import React, { useCallback, useRef, useState } from "react";

interface CyberFormCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A dark, tech-forward card frame built to hold real, clickable form content.
 * All visual styling lives in global.css under the `.cyber-*` classes below —
 * this component only handles the mouse-driven tilt and hover state.
 *
 * Notes on the interaction:
 *  - The tilt is computed from a single onMouseMove handler on the card
 *    itself and applied as an inline transform. There's no invisible overlay
 *    sitting on top of the form, so inputs/buttons stay fully clickable and
 *    typeable — they tilt along with the rest of the card.
 *  - Everything decorative (corner brackets, scan line, glare, glow) is
 *    `pointer-events: none` in the CSS, so it's paint only.
 *  - Motion is disabled under prefers-reduced-motion (handled in CSS).
 */
export const CyberFormCard: React.FC<CyberFormCardProps> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1 across the card
    const py = (e.clientY - rect.top) / rect.height; // 0..1 down the card
    // Small max angle — this is a form, not a showpiece; keep it subtle
    // enough that typing in a field doesn't feel like it's on a seesaw.
    setTilt({ rx: (0.5 - py) * 5, ry: (px - 0.5) * 5 });
  }, []);

  const resetTilt = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    setHovering(false);
  }, []);

  return (
    <div className={`cyber-wrapper ${className ?? ""}`}>
      <div
        ref={cardRef}
        className={`cyber-card${hovering ? " is-hovering" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={resetTilt}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        <div className="cyber-glare" />
        <div className="cyber-lines" />
        <div className="cyber-scanline" />
        <div className="cyber-corners">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="cyber-glow" />
        <div className="cyber-content">{children}</div>
      </div>
    </div>
  );
};

export default CyberFormCard;