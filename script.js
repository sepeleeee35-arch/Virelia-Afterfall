const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 3600;
const H = 2600;

const keys = {};
const joy = { x: 0, y: 0, active: false };

let mode = "outside";
let building = null;
let furniture = [];
let last = performance.now();

const player = {
  x: 1800,
  y: 700,
  r: 14,
  speed: 3.4,
  hp: 100,
  hunger: 100,
  car: null
};

const camera = {
  x: player.x,
  y: player.y
};

const roads = [
  { x: 0, y: 430, w: W, h: 170 },
  { x: 0, y: 1210, w: W, h: 170 },
  { x: 0, y: 1990, w: W, h: 170 },
  { x: 520, y: 0, w: 170, h: H },
  { x: 1715, y: 0, w: 170, h: H },
  { x: 2910, y: 0, w: 170, h: H }
];

const buildings = [
  { x: 70, y: 70, w: 330, h: 260 },
  { x: 790, y: 70, w: 330, h: 260 },
  { x: 1250, y: 80, w: 330, h: 240 },
  { x: 2020, y: 70, w: 330, h: 260 },
  { x: 2480, y: 80, w: 300, h: 240 },
  { x: 3160, y: 70, w: 330, h: 260 },

  { x: 80, y: 680, w: 320, h: 300 },
  { x: 790, y: 680, w: 330, h: 300 },
  { x: 1250, y: 700, w: 330, h: 270 },
  { x: 2020, y: 680, w: 330, h: 300 },
  { x: 2480, y: 700, w: 300, h: 270 },
  { x: 3160, y: 680, w: 330, h: 300 },

  { x: 80, y: 1450, w: 320, h: 350 },
  { x: 790, y: 1450, w: 330, h: 300 },
  { x: 1250, y: 1480, w: 330, h: 270 },
  { x: 2020, y: 1450, w: 330, h: 300 },
  { x: 2480, y: 1480, w: 300, h: 270 },
  { x: 3160, y: 1450, w: 330, h: 300 },

  { x: 80, y: 2150, w: 320, h: 300 },
  { x: 790, y: 2150, w: 330, h: 300 },
  { x: 1250, y: 2170, w: 330, h: 270 },
  { x: 2020, y: 2150, w: 330, h: 300 },
  { x: 2480, y: 2170, w: 300, h: 270 },
  { x: 3160, y: 2150, w: 330, h: 300 }
];

buildings.forEach((b, i) => {
  b.color = ["#77756d", "#686b66", "#716e67", "#626762"][i % 4];
});

const trees = [];

for (const b of buildings) {
  const points = [
    [b.x - 35, b.y - 35],
    [b.x + b.w + 35, b.y - 35],
    [b.x - 35, b.y + b.h + 35],
    [b.x + b.w + 35, b.y + b.h + 35]
  ];

  for (const p of points) {
    if (
      p[0] > 35 &&
      p[1] > 35 &&
      p[0] < W - 35 &&
      p[1] < H - 35 &&
      !onRoad(p[0], p[1])
    ) {
      trees.push({ x: p[0], y: p[1], r: 25 });
    }
  }
}

const cars = [
  { x: 300, y: 515, color: "#9b3030", angle: 0 },
  { x: 1000, y: 515, color: "#4d5960", angle: 0 },
  { x: 2200, y: 515, color: "#a38c32", angle: 0 },
  { x: 3300, y: 515, color: "#59656c", angle: 0 },

  { x: 605, y: 800, color: "#4b5960", angle: Math.PI / 2 },
  { x: 1800, y: 900, color: "#7d3434", angle: Math.PI / 2 },
  { x: 3000, y: 850, color: "#776d35", angle: Math.PI / 2 },

  { x: 1000, y: 1295, color: "#56636a", angle: 0 },
  { x: 2300, y: 1295, color: "#843b3b", angle: 0 },

  { x: 605, y: 1660, color: "#4b5258", angle: Math.PI / 2 },
  { x: 1800, y: 1720, color: "#827139", angle: Math.PI / 2 },
  { x: 3000, y: 1640, color: "#704848", angle: Math.PI / 2 },

  { x: 1000, y: 2075, color: "#59666d", angle: 0 },
  { x: 2300, y: 2075, color: "#843636", angle: 0 }
];

cars.forEach(c => {
  c.w = 82;
  c.h = 42;
  c.occupied = false;
});

const zombies = [
  { x: 250, y: 515, r: 13, speed: 0.7 },
  { x: 1100, y: 515, r: 13, speed: 0.65 },
  { x: 2200, y: 515, r: 13, speed: 0.7 },
  { x: 3300, y: 515, r: 13, speed: 0.65 },
  { x: 1050, y: 1295, r: 13, speed: 0.7 },
  { x: 2400, y: 1295, r: 13, speed: 0.65 },
  { x: 1050, y: 2075, r: 13, speed: 0.7 },
  { x: 2400, y: 2075, r: 13, speed: 0.65 }
];

function onRoad(x, y) {
  return roads.some(r =>
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function circleRect(x, y, radius, r) {
  const px = clamp(x, r.x, r.x + r.w);
  const py = clamp(y, r.y, r.y + r.h);
  const dx = x - px;
  const dy = y - py;
  return dx * dx + dy * dy < radius * radius;
}

function blocked(x, y, radius, ignoreCar = null) {
  if (
    x < radius ||
    y < radius ||
    x > W - radius ||
    y > H - radius
  ) return true;

  for (const b of buildings) {
    if (circleRect(x, y, radius, b)) return true;
  }

  for (const t of trees) {
    if (Math.hypot(x - t.x, y - t.y) < radius + t.r * 0.7) {
      return true;
    }
  }

  for (const c of cars) {
    if (c === ignoreCar) continue;
    if (Math.hypot(x - c.x, y - c.y) < radius + 42) {
      return true;
    }
  }

  return false;
}

function moveOutside(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!blocked(nx, player.y, player.r, player.car)) {
    player.x = nx;
  }

  if (!blocked(player.x, ny, player.r, player.car)) {
    player.y = ny;
  }
}

function moveCar(dx, dy) {
  const c = player.car;
  if (!c) return;

  const nx = c.x + dx;
  const ny = c.y + dy;

  if (!onRoad(nx, ny)) return;
  if (blocked(nx, ny, 42, c)) return;

  c.x = nx;
  c.y = ny;
  player.x = nx;
  player.y = ny;

  if (Math.hypot(dx, dy) > 0.1) {
    c.angle = Math.atan2(dy, dx);
  }
}

function door(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h
  };
}

function nearestDoor() {
  let best = null;
  let dist = 65;

  for (const b of buildings) {
    const d = door(b);
    const n = Math.hypot(player.x - d.x, player.y - d.y);

    if (n < dist) {
      dist = n;
      best = b;
    }
  }

  return best;
}

function nearestCar() {
  let best = null;
  let dist = 60;

  for (const c of cars) {
    if (c.occupied) continue;

    const n = Math.hypot(player.x - c.x, player.y - c.y);

    if (n < dist) {
      dist = n;
      best = c;
    }
  }

  return best;
}

function makeInterior(b) {
  furniture = [
    { x: b.x + 35, y: b.y + 35, w: 100, h: 55, type: "bed" },
    { x: b.x + b.w - 135, y: b.y + 35, w: 95, h: 55, type: "cabinet" },
    { x: b.x + 35, y: b.y + 130, w: 85, h: 55, type: "table" },
    { x: b.x + b.w - 135, y: b.y + 130, w: 95, h: 55, type: "sofa" }
  ];
}

function interiorBlocked(x, y) {
  const b = building;

  if (
    x < b.x + 18 ||
    x > b.x + b.w - 18 ||
    y < b.y + 18 ||
    y > b.y + b.h - 18
  ) return true;

  for (const f of furniture) {
    if (circleRect(x, y, player.r, f)) return true;
  }

  return false;
}

function enterBuilding(b) {
  building = b;
  makeInterior(b);
  mode = "interior";

  player.x = b.x + b.w / 2;
  player.y = b.y + b.h - 35;
}

function exitBuilding() {
  if (!building) return;

  const d = door(building);
  const near = Math.hypot(
    player.x - d.x,
    player.y - (building.y + building.h - 30)
  );

  if (near > 55) return;

  const x = d.x;
  const y = building.y + building.h + 50;

  if (blocked(x, y, player.r)) return;

  player.x = x;
  player.y = y;
  building = null;
  furniture = [];
  mode = "outside";
}

function enterCar(c) {
  if (!c) return;

  c.occupied = true;
  player.car = c;
  player.x = c.x;
  player.y = c.y;
}

function exitCar() {
  const c = player.car;
  if (!c) return;

  const spots = [
    [c.x + 65, c.y],
    [c.x - 65, c.y],
    [c.x, c.y + 65],
    [c.x, c.y - 65]
  ];

  for (const p of spots) {
    if (!blocked(p[0], p[1], player.r, c)) {
      player.x = p[0];
      player.y = p[1];
      c.occupied = false;
      player.car = null;
      return;
    }
  }
}

function interact() {
  if (mode === "interior") {
    exitBuilding();
    return;
  }

  if (player.car) {
    exitCar();
    return;
  }

  const c = nearestCar();

  if (c) {
    enterCar(c);
    return;
  }

  const b = nearestDoor();

  if (b) {
    enterBuilding(b);
  }
}

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "e") {
    interact();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

const joystick = document.getElementById("joystick");
const stick = document.getElementById("joystick-stick");

function joystickMove(e) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  let dx = e.clientX - cx;
  let dy = e.clientY - cy;

  const max = r.width * 0.32;
  const len = Math.hypot(dx, dy);

  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }

  joy.x = dx / max;
  joy.y = dy / max;

  stick.style.transform = `translate(${dx}px,${dy}px)`;
}

function joystickReset() {
  joy.active = false;
  joy.x = 0;
  joy.y = 0;
  stick.style.transform = "translate(0,0)";
}

joystick.addEventListener("pointerdown", e => {
  joy.active = true;
  joystick.setPointerCapture(e.pointerId);
  joystickMove(e);
});

joystick.addEventListener("pointermove", e => {
  if (joy.active) joystickMove(e);
});

joystick.addEventListener("pointerup", joystickReset);
joystick.addEventListener("pointercancel", joystickReset);

document.getElementById("interact").addEventListener("click", interact);

document.getElementById("fullscreen").addEventListener("click", async () => {
  try {
    await document.documentElement.requestFullscreen();
  } catch {}
});

function input() {
  let x = joy.x;
  let y = joy.y;

  if (keys.w || keys.arrowup) y -= 1;
  if (keys.s || keys.arrowdown) y += 1;
  if (keys.a || keys.arrowleft) x -= 1;
  if (keys.d || keys.arrowright) x += 1;

  const len = Math.hypot(x, y);

  if (len > 1) {
    x /= len;
    y /= len;
  }

  return { x, y };
}

function updateZombies() {
  if (mode !== "outside") return;

  for (const z of zombies) {
    const dx = player.x - z.x;
    const dy = player.y - z.y;
    const d = Math.hypot(dx, dy);

    if (d > 500 || d < 1) continue;

    const vx = dx / d * z.speed;
    const vy = dy / d * z.speed;

    if (!blocked(z.x + vx, z.y + vy, z.r, player.car)) {
      z.x += vx;
      z.y += vy;
    } else {
      if (!blocked(z.x + vx, z.y, z.r, player.car)) {
        z.x += vx;
      }

      if (!blocked(z.x, z.y + vy, z.r, player.car)) {
        z.y += vy;
      }
    }
  }
}

function updateCamera() {
  camera.x += (player.x - camera.x) * 0.1;
  camera.y += (player.y - camera.y) * 0.1;

  camera.x = clamp(camera.x, 640, W - 640);
  camera.y = clamp(camera.y, 360, H - 360);
}

function drawGround() {
  ctx.fillStyle = "#3d503b";
  ctx.fillRect(0, 0, W, H);
}

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#303236";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = "#c7bb67";
    ctx.lineWidth = 4;
    ctx.setLineDash([35, 30]);

    ctx.beginPath();

    if (r.w > r.h) {
      ctx.moveTo(r.x, r.y + r.h / 2);
      ctx.lineTo(r.x + r.w, r.y + r.h / 2);
    } else {
      ctx.moveTo(r.x + r.w / 2, r.y);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBuilding(b) {
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);

  ctx.fillStyle = b.color;
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.fillStyle = "#30322f";
  ctx.fillRect(b.x - 5, b.y - 8, b.w + 10, 14);

  ctx.fillStyle = "#26383b";

  for (let x = b.x + 35; x < b.x + b.w - 25; x += 75) {
    ctx.fillRect(x, b.y + 30, 30, 42);
  }

  ctx.fillStyle = "#3b2b20";
  ctx.fillRect(b.x + b.w / 2 - 20, b.y + b.h - 50, 40, 50);
}

function drawTree(t) {
  ctx.fillStyle = "#60472e";
  ctx.fillRect(t.x - 6, t.y, 12, 28);

  ctx.fillStyle = "#2e5235";
  ctx.beginPath();
  ctx.arc(t.x, t.y - 12, t.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(-c.w / 2 + 5, -c.h / 2 + 6, c.w, c.h);

  ctx.fillStyle = c.color;
  ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);

  ctx.fillStyle = "#172124";
  ctx.fillRect(-18, -15, 36, 14);

  ctx.fillStyle = "#171717";
  ctx.fillRect(-30, -24, 17, 7);
  ctx.fillRect(-30, 17, 17, 7);
  ctx.fillRect(13, -24, 17, 7);
  ctx.fillRect(13, 17, 17, 7);

  ctx.restore();
}

function drawZombie(z) {
  ctx.fillStyle = "#596954";
  ctx.fillRect(z.x - 8, z.y - 3, 16, 22);

  ctx.fillStyle = "#89927b";
  ctx.beginPath();
  ctx.arc(z.x, z.y - 13, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  if (player.car) return;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#1d2525";
  ctx.fillRect(-8, 3, 6, 18);
  ctx.fillRect(2, 3, 6, 18);

  ctx.fillStyle = "#394345";
  ctx.fillRect(-11, -13, 22, 22);

  ctx.fillStyle = "#b99c7e";
  ctx.beginPath();
  ctx.arc(0, -22, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInterior() {
  const b = building;

  ctx.fillStyle = "#625c52";
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.strokeStyle = "#252725";
  ctx.lineWidth = 18;
  ctx.strokeRect(b.x, b.y, b.w, b.h);

  for (const f of furniture) {
    ctx.fillStyle =
      f.type === "bed" ? "#3b3029" :
      f.type === "cabinet" ? "#302721" :
      f.type === "table" ? "#4a3525" :
      "#4b4e4b";

    ctx.fillRect(f.x, f.y, f.w, f.h);
  }

  ctx.fillStyle = "#b39a5b";
  ctx.fillRect(b.x + b.w / 2 - 25, b.y + b.h - 10, 50, 20);
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,.65)";
  ctx.fillRect(18, 18, 280, 105);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.fillText("VIRELIA: AFTERFALL", 30, 43);

  ctx.fillStyle = "#df5757";
  ctx.font = "bold 14px Arial";
  ctx.fillText(`HP ${Math.round(player.hp)}`, 30, 68);

  ctx.fillStyle = "#d5bb4d";
  ctx.fillText(`HUNGER ${Math.round(player.hunger)}`, 30, 91);

  ctx.fillStyle = "#fff";
  ctx.fillText(player.car ? "VEHICLE" : mode === "interior" ? "INDOORS" : "DAY 1", 30, 114);
}

function drawPrompt() {
  let text = "";

  if (mode === "interior") {
    const b = building;
    const d = door(b);

    if (Math.hypot(player.x - d.x, player.y - (b.y + b.h - 30)) < 60) {
      text = "INTERACT • EXIT";
    }
  } else if (player.car) {
    text = "INTERACT • EXIT VEHICLE";
  } else if (nearestCar()) {
    text = "INTERACT • ENTER VEHICLE";
  } else if (nearestDoor()) {
    text = "INTERACT • ENTER BUILDING";
  }

  if (!text) return;

  ctx.fillStyle = "rgba(0,0,0,.75)";
  ctx.fillRect(470, 650, 340, 38);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 640, 675);
  ctx.textAlign = "left";
}

function update(dt) {
  const v = input();

  if (mode === "outside") {
    if (player.car) {
      moveCar(v.x * 5, v.y * 5);
    } else {
      moveOutside(v.x * player.speed, v.y * player.speed);
    }

    updateZombies();
  } else {
    const nx = player.x + v.x * player.speed;
    const ny = player.y + v.y * player.speed;

    if (!interiorBlocked(nx, player.y)) {
      player.x = nx;
    }

    if (!interiorBlocked(player.x, ny)) {
      player.y = ny;
    }
  }

  player.hunger = Math.max(0, player.hunger - dt * 0.0007);

  if (player.hunger === 0) {
    player.hp = Math.max(0, player.hp - dt * 0.001);
  }

  updateCamera();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(
    canvas.width / 2 - camera.x,
    canvas.height / 2 - camera.y
  );

  if (mode === "outside") {
    drawGround();
    drawRoads();

    buildings.forEach(drawBuilding);
    trees.forEach(drawTree);
    cars.forEach(drawCar);
    zombies.forEach(drawZombie);
    drawPlayer();
  } else {
    drawGround();
    drawInterior();
    drawPlayer();
  }

  ctx.restore();

  drawHUD();
  drawPrompt();
}

function loop(now) {
  const dt = Math.min(50, now - last);

  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);