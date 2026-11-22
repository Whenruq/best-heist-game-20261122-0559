// The thief: eight-way movement that slides along walls, a slower sneak that is harder
// to spot and makes no noise, and a carry penalty — every gold bar on board slows the
// getaway a little more.
import { FIELD, PLAYER } from './config.js';
import { moveCircle } from './geometry.js';
import { SOLIDS } from './world.js';

const BOUNDS = { minX: 20, minY: 20, maxX: FIELD.width - 20, maxY: FIELD.height - 20 };

/** The thief's current top speed: sneak pace or run pace, minus the weight of the loot. */
export function playerSpeed(player) {
  const base = player.sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
  return base * (1 - PLAYER.carrySlowPerBar * player.gold);
}

export function updatePlayer(state, input, dt) {
  const player = state.player;
  player.sneaking = Boolean(input.sneak);
  const length = Math.hypot(input.dx, input.dy);
  player.moving = length > 0;
  if (!player.moving) return;

  const speed = playerSpeed(player);
  const dx = (input.dx / length) * speed * dt;
  const dy = (input.dy / length) * speed * dt;
  moveCircle(player, dx, dy, PLAYER.radius, SOLIDS, BOUNDS);
  player.angle = Math.atan2(dy, dx);
}
