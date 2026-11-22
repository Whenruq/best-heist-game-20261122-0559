// A tiny seeded random generator (mulberry32): the same seed always deals the same
// decoration jitter and gold glint phases, so a screenshot scene is reproducible.

export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random float in [min, max) from the seeded generator. */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** A random integer in [min, max] inclusive, from the seeded generator. */
export function intRange(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
