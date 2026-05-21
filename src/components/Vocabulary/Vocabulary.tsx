import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getSectionWorldY } from '../../config/sections';
import { useSectionVisibility } from '../../helpers/useScrollSection';
import { KNIFE_PATH_D } from './knifePathD';

const SENTENCE = 'Chaotic space of creativity & multidisciplinary ideas exploring the limits of the human curiosity.';
const CW = 662;
const CH = 636;
const PAD = 60;
const TX = 646.625;
const TY = 38.1875;
const FONT_SIZE = 22;
const LAP = 29;

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
      {/* Swiss-knife textpath SVG + vocab list */}
      <Html center position={[0, 0, 0]} style={{ width: '92vw', maxWidth: '1000px', pointerEvents: 'none', zIndex: 4 }} transform={false}>
        <div ref={htmlRef} style={{ transition: 'opacity 0.18s ease' }}>
          <div className="spa-vocab">
            <div className="spa-vocab__copy">
              <div className="spa-eyebrow">Vocabulary</div>
              <h2 className="spa-vocab__lead">
                A studio that thinks in <em>silhouettes, prompts, paper, code.</em>
              </h2>
              <ul className="spa-vocab__list">
                {TERMS.map((t) => (<li key={t}>{t}</li>))}
              </ul>
            </div>
            <div>
              <svg viewBox={`-${PAD} -${PAD} ${CW + PAD * 2} ${CH + PAD * 2}`} className="spa-vocab__svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs><path id="knife-outline" d={KNIFE_PATH_D} /></defs>
                <g transform={`translate(${TX}, ${TY})`}>
                  <use href="#knife-outline" fill="none" stroke="#f6f3ee" strokeOpacity="0.18" strokeWidth="0.6" />
                  <text fontFamily='"Cormorant Garamond", serif' fontWeight={500} fontSize={FONT_SIZE} fill="#d30000" letterSpacing={0.2}>
                    <textPath href="#knife-outline" startOffset="100%">
                      <animate id="lap" attributeName="startOffset" from="100%" to="0%" dur={`${LAP}s`} repeatCount="indefinite" />
                      {SENTENCE}
                    </textPath>
                  </text>
                  <text fontFamily='"Cormorant Garamond", serif' fontWeight={500} fontSize={FONT_SIZE} fill="#d30000" letterSpacing={0.2}>
                    <textPath href="#knife-outline" startOffset="0%">
                      <animate attributeName="startOffset" from="0%" to="-100%" dur={`${LAP}s`} repeatCount="indefinite" begin="lap.begin" />
                      {SENTENCE}
                    </textPath>
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

export default Vocabulary;
