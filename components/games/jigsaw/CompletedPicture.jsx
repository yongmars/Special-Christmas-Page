import { useEffect, useRef } from "react";

export default function CompletedPicture({ image, title, children }) {
  const heading = useRef(null);
  useEffect(() => {
    heading.current.focus({ preventScroll: true });
    heading.current.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <section className="jg-success" aria-label="ジグソーの完成作品">
      <h2 ref={heading} tabIndex={-1}>かんせい！できたね！</h2>
      <img className="jg-finished-art" src={image} alt={title} />
      <div className="jg-finished-actions">{children}</div>
    </section>
  );
}
