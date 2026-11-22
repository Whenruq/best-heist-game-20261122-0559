// The security cameras: fixed mounts whose cones sweep back and forth on a sine. An EMP
// charge freezes a camera (grey cone, no detection) for a few seconds; the sweep resumes
// from the same clock, so a disabled camera never drifts out of sync with the others.
import { CAMERA } from './config.js';
import { pointInCone } from './geometry.js';
import { SOLIDS } from './world.js';

export function updateCameras(state, dt) {
  for (let i = 0; i < state.cameras.length; i += 1) {
    const camera = state.cameras[i];
    if (camera.disabled > 0) {
      camera.disabled = Math.max(0, camera.disabled - dt);
      continue;
    }
    camera.angle = camera.baseAngle + Math.sin(state.time * CAMERA.sweepSpeed + camera.phase) * CAMERA.sweepArc;
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
