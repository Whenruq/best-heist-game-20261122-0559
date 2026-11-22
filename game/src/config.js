// Vault Job's tuning sheet: every number and colour the game uses lives here, so the
// rest of the code reads as rules rather than arithmetic. The bank floor is a fixed
// 1280x720 logical field; the renderer letterboxes it to whatever window it gets.

export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step in seconds: 60 updates a second, whatever the display rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  speed: 190,
  sneakSpeed: 108,
  /** Each gold bar on board slows the thief by this fraction. Heavy loot, slow feet. */
  carrySlowPerBar: 0.15,
};

export const GUARD = {
  radius: 15,
  speed: 96,
  investigateSpeed: 132,
  sightRange: 215,
  /** Half-width of the vision cone in radians (roughly 36 degrees each way). */
  sightHalfAngle: 0.63,
  /** A thief moving at full pace inside this range is heard, even from behind. */
  hearingRange: 98,
  /** A guard this close simply grabs the thief. */
  catchRange: 31,
  turnRate: 5.2,
};

export const CAMERA = {
  sightRange: 245,
  sightHalfAngle: 0.5,
  /** The sweep: how fast the cone oscillates and how far it swings from its base angle. */
  sweepSpeed: 0.5,
  sweepArc: 0.8,
  disabledSeconds: 6,
};

export const ALARM = {
  max: 100,
  /** Points per second while in view, before the distance scaling in alarm.js. */
  guardRate: 54,
  cameraRate: 40,
  noiseRate: 14,
  /** Points per second drained while nobody can see or hear the thief. */
  decay: 9,
  /** Sneaking multiplies every detection rate by this. */
  sneakFactor: 0.45,
};

export const TOOLS = {
  empCharges: 2,
  /** An EMP charge fries the nearest live camera within this range of the thief. */
  empRange: 285,
  decoyCharges: 3,
  /** A decoy coin can be tossed at most this far. */
  decoyRange: 345,
  /** The nearest guard within this range of the coin walks over to investigate. */
  decoyHearRange: 470,
  investigateSeconds: 2.6,
  coinLifetime: 7,
};

export const GOLD = { radius: 13, points: 1000 };

/** Height of the HUD bar across the top of the field, in logical pixels. */
export const HUD = { height: 52 };

/** How many rays shape each vision cone when it is drawn (more = smoother edges). */
export const CONE_RAYS = 22;

export const SCORE = {
  timeBonusPerSecond: 10,
  timeBonusCapSeconds: 300,
  unusedToolPoints: 150,
};

export const PALETTE = {
  backdrop: '#0d1017',
  floor: '#1d2334',
  floorAlt: '#212a3f',
  vaultFloor: '#2b2340',
  wall: '#3a4260',
  wallTop: '#525f8a',
  counter: '#5c4630',
  counterTop: '#7d5f40',
  plant: '#2f6e47',
  plantDark: '#24573a',
  van: '#26364d',
  vanStripe: '#f2c94c',
  gold: '#f2c94c',
  goldDark: '#c79a2e',
  player: '#37c8b4',
  playerDark: '#1f7a6d',
  guard: '#3b5bdb',
  guardDark: '#2b439e',
  guardCap: '#e5534b',
  camera: '#d7dde8',
  cameraDark: '#8b93a3',
  coneGuard: 'rgba(242, 201, 76, 0.15)',
  coneCamera: 'rgba(229, 83, 75, 0.14)',
  coneOff: 'rgba(150, 160, 180, 0.07)',
  panel: 'rgba(13, 17, 27, 0.9)',
  text: '#eef1f5',
  muted: '#9aa3b5',
  alarmLow: '#57d977',
  alarmMid: '#f2c94c',
  alarmHigh: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** localStorage key for the best score (this browser only). */
export const BEST_KEY = 'vault-job.best';
