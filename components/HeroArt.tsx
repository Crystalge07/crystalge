type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** an extra layer (same size as the art) that only shows while the art is hovered */
  overlay?: { src: string; alt: string };
};

/** The pinned picture, with an optional layer that fades in on hover. */
export default function HeroArt({ src, alt, width, height, overlay }: Props) {
  return (
    <figure className="art">
      <div className="art-frame" style={{ aspectRatio: `${width} / ${height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="art-img" src={src} alt={alt} width={width} height={height} />
        {overlay && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="art-overlay" src={overlay.src} alt={overlay.alt} width={width} height={height} />
        )}
      </div>
    </figure>
  );
}
