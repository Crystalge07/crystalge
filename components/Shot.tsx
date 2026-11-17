/** A 16:10 screenshot, or a dotted placeholder until a real image exists. */
export default function Shot({ img, alt }: { img: string; alt: string }) {
  if (!img) {
    return (
      <span className="shot empty" aria-hidden="true">
        [screenshot]
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="shot" src={img} alt={alt} loading="lazy" decoding="async" />;
}
