import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';

const TERMS = ['Editorial', 'Brutalism', 'Iridescence', 'Riso', 'Lo-fi', 'AI prompt', 'Halftone', 'Type-as-image', 'Projection', 'Spatial UX', 'Motion', 'Procedural'];

export function Vocabulary() {
  const yPos = getSectionWorldY('vocabulary');
  const visibility = useSectionVisibility('vocabulary');
  const htmlRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (htmlRef.current) {
      const v = visibility();
      htmlRef.current.style.display = v > 0.1 ? '' : 'none';
      htmlRef.current.style.opacity = String(Math.min(1, v * 1.4).toFixed(2));
    }
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Centered vocabulary list */}
      <Html center position={[0, 0, 0]} style={{ width: '92vw', maxWidth: '800px', pointerEvents: 'none', zIndex: 4 }} transform={false}>
        <div ref={htmlRef} style={{ transition: 'opacity 0.18s ease' }}>
          <div className="spa-vocab" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div className="spa-vocab__copy" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div className="spa-eyebrow">Vocabulary</div>
              <h2 className="spa-vocab__lead" style={{ maxWidth: '600px', margin: '0 auto 16px auto' }}>
                A studio that thinks in <em>silhouettes, prompts, paper, code.</em>
              </h2>
              <ul className="spa-vocab__list" style={{ justifyContent: 'center' }}>
                {TERMS.map((t) => (<li key={t}>{t}</li>))}
              </ul>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default Vocabulary;
