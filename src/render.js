// Everything the player sees: the bank floor, vision cones clipped by walls, the thief,
// guards and cameras, the gold, the HUD with its alarm meter, and the title / pause /
// getaway / busted overlays. The logical 1280x720 field is letterboxed to the window.
import { ALARM, CAMERA, FIELD, FONT, GOLD, GUARD, HUD, PALETTE } from './config.js';
import { raycastDistance } from './geometry.js';
import { COUNTERS, PLANTS, SOLIDS, VAN_ZONE, VAULT_FLOOR, WALLS } from './world.js';
import { guardSeesPlayer } from './guards.js';
import { cameraSeesPlayer } from './cameras.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_WIN = 3;
export const SCREEN_OVER = 4;

const CONE_RAYS = 22;
const TILE = 40;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    return {
      scale,
      offsetX: (canvas.width - FIELD.width * scale) / 2,
      offsetY: (canvas.height - FIELD.height * scale) / 2,
    };
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floorAlt;
    for (let y = 0; y < FIELD.height / TILE; y += 1) {
      for (let x = 0; x < FIELD.width / TILE; x += 1) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    ctx.fillStyle = PALETTE.vaultFloor;
    ctx.fillRect(VAULT_FLOOR.x, VAULT_FLOOR.y, VAULT_FLOOR.w, VAULT_FLOOR.h);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', VAULT_FLOOR.x + VAULT_FLOOR.w / 2, VAULT_FLOOR.y + 24);
  }

  function drawVanZone() {
    ctx.fillStyle = PALETTE.van;
    ctx.fillRect(VAN_ZONE.x, VAN_ZONE.y, VAN_ZONE.w, VAN_ZONE.h);
    ctx.strokeStyle = PALETTE.vanStripe;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(VAN_ZONE.x + 4, VAN_ZONE.y + 4, VAN_ZONE.w - 8, VAN_ZONE.h - 8);
    ctx.setLineDash([]);
    // The van itself: a simple top-down box with a windshield.
    ctx.fillStyle = '#42506b';
    ctx.fillRect(VAN_ZONE.x + 18, VAN_ZONE.y + 26, 120, 52);
    ctx.fillStyle = '#9fc4e8';
    ctx.fillRect(VAN_ZONE.x + 108, VAN_ZONE.y + 32, 22, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY VAN', VAN_ZONE.x + VAN_ZONE.w / 2, VAN_ZONE.y + 18);
  }

  function drawCone(x, y, angle, halfAngle, range, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i <= CONE_RAYS; i += 1) {
      const rayAngle = angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
      const dist = raycastDistance(x, y, rayAngle, range, SOLIDS);
      ctx.lineTo(x + Math.cos(rayAngle) * dist, y + Math.sin(rayAngle) * dist);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawSolids() {
    for (const rect of WALLS) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(rect.x, rect.y, rect.w, Math.min(5, rect.h));
    }
    for (const rect of COUNTERS) {
      ctx.fillStyle = PALETTE.counter;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = PALETTE.counterTop;
      ctx.fillRect(rect.x, rect.y, rect.w, 7);
    }
    for (const rect of PLANTS) {
      ctx.fillStyle = PALETTE.plantDark;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = PALETTE.plant;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGoldBar(bar, time) {
    const bob = Math.sin(time * 2 + bar.glintPhase) * 1.5;
    ctx.fillStyle = PALETTE.goldDark;
    ctx.fillRect(bar.x - 13, bar.y - 7 + bob, 26, 14);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(bar.x - 11, bar.y - 6 + bob, 22, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(bar.x - 8, bar.y - 5 + bob, 7, 3);
  }

  function drawDecoy(coin) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldDark;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawCamera(camera, sees) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.angle);
    ctx.fillStyle = camera.disabled > 0 ? PALETTE.cameraDark : PALETTE.camera;
    ctx.fillRect(-7, -6, 16, 12);
    ctx.fillStyle = camera.disabled > 0 ? '#5c6474' : '#e5534b';
    ctx.beginPath();
    ctx.arc(9, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (camera.disabled > 0) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(camera.x - 8, camera.y - 12);
      ctx.lineTo(camera.x - 2, camera.y - 6);
      ctx.lineTo(camera.x - 7, camera.y - 1);
      ctx.lineTo(camera.x - 1, camera.y + 5);
      ctx.stroke();
    }
    if (sees) drawAlert(camera.x, camera.y - 22);
  }

  function drawGuard(guard, sees) {
    ctx.fillStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius - 3, 0, Math.PI * 2);
    ctx.fill();
    // Cap brim toward the facing direction.
    ctx.fillStyle = PALETTE.guardCap;
    ctx.beginPath();
    ctx.arc(
      guard.x + Math.cos(guard.angle) * 7,
      guard.y + Math.sin(guard.angle) * 7,
      6,
      guard.angle - 1.2,
      guard.angle + 1.2,
    );
    ctx.fill();
    if (sees) drawAlert(guard.x, guard.y - GUARD.radius - 12);
  }

  function drawAlert(x, y) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = `900 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y);
  }

  function drawPlayer(player) {
    // Carried gold trails behind as little pips.
    for (let i = 0; i < player.gold; i += 1) {
      const back = 18 + i * 9;
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(
        player.x - Math.cos(player.angle) * back - 5,
        player.y - Math.sin(player.angle) * back - 4,
        10,
        8,
      );
    }
    ctx.fillStyle = PALETTE.playerDark;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
    ctx.fill();
    // Mask band across the facing direction.
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#10202b';
    ctx.fillRect(2, -8, 7, 16);
    ctx.restore();
    if (player.sneaking) {
      ctx.strokeStyle = 'rgba(238,241,245,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function formatTime(seconds) {
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, HUD.height);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText('ALARM', 18, 32);
    // The meter: green, then amber, then red as it fills.
    const meterX = 92;
    const meterW = 300;
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(meterX, 16, meterW, 20);
    const frac = state.alarm / ALARM.max;
    ctx.fillStyle = frac < 0.45 ? PALETTE.alarmLow : frac < 0.75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
    ctx.fillRect(meterX, 16, meterW * frac, 20);
    ctx.strokeStyle = PALETTE.muted;
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, 16, meterW, 20);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 14px ${FONT}`;
    ctx.fillText(`${Math.round(state.alarm)}%`, meterX + meterW + 10, 32);

    // Gold carried, as three bar slots.
    ctx.fillText('GOLD', 480, 32);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.player.gold ? PALETTE.gold : '#2a3040';
      ctx.fillRect(532 + i * 30, 18, 24, 14);
    }

    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`EMP x${state.empCharges} [E]`, 650, 32);
    ctx.fillText(`DECOY x${state.decoyCharges} [Q]`, 770, 32);
    ctx.fillText(formatTime(state.time), 930, 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 14px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('Grab the gold. Reach the van.', FIELD.width - 18, 32);
    ctx.textAlign = 'left';
  }

  function drawPanel(title, lines, footer) {
    const w = 560;
    const h = 92 + lines.length * 26 + 44;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PALETTE.wallTop;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `900 44px ${FONT}`;
    ctx.fillText(title, FIELD.width / 2, y + 58);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 17px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, y + 96 + i * 26);
    });
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText(footer, FIELD.width / 2, y + h - 20);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    const view = fitCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);

    drawFloor();
    drawVanZone();
    for (const bar of state.goldBars) if (!bar.taken) drawGoldBar(bar, state.time);
    for (const coin of state.decoys) drawDecoy(coin);

    for (const camera of state.cameras) {
      drawCone(
        camera.x,
        camera.y,
        camera.angle,
        CAMERA.sightHalfAngle,
        CAMERA.sightRange,
        camera.disabled > 0 ? PALETTE.coneOff : PALETTE.coneCamera,
      );
    }
    for (const guard of state.guards) {
      drawCone(guard.x, guard.y, guard.angle, GUARD.sightHalfAngle, GUARD.sightRange, PALETTE.coneGuard);
    }

    drawSolids();
    for (const camera of state.cameras) drawCamera(camera, cameraSeesPlayer(camera, state.player));
    for (const guard of state.guards) drawGuard(guard, guardSeesPlayer(guard, state.player));
    drawPlayer(state.player);

    if (state.empFlash) {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(state.empFlash.x, state.empFlash.y, 26 - state.empFlash.t * 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // A red pulse at the edges while the alarm is dangerously high.
    if (state.alarm > 55 && screen === SCREEN_PLAY) {
      const alpha = 0.1 + 0.08 * Math.sin(state.time * 6);
      ctx.strokeStyle = `rgba(229, 83, 75, ${alpha + 0.12})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, FIELD.width - 14, FIELD.height - 14);
    }

    drawHud(state);

    if (screen === SCREEN_TITLE) {
      drawPanel(
        'VAULT JOB',
        [
          'Slip past the guards and cameras, grab the gold,',
          'and get back to the van before the alarm fills.',
          '',
          'Move: WASD / arrows    Sneak: hold Shift',
          'EMP a camera: E or click it    Decoy coin: Q or click',
          'Carrying gold slows you down. Stay out of the cones!',
        ],
        best > 0 ? `Best score: ${best}   ·   Press Space or click to start` : 'Press Space or click to start',
      );
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The vault waits.'], 'Press P or Space to keep going');
    } else if (screen === SCREEN_WIN) {
      drawPanel(
        'CLEAN GETAWAY',
        [
          `Gold: ${state.player.gold} bar${state.player.gold === 1 ? '' : 's'}  (+${state.scoreParts.gold})`,
          `Time bonus: +${state.scoreParts.timeBonus}`,
          `Unused tools: +${state.scoreParts.toolBonus}`,
          `Score: ${state.score}   ·   Best: ${Math.max(best, state.score)}`,
        ],
        'Press Space or click to run it again',
      );
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'BUSTED',
        [
          state.caughtReason,
          `You grabbed ${state.player.gold} gold bar${state.player.gold === 1 ? '' : 's'} before the cuffs.`,
          `Score: ${state.player.gold * GOLD.points}   ·   Best: ${best}`,
        ],
        'Press Space or click to try again',
      );
    }
  }

  return { draw };
}
