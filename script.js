const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 4200;
const H = 3000;

const keys = {};
const joy = { x: 0, y: 0, active: false };

let mode = "outside";
let insideBuilding = null;
let furniture = [];
let last = performance.now();

const player = {
  x: 2100,
  y: 690,
  r: 14,
  speed: 3.2,
  hp: 100,
  hunger: 100,
  car: null
};

const camera = {
  x: player.x,
  y: player.y
};

const roads = [
  { x: 0, y: 500, w: W, h: 180 },
  { x: 0, y: 1400, w: W, h: 180 },
  { x: 0, y: 2300, w: W, h: 180 },
  { x: 600, y: 0, w: 180, h: H },
  { x: 2010, y: 0, w: 180, h: H },
  { x: 3420, y: 0, w: 180, h: H }
];

const buildings = [
  { x: 80, y: 80, w: 380, h: 320, h3: 95 },
  { x: 950, y: 80, w: 420, h: 320, h3: 110 },
  { x: 2400, y: 80, w: 420, h: 320, h3: 105 },
  { x: 3710, y: 80, w: 380, h: 320, h3: 90 },

  { x: 80, y: 820, w: 380, h: 420, h3: 120 },
  { x: 950, y: 820, w: 420, h: 420, h3: 115 },
  { x: 2400, y: 820, w: 420, h: 420, h3: 120 },
  { x: 3710, y: 820, w: 380, h: 420, h3: 105 },

  { x: 80, y: 1720, w: 380, h: 420, h3: 120 },
  { x: 950, y: 1720, w: 420, h: 420, h3: 125 },
  { x: 2400, y: 1720, w: 420, h: 420, h3: 115 },
  { x: 3710, y: 1720, w: 380, h: 420, h3: 105 },

  { x: 80, y: 2620, w: 380, h: 280, h3: 90 },
  { x: 950, y: 2620, w: 420, h: 280, h3: 100 },
  { x: 2400, y: 2620, w: 420, h: 280, h3: 100 },
  { x: 3710, y: 2620, w: 380, h3: 90 }
];

const buildingColors = [
  "#73766f",
  "#696d68",
  "#77746c",
  "#626862"
];

buildings.forEach((b, i) => {
  b.color = buildingColors[i % buildingColors.length];
});

const trees = [];

for (const b of buildings) {
  const spots = [
    [b.x - 45, b.y - 45],
    [b.x + b.w + 45, b.y - 45],
    [b.x - 45, b.y + b.h + 45],
    [b.x + b.w + 45, b.y + b.h + 45]
  ];

  for (const p of spots) {
    if (
      p[0] > 40 &&
      p[1] > 40 &&
      p[0] < W - 40 &&
      p[1] < H - 40 &&
      !onRoad(p[0], p[1])
    ) {
      trees.push({
        x: p[0],
        y: p[1],
        r: 25
      });
    }
  }
}

const cars = [
  { x: 300, y: 590, color: "#9b3434", angle: 0 },
  { x: 1120, y: 590, color: "#56636b", angle: 0 },
  { x: 2700, y: 590, color: "#9a8131", angle: 0 },
  { x: 3900, y: 590, color: "#59656c", angle: 0 },

  { x: 690, y: 1050, color: "#59636a", angle: Math.PI / 2 },
  { x: 2100, y: 1050, color: "#873d3d", angle: Math.PI / 2 },
  { x: 3510, y: 1050, color: "#776a35", angle: Math.PI / 2 },

  { x: 1120, y: 1490, color: "#56636b", angle: 0 },
  { x: 2700, y: 1490, color: "#8b3939", angle: 0 },

  { x: 690, y: 1950, color: "#59636a", angle: Math.PI / 2 },
  { x: 2100, y: 1950, color: "#81703a", angle: Math.PI / 2 },
  { x: 3510, y: 1950, color: "#704848", angle: Math.PI / 2 },

  { x: 1120, y: 2390, color: "#56636b", angle: 0 },
  { x: 2700, y: 2390, color: "#873b3b", angle: 0 }
];

cars.forEach(c => {
  c.w = 88;
  c.h = 44;
  c.occupied = false;
});

const zombies = [
  { x: 430, y: 590, r: 13, speed: 0.65 },
  { x: 1350, y: 590, r: 13, speed: 0.7 },
  { x: 2900, y: 590, r: 13, speed: 0.65 },
  { x: 4000, y: 590, r: 13, speed: 0.7 },
  { x: 900, y: 1490, r: 13, speed: 0.65 },
  { x: 1550, y: 1490, r: 13, speed: 0.7 },
  { x: 3000, y: 1490, r: 13, speed: 0.65 },
  { x: 900, y: 2390, r: 13, speed: 0.7 },
  { x: 1550, y: 2390, r: 13, speed: 0.65 },
  { x: 3000, y: 2390, r: 13, speed: 0.7 }
];

function onRoad(x, y) {
  return roads.some(r =>
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
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
  ) {
    return true;
  }

  for (const b of buildings) {
    if (circleRect(x, y, radius, b)) {
      return true;
    }
  }

  for (const t of trees) {
    if (
      Math.hypot(x - t.x, y - t.y) <
      radius + t.r * 0.75
    ) {
      return true;
    }
  }

  for (const c of cars) {
    if (c === ignoreCar) continue;

    if (
      Math.hypot(x - c.x, y - c.y) <
      radius + 45
    ) {
      return true;
    }
  }

  return false;
}

function movePlayer(dx, dy) {
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

  if (Math.hypot(dx, dy) > 0.2) {
    c.angle = Math.atan2(dy, dx);
  }
}

function getDoor(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h
  };
}

function nearestBuilding() {
  let result = null;
  let distance = 75;

  for (const b of buildings) {
    const d = getDoor(b);
    const n = Math.hypot(
      player.x - d.x,
      player.y - d.y
    );

    if (n < distance) {
      distance = n;
      result = b;
    }
  }

  return result;
}

function nearestCar() {
  let result = null;
  let distance = 70;

  for (const c of cars) {
    if (c.occupied) continue;

    const n = Math.hypot(
      player.x - c.x,
      player.y - c.y
    );

    if (n < distance) {
      distance = n;
      result = c;
    }
  }

  return result;
}

function createFurniture(b) {
  furniture = [
    {
      x: b.x + 35,
      y: b.y + 35,
      w: 105,
      h: 55
    },
    {
      x: b.x + b.w - 140,
      y: b.y + 35,
      w: 105,
      h: 55
    },
    {
      x: b.x + 35,
      y: b.y + 140,
      w: 90,
      h: 55
    },
    {
      x: b.x + b.w - 140,
      y: b.y + 140,
      w: 105,
      h: 55
    }
  ];
}

function interiorBlocked(x, y) {
  const b = insideBuilding;

  if (!b) return true;

  if (
    x < b.x + 20 ||
    x > b.x + b.w - 20 ||
    y < b.y + 20 ||
    y > b.y + b.h - 20
  ) {
    return true;
  }

  for (const f of furniture) {
    if (circleRect(x, y, player.r, f)) {
      return true;
    }
  }

  return false;
}

function enterBuilding(b) {
  insideBuilding = b;
  createFurniture(b);
  mode = "interior";

  player.x = b.x + b.w / 2;
  player.y = b.y + b.h - 30;
}

function exitBuilding() {
  const b = insideBuilding;

  if (!b) return;

  const d = getDoor(b);

  const near =
    Math.hypot(
      player.x - d.x,
      player.y - (b.y + b.h - 30)
    ) < 70;

  if (!near) return;

  const x = d.x;
  const y = b.y + b.h + 55;

  if (blocked(x, y, player.r)) return;

  player.x = x;
  player.y = y;

  insideBuilding = null;
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
    [c.x + 70, c.y],
    [c.x - 70, c.y],
    [c.x, c.y + 70],
    [c.x, c.y - 70]
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

  const b = nearestBuilding();

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

function updateJoystick(e) {
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

  stick.style.transform =
    `translate(${dx}px,${dy}px)`;
}

function resetJoystick() {
  joy.active = false;
  joy.x = 0;
  joy.y = 0;
  stick.style.transform = "translate(0,0)";
}

joystick.addEventListener("pointerdown", e => {
  joy.active = true;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (joy.active) updateJoystick(e);
});

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

document
  .getElementById("interact")
  .addEventListener("click", interact);

document
  .getElementById("fullscreen")
  .addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  });

function getInput() {
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

  const tx = player.car ? player.car.x : player.x;
  const ty = player.car ? player.car.y : player.y;

  for (const z of zombies) {
    const dx = tx - z.x;
    const dy = ty - z.y;
    const d = Math.hypot(dx, dy);

    if (d > 650 || d < 1) continue;

    const vx = dx / d * z.speed;
    const vy = dy / d * z.speed;

    if (!blocked(z.x + vx, z.y + vy, z.r)) {
      z.x += vx;
      z.y += vy;
    } else if (!blocked(z.x + vx, z.y, z.r)) {
      z.x += vx;
    } else if (!blocked(z.x, z.y + vy, z.r)) {
      z.y += vy;
    }
  }
}

function updateCamera() {
  const lookX = player.x;
  const lookY = player.y - 140;

  camera.x += (lookX - camera.x) * 0.08;
  camera.y += (lookY - camera.y) * 0.08;

  camera.x = clamp(
    camera.x,
    500,
    W - 500
  );

  camera.y = clamp(
    camera.y,
    250,
    H - 400
  );
}

function project(x, y) {
  const dx = x - camera.x;
  const dy = y - camera.y;

  const depth = clamp(
    1 - dy / 1500,
    0.48,
    1.25
  );

  return {
    x: canvas.width / 2 + dx * depth,
    y: canvas.height * 0.58 + dy * depth * 0.68,
    s: depth
  };
}

function poly(points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = "#354734";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function drawRoad(r) {
  const a = project(r.x, r.y);
  const b = project(r.x + r.w, r.y);
  const c = project(r.x + r.w, r.y + r.h);
  const d = project(r.x, r.y + r.h);

  poly(
    [a, b, c, d],
    "#303236"
  );

  ctx.strokeStyle = "#c8b85f";
  ctx.lineWidth = 3;

  if (r.w > r.h) {
    const p1 = project(
      r.x,
      r.y + r.h / 2
    );

    const p2 = project(
      r.x + r.w,
      r.y + r.h / 2
    );

    ctx.setLineDash([35, 28]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const p1 = project(
      r.x + r.w / 2,
      r.y
    );

    const p2 = project(
      r.x + r.w / 2,
      r.y + r.h
    );

    ctx.setLineDash([35, 28]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBuilding(b) {
  const p1 = project(b.x, b.y);
  const p2 = project(b.x + b.w, b.y);
  const p3 = project(
    b.x + b.w,
    b.y + b.h
  );
  const p4 = project(
    b.x,
    b.y + b.h
  );

  const lift = b.h3 * p4.s;

  poly(
    [
      p1,
      p2,
      { x: p2.x, y: p2.y - lift },
      { x: p1.x, y: p1.y - lift }
    ],
    "#50534f"
  );

  poly(
    [
      p2,
      p3,
      { x: p3.x, y: p3.y - lift },
      { x: p2.x, y: p2.y - lift }
    ],
    "#454944"
  );

  poly(
    [
      p1,
      p2,
      p3,
      p4
    ],
    b.color
  );

  const door = getDoor(b);
  const dp = project(door.x, door.y);
  const ds = 24 * dp.s;

  ctx.fillStyle = "#3b2b20";
  ctx.fillRect(
    dp.x - ds / 2,
    dp.y - ds * 1.7,
    ds,
    ds * 1.7
  );

  const windows = 4;

  for (let i = 0; i < windows; i++) {
    const wx =
      b.x + 55 + i * ((b.w - 110) / 3);

    const wp = project(
      wx,
      b.y + 55
    );

    const size = 25 * wp.s;

    ctx.fillStyle = "#24383b";
    ctx.fillRect(
      wp.x - size / 2,
      wp.y - size / 2 - b.h3 * wp.s,
      size,
      size
    );
  }
}

function drawTree(t) {
  const p = project(t.x, t.y);
  const s = p.s;

  ctx.fillStyle = "#5b432d";

  ctx.fillRect(
    p.x - 6 * s,
    p.y - 35 * s,
    12 * s,
    35 * s
  );

  ctx.fillStyle = "#315637";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - 48 * s,
    t.r * s,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawCar(c) {
  const p = project(c.x, c.y);
  const s = p.s;

  ctx.save();

  ctx.translate(p.x, p.y);
  ctx.rotate(c.angle);

  const w = c.w * s;
  const h = c.h * s;

  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(
    -w / 2 + 5 * s,
    -h / 2 + 6 * s,
    w,
    h
  );

  ctx.fillStyle = c.color;
  ctx.fillRect(
    -w / 2,
    -h / 2,
    w,
    h
  );

  ctx.fillStyle = "#182427";

  ctx.fillRect(
    -19 * s,
    -15 * s,
    38 * s,
    14 * s
  );

  ctx.fillStyle = "#ddd078";

  ctx.fillRect(
    w / 2 - 9 * s,
    -h / 2 + 5 * s,
    5 * s,
    9 * s
  );

  ctx.fillRect(
    w / 2 - 9 * s,
    h / 2 - 14 * s,
    5 * s,
    9 * s
  );

  ctx.fillStyle = "#171717";

  ctx.fillRect(
    -31 * s,
    -24 * s,
    18 * s,
    7 * s
  );

  ctx.fillRect(
    -31 * s,
    17 * s,
    18 * s,
    7 * s
  );

  ctx.fillRect(
    13 * s,
    -24 * s,
    18 * s,
    7 * s
  );

  ctx.fillRect(
    13 * s,
    17 * s,
    18 * s,
    7 * s
  );

  ctx.restore();
}

function drawZombie(z) {
  const p = project(z.x, z.y);
  const s = p.s;

  ctx.fillStyle = "#586852";

  ctx.fillRect(
    p.x - 8 * s,
    p.y - 3 * s,
    16 * s,
    22 * s
  );

  ctx.fillStyle = "#89927b";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - 15 * s,
    9 * s,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawPlayer() {
  if (player.car) return;

  const x = canvas.width / 2;
  const y = canvas.height * 0.72;

  ctx.save();

  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    18,
    25,
    9,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#1d2525";

  ctx.fillRect(
    -11,
    0,
    8,
    30
  );

  ctx.fillRect(
    3,
    0,
    8,
    30
  );

  ctx.fillStyle = "#394345";

  ctx.fillRect(
    -16,
    -28,
    32,
    30
  );

  ctx.fillStyle = "#b99c7e";

  ctx.beginPath();

  ctx.arc(
    0,
    -40,
    13,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

function drawWorld() {
  drawGround();

  for (const r of roads) {
    drawRoad(r);
  }

  const objects = [];

  for (const b of buildings) {
    objects.push({
      y: b.y + b.h,
      type: "building",
      obj: b
    });
  }

  for (const t of trees) {
    objects.push({
      y: t.y,
      type: "tree",
      obj: t
    });
  }

  for (const c of cars) {
    objects.push({
      y: c.y,
      type: "car",
      obj: c
    });
  }

  for (const z of zombies) {
    objects.push({
      y: z.y,
      type: "zombie",
      obj: z
    });
  }

  objects.sort((a, b) => a.y - b.y);

  for (const item of objects) {
    if (item.type === "building") {
      drawBuilding(item.obj);
    } else if (item.type === "tree") {
      drawTree(item.obj);
    } else if (item.type === "car") {
      drawCar(item.obj);
    } else {
      drawZombie(item.obj);
    }
  }

  drawPlayer();
}

function drawInterior() {
  const b = insideBuilding;

  ctx.fillStyle = "#615b50";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.strokeStyle = "#292a28";
  ctx.lineWidth = 20;

  ctx.strokeRect(
    120,
    90,
    1040,
    540
  );

  for (const f of furniture) {
    const x =
      120 +
      ((f.x - b.x) / b.w) * 1040;

    const y =
      90 +
      ((f.y - b.y) / b.h) * 540;

    const w =
      (f.w / b.w) * 1040;

    const h =
      (f.h / b.h) * 540;

    ctx.fillStyle = "#40352c";
    ctx.fillRect(x, y, w, h);
  }

  ctx.fillStyle = "#b59b5b";

  ctx.fillRect(
    610,
    580,
    60,
    25
  );

  ctx.fillStyle = "#1d2525";

  ctx.fillRect(
    626,
    535,
    10,
    35
  );

  ctx.fillRect(
    644,
    535,
    10,
    35
  );

  ctx.fillStyle = "#b99c7e";

  ctx.beginPath();

  ctx.arc(
    640,
    510,
    13,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,.68)";

  ctx.fillRect(
    18,
    18,
    285,
    110
  );

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    30,
    44
  );

  ctx.fillStyle = "#df5757";
  ctx.font = "bold 14px Arial";

  ctx.fillText(
    `HP ${Math.round(player.hp)}`,
    30,
    70
  );

  ctx.fillStyle = "#d5bb4d";

  ctx.fillText(
    `HUNGER ${Math.round(player.hunger)}`,
    30,
    94
  );

  ctx.fillStyle = "#fff";

  ctx.fillText(
    player.car
      ? "VEHICLE"
      : mode === "interior"
        ? "INDOORS"
        : "DAY 1",
    30,
    117
  );
}

function drawPrompt() {
  let text = "";

  if (mode === "interior") {
    const b = insideBuilding;
    const d = getDoor(b);

    if (
      Math.hypot(
        player.x - d.x,
        player.y - (b.y + b.h - 30)
      ) < 70
    ) {
      text = "INTERACT  •  EXIT";
    }
  } else if (player.car) {
    text = "INTERACT  •  EXIT VEHICLE";
  } else if (nearestCar()) {
    text = "INTERACT  •  ENTER VEHICLE";
  } else if (nearestBuilding()) {
    text = "INTERACT  •  ENTER BUILDING";
  }

  if (!text) return;

  ctx.fillStyle = "rgba(0,0,0,.78)";

  ctx.fillRect(
    430,
    650,
    420,
    38
  );

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    text,
    640,
    675
  );

  ctx.textAlign = "left";
}

function update(dt) {
  const v = getInput();

  if (mode === "outside") {
    if (player.car) {
      moveCar(
        v.x * 5,
        v.y * 5
      );
    } else {
      movePlayer(
        v.x * player.speed,
        v.y * player.speed
      );
    }

    updateZombies();
  } else {
    const nx =
      player.x + v.x * player.speed;

    const ny =
      player.y + v.y * player.speed;

    if (!interiorBlocked(nx, player.y)) {
      player.x = nx;
    }

    if (!interiorBlocked(player.x, ny)) {
      player.y = ny;
    }
  }

  player.hunger = Math.max(
    0,
    player.hunger - dt * 0.0007
  );

  if (player.hunger <= 0) {
    player.hp = Math.max(
      0,
      player.hp - dt * 0.001
    );
  }

  updateCamera();
}

function draw() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (mode === "outside") {
    drawWorld();
  } else {
    drawInterior();
  }

  drawHUD();
  drawPrompt();
}

function loop(now) {
  const dt = Math.min(
    50,
    now - last
  );

  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);