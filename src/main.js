import { input, setupInput } from "./input.js";
import { player, updatePlayer } from "./player.js";
import { world, createWorld, drawWorld } from "./world.js";
import { bots, createBots, updateBots, drawBots } from "./bots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let width = 1;
let height = 1;
let running = false;
let lastTime = 0;

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