// The bank floor and the one simulation step. The level is rectangles: a walled shell,
// a vault room in the top-right with a single door, lobby counters and planters for
// cover, and divider walls that leave several routes between the vault and the getaway
// van in the bottom-left. createWorld owns the state; step() advances it by one fixed
// slice, delegating to the player, guard, camera, alarm and tool modules.
import { FIELD, GOLD, PLAYER, SCORE, TOOLS } from './config.js';
import { pointInRect } from './geometry.js';
import { updatePlayer } from './player.js';
import { updateGuards } from './guards.js';
import { updateCameras } from './cameras.js';
import { updateAlarm } from './alarm.js';
import { tossDecoy, updateDecoys, useEmp } from './tools.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_TOOL = 2;
export const EVENT_WIN = 4;
export const EVENT_CAUGHT = 8;

/** Structural walls: the room shell, the vault, and the dividers that shape the routes. */
export const WALLS = [
  { x: 0, y: 0, w: FIELD.width, h: 20 },
  { x: 0, y: FIELD.height - 20, w: FIELD.width, h: 20 },
  { x: 0, y: 0, w: 20, h: FIELD.height },
  { x: FIELD.width - 20, y: 0, w: 20, h: FIELD.height },
  // Vault: left wall with a door gap at y 150-210 (the only way in), solid bottom wall.
  { x: 900, y: 20, w: 24, h: 130 },
  { x: 900, y: 210, w: 24, h: 90 },
  { x: 900, y: 276, w: 360, h: 24 },
  // A safe block inside the vault: cover from the door camera's sweep.
  { x: 1040, y: 55, w: 170, h: 26 },
  // Camera mount stub hanging from the top wall in the lobby.
  { x: 618, y: 20, w: 44, h: 48 },
  // Dividers: a left corridor, a bottom corridor and a right-hand dogleg.
  { x: 420, y: 20, w: 22, h: 170 },
  { x: 640, y: 530, w: 22, h: 170 },
  { x: 820, y: 360, w: 22, h: 150 },
];

/** Lobby counters: solid cover that breaks sight lines. */
export const COUNTERS = [
  { x: 300, y: 300, w: 220, h: 34 },
  { x: 620, y: 300, w: 220, h: 34 },
  { x: 460, y: 470, w: 240, h: 34 },
];

/** Planters: smaller blocks of cover dotted around the floor. */
export const PLANTS = [
  { x: 180, y: 180, w: 44, h: 44 },
  { x: 760, y: 150, w: 44, h: 44 },
  { x: 1050, y: 430, w: 44, h: 44 },
  { x: 250, y: 560, w: 44, h: 44 },
];

/** Everything a body or a sight line can collide with. */
export const SOLIDS = [...WALLS, ...COUNTERS, ...PLANTS];

/** The vault room's floor, tinted differently by the renderer. */
export const VAULT_FLOOR = { x: 924, y: 20, w: 336, h: 256 };

/** The getaway van's parking spot: reach it carrying gold to win. */
export const VAN_ZONE = { x: 20, y: 596, w: 156, h: 104 };

export const PLAYER_START = { x: 98, y: 648 };

export const GOLD_SPOTS = [
  { x: 1005, y: 120 },
  { x: 1095, y: 165 },
  { x: 1185, y: 120 },
];

/** Patrol loops: the lobby, the vault door, and the right-hand floor. */
export const GUARD_ROUTES = [
  [
    { x: 250, y: 240 },
    { x: 700, y: 240 },
    { x: 700, y: 420 },
    { x: 250, y: 420 },
  ],
  [
    { x: 845, y: 115 },
    { x: 845, y: 250 },
    { x: 755, y: 250 },
    { x: 755, y: 115 },
  ],
  [
    { x: 1150, y: 385 },
    { x: 1150, y: 615 },
    { x: 905, y: 615 },
    { x: 905, y: 385 },
  ],
];

/** Camera mounts: the lobby stub (facing down) and the vault door (facing left). */
export const CAMERA_SPOTS = [
  { x: 640, y: 76, baseAngle: Math.PI / 2, phase: 0 },
  { x: 890, y: 180, baseAngle: Math.PI, phase: 2.1 },
];

export function createWorld(random) {
  const state = {
    time: 0,
    status: 'playing', // 'playing' | 'won' | 'caught'
    caughtReason: '',
    player: { x: 0, y: 0, angle: -Math.PI / 2, sneaking: false, moving: false, gold: 0 },
    guards: [],
    cameras: [],
    goldBars: [],
    decoys: [],
    alarm: 0,
    seenNow: false,
    empCharges: TOOLS.empCharges,
    decoyCharges: TOOLS.decoyCharges,
    empFlash: null,
    score: 0,
    scoreParts: { gold: 0, timeBonus: 0, toolBonus: 0 },
  };

  function reset() {
    state.time = 0;
    state.status = 'playing';
    state.caughtReason = '';
    state.player = {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
      gold: 0,
    };
    state.guards = GUARD_ROUTES.map((route) => ({
      x: route[0].x,
      y: route[0].y,
      angle: Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x),
      route,
      waypoint: 1,
      mode: 'patrol', // 'patrol' | 'investigate' | 'look'
      targetX: route[1].x,
      targetY: route[1].y,
      lookTimer: 0,
      lookBase: 0,
    }));
    state.cameras = CAMERA_SPOTS.map((spot) => ({
      x: spot.x,
      y: spot.y,
      baseAngle: spot.baseAngle,
      phase: spot.phase,
      angle: spot.baseAngle,
      disabled: 0,
    }));
    state.goldBars = GOLD_SPOTS.map((spot) => ({
      x: spot.x,
      y: spot.y,
      taken: false,
      glintPhase: random() * Math.PI * 2,
    }));
    state.decoys = [];
    state.alarm = 0;
    state.seenNow = false;
    state.empCharges = TOOLS.empCharges;
    state.decoyCharges = TOOLS.decoyCharges;
    state.empFlash = null;
    state.score = 0;
    state.scoreParts = { gold: 0, timeBonus: 0, toolBonus: 0 };
  }

  /** Settle the score for a successful getaway and mark the run won. */
  function finishWin() {
    const goldPoints = state.player.gold * GOLD.points;
    const timeBonus =
      Math.max(0, SCORE.timeBonusCapSeconds - Math.floor(state.time)) * SCORE.timeBonusPerSecond;
    const toolBonus = (state.empCharges + state.decoyCharges) * SCORE.unusedToolPoints;
    state.scoreParts = { gold: goldPoints, timeBonus, toolBonus };
    state.score = goldPoints + timeBonus + toolBonus;
    state.status = 'won';
  }

  /**
   * Advance the world by `dt` seconds. `input` is {dx, dy, sneak, emp, decoy}, where
   * decoy is null or a logical {x, y} aim point. Returns an EVENT_* bitmask.
   */
  function step(dt, input) {
    if (state.status !== 'playing') return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;

    updatePlayer(state, input, dt);
    updateGuards(state, dt);
    updateCameras(state, dt);
    updateDecoys(state, dt);

    if (input.emp && useEmp(state)) events |= EVENT_TOOL;
    if (input.decoy && tossDecoy(state, input.decoy)) events |= EVENT_TOOL;
    if (state.empFlash) {
      state.empFlash.t -= dt;
      if (state.empFlash.t <= 0) state.empFlash = null;
    }

    for (let i = 0; i < state.goldBars.length; i += 1) {
      const bar = state.goldBars[i];
      if (!bar.taken && Math.hypot(bar.x - state.player.x, bar.y - state.player.y) < PLAYER.radius + GOLD.radius) {
        bar.taken = true;
        state.player.gold += 1;
        events |= EVENT_LOOT;
      }
    }

    events |= updateAlarm(state, dt);
    if (state.status !== 'playing') return events;

    if (state.player.gold > 0 && pointInRect(state.player.x, state.player.y, VAN_ZONE)) {
      finishWin();
      events |= EVENT_WIN;
    }
    return events;
  }

  reset();
  return { state, reset, step, finishWin };
}
