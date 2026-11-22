// Seeded randomness (mulberry32). The same seed always produces the same stream, so
// decoration jitter and gold glint phases repeat exactly — screenshot scenes staged
// with a fixed seed are reproducible frame for frame.

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

/** A float in [min, max) drawn from the seeded generator. */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max], both ends included. */
export function intRange(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** One element of a non-empty array, chosen by the seeded generator. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}
