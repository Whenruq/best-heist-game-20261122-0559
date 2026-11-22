// The screenshot scenes behind ?shot=start|play|end. Each one stages a real moment of
// the heist — the same world, rules and renderer as live play — so the frame is what a
// short game really looks like, and the same seed always gives the same frame:
//   start: mid-heist in the lobby — room, thief, guard and camera cones, gold and the
//          alarm meter all in one frame.
//   play:  at the vault door with a bar of gold on board, the door camera just fried by
//          an EMP, and a decoy coin pulling a guard away.
//   end:   the clean-getaway screen after a three-bar run.
import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_WIN } from './render.js';

const IDLE = { dx: 0, dy: 0, sneak: false, emp: false, decoy: null };
/** A beat of live simulation after staging, so cones and guards settle into the frame. */
const SETTLE_SECONDS = 0.35;

function run(world, seconds, input) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, input);
}

function stageStart(world) {
  world.reset();
  // Walk the thief into the lobby and up behind the first counter, guards mid-patrol.
  run(world, 1.7, { ...IDLE, dx: 1 });
  run(world, 1.9, { ...IDLE, dy: -1 });
  run(world, 1.1, { ...IDLE, dx: 1 });
  run(world, 0.4, IDLE);
  world.state.alarm = 34;
  return { screen: SCREEN_PLAY, best: 0 };
}

function stagePlay(world) {
  world.reset();
  const state = world.state;
  // A few seconds of patrol so the guards are spread across their routes.
  run(world, 3.2, IDLE);
  // The thief, one bar richer, slips out of the vault door...
  state.player.x = 858;
  state.player.y = 180;
  state.player.angle = Math.PI;
  state.player.gold = 1;
  state.goldBars[0].taken = true;
  // ...the door camera is still smoking from an EMP charge...
  state.cameras[1].disabled = 5.4;
  state.empCharges -= 1;
  state.empFlash = { x: state.cameras[1].x, y: state.cameras[1].y, t: 0.45 };
  // ...and a decoy coin in the lobby has the nearest guard walking over to look.
  state.decoys.push({ x: 690, y: 250, ttl: 6 });
  state.decoyCharges -= 1;
  const guard = state.guards[0];
  guard.mode = 'investigate';
  guard.targetX = 690;
  guard.targetY = 250;
  state.alarm = 52;
  run(world, SETTLE_SECONDS, IDLE);
  return { screen: SCREEN_PLAY, best: 0 };
}

function stageEnd(world) {
  world.reset();
  const state = world.state;
  run(world, 2.0, IDLE);
  state.player.x = 98;
  state.player.y = 648;
  state.player.gold = 3;
  for (const bar of state.goldBars) bar.taken = true;
  state.time = 95;
  world.finishWin();
  return { screen: SCREEN_WIN, best: state.score };
}

/** Set `world` to the named scene (start, play or end; any other name is start). */
export function stageShot(name, world) {
  if (name === 'play') return stagePlay(world);
  if (name === 'end') return stageEnd(world);
  return stageStart(world);
}
