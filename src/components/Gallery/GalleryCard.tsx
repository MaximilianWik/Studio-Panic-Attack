import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  url: string;
  /** Max size of the longer side; aspect-fit applied. */
  size?: [number, number];
}

/**
 * A textured plane for one gallery image. Aspect-fits the source so
 * landscape and portrait images both look right. Transform is owned
 * entirely by the parent group.
 */
export function GalleryCard({ url, size = [1.4, 1.0] }: Props) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const img = tex.image;
  let w = size[0];
  let h = size[1];
  if (img) {
    const a = img.width / img.height;
    if (a >= 1) {
      w = size[0];
      h = size[0] / a;
    } else {
      h = size[0];
      w = size[0] * a;
    }
  }

  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        map={tex}
        toneMapped={false}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
