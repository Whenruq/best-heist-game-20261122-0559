// The alarm meter: the heist's one resource. Being seen by a guard or a camera fills it
// (faster up close), running near a guard fills it a little, and staying out of sight
// drains it. A full meter — or a guard's hand on the thief's collar — ends the run.
import { ALARM, CAMERA, GUARD } from './config.js';
import { clamp, distance } from './geometry.js';
import { guardSeesPlayer } from './guards.js';
import { cameraSeesPlayer } from './cameras.js';
import { EVENT_CAUGHT, EVENT_NONE } from './world.js';

/** Detection rate scaled by closeness: point-blank is spotted fastest, the cone's edge slowest. */
const CLOSE_BONUS = 1.25;
const EDGE_FALLOFF = 0.6;
function scaledRate(baseRate, dist, range) {
  return baseRate * (CLOSE_BONUS - EDGE_FALLOFF * (dist / range));
}

export function updateAlarm(state, dt) {
  const player = state.player;
  let rate = 0;
  let seen = false;

  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    const dist = distance(guard.x, guard.y, player.x, player.y);
    if (dist < GUARD.catchRange) {
      state.status = 'caught';
      state.caughtReason = 'A guard grabbed you.';
      state.seenNow = true;
      return EVENT_CAUGHT;
    }
    if (guardSeesPlayer(guard, player)) {
      seen = true;
      rate = Math.max(rate, scaledRate(ALARM.guardRate, dist, GUARD.sightRange));
    } else if (player.moving && !player.sneaking && dist < GUARD.hearingRange) {
      seen = true;
      rate = Math.max(rate, ALARM.noiseRate * (1 - dist / GUARD.hearingRange));
    }
  }

  for (let i = 0; i < state.cameras.length; i += 1) {
    const camera = state.cameras[i];
    if (cameraSeesPlayer(camera, player)) {
      seen = true;
      const dist = distance(camera.x, camera.y, player.x, player.y);
      rate = Math.max(rate, scaledRate(ALARM.cameraRate, dist, CAMERA.sightRange));
    }
  }

  state.seenNow = seen;
  if (seen) {
    state.alarm += rate * (player.sneaking ? ALARM.sneakFactor : 1) * dt;
  } else {
    state.alarm -= ALARM.decay * dt;
  }
  state.alarm = clamp(state.alarm, 0, ALARM.max);

  if (state.alarm >= ALARM.max) {
    state.status = 'caught';
    state.caughtReason = 'The alarm hit 100%.';
    return EVENT_CAUGHT;
  }
  return EVENT_NONE;
}
