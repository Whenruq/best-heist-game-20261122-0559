// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// bank floor; the renderer scales it to the window, so no rule below depends on screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  speed: 190,
  sneakSpeed: 108,
  /** Each gold bar carried slows the thief by this fraction: heavy loot, careful feet. */
  carrySlowPerBar: 0.15,
};

export const GUARD = {
  radius: 15,
  speed: 96,
  investigateSpeed: 132,
  sightRange: 215,
  /** Half the vision cone's width, in radians (about 36 degrees each way). */
  sightHalfAngle: 0.63,
  /** A running (non-sneaking) thief inside this range is heard, even behind the guard. */
  hearingRange: 98,
  /** A guard this close grabs the thief on the spot. */
  catchRange: 31,
  turnRate: 5.2,
};

export const CAMERA = {
  sightRange: 245,
  sightHalfAngle: 0.5,
  /** How fast the sweep oscillates, and how far each way from its base angle. */
  sweepSpeed: 0.5,
  sweepArc: 0.8,
  disabledSeconds: 6,
};

export const ALARM = {
  max: 100,
  /** Alarm points per second while a guard (or camera) has the thief in view, before distance scaling. */
  guardRate: 54,
  cameraRate: 40,
  noiseRate: 14,
  /** Alarm points per second drained while nobody can see or hear the thief. */
  decay: 9,
  /** Sneaking multiplies every detection rate by this. */
  sneakFactor: 0.45,
};

export const TOOLS = {
  empCharges: 2,
  /** An EMP charge fries the nearest camera within this range of the thief. */
  empRange: 285,
  decoyCharges: 3,
  /** A decoy coin can be tossed at most this far from the thief. */
  decoyRange: 345,
  /** The nearest guard within this range of the coin goes to look at it. */
  decoyHearRange: 470,
  investigateSeconds: 2.6,
  coinLifetime: 7,
};

export const GOLD = { radius: 13, points: 1000 };

/** The HUD bar drawn across the top of the field, in logical pixels. */
export const HUD = { height: 52 };

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

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'vault-job.best';
