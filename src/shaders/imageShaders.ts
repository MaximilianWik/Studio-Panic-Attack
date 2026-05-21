/**
 * Custom GLSL shaders for the scattered-images pool.
 *
 * All shaders share a common vertex shader and follow the same uniform
 * convention: `uMap` (the image texture), `uTime`, plus shader-specific
 * uniforms. Output stays in sRGB-correct linear space — we set
 * `texture.colorSpace = SRGBColorSpace` on the texture and let three.js
 * apply the output transform.
 */

export const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/**
 * Halftone: emulates CMYK dot screening. Samples the source, computes
 * luminance, then outputs a dot pattern whose dot size is inversely
 * proportional to luminance (darker → bigger dot).
 */
export const HALFTONE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;
uniform float uDotSize;     // pixels per dot — smaller = denser
uniform vec3  uInk;         // dot color
uniform vec3  uPaper;       // background color
uniform vec2  uResolution;  // mesh pixel size for dot grid

float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec4 src = texture2D(uMap, vUv);
  if (src.a < 0.01) discard;

  float lum = luminance(src.rgb);
  // Rotate UV grid 15deg for a more screen-print feel
  float ang = 0.2618; // 15deg
  vec2 uvR = vec2(cos(ang)*vUv.x - sin(ang)*vUv.y,
                  sin(ang)*vUv.x + cos(ang)*vUv.y);
  vec2 grid = uvR * uResolution / uDotSize;
  vec2 cell = fract(grid) - 0.5;
  float dotR = (1.0 - lum) * 0.55;
  float d = length(cell);
  // antialias the edge with smoothstep
  float aa = fwidth(d) * 1.0 + 0.001;
  float dot = 1.0 - smoothstep(dotR - aa, dotR + aa, d);

  vec3 col = mix(uPaper, uInk, dot);
  gl_FragColor = vec4(col, src.a * uOpacity);
}
`;

/**
 * Ordered Bayer-matrix dithering. Quantizes luminance to N levels using
 * a 4x4 threshold matrix. Output is monochrome (paper/ink) for that
 * print-zine feel.
 */
export const DITHER_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uPixel;       // pixel size
uniform vec3  uInk;
uniform vec3  uPaper;
uniform vec2  uResolution;

float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

const float bayer4[16] = float[16](
   0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
  12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
   3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
  15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
);

void main() {
  // pixelate first
  vec2 px = uResolution / uPixel;
  vec2 uvQ = floor(vUv * px) / px + 0.5 / px;
  vec4 src = texture2D(uMap, uvQ);
  if (src.a < 0.01) discard;

  float lum = luminance(src.rgb);
  ivec2 ip = ivec2(mod(floor(vUv * px), 4.0));
  float threshold = bayer4[ip.y * 4 + ip.x];
  float bit = step(threshold, lum);

  vec3 col = mix(uPaper, uInk, bit);
  gl_FragColor = vec4(col, src.a * uOpacity);
}
`;

/**
 * Paper texture: warm grain overlay + slight UV warp + soft vignette.
 * Keeps source image legible — meant to feel like the image is printed
 * on textured stock.
 */
export const PAPER_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;

// hash without sin (Hugo Elias style)
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main() {
  // subtle warp
  vec2 warp = vec2(
    hash21(floor(vUv * 80.0)) - 0.5,
    hash21(floor(vUv * 80.0) + 7.0) - 0.5
  ) * 0.004;
  vec2 uv = vUv + warp;
  vec4 src = texture2D(uMap, uv);
  if (src.a < 0.01) discard;

  // grain
  float g1 = hash21(vUv * 600.0);
  float g2 = hash21(vUv * 200.0 + 13.0);
  float grain = g1 * 0.55 + g2 * 0.45;
  vec3 grainCol = mix(vec3(0.86, 0.82, 0.74), vec3(1.0), grain);
  vec3 col = src.rgb * mix(vec3(1.0), grainCol, 0.22);

  // Fiber-like horizontal streaks
  float fibers = sin(vUv.y * 280.0 + g1 * 6.28) * 0.04 + 0.96;
  col *= fibers;

  // gentle vignette
  float v = smoothstep(0.85, 0.2, length(vUv - 0.5));
  col *= mix(0.85, 1.0, v);

  gl_FragColor = vec4(col, src.a * uOpacity);
}
`;

/**
 * Flute-glass: vertical ribbed glass distortion. Repeats a sinusoidal
 * displacement along U so columns of the image are sheared and slightly
 * blurred between ribs. Includes a subtle moving highlight band.
 */
export const FLUTE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;
uniform float uRibCount;   // how many vertical ribs across the plane
uniform float uShear;      // displacement amount

void main() {
  float ribs = sin(vUv.x * uRibCount * 6.2831853);
  float shear = ribs * uShear;
  vec2 uv = vUv;
  // ribbed vertical displacement
  uv.x += shear * 0.6;
  uv.y += abs(ribs) * uShear * 0.25;

  // chromatic split per channel for that frosted glass feel
  vec4 r = texture2D(uMap, uv + vec2(0.003, 0.0));
  vec4 g = texture2D(uMap, uv);
  vec4 b = texture2D(uMap, uv - vec2(0.003, 0.0));
  vec4 src = vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a));
  if (src.a < 0.01) discard;

  // moving specular band
  float band = smoothstep(0.0, 0.05, 0.05 - abs(fract(vUv.x * 1.5 - uTime * 0.05) - 0.5)) * 0.18;
  vec3 col = src.rgb + vec3(band);

  gl_FragColor = vec4(col, src.a * uOpacity);
}
`;

/**
 * Liquid metal: faux iridescent metallic finish. Combines the source
 * luminance with a procedural environment derived from the surface
 * normal-ish vUv gradient + animated noise. Not physically based — just
 * a vibe.
 */
export const LIQUID_METAL_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;
uniform vec3  uTintA;
uniform vec3  uTintB;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec4 src = texture2D(uMap, vUv);
  if (src.a < 0.01) discard;
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  // animated swirl coords
  vec2 q = vUv * 2.5;
  float n = noise(q + vec2(uTime * 0.07, -uTime * 0.05));
  float n2 = noise(q * 1.7 - vec2(uTime * 0.04, uTime * 0.03) + 5.0);
  float swirl = smoothstep(0.2, 0.9, n + n2 * 0.5);

  vec3 metal = mix(uTintA, uTintB, swirl);
  // boost specular highlight where source is bright
  float hi = smoothstep(0.5, 1.0, lum);
  metal += vec3(hi * 0.5);

  // mix source through luminance — keeps the image readable
  vec3 col = mix(metal, metal * (0.4 + lum * 0.8), 0.6);
  gl_FragColor = vec4(col, src.a * uOpacity);
}
`;

export type ShaderKind =
  | 'halftone'
  | 'dither'
  | 'paper'
  | 'flute'
  | 'liquid'
  | 'plain';
