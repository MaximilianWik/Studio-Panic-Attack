import { getSectionWorldY } from '../../config/sections';

export function Hero() {
  return <group position={[0, getSectionWorldY('hero'), 0]} />;
}

export default Hero;
