"use client";
import { useSyncExternalStore } from "react";
import type { GameId } from "./types";
type RecordState = { opened: number[]; clears: GameId[] };
const empty: RecordState = { opened: [], clears: [] };
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
          opened: Array.isArray(p?.opened)
            ? p.opened.filter(
                (d: number) => Number.isInteger(d) && d >= 1 && d <= 25,
              )
            : [],
          clears: Array.isArray(p?.clears)
            ? p.clears.filter((g: string) =>
                ["memory", "slide", "jigsaw"].includes(g),
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
      clears: yes
        ? Array.from(new Set([...p.clears, game]))
        : p.clears.filter((g) => g !== game),
    }));
  }
  return { state, opened, clear, reset: () => change(() => empty) };
}
