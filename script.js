const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 3600;
const H = 2600;

let mode = "outside";
let gameTime = 8 * 60;
let lastTime = performance.now();

const keys = {};
const joystick = {
  active: false,
  x: 0,
  y: 0
};

const player = {
  x: 1800,
  y: 1300,
  r: 15,
  speed: 3.2,
  hp: 100,
  hunger: 100,
  inCar: false,
  car: null
};

let camera = {
  x: 0,
  y: 0
};

/* =========================================================
   MAP
========================================================= */

const roads = [
  // horizontal main roads
  { x: 0, y: 550, w: W, h: 180 },
  { x: 0, y: 1220, w: W, h: 180 },
  { x: 0, y: 1890, w: W, h: 180 },

  // vertical main roads
  { x: 650, y: 0, w: 180, h: H },
  { x: 1710, y: 0, w: 180, h: H },
  { x: 2770, y: 0, w: 180, h: H }
];

const buildings = [
  { x: 170, y: 170, w: 340, h: 280, color: "#77736a", type: "house" },
  { x: 900, y: 150, w: 360, h: 300, color: "#686b65", type: "house" },
  { x: 2020, y: 140, w: 380, h: 300, color: "#76716b", type: "house" },
  { x: 3070, y: 160, w: 360, h: 280, color: "#666862", type: "house" },

  { x: 120, y: 850, w: 390, h: 280, color: "#6e706c", type: "house" },
  { x: 930, y: 830, w: 350, h: 300, color: "#77736b", type: "house" },
  { x: 2040, y: 830, w: 390, h: 300, color: "#696c67", type: "house" },
  { x: 3070, y: 840, w: 360, h: 300, color: "#72716a", type: "house" },

  { x: 120, y: 1510, w: 390, h: 290, color: "#73746e", type: "house" },
  { x: 930, y: 1500, w: 350, h: 300, color: "#676963", type: "house" },
  { x: 2040, y: 1500, w: 390, h: 300, color: "#75716a", type: "house" },
  { x: 3070, y: 1510, w: 360, h: 290, color: "#6c6d67", type: "house" },

  { x: 120, y: 2180, w: 390, h: 280, color: "#666964", type: "house" },
  { x: 930, y: 2180, w: 350, h: 280, color: "#77736c", type: "house" },
  { x: 2040, y: 2180, w: 390, h: 280, color: "#696b65", type: "house" },
  { x: 3070, y: 2180, w: 360, h: 280, color: "#73716b", type: "house" }
];

/* =========================================================
   CARS
========================================================= */

const cars = [
  { x: 520, y: 640, w: 86, h: 46, color: "#8b2626", angle: 0, occupied: false },
  { x: 1080, y: 640, w: 86, h: 46, color: "#343b42", angle: 0, occupied: false },
  { x: 2160, y: 640, w: 86, h: 46, color: "#9b8b34", angle: 0, occupied: false },
  { x: 3010, y: 640, w: 86, h: 46, color: "#4c5963", angle: 0, occupied: false },

  { x: 760, y: 1140, w: 86, h: 46, color: "#7d3030", angle: Math.PI / 2, occupied: false },
  { x: 1820, y: 1100, w: 86, h: 46, color: "#41494f", angle: Math.PI / 2, occupied: false },
  { x: 2880, y: 1100, w: 86, h: 46, color: "#6e6e42", angle: Math.PI / 2, occupied: false },

  { x: 1200, y: 1980, w: 86, h: 46, color: "#59636b", angle: 0, occupied: false },
  { x: 2500, y: 1980, w: 86, h: 46, color: "#873737", angle: 0, occupied: false }
];

/* =========================================================
   TREES
   IMPORTANT:
   These positions are deliberately OFF roads.
========================================================= */

const trees = [
  { x: 80, y: 80, r: 28 },
  { x: 560, y: 300, r: 28 },
  { x: 1330, y: 300, r: 28 },
  { x: 2500, y: 300, r: 28 },
  { x: 3480, y: 300, r: 28 },

  { x: 580, y: 960, r: 28 },
  { x: 1330, y: 960, r: 28 },
  { x: 2520, y: 960, r: 28 },
  { x: 3480, y: 960, r: 28 },

  { x: 580, y: 1660, r: 28 },
  { x: 1330, y: 1660, r: 28 },
  { x: 2520, y: 1660, r: 28 },
  { x: 3480, y: 1660, r: 28 },

  { x: 580, y: 2330, r: 28 },
  { x: 1330, y: 2330, r: 28 },
  { x: 2520, y: 2330, r: 28 },
  { x: 3480, y: 2330, r: 28 }
];

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [
  { x: 400, y: 680, r: 14, speed: 0.65 },
  { x: 1450, y: 680, r: 14, speed: 0.7 },
  { x: 2350, y: 1350, r: 14, speed: 0.65 },
  { x: 3200, y: 1350, r: 14, speed: 0.72 },
  { x: 550, y: 2050, r: 14, speed: 0.68 },
  { x: 1500, y: 2050, r: 14, speed: 0.65 },
  { x: 2600, y: 2050, r: 14, speed: 0.7 },
  { x: 3350, y: 2050, r: 14, speed: 0.62 }
];

/* =========================================================
   INTERIOR
========================================================= */

let currentBuilding = null;
let interiorFurniture = [];

function makeInterior(building) {
  const bx = building.x;
  const by = building.y;

  interiorFurniture = [
    { x: bx + 45, y: by + 55, w: 115, h: 55, type: "bed" },
    { x: bx + 220, y: by + 55, w: 65, h: 45, type: "cabinet" },
    { x: bx + 70, y: by + 155, w: 80, h: 55, type: "table" },
    { x: bx + 205, y: by + 150, w: 90, h: 60, type: "sofa" }
  ];
}

/* =========================================================
   UTILITY
========================================================= */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function circleRect(cx, cy, r, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);

  const dx = cx - closestX;
  const dy = cy - closestY;

  return dx * dx + dy * dy < r * r;
}

function circleCircle(a, b) {
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  return d < a.r + b.r;
}

function pointInsideRoad(x, y) {
  return roads.some(r =>
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

/* =========================================================
   ROAD COLLISION
========================================================= */

function roadSafeSpawn(x, y) {
  return pointInsideRoad(x, y);
}

/* =========================================================
   BUILDING COLLISION
========================================================= */

function buildingBlocked(x, y, radius) {
  for (const b of buildings) {
    if (circleRect(x, y, radius, b)) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   TREE COLLISION
========================================================= */

function treeBlocked(x, y, radius) {
  for (const t of trees) {
    const d = Math.hypot(x - t.x, y - t.y);

    if (d < radius + t.r * 0.72) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   CAR COLLISION
========================================================= */

function carRect(car) {
  // Use a safe AABB around rotated vehicle.
  // This keeps collision stable and lightweight.
  const radius = Math.max(car.w, car.h) * 0.58;

  return {
    x: car.x - radius,
    y: car.y - radius,
    w: radius * 2,
    h: radius * 2
  };
}

function carBlocked(x, y, radius, ignoreCar = null) {
  for (const car of cars) {
    if (car === ignoreCar) continue;

    const box = carRect(car);

    if (circleRect(x, y, radius, box)) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   GENERAL OUTSIDE COLLISION
========================================================= */

function outsideBlocked(x, y, radius, ignoreCar = null) {
  if (
    x < radius ||
    y < radius ||
    x > W - radius ||
    y > H - radius
  ) {
    return true;
  }

  if (buildingBlocked(x, y, radius)) {
    return true;
  }

  if (treeBlocked(x, y, radius)) {
    return true;
  }

  if (carBlocked(x, y, radius, ignoreCar)) {
    return true;
  }

  return false;
}

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function tryMovePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!outsideBlocked(nx, player.y, player.r, player.car)) {
    player.x = nx;
  }

  if (!outsideBlocked(player.x, ny, player.r, player.car)) {
    player.y = ny;
  }
}

/* =========================================================
   CAR MOVEMENT
========================================================= */

function moveCar(dx, dy) {
  if (!player.car) return;

  const car = player.car;

  const nx = car.x + dx;
  const ny = car.y + dy;

  let blocked = false;

  if (
    nx < 65 ||
    ny < 65 ||
    nx > W - 65 ||
    ny > H - 65
  ) {
    blocked = true;
  }

  if (!blocked && buildingBlocked(nx, ny, 48)) {
    blocked = true;
  }

  if (!blocked && treeBlocked(nx, ny, 48)) {
    blocked = true;
  }

  if (!blocked && carBlocked(nx, ny, 48, car)) {
    blocked = true;
  }

  if (!blocked) {
    car.x = nx;
    car.y = ny;

    player.x = car.x;
    player.y = car.y;
  }
}

/* =========================================================
   INTERIOR COLLISION
========================================================= */

function interiorBlocked(x, y, radius) {
  const b = currentBuilding;

  if (!b) return true;

  const inside =
    x > b.x + radius &&
    x < b.x + b.w - radius &&
    y > b.y + radius &&
    y < b.y + b.h - radius;

  if (!inside) {
    return true;
  }

  for (const f of interiorFurniture) {
    if (circleRect(x, y, radius, f)) {
      return true;
    }
  }

  return false;
}

function moveInterior(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!interiorBlocked(nx, player.y, player.r)) {
    player.x = nx;
  }

  if (!interiorBlocked(player.x, ny, player.r)) {
    player.y = ny;
  }
}

/* =========================================================
   BUILDING DOOR
========================================================= */

function getDoor(building) {
  return {
    x: building.x + building.w / 2,
    y: building.y + building.h,
    w: 62,
    h: 22
  };
}

function nearBuildingDoor() {
  for (const b of buildings) {
    const d = getDoor(b);

    const distance = Math.hypot(
      player.x - d.x,
      player.y - d.y
    );

    if (distance < 70) {
      return b;
    }
  }

  return null;
}

function enterBuilding(building) {
  const door = getDoor(building);

  currentBuilding = building;

  makeInterior(building);

  mode = "interior";

  // Spawn safely inside, just above the door.
  player.x = door.x;
  player.y = building.y + building.h - 65;
}

function exitBuilding() {
  if (!currentBuilding) return;

  const door = getDoor(currentBuilding);

  const d = Math.hypot(
    player.x - door.x,
    player.y - (currentBuilding.y + currentBuilding.h - 40)
  );

  // IMPORTANT:
  // You can ONLY exit when actually near the door.
  if (d > 55) {
    return;
  }

  mode = "outside";

  player.x = door.x;
  player.y = currentBuilding.y + currentBuilding.h + 45;

  currentBuilding = null;
  interiorFurniture = [];
}

/* =========================================================
   CAR INTERACTION
========================================================= */

function nearestCar() {
  let closest = null;
  let best = 75;

  for (const car of cars) {
    const d = Math.hypot(
      player.x - car.x,
      player.y - car.y
    );

    if (d < best) {
      best = d;
      closest = car;
    }
  }

  return closest;
}

function enterCar(car) {
  if (!car) return;

  car.occupied = true;

  player.inCar = true;
  player.car = car;

  player.x = car.x;
  player.y = car.y;
}

function exitCar() {
  if (!player.car) return;

  const car = player.car;

  const positions = [
    { x: car.x + 65, y: car.y },
    { x: car.x - 65, y: car.y },
    { x: car.x, y: car.y + 65 },
    { x: car.x, y: car.y - 65 }
  ];

  for (const p of positions) {
    if (!outsideBlocked(p.x, p.y, player.r, car)) {
      player.x = p.x;
      player.y = p.y;

      car.occupied = false;

      player.inCar = false;
      player.car = null;

      return;
    }
  }
}

/* =========================================================
   INTERACT
========================================================= */

function interact() {
  if (mode === "interior") {
    exitBuilding();
    return;
  }

  if (player.inCar) {
    exitCar();
    return;
  }

  const car = nearestCar();

  if (car) {
    enterCar(car);
    return;
  }

  const building = nearBuildingDoor();

  if (building) {
    enterBuilding(building);
  }
}

/* =========================================================
   INPUT
========================================================= */

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (
    e.key === "e" ||
    e.key === "Enter"
  ) {
    interact();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

/* =========================================================
   JOYSTICK
========================================================= */

const joystickEl = document.getElementById("joystick");
const stickEl = document.getElementById("joystick-stick");

function updateJoystick(clientX, clientY) {
  const rect = joystickEl.getBoundingClientRect();

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = clientX - cx;
  let dy = clientY - cy;

  const max = rect.width * 0.32;

  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  joystick.x = dx / max;
  joystick.y = dy / max;

  stickEl.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;

  stickEl.style.transform =
    "translate(0px, 0px)";
}

joystickEl.addEventListener("pointerdown", e => {
  joystick.active = true;

  try {
    joystickEl.setPointerCapture(e.pointerId);
  } catch {}

  updateJoystick(e.clientX, e.clientY);
});

joystickEl.addEventListener("pointermove", e => {
  if (!joystick.active) return;

  updateJoystick(e.clientX, e.clientY);
});

joystickEl.addEventListener("pointerup", resetJoystick);
joystickEl.addEventListener("pointercancel", resetJoystick);
joystickEl.addEventListener("lostpointercapture", resetJoystick);

/* =========================================================
   BUTTONS
========================================================= */

document
  .getElementById("interact")
  .addEventListener("pointerdown", e => {
    e.preventDefault();
    interact();
  });

document
  .getElementById("fullscreen")
  .addEventListener("click", async () => {
    try {
      await document.documentElement.requestFullscreen();

      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch {}
  });

/* =========================================================
   MOVEMENT INPUT
========================================================= */

function getInput() {
  let x = joystick.x;
  let y = joystick.y;

  if (keys["w"] || keys["arrowup"]) y -= 1;
  if (keys["s"] || keys["arrowdown"]) y += 1;
  if (keys["a"] || keys["arrowleft"]) x -= 1;
  if (keys["d"] || keys["arrowright"]) x += 1;

  const len = Math.hypot(x, y);

  if (len > 1) {
    x /= len;
    y /= len;
  }

  return { x, y };
}

/* =========================================================
   ZOMBIE AI
========================================================= */

function zombieCanMove(x, y, r) {
  return !outsideBlocked(x, y, r);
}

function updateZombies() {
  if (mode !== "outside") return;

  for (const z of zombies) {
    const dx = player.x - z.x;
    const dy = player.y - z.y;

    const distance = Math.hypot(dx, dy);

    if (distance > 520) continue;

    let vx = 0;
    let vy = 0;

    if (distance > 1) {
      vx = dx / distance * z.speed;
      vy = dy / distance * z.speed;
    }

    // Try direct movement first.
    if (
      zombieCanMove(
        z.x + vx,
        z.y + vy,
        z.r
      )
    ) {
      z.x += vx;
      z.y += vy;
      continue;
    }

    // Try horizontal.
    if (
      zombieCanMove(
        z.x + vx,
        z.y,
        z.r
      )
    ) {
      z.x += vx;
    }

    // Try vertical.
    if (
      zombieCanMove(
        z.x,
        z.y + vy,
        z.r
      )
    ) {
      z.y += vy;
    }
  }
}

/* =========================================================
   SURVIVAL
========================================================= */

function updateSurvival(dt) {
  gameTime += dt * 0.25;

  if (gameTime >= 1440) {
    gameTime = 0;
  }

  player.hunger -= dt * 0.001;

  if (player.hunger < 0) {
    player.hunger = 0;
  }

  if (player.hunger <= 0) {
    player.hp -= dt * 0.002;
  }

  player.hp = clamp(player.hp, 0, 100);
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {
  let targetX = player.x;
  let targetY = player.y;

  camera.x +=
    (targetX - camera.x) * 0.09;

  camera.y +=
    (targetY - camera.y) * 0.09;

  camera.x = clamp(
    camera.x,
    canvas.width / 2,
    W - canvas.width / 2
  );

  camera.y = clamp(
    camera.y,
    canvas.height / 2,
    H - canvas.height / 2
  );
}

/* =========================================================
   DRAW WORLD
========================================================= */

function drawGround() {
  ctx.fillStyle = "#3e513c";
  ctx.fillRect(0, 0, W, H);

  // Grass texture
  ctx.strokeStyle = "rgba(20,35,20,0.18)";
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += 70) {
    for (let y = 0; y < H; y += 70) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y + 5);
      ctx.stroke();
    }
  }
}

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#303234";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // road edges
    ctx.fillStyle = "#55565a";

    if (r.w > r.h) {
      ctx.fillRect(r.x, r.y, r.w, 8);
      ctx.fillRect(r.x, r.y + r.h - 8, r.w, 8);

      // center markings
      ctx.strokeStyle = "#c6b96b";
      ctx.lineWidth = 5;
      ctx.setLineDash([35, 30]);

      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h / 2);
      ctx.lineTo(r.x + r.w, r.y + r.h / 2);
      ctx.stroke();

      ctx.setLineDash([]);
    } else {
      ctx.fillRect(r.x, r.y, 8, r.h);
      ctx.fillRect(r.x + r.w - 8, r.y, 8, r.h);

      ctx.strokeStyle = "#c6b96b";
      ctx.lineWidth = 5;
      ctx.setLineDash([35, 30]);

      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, r.y);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  }
}

/* =========================================================
   BUILDINGS
========================================================= */

function drawBuilding(b) {
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(
    b.x + 12,
    b.y + 14,
    b.w,
    b.h
  );

  // building body
  ctx.fillStyle = b.color;
  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // roof
  ctx.fillStyle = "#343936";
  ctx.fillRect(
    b.x - 8,
    b.y - 10,
    b.w + 16,
    18
  );

  // windows
  ctx.fillStyle = "#26383a";

  for (let x = b.x + 35; x < b.x + b.w - 25; x += 80) {
    ctx.fillRect(
      x,
      b.y + 35,
      38,
      42
    );
  }

  // door
  const d = getDoor(b);

  ctx.fillStyle = "#33271e";
  ctx.fillRect(
    d.x - 20,
    b.y + b.h - 55,
    40,
    55
  );

  ctx.fillStyle = "#9b8b54";
  ctx.beginPath();
  ctx.arc(
    d.x + 12,
    b.y + b.h - 28,
    3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

/* =========================================================
   TREES
========================================================= */

function drawTree(t) {
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(
    t.x,
    t.y + 22,
    28,
    11,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // trunk
  ctx.fillStyle = "#59432e";
  ctx.fillRect(
    t.x - 7,
    t.y - 5,
    14,
    35
  );

  // leaves
  ctx.fillStyle = "#263f2b";

  ctx.beginPath();
  ctx.arc(t.x, t.y - 18, t.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#315537";

  ctx.beginPath();
  ctx.arc(
    t.x - 12,
    t.y - 8,
    t.r * 0.7,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    t.x + 13,
    t.y - 10,
    t.r * 0.72,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

/* =========================================================
   CARS
========================================================= */

function drawCar(car) {
  ctx.save();

  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(
    -car.w / 2 + 5,
    -car.h / 2 + 7,
    car.w,
    car.h
  );

  // body
  ctx.fillStyle = car.color;
  ctx.fillRect(
    -car.w / 2,
    -car.h / 2,
    car.w,
    car.h
  );

  // windows
  ctx.fillStyle = "#1c2529";

  ctx.fillRect(
    -18,
    -car.h / 2 + 5,
    36,
    14
  );

  // hood
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(
    -car.w / 2 + 8,
    -car.h / 2 + 5,
    18,
    car.h - 10
  );

  // lights
  ctx.fillStyle = "#d8d1a1";

  ctx.fillRect(
    car.w / 2 - 6,
    -car.h / 2 + 5,
    4,
    10
  );

  ctx.fillRect(
    car.w / 2 - 6,
    car.h / 2 - 15,
    4,
    10
  );

  // wheels
  ctx.fillStyle = "#151515";

  ctx.fillRect(
    -car.w / 2 + 12,
    -car.h / 2 - 3,
    16,
    7
  );

  ctx.fillRect(
    -car.w / 2 + 12,
    car.h / 2 - 4,
    16,
    7
  );

  ctx.fillRect(
    car.w / 2 - 28,
    -car.h / 2 - 3,
    16,
    7
  );

  ctx.fillRect(
    car.w / 2 - 28,
    car.h / 2 - 4,
    16,
    7
  );

  ctx.restore();
}

/* =========================================================
   ZOMBIES
========================================================= */

function drawZombie(z) {
  ctx.save();

  ctx.translate(z.x, z.y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    13,
    13,
    6,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // body
  ctx.fillStyle = "#5d6b57";
  ctx.fillRect(-9, -4, 18, 25);

  // head
  ctx.fillStyle = "#87917a";
  ctx.beginPath();
  ctx.arc(0, -13, 10, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = "#171b17";

  ctx.fillRect(-5, -15, 3, 3);
  ctx.fillRect(2, -15, 3, 3);

  // arms
  ctx.strokeStyle = "#707967";
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-17, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(17, 8);
  ctx.stroke();

  ctx.restore();
}

/* =========================================================
   PLAYER
========================================================= */

function drawPlayer() {
  ctx.save();

  ctx.translate(player.x, player.y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    17,
    16,
    8,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (player.inCar) {
    ctx.restore();
    return;
  }

  // legs STATIC — no walking animation
  ctx.fillStyle = "#1c2525";

  ctx.fillRect(-9, 4, 7, 18);
  ctx.fillRect(2, 4, 7, 18);

  // body
  ctx.fillStyle = "#343c3d";
  ctx.fillRect(-11, -13, 22, 23);

  // backpack
  ctx.fillStyle = "#222b28";
  ctx.fillRect(-14, -10, 5, 19);

  // head
  ctx.fillStyle = "#b89b7d";

  ctx.beginPath();
  ctx.arc(0, -22, 9, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = "#252322";

  ctx.beginPath();
  ctx.arc(
    0,
    -26,
    9,
    Math.PI,
    Math.PI * 2
  );
  ctx.fill();

  // shoulders
  ctx.fillStyle = "#424c4d";
  ctx.fillRect(-15, -11, 30, 8);

  ctx.restore();
}

/* =========================================================
   INTERIOR
========================================================= */

function drawInterior() {
  const b = currentBuilding;

  if (!b) return;

  // room floor
  ctx.fillStyle = "#5a554b";
  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // walls
  ctx.strokeStyle = "#292b28";
  ctx.lineWidth = 18;
  ctx.strokeRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // furniture
  for (const f of interiorFurniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#3b3029";
      ctx.fillRect(f.x, f.y, f.w, f.h);

      ctx.fillStyle = "#8a8375";
      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        f.h - 18
      );
    }

    if (f.type === "cabinet") {
      ctx.fillStyle = "#332a23";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (f.type === "table") {
      ctx.fillStyle = "#4b3627";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (f.type === "sofa") {
      ctx.fillStyle = "#4b4d48";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#62645e";
      ctx.fillRect(
        f.x + 5,
        f.y + 5,
        f.w - 10,
        20
      );
    }
  }

  // door
  ctx.fillStyle = "#9c824f";

  ctx.fillRect(
    b.x + b.w / 2 - 25,
    b.y + b.h - 10,
    50,
    20
  );
}

/* =========================================================
   HUD
========================================================= */

function drawHUD() {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(18, 18, 285, 108);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.fillText(
    "VIRELIA: AFTERFALL",
    32,
    45
  );

  ctx.font = "bold 15px Arial";

  ctx.fillStyle = "#d34c4c";
  ctx.fillText(
    `HP ${Math.round(player.hp)}`,
    32,
    72
  );

  ctx.fillStyle = "#d1b84e";
  ctx.fillText(
    `HUNGER ${Math.round(player.hunger)}`,
    32,
    96
  );

  const hours = Math.floor(gameTime / 60);
  const minutes = Math.floor(gameTime % 60);

  const timeText =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0");

  ctx.fillStyle = "#ffffff";
  ctx.fillText(
    `DAY 1   ${timeText}`,
    32,
    118
  );

  // right status
  ctx.textAlign = "right";

  if (player.inCar) {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "VEHICLE",
      canvas.width - 25,
      35
    );
  }

  if (mode === "interior") {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "INDOORS",
      canvas.width - 25,
      60
    );
  }

  ctx.restore();
}

/* =========================================================
   INTERACTION PROMPT
========================================================= */

function drawPrompt() {
  let text = "";

  if (mode === "interior") {
    const b = currentBuilding;

    if (b) {
      const door = getDoor(b);

      const d = Math.hypot(
        player.x - door.x,
        player.y - (b.y + b.h - 40)
      );

      if (d < 75) {
        text = "INTERACT  •  EXIT";
      }
    }
  } else if (player.inCar) {
    text = "INTERACT  •  EXIT VEHICLE";
  } else {
    const car = nearestCar();

    if (car) {
      text = "INTERACT  •  ENTER VEHICLE";
    } else {
      const b = nearBuildingDoor();

      if (b) {
        text = "INTERACT  •  ENTER";
      }
    }
  }

  if (!text) return;

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.72)";

  const width = 270;
  const height = 40;

  ctx.fillRect(
    canvas.width / 2 - width / 2,
    canvas.height - 65,
    width,
    height
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height - 40
  );

  ctx.restore();
}

/* =========================================================
   LIGHTING
========================================================= */

function drawLighting() {
  const gradient = ctx.createRadialGradient(
    player.x,
    player.y,
    100,
    player.x,
    player.y,
    550
  );

  gradient.addColorStop(
    0,
    "rgba(255,240,190,0)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0.24)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    camera.x - canvas.width / 2,
    camera.y - canvas.height / 2,
    canvas.width,
    canvas.height
  );
}

/* =========================================================
   WORLD DRAW
========================================================= */

function drawWorld() {
  ctx.save();

  ctx.translate(
    Math.round(canvas.width / 2 - camera.x),
    Math.round(canvas.height / 2 - camera.y)
  );

  if (mode === "outside") {
    drawGround();
    drawRoads();

    for (const b of buildings) {
      drawBuilding(b);
    }

    for (const car of cars) {
      drawCar(car);
    }

    for (const tree of trees) {
      drawTree(tree);
    }

    updateCamera();

    for (const z of zombies) {
      drawZombie(z);
    }

    drawPlayer();

    drawLighting();
  } else {
    drawGround();
    drawInterior();
    drawPlayer();
  }

  ctx.restore();
}

/* =========================================================
   GAME UPDATE
========================================================= */

function update(dt) {
  const input = getInput();

  if (mode === "outside") {
    if (player.inCar) {
      const carSpeed = 5.2;

      moveCar(
        input.x * carSpeed,
        input.y * carSpeed
      );

      // rotate car according to movement
      if (Math.hypot(input.x, input.y) > 0.15) {
        player.car.angle =
          Math.atan2(input.y, input.x);
      }
    } else {
      tryMovePlayer(
        input.x * player.speed,
        input.y * player.speed
      );
    }

    updateZombies();
  } else {
    moveInterior(
      input.x * player.speed,
      input.y * player.speed
    );
  }

  updateSurvival(dt);
  updateCamera();
}

/* =========================================================
   RENDER LOOP
========================================================= */

function loop(now) {
  const dt = Math.min(
    50,
    now - lastTime
  );

  lastTime = now;

  update(dt);

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawWorld();
  drawHUD();
  drawPrompt();

  requestAnimationFrame(loop);
}

/* =========================================================
   START
========================================================= */

function resizeCanvas() {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
}

resizeCanvas();

requestAnimationFrame(loop);