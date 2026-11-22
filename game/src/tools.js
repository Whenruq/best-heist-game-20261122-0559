// The thief's kit, in limited charges: an EMP charge fries the nearest live camera for
// a few seconds, and a decoy coin clatters to a chosen spot and pulls the nearest guard
// over to investigate. Charges are spent whether or not they change the run.
import { CAMERA, FIELD, TOOLS } from './config.js';
import { clamp, distance } from './geometry.js';
import { nearestGuardTo, sendToInvestigate } from './guards.js';

/** Fry the nearest live camera within EMP range. Returns true when a charge was spent. */
export function useEmp(state) {
  if (state.empCharges <= 0) return false;
  let best = null;
  let bestDist = TOOLS.empRange;
  for (let i = 0; i < state.cameras.length; i += 1) {
    const camera = state.cameras[i];
    if (camera.disabled > 0) continue;
    const dist = distance(camera.x, camera.y, state.player.x, state.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = camera;
    }
  }
  if (!best) return false;
  best.disabled = CAMERA.disabledSeconds;
  state.empCharges -= 1;
  state.empFlash = { x: best.x, y: best.y, t: 0.6 };
  return true;
}

/** Keep a tossed coin on the bank floor, inside the outer walls. */
function clampToField(x, y) {
  return {
    x: clamp(x, 34, FIELD.width - 34),
    y: clamp(y, 34, FIELD.height - 34),
  };
}

/** Toss a decoy coin toward `point` (clamped to throwing range). Returns true when spent. */
export function tossDecoy(state, point) {
  if (state.decoyCharges <= 0) return false;
  const player = state.player;
  const dx = point.x - player.x;
  const dy = point.y - player.y;
  const dist = Math.hypot(dx, dy);
  const scale = dist > TOOLS.decoyRange ? TOOLS.decoyRange / dist : 1;
  const { x, y } = clampToField(player.x + dx * scale, player.y + dy * scale);
  state.decoyCharges -= 1;
  state.decoys.push({ x, y, ttl: TOOLS.coinLifetime });
  const guard = nearestGuardTo(state, x, y, TOOLS.decoyHearRange);
  if (guard) sendToInvestigate(guard, x, y);
  return true;
}

/** Age the coins on the floor; after a few seconds they stop mattering. */
export function updateDecoys(state, dt) {
  for (let i = state.decoys.length - 1; i >= 0; i -= 1) {
    state.decoys[i].ttl -= dt;
    if (state.decoys[i].ttl <= 0) state.decoys.splice(i, 1);
  }
}
