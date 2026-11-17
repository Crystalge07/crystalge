/** Repeatable 0..1 hash, so server and client render the same "random" values. */
export function rand(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
