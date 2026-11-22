// The guards: each walks a patrol loop, turning smoothly toward where it walks. A decoy
// coin pulls the nearest guard off patrol to investigate, look around, then return to
// the nearest waypoint. guardSeesPlayer is the cone-and-line-of-sight test the alarm uses.
import { GUARD, TOOLS } from './config.js';
import { distance, moveCircle, pointInCone, turnToward } from './geometry.js';
import { SOLIDS } from './world.js';
import { FIELD } from './config.js';

const BOUNDS = { minX: 20, minY: 20, maxX: FIELD.width - 20, maxY: FIELD.height - 20 };
const ARRIVE = 6;

function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = distance(guard.x, guard.y, tx, ty);
  if (dist < ARRIVE) return true;
  const step = Math.min(dist, speed * dt);
  moveCircle(guard, (dx / dist) * step, (dy / dist) * step, GUARD.radius, SOLIDS, BOUNDS);
  guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), GUARD.turnRate * dt);
  return distance(guard.x, guard.y, tx, ty) < ARRIVE;
}

function nearestWaypointIndex(guard) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < guard.route.length; i += 1) {
    const dist = distance(guard.x, guard.y, guard.route[i].x, guard.route[i].y);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function updateGuards(state, dt) {
  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    if (guard.mode === 'patrol') {
      const target = guard.route[guard.waypoint];
      if (walkToward(guard, target.x, target.y, GUARD.speed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.route.length;
      }
    } else if (guard.mode === 'investigate') {
      if (walkToward(guard, guard.targetX, guard.targetY, GUARD.investigateSpeed, dt)) {
        guard.mode = 'look';
        guard.lookTimer = TOOLS.investigateSeconds;
        guard.lookBase = guard.angle;
      }
    } else if (guard.mode === 'look') {
      guard.lookTimer -= dt;
      const elapsed = TOOLS.investigateSeconds - guard.lookTimer;
      guard.angle = guard.lookBase + Math.sin(elapsed * 2.1) * 0.95;
      if (guard.lookTimer <= 0) {
        guard.mode = 'patrol';
        guard.waypoint = nearestWaypointIndex(guard);
      }
    }
  }
}

/** Send a guard to investigate a point (a decoy coin's landing spot). */
export function sendToInvestigate(guard, x, y) {
  guard.mode = 'investigate';
  guard.targetX = x;
  guard.targetY = y;
}

/** The nearest guard to a point, within maxDist, or null. */
export function nearestGuardTo(state, x, y, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (let i = 0; i < state.guards.length; i += 1) {
    const dist = distance(state.guards[i].x, state.guards[i].y, x, y);
    if (dist < bestDist) {
      bestDist = dist;
      best = state.guards[i];
    }
  }
  return best;
}

/** True when the guard's vision cone covers the player with a clear line of sight. */
export function guardSeesPlayer(guard, player) {
  return pointInCone(
    player.x,
    player.y,
    guard.x,
    guard.y,
    guard.angle,
    GUARD.sightHalfAngle,
    GUARD.sightRange,
    SOLIDS,
  );
}
