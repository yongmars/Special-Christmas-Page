"use client";
import { useSyncExternalStore } from "react";
import type { GameId } from "./types";
import games from "@/content/games.json";
const validGame = (id: unknown): id is GameId => games.some(g => g.id === id);
type QuizRecord = { attempts: number[]; lastChoice: number | null };
function isChoice(value: unknown): value is number {
  return value === 0 || value === 1 || value === 2;
}
function readQuizzes(raw: Record<string, QuizRecord> = {}) {
  return Object.fromEntries(Object.entries(raw ?? {}).filter(([, q]) =>
    Array.isArray(q?.attempts) && q.attempts.every(isChoice) && (q.lastChoice === null || isChoice(q.lastChoice))));
}
type RecordState = { pendingRewards: GameId[]; quizAnswers: Record<string, QuizRecord>; opened: number[]; clears: GameId[]; slideBest: Partial<Record<number, number>> };
const empty: RecordState = { pendingRewards: [], quizAnswers: {}, opened: [], clears: [], slideBest: {} };
const cache = new Map<string, RecordState>(),
  last = new Map<string, string | null>(),
  volatile = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
function read(key: string): RecordState {
  if (volatile.has(key)) return cache.get(key) || empty;
  try {
    const raw = localStorage.getItem(key);
    if (last.has(key) && last.get(key) === raw) return cache.get(key) || empty;
    let value = empty;
    if (raw) {
      try {
        const p = JSON.parse(raw);
        value = {
          pendingRewards: Array.isArray(p?.pendingRewards) ? p.pendingRewards.filter(validGame) : [],
          quizAnswers: readQuizzes(p?.quizAnswers),
          slideBest: Object.fromEntries(
            [3, 4].filter(n => Number.isSafeInteger(p?.slideBest?.[n]) && p.slideBest[n] > 0)
              .map(n => [n, p.slideBest[n]]),
          ),
          opened: Array.isArray(p?.opened)
            ? p.opened.filter(
                (d: number) => Number.isInteger(d) && d >= 1 && d <= 25,
              )
            : [],
          clears: Array.isArray(p?.clears)
            ? p.clears.filter((g: string) =>
                validGame(g),
              )
            : [],
        };
      } catch {}
    }
    cache.set(key, value);
    last.set(key, raw);
    return value;
  } catch {
    volatile.add(key);
    return cache.get(key) || empty;
  }
}
export function useProgress(preview: boolean) {
  const key = "noct-lux:christmas-2026:v1:" + (preview ? "preview" : "season");
  const state = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => empty,
  );
  function change(fn: (p: RecordState) => RecordState) {
    const old = read(key),
      next = fn(old);
    const raw = JSON.stringify(next);
    if (raw === JSON.stringify(old)) return;
    cache.set(key, next);
    last.set(key, raw);
    try {
      localStorage.setItem(key, raw);
    } catch {
      volatile.add(key);
    }
    notify();
  }
  function opened(day: number, yes = true) {
    change((p) => ({
      ...p,
      opened: yes
        ? Array.from(new Set([...p.opened, day]))
        : p.opened.filter((d) => d !== day),
    }));
  }
  function clear(game: GameId, yes = true) {
    change((p) => ({
      ...p,
      pendingRewards: yes
        ? p.clears.includes(game) ? p.pendingRewards : [...p.pendingRewards, game]
        : p.pendingRewards.filter(id => id !== game),
      clears: yes
        ? Array.from(new Set([...p.clears, game]))
        : p.clears.filter((g) => g !== game),
    }));
  }
  function recordSlideBest(size: number, moves: number) {
    change(p => ({
      ...p,
      slideBest: { ...p.slideBest, [size]: Math.min(moves, p.slideBest[size] ?? moves) },
    }));
  }
  function readReward(id: GameId) {
    change(p => ({ ...p, pendingRewards: p.pendingRewards.filter(g => g !== id) }));
  }
  function answer(id: string, choice: number) {
    change(p => {
      const quiz = p.quizAnswers[id];
      if (quiz?.lastChoice != null || !isChoice(choice)) return p;
      return { ...p, quizAnswers: { ...p.quizAnswers, [id]: {
        attempts: [...(quiz?.attempts ?? []), choice], lastChoice: choice,
      } } };
    });
  }
  function retryQuiz(id: string) {
    change(p => ({ ...p, quizAnswers: { ...p.quizAnswers, [id]: { ...p.quizAnswers[id], lastChoice: null } } }));
  }
  return { state, opened, clear, readReward, answer, retryQuiz, recordSlideBest, reset: () => change(() => empty) };
}
