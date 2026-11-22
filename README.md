[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Whenruq/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Whenruq/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Vault Job

A top-down bank heist in one static page: slip past three patrolling guards and two
sweeping cameras, grab the gold bars from the vault, and get back to the getaway van
before the alarm meter fills. Carrying gold slows you down, so every bar is a wager —
one bar and a clean exit, or all three and a nervous walk home?

Entry for make.fun's [best-heist-game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).
The three screenshots in `screenshots/` are real renders of the game (the first is the cover).

## How to play

- **Move:** WASD or arrow keys
- **Sneak:** hold Shift (slower, but harder to spot and silent)
- **EMP charge:** E, or click a camera — fries the nearest live camera for 6 seconds (2 charges)
- **Decoy coin:** Q, or click a spot — the nearest guard walks over to investigate (3 charges)
- **Pause:** P or Esc

Guards see in cones and hear running feet; cameras sweep. Being seen fills the alarm,
breaking line of sight drains it. At 100% — or if a guard lays a hand on you — the job
is over. Score is gold, a time bonus, and points for tools you never spent.

## Run it

```
node serve.ts        # then open http://localhost:8080
node main.ts         # writes the entry (game/, screenshots/, dossier.json) to /output
```

Outside the grader's container, `MAKEFUN_OUTPUT_DIR=out node main.ts` writes to `./out`
instead. The game itself is plain HTML + ES modules under `game/` — no build step, no
network requests, works offline. `?seed=N` fixes the decoration pattern;
`?shot=start|play|end&seed=1` stages the screenshot scenes.

## Layout

- `game/src/config.js` — every tuning number and colour
- `game/src/world.js` — the bank floor and the one simulation step
- `game/src/guards.js`, `cameras.js`, `player.js` — the actors
- `game/src/alarm.js` — detection and the alarm meter
- `game/src/tools.js` — EMP charges and decoy coins
- `game/src/geometry.js` — sight lines, raycasts, wall sliding
- `game/src/render.js` — canvas drawing, HUD and screens
- `game/src/input.js`, `random.js`, `shots.js`, `main.js` — input, seeded RNG, screenshot scenes, boot
- `vendor/makefun-game.ts` — the vendored make.fun dossier library
