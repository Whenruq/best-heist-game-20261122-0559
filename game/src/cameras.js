// The security cameras: fixed mounts whose cones sweep back and forth on a sine. An EMP
// charge freezes a camera (grey cone, no detection) for a few seconds; the sweep runs
// off the world clock, so a disabled camera resumes in sync with the others.
import { CAMERA } from './config.js';
import { pointInCone } from './geometry.js';
import { SOLIDS } from './world.js';

/** Where a live camera's cone points at world time `time`. */
export function sweepAngle(camera, time) {
  return camera.baseAngle + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * CAMERA.sweepArc;
}

export function updateCameras(state, dt) {
  for (let i = 0; i < state.cameras.length; i += 1) {
    const camera = state.cameras[i];
    if (camera.disabled > 0) {
      camera.disabled = Math.max(0, camera.disabled - dt);
      continue;
    }
    camera.angle = sweepAngle(camera, state.time);
  }
}

/** True when the camera is live and its cone covers the player with a clear line of sight. */
export function cameraSeesPlayer(camera, player) {
  if (camera.disabled > 0) return false;
  return pointInCone(
    player.x,
    player.y,
    camera.x,
    camera.y,
    camera.angle,
    CAMERA.sightHalfAngle,
    CAMERA.sightRange,
    SOLIDS,
  );
}
