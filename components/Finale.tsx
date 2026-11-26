import { Link } from "@/lib/navigation";
import { asset, url, type Context, type Day } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function Finale({ ctx, entry }: { ctx: Context; entry: Extract<Day, { video: string }> }) {
  const [stage, setStage] = useState<"movie" | "flash" | "reveal" | "gift">("movie");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const focusPlay = useRef(false);
  const giftMessage = useRef<HTMLParagraphElement>(null);
  const image = asset(ctx, entry.day, entry.image.file);
  const showingGift = stage === "gift" || stage === "reveal";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.error) setVideoError(true);
    const pause = () => video.pause();
    window.addEventListener("pagehide", pause);
    return () => {
      window.removeEventListener("pagehide", pause);
      pause();
    };
  }, [showingGift]);

  useEffect(() => {
    if (stage === "movie" && focusPlay.current) {
      focusPlay.current = false;
      playButton.current?.focus({ preventScroll: true });
    }
    if (showingGift) {
      giftMessage.current?.focus({ preventScroll: true });
      const picture = imageRef.current;
      if (picture?.complete && picture.naturalWidth === 0) setImageError(true);
    }
    if (stage !== "flash") return;
    const timer = window.setTimeout(() => setStage(current => current === "flash" ? "reveal" : current), 480);
    return () => window.clearTimeout(timer);
  }, [stage, showingGift]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      setVideoError(false);
      if (!started) video.muted = false;
      await video.play();
    } catch (error) {
      if (videoRef.current === video && !(error instanceof DOMException && error.name === "AbortError")) {
        setVideoError(true);
      }
    }
  }

  function completeVideo() {
    const next = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "gift" : "flash";
    setStage(current => current === "movie" ? next : current);
  }

  function skipVideo() {
    videoRef.current?.pause();
    setStage("gift");
  }

  function replay() {
    focusPlay.current = true;
    setPlaying(false);
    setStarted(false);
    setVideoError(false);
    setStage("movie");
  }

  return (
    <section className="finale">
      <h1>クリスマスパーティーへようこそ！</h1>
      <div className={stage === "reveal" && !imageError ? "finale-frame finale-frame-reveal" : "finale-frame"}>
        {!showingGift && (
          <video
            ref={videoRef}
            src={asset(ctx, entry.day, entry.video)}
            aria-label="クリスマスパーティーの動画"
            playsInline
            controls
            preload="metadata"
            onPlay={() => {
              setStarted(true);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={completeVideo}
            onError={() => setVideoError(true)}
          />
        )}
        {showingGift && imageError ? (
          <div className="finale-image-error">
            <p role="status">記念イラストを表示できませんでした。</p>
            <button type="button" className="action" onClick={() => {
              setImageError(false);
              setImageAttempt(attempt => attempt + 1);
            }}>画像を再読み込み</button>
          </div>
        ) : (
          <img
            key={imageAttempt}
            ref={imageRef}
            className="finale-picture"
            src={image}
            alt={entry.image.alt}
            hidden={!showingGift}
            onError={() => setImageError(true)}
          />
        )}
        {stage === "flash" && <div className="finale-flash" aria-hidden="true" />}
      </div>
      {showingGift ? (
        <>
          <p className="finale-message" ref={giftMessage} tabIndex={-1}>
            一緒にクリスマスを楽しんでくれて、ありがとう！<br />
            今日の思い出に、この写真をプレゼントするよ。<br />
            メリークリスマス！
          </p>
          <div className="finale-actions">
            <a className="action green" href={image} download={entry.image.file}>
              <Icon name="download" /> 記念イラストを保存する
            </a>
            <a className="action" href={image} target="_blank" rel="noopener noreferrer">画像を開く</a>
            <button type="button" className="action" onClick={replay}>もう一度見る</button>
            <Link prefetch={false} className="action" href={url(ctx)}>ホームへ戻る</Link>
          </div>
        </>
      ) : (
        <>
          {videoError && <p role="status">動画を再生できませんでした。「動画をスキップ」から記念イラストへ進めます。</p>}
          <div className="finale-actions">
            <button ref={playButton} type="button" className="action green" onClick={togglePlayback} disabled={stage === "flash"}>
              {playing ? "一時停止" : started ? "再生を続ける" : "パーティーに参加する"}
            </button>
            <button type="button" className="action" onClick={skipVideo}>動画をスキップ</button>
          </div>
        </>
      )}
    </section>
  );
}
