// The geometry toolbox: angle arithmetic, line-of-sight tests against the room's solid
// rectangles, raycasts that give the vision cones their clipped shapes, and circle
// movement that slides along walls instead of sticking to them.

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** The angle from (x1,y1) toward (x2,y2), in radians. */
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Signed smallest difference between two angles, in (-PI, PI]. */
export function angleDifference(a, b) {
  let diff = (a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** Rotate `angle` toward `target`, by at most `maxTurn` radians. */
export function turnToward(angle, target, maxTurn) {
  const diff = angleDifference(target, angle);
  if (Math.abs(diff) <= maxTurn) return target;
  return angle + Math.sign(diff) * maxTurn;
}

/**
 * Does the segment (x1,y1)-(x2,y2) cross the rectangle? Slab method: clip the
 * segment's parameter range against each axis; touching an edge counts as crossing.
 */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when no solid rectangle stands between the two points. */
export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return false;
  }
  return true;
}

/** Distance a ray from (x,y) along `angle` travels before hitting a solid, capped at maxDist. */
export function raycastDistance(x, y, angle, maxDist, solids) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  for (let i = 0; i < solids.length; i += 1) {
    const rect = solids[i];
    let tMin = 0;
    let tMax = best;
    let ok = true;
    if (Math.abs(dx) < 1e-9) {
      if (x < rect.x || x > rect.x + rect.w) ok = false;
    } else {
      let t1 = (rect.x - x) / dx;
      let t2 = (rect.x + rect.w - x) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) ok = false;
    }
    if (ok) {
      if (Math.abs(dy) < 1e-9) {
        if (y < rect.y || y > rect.y + rect.h) ok = false;
      } else {
        let t1 = (rect.y - y) / dy;
        let t2 = (rect.y + rect.h - y) / dy;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) ok = false;
      }
    }
    if (ok && tMin < best) best = tMin;
  }
  return best;
}

/** Is the point inside the cone at (x,y) facing `angle`, with a clear line of sight? */
export function pointInCone(px, py, x, y, angle, halfAngle, range, solids) {
  const dist = distance(px, py, x, y);
  if (dist > range) return false;
  if (dist > 1e-6) {
    const toPoint = Math.atan2(py - y, px - x);
    if (Math.abs(angleDifference(toPoint, angle)) > halfAngle) return false;
  }
  return lineOfSightClear(x, y, px, py, solids);
}

/**
 * Move a circle by (dx, dy), resolving collisions one axis at a time (x first, then y)
 * so the mover slides along walls. When the circle's nearest point on a rectangle is
 * closer than the radius, it is pushed back out along the axis being moved. The fixed
 * axis order keeps identical inputs producing identical slides. Mutates pos.
 */
export function moveCircle(pos, dx, dy, radius, solids, bounds) {
  pos.x += dx;
  resolveAxis(pos, radius, solids, 'x', dx);
  pos.y += dy;
  resolveAxis(pos, radius, solids, 'y', dy);
  pos.x = clamp(pos.x, bounds.minX + radius, bounds.maxX - radius);
  pos.y = clamp(pos.y, bounds.minY + radius, bounds.maxY - radius);
  return pos;
}

function resolveAxis(pos, radius, solids, axis, delta) {
  for (let i = 0; i < solids.length; i += 1) {
    const rect = solids[i];
    const nearestX = clamp(pos.x, rect.x, rect.x + rect.w);
    const nearestY = clamp(pos.y, rect.y, rect.y + rect.h);
    if (distance(pos.x, pos.y, nearestX, nearestY) >= radius) continue;
    if (axis === 'x') {
      pos.x = delta > 0 ? rect.x - radius : rect.x + rect.w + radius;
    } else {
      pos.y = delta > 0 ? rect.y - radius : rect.y + rect.h + radius;
    }
  }
}

/** Is the point inside the rectangle, edges included? */
export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
