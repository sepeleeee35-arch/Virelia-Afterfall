import { input, setupInput } from "./input.js";
import { player, updatePlayer } from "./player.js";
import { world, createWorld, drawWorld } from "./world.js";
import { bots, createBots, updateBots, drawBots } from "./bots.js";

const VERSION = "0.5.0";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const miniCanvas = document.getElementById("mini");
const miniCtx = miniCanvas ? miniCanvas.getContext("2d") : null;

let width = 1;
let height = 1;
let running = false;
let lastTime = 0;

let zoneTime = 300;
let inventoryOpen = false;

const camera = {
  x: 0,
  y: 0
};

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  if (miniCanvas && miniCtx) {
    const miniDpr = Math.min(window.devicePixelRatio || 1, 2);

    miniCanvas.width = 118 * miniDpr;
    miniCanvas.height = 118 * miniDpr;

    miniCtx.setTransform(
      miniDpr,
      0,
      0,
      miniDpr,
      0,
      0
    );
  }
}

function updateHud(dt) {
  const hpBar = document.getElementById("hpBar");
  const staminaBar = document.getElementById("staminaBar");
  const alive = document.getElementById("alive");
  const zoneTimer = document.getElementById("zoneTimer");

  if (hpBar) {
    hpBar.style.width = `${Math.max(0, Math.min(100, player.hp))}%`;
  }

  if (staminaBar) {
    staminaBar.style.width = `${Math.max(0, Math.min(100, player.stamina))}%`;
  }

  if (alive) {
    alive.textContent = String(bots.length + 1);
  }

  zoneTime = Math.max(0, zoneTime - dt);

  if (zoneTimer) {
    const minutes = Math.floor(zoneTime / 60);
    const seconds = Math.floor(zoneTime % 60);

    zoneTimer.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

function update(dt) {
  updatePlayer(dt);
  updateBots(dt);

  camera.x +=
    (player.x - camera.x) * 0.12;

  camera.y +=
    (player.y - camera.y) * 0.12;

  camera.x = Math.max(
    width / 2,
    Math.min(
      world.width - width / 2,
      camera.x
    )
  );

  camera.y = Math.max(
    height / 2,
    Math.min(
      world.height - height / 2,
      camera.y
    )
  );

  updateHud(dt);
}

function drawMinimap() {
  if (!miniCtx) return;

  const w = 118;
  const h = 118;

  miniCtx.clearRect(0, 0, w, h);

  miniCtx.fillStyle = "#70865e";
  miniCtx.fillRect(0, 0, w, h);

  const sx = w / world.width;
  const sy = h / world.height;

  miniCtx.fillStyle = "#4f666b";

  for (const road of world.roads) {
    miniCtx.fillRect(
      road.x * sx,
      road.y * sy,
      road.w * sx,
      road.h * sy
    );
  }

  miniCtx.fillStyle = "#867e6e";

  for (const building of world.buildings) {
    miniCtx.fillRect(
      building.x * sx,
      building.y * sy,
      building.w * sx,
      building.h * sy
    );
  }

  miniCtx.fillStyle = "#c5b376";
  miniCtx.fillRect(
    4500 * sx,
    0,
    200 * sx,
    h
  );

  miniCtx.fillStyle = "#4b7e8d";
  miniCtx.fillRect(
    4700 * sx,
    0,
    1300 * sx,
    h
  );

  miniCtx.fillStyle = "#f3f0c4";

  for (const bot of bots) {
    miniCtx.fillRect(
      bot.x * sx - 1,
      bot.y * sy - 1,
      2,
      2
    );
  }

  miniCtx.fillStyle = "#ffffff";

  miniCtx.beginPath();
  miniCtx.arc(
    player.x * sx,
    player.y * sy,
    3,
    0,
    Math.PI * 2
  );
  miniCtx.fill();
}

function render() {
  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  ctx.fillStyle = "#718b5d";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.save();

  ctx.translate(
    width / 2 - camera.x,
    height / 2 - camera.y
  );

  drawWorld(ctx);
  drawBots(ctx);
  drawPlayer(ctx);

  ctx.restore();

  drawMinimap();
}

function drawPlayer(ctx) {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = "rgba(0,0,0,.25)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 27,
    25,
    9,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#334b55";

  ctx.fillRect(
    x - 15,
    y - 40,
    30,
    43
  );

  ctx.fillStyle = "#c18d72";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 54,
    12,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#242729";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 58,
    12,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle = "#242c30";
  ctx.lineWidth = 9;

  ctx.beginPath();

  ctx.moveTo(
    x - 7,
    y + 3
  );

  ctx.lineTo(
    x - 10,
    y + 28
  );

  ctx.moveTo(
    x + 7,
    y + 3
  );

  ctx.lineTo(
    x + 10,
    y + 28
  );

  ctx.stroke();
}

function setupUi() {
  const bag =
    document.getElementById("bagBtn");

  const inventory =
    document.getElementById("inventory");

  if (bag && inventory) {
    bag.addEventListener(
      "click",
      () => {
        inventoryOpen = !inventoryOpen;
        inventory.style.display =
          inventoryOpen ? "block" : "none";
      }
    );
  }

  const version =
    document.querySelector(".version");

  if (version) {
    version.textContent =
      `VIRELIA v${VERSION}`;
  }

  const startVersion =
    document.querySelector(".versionStart");

  if (startVersion) {
    startVersion.textContent =
      `VERSION ${VERSION}`;
  }
}

function loop(time) {
  if (!running) return;

  const dt = Math.min(
    (time - lastTime) / 1000,
    0.033
  );

  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

export function startGame() {
  if (running) return;

  running = true;

  resize();

  createWorld();

  player.x = world.width / 2;
  player.y = world.height / 2;

  createBots();

  setupInput();
  setupUi();

  camera.x = player.x;
  camera.y = player.y;

  lastTime = performance.now();

  requestAnimationFrame(loop);
}

window.addEventListener(
  "resize",
  resize
);

window.addEventListener(
  "orientationchange",
  () => {
    setTimeout(resize, 150);
  }
);
