// Keyboard and mouse, translated into game terms: a movement direction, a sneak flag,
// one-shot action bits (confirm, pause, EMP, decoy), and the pointer position in
// logical field coordinates for aiming decoy tosses and clicking cameras.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_EMP = 4;
export const ACTION_DECOY = 8;

const KEY_DIRECTIONS = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let click = null;
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2 };

  // Screen pixels to logical field coordinates, undoing the renderer's letterbox.
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    // Browser shortcuts (Ctrl/Cmd combos) are not game input.
    if (event.ctrlKey || event.metaKey) return;
    if (KEY_DIRECTIONS[event.code] || event.code === 'Space') event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter') {
      actions |= ACTION_CONFIRM;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyE') {
      actions |= ACTION_EMP;
    } else if (event.code === 'KeyQ') {
      actions |= ACTION_DECOY;
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointermove', (event) => {
    const point = toLogical(event);
    mouse.x = point.x;
    mouse.y = point.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    mouse.x = point.x;
    mouse.y = point.y;
    click = point;
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Held movement direction as {dx, dy}, each in [-1, 1], not normalised. */
    direction() {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        const dir = KEY_DIRECTIONS[code];
        if (dir) {
          dx += dir[0];
          dy += dir[1];
        }
      }
      return { dx, dy };
    },
    sneaking() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
    mouse() {
      return mouse;
    },
    /** One-shot actions pressed since the last call, as a bitmask; clears them. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Last click in logical coordinates since the last call, or null; clears it. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
