import { Link } from "@/lib/navigation";
import { asset, url, type Context, type Day } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function Finale({ ctx, entry }: { ctx: Context; entry: Extract<Day, { video: string }> }) {
  const [stage, setStage] = useState<"movie" | "flash" | "gift">("movie");
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const giftMessage = useRef<HTMLParagraphElement>(null);
  const image = asset(ctx, entry.day, entry.image.file);
  const showingGift = stage === "gift";

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
    if (stage === "gift") giftMessage.current?.focus({ preventScroll: true });
    if (stage !== "flash") return;
    const timer = window.setTimeout(() => setStage("gift"), 250);
    return () => window.clearTimeout(timer);
  }, [stage]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      setVideoError(false);
      await video.play();
    } catch (error) {
      if (videoRef.current === video && !(error instanceof DOMException && error.name === "AbortError")) {
        setVideoError(true);
      }
    }
  }

  function completeVideo() {
    setStage(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "gift" : "flash");
  }

  function skipVideo() {
    videoRef.current?.pause();
    setStage("gift");
  }

  function replay() {
    setPlaying(false);
    setVideoError(false);
    setStage("movie");
  }

  return (
    <section className="finale">
      <h1>クリスマスパーティーへようこそ！</h1>
      <div className="finale-frame">
        {!showingGift && (
          <video
            ref={videoRef}
            src={asset(ctx, entry.day, entry.video)}
            aria-label="クリスマスパーティーの動画"
            playsInline
            controls
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={completeVideo}
            onError={() => setVideoError(true)}
          />
        )}
        <img className="finale-picture" src={image} alt={entry.image.alt} hidden={!showingGift} />
        {stage === "flash" && <div className="finale-flash" aria-hidden="true" />}
      </div>
      {showingGift ? (
        <>
          <p className="finale-message" ref={giftMessage} tabIndex={-1}>
            最後まで一緒に楽しんでくれて、ありがとう！<br />
            素敵なクリスマスを過ごしてね！
          </p>
          <div className="finale-actions">
            <a className="action green" href={image} download={entry.image.file}>
              <Icon name="download" /> 記念イラストを保存する
            </a>
            <a className="action" href={image} target="_blank" rel="noopener noreferrer">画像を開く</a>
            <button type="button" className="action" onClick={replay}>もう一度見る</button>
            <Link prefetch={false} className="action" href={url(ctx)}>ホームに戻る</Link>
          </div>
        </>
      ) : (
        <>
          {videoError && <p role="status">動画を再生できませんでした。「動画をスキップ」から記念イラストへ進めます。</p>}
          <div className="finale-actions">
            <button type="button" className="action green" onClick={togglePlayback} disabled={stage === "flash"}>
              {playing ? "一時停止" : "動画を再生する"}
            </button>
            <button type="button" className="action" onClick={skipVideo}>動画をスキップ</button>
          </div>
        </>
      )}
    </section>
  );
}
