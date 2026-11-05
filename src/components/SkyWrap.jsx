import { useCallback, useEffect, useRef, useState } from 'react';
import { createHalftoneSky } from '../../halftone-sky.js';
import StarField from './StarField.jsx';
import DetailOverlay from './DetailOverlay.jsx';

export default function SkyWrap() {
  const [card, setCard] = useState(null);
  const isDetailOpenRef = useRef(false);
  const skyCanvasRef = useRef(null);
  const skyRef = useRef(null);
  /** Latest mode from the constellation layer; it can arrive before the sky exists. */
  const skyStateRef = useRef({ mode: 'home', constellations: null });

  isDetailOpenRef.current = card !== null;

  const handleShowCard = useCallback((con, item) => {
    setCard({ con, item });
  }, []);

  const handleHideCard = useCallback(() => {
    setCard(null);
  }, []);

  const handleSkyChange = useCallback((mode, constellations) => {
    skyStateRef.current = { mode, constellations };
    skyRef.current?.setMode(mode, constellations);
  }, []);

  useEffect(() => {
    const canvas = skyCanvasRef.current;
    if (!canvas) return undefined;
    const { mode, constellations } = skyStateRef.current;
    const sky = createHalftoneSky(canvas, constellations ? { mode, constellations } : { mode });
    skyRef.current = sky;
    return () => {
      sky.destroy();
      if (skyRef.current === sky) skyRef.current = null;
    };
  }, []);

  const selectedStar = card ? card.item.star : -1;
  useEffect(() => {
    skyRef.current?.setSelected(selectedStar);
  }, [selectedStar]);

  return (
    <div id="sky-wrap">
      <canvas id="halftone-sky" ref={skyCanvasRef} aria-hidden="true" />
      <StarField
        isDetailOpenRef={isDetailOpenRef}
        onShowCard={handleShowCard}
        onHideCard={handleHideCard}
        onSkyChange={handleSkyChange}
      />
      <DetailOverlay card={card} onClose={handleHideCard} />
    </div>
  );
}
