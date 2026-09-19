// VIRELIA: AFTERFALL
// Lightweight mobile build
// Version: 0.3

const canvas = document.getElementById("game");

if (!canvas) {
  throw new Error("Canvas #game tidak ditemukan.");
}

const ctx = canvas.getContext("2d", { alpha: false });

canvas.width = 960;
canvas.height = 540;

const W = 2400;
const H = 1800;

let lastTime = performance.now();
let gameTime = 0;

const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

let mode = "outside";
let message = "";
let messageTimer = 0;

const player = {
  x: 1200,
  y: 1050,
  r: 15,
  speed: 145,
  hp: 100,
  hunger: 100,
  angle: 0,
  inCar: null
};

const camera = {
  x: 0,
  y: 0
};

// --------------------------------------------------
// WORLD
// --------------------------------------------------

const roads = [
  { x: 0, y: 800, w: W, h: 180 },
  { x: 1040, y: 0, w: 180, h: H }
];

const buildings = [
  { x: 260, y: 300, w: 330, h: 250, doorX: 425, doorY: 555 },
  { x: 720, y: 220, w: 260, h: 300, doorX: 850, doorY: 525 },
  { x: 1450, y: 230, w: 330, h: 250, doorX: 1615, doorY: 485 },
  { x: 1900, y: 350, w: 300, h: 260, doorX: 2050, doorY: 615 },
  { x: 250, y: 1180, w: 300, h: 260, doorX: 400, doorY: 1170 },
  { x: 700, y: 1300, w: 290, h: 250, doorX: 845, doorY: 1290 },
  { x: 1500, y: 1200, w: 350, h: 280, doorX: 1675, doorY: 1190 }
];

const cars = [
  { x: 620, y: 870, w: 72, h: 38, angle: 0, occupied: false },
  { x: 890, y: 920, w: 72, h: 38, angle: 0, occupied: false },
  { x: 1320, y: 870, w: 72, h: 38, angle: 0, occupied: false },
  { x: 1640, y: 930, w: 72, h: 38, angle: 0, occupied: false },
  { x: 1980, y: 850, w: 72, h: 38, angle: 0, occupied: false },
  { x: 1160, y: 1170, w: 72, h: 38, angle: 0, occupied: false },
  { x: 1350, y: 1450, w: 72, h: 38, angle: 0, occupied: false }
];

const trees = [
  [100, 180], [180, 650], [90, 1120], [620, 160],
  [1120, 170], [1360, 160], [1820, 170], [2280, 200],
  [2300, 700], [2150, 1100], [2250, 1500], [1180, 1560],
  [1000, 1450], [580, 1580], [110, 1600], [1370, 620],
  [1820, 720], [700, 650], [1950, 1450], [2100, 1250]
].map(([x, y]) => ({ x, y, r: 25 }));

const rubble = [
  [650, 700], [760, 1060], [980, 690], [1410, 700],
  [1770, 700], [1860, 1040], [1160, 1320], [1300, 500]
].map(([x, y]) => ({ x, y, r: 18 }));

const zombies = [
  [500, 720], [680, 1080], [900, 700], [1100, 620],
  [1320, 650], [1510, 760], [1770, 1080], [2040, 760]
].map(([x, y], i) => ({
  x,
  y,
  r: 13,
  speed: 38 + (i % 3) * 5,
  wander: Math.random() * Math.PI * 2,
  attackCooldown: 0
}));

// --------------------------------------------------
// INTERIOR
// --------------------------------------------------

let currentBuilding = null;

const interior = {
  width: 760,
  height: 520,
  playerX: 380,
  playerY: 410
};

// --------------------------------------------------
// INPUT
// --------------------------------------------------

function setKey(name, value) {
  keys[name] = value;
}

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();

  if (k === "w" || k === "arrowup") setKey("up", true);
  if (k === "s" || k === "arrowdown") setKey("down", true);
  if (k === "a" || k === "arrowleft") setKey("left", true);
  if (k === "d" || k === "arrowright") setKey("right", true);

  if (k === "e" || k === "enter") interact();
});

window.addEventListener("keyup", e => {
  const k = e.key.toLowerCase();

  if (k === "w" || k === "arrowup") setKey("up", false);
  if (k === "s" || k === "arrowdown") setKey("down", false);
  if (k === "a" || k === "arrowleft") setKey("left", false);
  if (k === "d" || k === "arrowright") setKey("right", false);
});

// --------------------------------------------------
// MOBILE BUTTONS
// --------------------------------------------------

function bindButton(ids, key) {
  ids.forEach(id => {
    const el = document.getElementById(id);

    if (!el) return;

    const down = e => {
      e.preventDefault();
      setKey(key, true);
    };

    const up = e => {
      e.preventDefault();
      setKey(key, false);
    };

    el.addEventListener("touchstart", down, { passive: false });
    el.addEventListener("touchend", up, { passive: false });
    el.addEventListener("touchcancel", up, { passive: false });

    el.addEventListener("mousedown", down);
    el.addEventListener("mouseup", up);
    el.addEventListener("mouseleave", up);
  });
}

bindButton(["up", "upBtn", "btn-up"], "up");
bindButton(["down", "downBtn", "btn-down"], "down");
bindButton(["left", "leftBtn", "btn-left"], "left");
bindButton(["right", "rightBtn", "btn-right"], "right");

const interactButton = document.getElementById("interact");

if (interactButton) {
  interactButton.addEventListener("click", interact);
  interactButton.addEventListener("touchstart", e => {
    e.preventDefault();
    interact();
  }, { passive: false });
}

// --------------------------------------------------
// COLLISION
// --------------------------------------------------

function circleRectCollision(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

function solidObjects() {
  return [
    ...buildings,
    ...trees.map(t => ({
      x: t.x - t.r,
      y: t.y - t.r,
      w: t.r * 2,
      h: t.r * 2
    })),
    ...rubble.map(r => ({
      x: r.x - r.r,
      y: r.y - r.r,
      w: r.r * 2,
      h: r.r * 2
    }))
  ];
}

function blocked(x, y, radius) {
  for (const b of buildings) {
    if (circleRectCollision(x, y, radius, b)) return true;
  }

  for (const t of trees) {
    const dx = x - t.x;
    const dy = y - t.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < radius + t.r) return true;
  }

  for (const r of rubble) {
    const dx = x - r.x;
    const dy = y - r.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < radius + r.r) return true;
  }

  return false;
}

// --------------------------------------------------
// MOVEMENT
// --------------------------------------------------

function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!blocked(nx, player.y, player.r)) {
    player.x = nx;
  }

  if (!blocked(player.x, ny, player.r)) {
    player.y = ny;
  }

  player.x = Math.max(25, Math.min(W - 25, player.x));
  player.y = Math.max(25, Math.min(H - 25, player.y));
}

function updateOutside(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  const length = Math.hypot(dx, dy);

  if (length > 0) {
    dx /= length;
    dy /= length;

    if (player.inCar) {
      const car = player.inCar;

      car.angle = Math.atan2(dy, dx);

      const speed = 280;

      const nx = car.x + dx * speed * dt;
      const ny = car.y + dy * speed * dt;

      if (!blocked(nx, ny, 25)) {
        car.x = nx;
        car.y = ny;
      }

      player.x = car.x;
      player.y = car.y;
    } else {
      player.angle = Math.atan2(dy, dx);
      movePlayer(dx * player.speed * dt, dy * player.speed * dt);
    }
  }
}

// --------------------------------------------------
// ZOMBIES
// --------------------------------------------------

function updateZombies(dt) {
  if (mode !== "outside") return;

  for (const z of zombies) {
    const dx = player.x - z.x;
    const dy = player.y - z.y;

    const distance = Math.hypot(dx, dy);

    if (distance < 420 && distance > 35) {
      const nx = dx / distance;
      const ny = dy / distance;

      const testX = z.x + nx * z.speed * dt;
      const testY = z.y + ny * z.speed * dt;

      if (!blocked(testX, testY, z.r)) {
        z.x = testX;
        z.y = testY;
      } else {
        // Simple avoidance
        const sideX = -ny;
        const sideY = nx;

        const ax = z.x + sideX * z.speed * dt;
        const ay = z.y + sideY * z.speed * dt;

        if (!blocked(ax, ay, z.r)) {
          z.x = ax;
          z.y = ay;
        }
      }
    } else {
      z.wander += (Math.random() - 0.5) * dt;

      const wx = Math.cos(z.wander);
      const wy = Math.sin(z.wander);

      const nx = z.x + wx * z.speed * 0.35 * dt;
      const ny = z.y + wy * z.speed * 0.35 * dt;

      if (!blocked(nx, ny, z.r)) {
        z.x = nx;
        z.y = ny;
      }
    }

    if (distance < 34 && !player.inCar) {
      z.attackCooldown -= dt;

      if (z.attackCooldown <= 0) {
        player.hp = Math.max(0, player.hp - 4);
        z.attackCooldown = 1.2;
        showMessage("A zombie is nearby!");
      }
    }
  }
}

// --------------------------------------------------
// INTERACTION
// --------------------------------------------------

function nearestCar() {
  let best = null;
  let bestDistance = Infinity;

  for (const car of cars) {
    const d = Math.hypot(player.x - car.x, player.y - car.y);

    if (d < bestDistance) {
      bestDistance = d;
      best = car;
    }
  }

  return bestDistance < 75 ? best : null;
}

function nearestDoor() {
  let best = null;
  let bestDistance = Infinity;

  for (const b of buildings) {
    const d = Math.hypot(player.x - b.doorX, player.y - b.doorY);

    if (d < bestDistance) {
      bestDistance = d;
      best = b;
    }
  }

  return bestDistance < 65 ? best : null;
}

function interact() {
  if (mode === "inside") {
    exitBuilding();
    return;
  }

  if (player.inCar) {
    const car = player.inCar;

    player.inCar = null;
    car.occupied = false;

    player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 45;
    player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 45;

    showMessage("Exited vehicle");
    return;
  }

  const car = nearestCar();

  if (car) {
    car.occupied = true;
    player.inCar = car;

    showMessage("Vehicle entered");
    return;
  }

  const door = nearestDoor();

  if (door) {
    enterBuilding(door);
    return;
  }

  showMessage("Nothing to interact with");
}

function enterBuilding(building) {
  currentBuilding = building;
  mode = "inside";

  interior.playerX = interior.width / 2;
  interior.playerY = interior.height - 80;

  showMessage("Entered building");
}

function exitBuilding() {
  if (!currentBuilding) return;

  player.x = currentBuilding.doorX;
  player.y = currentBuilding.doorY + 45;

  currentBuilding = null;
  mode = "outside";

  showMessage("Exited building");
}

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

function updateCamera() {
  if (mode !== "outside") return;

  // Player lower-center instead of dead-center.
  const targetX = player.x - canvas.width / 2;
  const targetY = player.y - canvas.height * 0.68;

  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;

  camera.x = Math.max(0, Math.min(W - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(H - canvas.height, camera.y));
}

// --------------------------------------------------
// DRAW WORLD
// --------------------------------------------------

function drawGround() {
  ctx.fillStyle = "#263126";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid-like ground detail
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;

  const startX = Math.floor(camera.x / 80) * 80;
  const startY = Math.floor(camera.y / 80) * 80;

  for (let x = startX; x < camera.x + canvas.width + 80; x += 80) {
    const sx = x - camera.x;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, canvas.height);
    ctx.stroke();
  }

  for (let y = startY; y < camera.y + canvas.height + 80; y += 80) {
    const sy = y - camera.y;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(canvas.width, sy);
    ctx.stroke();
  }
}

function drawRoads() {
  for (const road of roads) {
    const x = road.x - camera.x;
    const y = road.y - camera.y;

    ctx.fillStyle = "#343638";
    ctx.fillRect(x, y, road.w, road.h);

    ctx.strokeStyle = "#4b4d4d";
    ctx.lineWidth = 3;

    if (road.w > road.h) {
      ctx.beginPath();
      ctx.moveTo(x, y + road.h / 2);
      ctx.lineTo(x + road.w, y + road.h / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + road.w / 2, y);
      ctx.lineTo(x + road.w / 2, y + road.h);
      ctx.stroke();
    }
  }
}

function drawBuildings() {
  for (const b of buildings) {
    const x = b.x - camera.x;
    const y = b.y - camera.y;

    if (
      x + b.w < 0 ||
      y + b.h < 0 ||
      x > canvas.width ||
      y > canvas.height
    ) continue;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 10, y + 12, b.w, b.h);

    // Building
    ctx.fillStyle = "#77766f";
    ctx.fillRect(x, y, b.w, b.h);

    // Roof
    ctx.fillStyle = "#55544f";
    ctx.fillRect(x + 8, y + 8, b.w - 16, 28);

    // Windows
    ctx.fillStyle = "#30393a";

    for (let wx = x + 35; wx < x + b.w - 30; wx += 65) {
      ctx.fillRect(wx, y + 75, 35, 42);
    }

    for (let wx = x + 35; wx < x + b.w - 30; wx += 65) {
      ctx.fillRect(wx, y + 150, 35, 42);
    }

    // Door
    ctx.fillStyle = "#292623";
    ctx.fillRect(
      b.doorX - camera.x - 14,
      b.doorY - camera.y - 28,
      28,
      45
    );
  }
}

function drawTrees() {
  for (const t of trees) {
    const x = t.x - camera.x;
    const y = t.y - camera.y;

    if (
      x < -60 ||
      y < -60 ||
      x > canvas.width + 60 ||
      y > canvas.height + 60
    ) continue;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 15, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = "#554333";
    ctx.fillRect(x - 7, y - 3, 14, 30);

    // Crown
    ctx.fillStyle = "#263f2b";
    ctx.beginPath();
    ctx.arc(x, y - 15, 27, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#304d34";
    ctx.beginPath();
    ctx.arc(x - 10, y - 25, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRubble() {
  for (const r of rubble) {
    const x = r.x - camera.x;
    const y = r.y - camera.y;

    ctx.fillStyle = "#55504a";

    ctx.beginPath();
    ctx.arc(x, y, r.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#716b62";

    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCars() {
  for (const car of cars) {
    const x = car.x - camera.x;
    const y = car.y - camera.y;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(car.angle);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(-35, -14, 70, 32);

    // Body
    ctx.fillStyle = car.occupied ? "#8a7770" : "#686b6b";
    ctx.fillRect(-36, -18, 72, 36);

    // Windows
    ctx.fillStyle = "#222b2d";
    ctx.fillRect(-15, -14, 28, 28);

    // Wheels
    ctx.fillStyle = "#151515";
    ctx.fillRect(-27, -23, 15, 7);
    ctx.fillRect(12, -23, 15, 7);
    ctx.fillRect(-27, 16, 15, 7);
    ctx.fillRect(12, 16, 15, 7);

    ctx.restore();
  }
}

function drawZombies() {
  for (const z of zombies) {
    const x = z.x - camera.x;
    const y = z.y - camera.y;

    if (
      x < -40 ||
      y < -40 ||
      x > canvas.width + 40 ||
      y > canvas.height + 40
    ) continue;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#6c7460";
    ctx.fillRect(x - 9, y - 3, 18, 25);

    // Head
    ctx.fillStyle = "#858b70";
    ctx.beginPath();
    ctx.arc(x, y - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#24251f";
    ctx.fillRect(x - 5, y - 14, 3, 3);
    ctx.fillRect(x + 2, y - 14, 3, 3);
  }
}

// --------------------------------------------------
// PLAYER
// --------------------------------------------------

function drawPlayer() {
  if (player.inCar) return;

  const x = player.x - camera.x;
  const y = player.y - camera.y;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 19, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs - STATIC
  ctx.fillStyle = "#25272a";
  ctx.fillRect(x - 10, y + 5, 8, 25);
  ctx.fillRect(x + 2, y + 5, 8, 25);

  // Body
  ctx.fillStyle = "#3f5058";
  ctx.fillRect(x - 13, y - 14, 26, 28);

  // Backpack
  ctx.fillStyle = "#293036";
  ctx.fillRect(x - 17, y - 10, 7, 22);

  // Head
  ctx.fillStyle = "#b48c6c";
  ctx.beginPath();
  ctx.arc(x, y - 24, 11, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#24211e";
  ctx.beginPath();
  ctx.arc(x, y - 28, 10, Math.PI, Math.PI * 2);
  ctx.fill();
}

// --------------------------------------------------
// INTERIOR DRAW
// --------------------------------------------------

function drawInterior() {
  ctx.fillStyle = "#171817";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ox = (canvas.width - interior.width) / 2;
  const oy = (canvas.height - interior.height) / 2;

  // Floor
  ctx.fillStyle = "#4a4943";
  ctx.fillRect(ox, oy, interior.width, interior.height);

  // Walls
  ctx.fillStyle = "#6c6960";

  ctx.fillRect(ox, oy, interior.width, 25);
  ctx.fillRect(ox, oy, 25, interior.height);
  ctx.fillRect(ox + interior.width - 25, oy, 25, interior.height);
  ctx.fillRect(ox, oy + interior.height - 25, interior.width, 25);

  // Floor lines
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;

  for (let x = ox + 25; x < ox + interior.width; x += 55) {
    ctx.beginPath();
    ctx.moveTo(x, oy + 25);
    ctx.lineTo(x, oy + interior.height - 25);
    ctx.stroke();
  }

  for (let y = oy + 25; y < oy + interior.height; y += 55) {
    ctx.beginPath();
    ctx.moveTo(ox + 25, y);
    ctx.lineTo(ox + interior.width - 25, y);
    ctx.stroke();
  }

  // Furniture
  ctx.fillStyle = "#34302c";
  ctx.fillRect(ox + 80, oy + 80, 150, 55);
  ctx.fillRect(ox + 500, oy + 90, 120, 45);
  ctx.fillRect(ox + 260, oy + 240, 180, 55);

  // Player
  const px = ox + interior.playerX;
  const py = oy + interior.playerY;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(px, py + 15, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#25272a";
  ctx.fillRect(px - 10, py + 2, 8, 24);
  ctx.fillRect(px + 2, py + 2, 8, 24);

  ctx.fillStyle = "#3f5058";
  ctx.fillRect(px - 13, py - 17, 26, 27);

  ctx.fillStyle = "#b48c6c";
  ctx.beginPath();
  ctx.arc(px, py - 27, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#24211e";
  ctx.beginPath();
  ctx.arc(px, py - 31, 10, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ddd";
  ctx.font = "16px Arial";
  ctx.fillText("BUILDING INTERIOR", ox + 25, oy - 15);
}

// --------------------------------------------------
// HUD
// --------------------------------------------------

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(15, 15, 230, 88);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.fillText("VIRELIA", 28, 40);

  ctx.font = "14px Arial";
  ctx.fillText("HP", 28, 63);

  ctx.fillStyle = "#333";
  ctx.fillRect(58, 53, 140, 12);

  ctx.fillStyle = "#c75b52";
  ctx.fillRect(58, 53, 140 * (player.hp / 100), 12);

  ctx.fillStyle = "#fff";
  ctx.fillText("Hunger", 28, 86);

  ctx.fillStyle = "#333";
  ctx.fillRect(78, 76, 120, 10);

  ctx.fillStyle = "#c0a44d";
  ctx.fillRect(78, 76, 120 * (player.hunger / 100), 10);

  const hours = Math.floor((gameTime / 30) % 24);
  const minutes = Math.floor((gameTime * 2) % 60);

  const timeText =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0");

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("DAY 1  " + timeText, canvas.width - 150, 32);

  if (messageTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(canvas.width / 2 - 130, canvas.height - 70, 260, 40);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "15px Arial";
    ctx.fillText(message, canvas.width / 2, canvas.height - 45);
    ctx.textAlign = "left";
  }

  if (mode === "outside") {
    const car = nearestCar();
    const door = nearestDoor();

    if (!player.inCar && (car || door)) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(canvas.width / 2 - 95, canvas.height - 120, 190, 34);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 14px Arial";
      ctx.fillText("E / INTERACT", canvas.width / 2, canvas.height - 98);
      ctx.textAlign = "left";
    }

    if (player.inCar) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(canvas.width / 2 - 95, canvas.height - 120, 190, 34);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 14px Arial";
      ctx.fillText("E / EXIT VEHICLE", canvas.width / 2, canvas.height - 98);
      ctx.textAlign = "left";
    }
  }
}

// --------------------------------------------------
// MESSAGE
// --------------------------------------------------

function showMessage(text) {
  message = text;
  messageTimer = 2;
}

// --------------------------------------------------
// SURVIVAL
// --------------------------------------------------

function updateSurvival(dt) {
  if (mode !== "outside") return;

  player.hunger -= dt * 0.08;
  player.hunger = Math.max(0, player.hunger);

  if (player.hunger <= 0) {
    player.hp -= dt * 1.5;
  }

  player.hp = Math.max(0, player.hp);

  if (player.hp <= 0) {
    showMessage("You are exhausted...");

    player.hp = 100;
    player.hunger = 60;
    player.x = 1200;
    player.y = 1050;
  }
}

// --------------------------------------------------
// MAIN UPDATE
// --------------------------------------------------

function update(dt) {
  gameTime += dt;

  if (messageTimer > 0) {
    messageTimer -= dt;
  }

  if (mode === "outside") {
    updateOutside(dt);
    updateZombies(dt);
    updateSurvival(dt);
    updateCamera();
  } else {
    let dx = 0;
    let dy = 0;

    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    const len = Math.hypot(dx, dy);

    if (len > 0) {
      dx /= len;
      dy /= len;

      interior.playerX += dx * 130 * dt;
      interior.playerY += dy * 130 * dt;

      interior.playerX = Math.max(
        50,
        Math.min(interior.width - 50, interior.playerX)
      );

      interior.playerY = Math.max(
        50,
        Math.min(interior.height - 50, interior.playerY)
      );
    }
  }
}

// --------------------------------------------------
// MAIN DRAW
// --------------------------------------------------

function draw() {
  if (mode === "outside") {
    drawGround();
    drawRoads();
    drawBuildings();
    drawRubble();
    drawTrees();
    drawCars();
    drawZombies();
    drawPlayer();

    drawHUD();
  } else {
    drawInterior();
    drawHUD();
  }
}

// --------------------------------------------------
// GAME LOOP
// --------------------------------------------------

function loop(now) {
  let dt = (now - lastTime) / 1000;

  // Prevent huge jumps when tab/browser sleeps.
  dt = Math.min(dt, 0.05);

  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

showMessage("Survive the Afterfall");

requestAnimationFrame(loop);