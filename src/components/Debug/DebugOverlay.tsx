import { Text, Billboard } from '@react-three/drei';

import { sections, getSectionWorldY } from '../../config/sections';
import { useDebug } from '../../helpers/debugStore';

/**
 * DebugOverlay — 3D inspection ruler.
 *
 * When enabled (toggle in NavHeader), renders inside Layout's
 * scrolling group so all coordinates are in the scene's world
 * frame. Components: vertical magenta spine at x=0, ruler ticks
 * + Y values every 5 units, and a cyan label at every section
 * centre with `[id] worldY=<n>`. Per-entity labels (sculptures,
 * scattered images, floating quote) are rendered by their owning
 * components conditionally on `useDebug((s) => s.enabled)` so
 * they live next to the things they describe.
 */

const SPINE_TOP = 2;
const SPINE_BOTTOM = -75;
const TICK_STEP = 5;

const COL_SPINE = '#ff00ff';   // magenta — Y axis
const COL_SECTION = '#00ffff'; // cyan — section labels

export function DebugOverlay() {
  const enabled = useDebug((s) => s.enabled);
  if (!enabled) return null;

  const ticks: number[] = [];
  for (let y = 0; y >= SPINE_BOTTOM; y -= TICK_STEP) ticks.push(y);

  return (
    <group renderOrder={9999}>
      {/* Vertical Y-axis spine, sits behind 3D content (z=-2). */}
      <mesh position={[0, (SPINE_TOP + SPINE_BOTTOM) / 2, -2]}>
        <boxGeometry args={[0.04, SPINE_TOP - SPINE_BOTTOM, 0.04]} />
        <meshBasicMaterial color={COL_SPINE} toneMapped={false} />
      </mesh>

      {/* Ruler ticks every 5 units along the spine. */}
      {ticks.map((y) => (
        <group key={'tick-' + y} position={[0, y, -2]}>
          <mesh>
            <boxGeometry args={[0.6, 0.025, 0.04]} />
            <meshBasicMaterial color={COL_SPINE} toneMapped={false} />
          </mesh>
          <Billboard position={[0.55, 0, 0]}>
            <Text
              fontSize={0.22}
              anchorX="left"
              anchorY="middle"
              color={COL_SPINE}
              outlineWidth={0.008}
              outlineColor="#000000"
            >
              y={y}
            </Text>
          </Billboard>
        </group>
      ))}

      {/* Section labels — one per section at its centre worldY. */}
      {sections.map((s) => {
        const y = getSectionWorldY(s.id);
        return (
          <group key={s.id} position={[0, y, -1.5]}>
            {/* Horizontal cyan line through the section centre. */}
            <mesh>
              <boxGeometry args={[14, 0.018, 0.02]} />
              <meshBasicMaterial color={COL_SECTION} toneMapped={false} transparent opacity={0.45} />
            </mesh>
            <Billboard position={[-3.5, 0.18, 0]}>
              <Text
                fontSize={0.32}
                anchorX="right"
                anchorY="middle"
                color={COL_SECTION}
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {'[' + s.id + '] y=' + y.toFixed(2)}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

export default DebugOverlay;

/**
 * DebugLabel — drop into any 3D component to mark its position.
 *
 * Reads `useDebug` so it auto-hides when the toggle is off.
 * `worldY` is optional — when provided, the label appends the
 * absolute world Y. When omitted, only the name shows (useful for
 * inline-positioned children whose absolute Y depends on parent
 * scrolling). `offset` translates the label relative to the
 * parent so it doesn't sit on top of the entity it labels.
 */
interface DebugLabelProps {
  name: string;
  worldY?: number;
  offset?: [number, number, number];
  color?: string;
  fontSize?: number;
}

export function DebugLabel({
  name,
  worldY,
  offset = [0, 1.0, 0.5],
  color = '#ffe600',
  fontSize = 0.22,
}: DebugLabelProps) {
  const enabled = useDebug((s) => s.enabled);
  if (!enabled) return null;

  const text = worldY !== undefined ? name + '  y=' + worldY.toFixed(2) : name;

  return (
    <Billboard position={offset}>
      <Text
        fontSize={fontSize}
        anchorX="center"
        anchorY="bottom"
        color={color}
        outlineWidth={0.012}
        outlineColor="#000000"
      >
        {text}
      </Text>
    </Billboard>
  );
}
