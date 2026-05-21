/**
 * Five custom GLSL fragment shaders for image planes scattered through
 * the world. Each shader takes a single sampler `uTex` and renders the
 * image at full UV coverage with its own visual treatment.
 *
 *   1. halftone   — variable-radius CMYK-style dots driven by luminance,
 *                   rotated angle.
 *   2. dither     — 8x8 ordered Bayer dithering, monochrome with a faint
 *                   blood tint.
 *   3. paper      — paper-grain warp + fiber overlay; muted contrast.
 *   4. flute      — vertical ribbed-glass refraction; mild per-column
 *                   blur and chromatic separation.
 *   5. liquid     — fresnel-driven animated noise band over the image,
 *                   chromatic shift along the band.
 *
 * The vertex shader is identical for all five (just forwards uv).
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_HALFTONE = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uIntensity;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void main() {
    vec2 uv = vUv;
    vec4 base = texture2D(uTex, uv);
    float l = luma(base.rgb);

    float angle = 0.45;
    mat2 R = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = (uv - 0.5) * uResolution;
    vec2 q = R * p;
    float cell = 8.0;
    vec2 cell_center = floor(q / cell) * cell + cell * 0.5;
    vec2 cell_uv = (R * (cell_center / uResolution) + 0.5);
    float lc = luma(texture2D(uTex, cell_uv).rgb);
    float r = (1.0 - lc) * cell * 0.6;
    float d = length(q - cell_center);
    float dot = smoothstep(r, r - 1.5, d);

    vec3 ink = vec3(0.04, 0.04, 0.04);
    vec3 paper = vec3(0.96, 0.94, 0.89);
    vec3 col = mix(paper, ink, dot);
    // bleed a hint of the original colour back in
    col = mix(col, base.rgb, 0.18);
    col = mix(base.rgb, col, uIntensity);
    gl_FragColor = vec4(col, base.a);
  }
`;

const FRAG_DITHER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uResolution;
  uniform float uIntensity;

  // 8x8 Bayer matrix
  float bayer(vec2 p) {
    int x = int(mod(p.x, 8.0));
    int y = int(mod(p.y, 8.0));
    int idx = y * 8 + x;
    int B[64];
    B[ 0] = 0;  B[ 1] = 32; B[ 2] = 8;  B[ 3] = 40; B[ 4] = 2;  B[ 5] = 34; B[ 6] = 10; B[ 7] = 42;
    B[ 8] = 48; B[ 9] = 16; B[10] = 56; B[11] = 24; B[12] = 50; B[13] = 18; B[14] = 58; B[15] = 26;
    B[16] = 12; B[17] = 44; B[18] = 4;  B[19] = 36; B[20] = 14; B[21] = 46; B[22] = 6;  B[23] = 38;
    B[24] = 60; B[25] = 28; B[26] = 52; B[27] = 20; B[28] = 62; B[29] = 30; B[30] = 54; B[31] = 22;
    B[32] = 3;  B[33] = 35; B[34] = 11; B[35] = 43; B[36] = 1;  B[37] = 33; B[38] = 9;  B[39] = 41;
    B[40] = 51; B[41] = 19; B[42] = 59; B[43] = 27; B[44] = 49; B[45] = 17; B[46] = 57; B[47] = 25;
    B[48] = 15; B[49] = 47; B[50] = 7;  B[51] = 39; B[52] = 13; B[53] = 45; B[54] = 5;  B[55] = 37;
    B[56] = 63; B[57] = 31; B[58] = 55; B[59] = 23; B[60] = 61; B[61] = 29; B[62] = 53; B[63] = 21;
    return float(B[idx]) / 64.0;
  }

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void main() {
    vec2 fragPx = vUv * uResolution;
    vec3 src = texture2D(uTex, vUv).rgb;
    float l = luma(src);
    float t = bayer(floor(fragPx / 1.5));
    float bit = step(t, l);
    vec3 ink = vec3(0.04);
    vec3 paper = vec3(0.94, 0.92, 0.86);
    vec3 dith = mix(ink, paper, bit);
    // a low duotone bleed for warmth
    dith = mix(dith, dith * vec3(1.0, 0.88, 0.85), 0.25);
    vec3 col = mix(src, dith, uIntensity);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FRAG_PAPER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uIntensity;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  // simple value noise
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i); float b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1)); float d = hash(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    // warp
    float w = noise(uv * 6.0 + uTime * 0.05) - 0.5;
    uv += vec2(w * 0.012, w * 0.008);
    vec3 col = texture2D(uTex, uv).rgb;
    // paper grain
    float grain = noise(vUv * 460.0) - 0.5;
    grain += (noise(vUv * 920.0) - 0.5) * 0.6;
    col += grain * 0.06;
    // fiber streaks
    float fiber = noise(vec2(vUv.x * 200.0, vUv.y * 8.0));
    col -= step(0.94, fiber) * 0.04;
    // muted, warm
    col = mix(col, vec3(luma(col)) * vec3(1.06, 1.0, 0.92), 0.3);
    col = mix(texture2D(uTex, vUv).rgb, col, uIntensity);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FRAG_FLUTE = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uResolution;
  uniform float uIntensity;

  void main() {
    float cols = 28.0;
    float colW = 1.0 / cols;
    float colIdx = floor(vUv.x / colW);
    float local = (vUv.x - colIdx * colW) / colW; // 0..1 within column
    // refraction profile across the column: bowed, flips at edges
    float bend = (local - 0.5);
    float refractX = bend * 0.06;
    // chromatic split
    float r = texture2D(uTex, vec2(vUv.x + refractX * 1.1, vUv.y)).r;
    float g = texture2D(uTex, vec2(vUv.x + refractX, vUv.y)).g;
    float b = texture2D(uTex, vec2(vUv.x + refractX * 0.9, vUv.y)).b;
    vec3 col = vec3(r, g, b);
    // column edges: subtle dark line
    float edge = smoothstep(0.0, 0.04, local) * smoothstep(1.0, 0.96, local);
    col *= mix(0.85, 1.0, edge);
    // mild brightness pop in mid column
    col *= 1.0 + (1.0 - abs(bend) * 2.0) * 0.05;

    vec3 base = texture2D(uTex, vUv).rgb;
    col = mix(base, col, uIntensity);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FRAG_LIQUID = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uIntensity;

  // 2d noise
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec3 base = texture2D(uTex, vUv).rgb;
    // animated band
    float band = n(vUv * 3.5 + uTime * 0.2) * 1.4 - 0.4;
    band = pow(max(0.0, band), 1.6);
    // chromatic shift along the band
    vec2 shift = vec2(band * 0.012, 0.0);
    float r = texture2D(uTex, vUv + shift * 1.4).r;
    float g = texture2D(uTex, vUv).g;
    float b = texture2D(uTex, vUv - shift * 1.4).b;
    vec3 chroma = vec3(r, g, b);
    // metal sheen
    vec3 sheen = mix(vec3(0.05), vec3(0.96, 0.94, 0.92), band);
    sheen += vec3(0.83, 0.0, 0.0) * pow(band, 4.0);
    vec3 col = mix(chroma, chroma + sheen * 0.5, band);
    col = mix(base, col, uIntensity);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type ShaderId = 'halftone' | 'dither' | 'paper' | 'flute' | 'liquid';

export interface ShaderModule {
  id: ShaderId;
  vertex: string;
  fragment: string;
}

export const shaders: Record<ShaderId, ShaderModule> = {
  halftone: { id: 'halftone', vertex: VERT, fragment: FRAG_HALFTONE },
  dither: { id: 'dither', vertex: VERT, fragment: FRAG_DITHER },
  paper: { id: 'paper', vertex: VERT, fragment: FRAG_PAPER },
  flute: { id: 'flute', vertex: VERT, fragment: FRAG_FLUTE },
  liquid: { id: 'liquid', vertex: VERT, fragment: FRAG_LIQUID },
};

export const shaderIds: ShaderId[] = ['halftone', 'dither', 'paper', 'flute', 'liquid'];
