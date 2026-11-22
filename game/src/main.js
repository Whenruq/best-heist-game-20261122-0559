// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, getaway and busted.
//
// ?seed=N fixes the decoration pattern. ?shot=start|play|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, GOLD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_LOOT, EVENT_TOOL, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_DECOY, ACTION_EMP, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;
/** Clicking this close to a camera (logical pixels) fries it instead of tossing a decoy. */
const CAMERA_CLICK_RANGE = 46;
/** The input that holds the thief still (title screen, staged scenes). */
const IDLE_INPUT = { dx: 0, dy: 0, sneak: false, emp: false, decoy: null };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let pendingEmp = false;
  let pendingDecoy = null;
  let wasSeen = false;

  // Screen readers (and anyone watching the page's text) hear the screen changes and key moments.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    pendingEmp = false;
    pendingDecoy = null;
    wasSeen = false;
    screen = SCREEN_PLAY;
    announce('Playing. Grab the gold in the vault and reach the van.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    const finalScore = won ? world.state.score : world.state.player.gold * GOLD.points;
    if (finalScore > best) {
      best = finalScore;
      saveBest(best);
    }
    announce(
      won
        ? `Clean getaway. Score ${world.state.score}. Best ${best}.`
        : `Busted. ${world.state.caughtReason} Score ${finalScore}. Best ${best}.`,
    );
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    // Playing.
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & ACTION_EMP) pendingEmp = true;
    if (actions & ACTION_DECOY) pendingDecoy = { ...input.mouse() };
    if (click) {
      const nearCamera = world.state.cameras.some(
        (camera) => Math.hypot(camera.x - click.x, camera.y - click.y) < CAMERA_CLICK_RANGE,
      );
      if (nearCamera) pendingEmp = true;
      else pendingDecoy = click;
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // Guards patrol behind the title panel; the thief waits at the van.
      world.step(STEP, IDLE_INPUT);
      return;
    }
    const dir = input.direction();
    const events = world.step(STEP, {
      dx: dir.dx,
      dy: dir.dy,
      sneak: input.sneaking(),
      emp: pendingEmp,
      decoy: pendingDecoy,
    });
    pendingEmp = false;
    pendingDecoy = null;
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_CAUGHT) endGame(false);
    else if (events & EVENT_LOOT) {
      announce(`Gold grabbed. ${world.state.player.gold} of ${world.state.goldBars.length}.`);
    } else if (events & EVENT_TOOL) {
      announce('Tool used.');
    } else if (world.state.seenNow && !wasSeen) {
      announce('Spotted! Break line of sight.');
    }
    wasSeen = world.state.seenNow;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running heist rather than letting the alarm fill unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  // A right-click aims a decoy; it should not also open the browser menu mid-heist.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  announce('Vault Job. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
