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
let lastTime = performance.now();

const player = {
  x: 2100,
  y: 690,
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
  { x: 0, y: 500, w: W, h: 180 },
  { x: 0, y: 1400, w: W, h: 180 },
  { x: 0, y: 2300, w: W, h: 180 },
  { x: 600, y: 0, w: 180, h: H },
  { x: 2010, y: 0, w: 180, h: H },
  { x: 3420, y: 0, w: 180, h: H }
];

const buildings = [
  { x: 80, y: 80, w: 380, h: 320 },
  { x: 950, y: 80, w: 420, h: 320 },
  { x: 2400, y: 80, w: 420, h: 320 },
  { x: 3710, y: 80, w: 380, h: 320 },

  { x: 80, y: 820, w: 380, h: 420 },
  { x: 950, y: 820, w: 420, h: 420 },
  { x: 2400, y: 820, w: 420, h: 420 },
  { x: 3710, y: 820, w: 380, h: 420 },

  { x: 80, y: 1720, w: 380, h: 420 },
  { x: 950, y: 1720, w: 420, h: 420 },
  { x: 2400, y: 1720, w: 420, h: 420 },
  { x: 3710, y: 1720, w: 380, h: 420 },

  { x: 80, y: 2620, w: 380, h: 280 },
  { x: 950, y: 2620, w: 420, h: 280 },
  { x: 2400, y: 2620, w: 420, h: 280 },
  { x: 3710, y: 2620, w: 380, h: 280 }
];

const buildingColors = [
  "#6e706b",
  "#77736a",
  "#666b68",
  "#716c63"
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

  for (const [x, y] of spots) {
    if (
      x > 35 &&
      y > 35 &&
      x < W - 35 &&
      y < H - 35 &&
      !onRoad(x, y)
    ) {
      trees.push({ x, y, r: 25 });
    }
  }
}

const cars = [
  { x: 300, y: 590, color: "#9b3434", angle: 0 },
  { x: 1120, y: 590, color: "#56636b", angle: 0 },
  { x: 2700, y: 590, color: "#8c7731", angle: 0 },
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
  const car = player.car;

  if (!car) return;

  const nx = car.x + dx;
  const ny = car.y + dy;

  if (!onRoad(nx, ny)) return;

  if (blocked(nx, ny, 42, car)) return;

  car.x = nx;
  car.y = ny;
  player.x = nx;
  player.y = ny;

  if (Math.hypot(dx, dy) > 0.2) {
    car.angle = Math.atan2(dy, dx);
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
      h: 55,
      type: "bed"
    },
    {
      x: b.x + b.w - 140,
      y: b.y + 35,
      w: 105,
      h: 55,
      type: "cabinet"
    },
    {
      x: b.x + 35,
      y: b.y + 140,
      w: 90,
      h: 55,
      type: "table"
    },
    {
      x: b.x + b.w - 140,
      y: b.y + 140,
      w: 105,
      h: 55,
      type: "sofa"
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
  player.y = b.y + b.h - 28;
}

function exitBuilding() {
  const b = insideBuilding;

  if (!b) return;

  const d = getDoor(b);

  const nearDoor =
    Math.hypot(
      player.x - d.x,
      player.y - (b.y + b.h - 30)
    ) < 70;

  if (!nearDoor) return;

  const outsideX = d.x;
  const outsideY = b.y + b.h + 55;

  if (blocked(outsideX, outsideY, player.r)) {
    return;
  }

  player.x = outsideX;
  player.y = outsideY;

  insideBuilding = null;
  furniture = [];
  mode = "outside";
}

function enterCar(car) {
  if (!car) return;

  car.occupied = true;
  player.car = car;
  player.x = car.x;
  player.y = car.y;
}

function exitCar() {
  const car = player.car;

  if (!car) return;

  const spots = [
    [car.x + 70, car.y],
    [car.x - 70, car.y],
    [car.x, car.y + 70],
    [car.x, car.y - 70]
  ];

  for (const [x, y] of spots) {
    if (!blocked(x, y, player.r, car)) {
      player.x = x;
      player.y = y;
      car.occupied = false;
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

  const car = nearestCar();

  if (car) {
    enterCar(car);
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
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  joy.x = dx / max;
  joy.y = dy / max;

  stick.style.transform =
    `translate(${dx}px, ${dy}px)`;
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
  if (joy.active) {
    updateJoystick(e);
  }
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

  const length = Math.hypot(x, y);

  if (length > 1) {
    x /= length;
    y /= length;
  }

  return { x, y };
}

function updateZombies() {
  if (mode !== "outside") return;

  const targetX = player.car
    ? player.car.x
    : player.x;

  const targetY = player.car
    ? player.car.y
    : player.y;

  for (const z of zombies) {
    const dx = targetX - z.x;
    const dy = targetY - z.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 650 || distance < 1) {
      continue;
    }

    const vx = dx / distance * z.speed;
    const vy = dy / distance * z.speed;

    if (
      !blocked(
        z.x + vx,
        z.y + vy,
        z.r
      )
    ) {
      z.x += vx;
      z.y += vy;
      continue;
    }

    if (
      !blocked(
        z.x + vx,
        z.y,
        z.r
      )
    ) {
      z.x += vx;
    }

    if (
      !blocked(
        z.x,
        z.y + vy,
        z.r
      )
    ) {
      z.y += vy;
    }
  }
}

function updateCamera() {
  const targetX = player.x;
  const targetY = player.y - 90;

  camera.x +=
    (targetX - camera.x) * 0.1;

  camera.y +=
    (targetY - camera.y) * 0.1;

  camera.x = clamp(
    camera.x,
    canvas.width / 2,
    W - canvas.width / 2
  );

  camera.y = clamp(
    camera.y,
    canvas.height * 0.38,
    H - canvas.height * 0.62
  );
}

function drawGround() {
  ctx.fillStyle = "#3f513d";
  ctx.fillRect(0, 0, W, H);
}

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#303236";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = "#c8b85f";
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 32]);

    ctx.beginPath();

    if (r.w > r.h) {
      ctx.moveTo(
        r.x,
        r.y + r.h / 2
      );

      ctx.lineTo(
        r.x + r.w,
        r.y + r.h / 2
      );
    } else {
      ctx.moveTo(
        r.x + r.w / 2,
        r.y
      );

      ctx.lineTo(
        r.x + r.w / 2,
        r.y + r.h
      );
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBuilding(b) {
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(
    b.x + 12,
    b.y + 14,
    b.w,
    b.h
  );

  ctx.fillStyle = b.color;
  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  ctx.fillStyle = "#343633";
  ctx.fillRect(
    b.x - 6,
    b.y - 8,
    b.w + 12,
    14
  );

  ctx.fillStyle = "#263a3d";

  for (
    let x = b.x + 35;
    x < b.x + b.w - 25;
    x += 82
  ) {
    ctx.fillRect(
      x,
      b.y + 32,
      34,
      45
    );
  }

  const d = getDoor(b);

  ctx.fillStyle = "#3b2b20";
  ctx.fillRect(
    d.x - 23,
    b.y + b.h - 55,
    46,
    55
  );
}

function drawTree(t) {
  ctx.fillStyle = "#5b432d";
  ctx.fillRect(
    t.x - 7,
    t.y,
    14,
    30
  );

  ctx.fillStyle = "#315637";
  ctx.beginPath();
  ctx.arc(
    t.x,
    t.y - 14,
    t.r,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawCar(c) {
  ctx.save();

  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);

  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(
    -c.w / 2 + 6,
    -c.h / 2 + 7,
    c.w,
    c.h
  );

  ctx.fillStyle = c.color;
  ctx.fillRect(
    -c.w / 2,
    -c.h / 2,
    c.w,
    c.h
  );

  ctx.fillStyle = "#172225";
  ctx.fillRect(
    -19,
    -15,
    38,
    14
  );

  ctx.fillStyle = "#d8c875";
  ctx.fillRect(
    c.w / 2 - 9,
    -c.h / 2 + 6,
    5,
    9
  );

  ctx.fillRect(
    c.w / 2 - 9,
    c.h / 2 - 15,
    5,
    9
  );

  ctx.fillStyle = "#171717";

  ctx.fillRect(-31, -24, 18, 7);
  ctx.fillRect(-31, 17, 18, 7);
  ctx.fillRect(13, -24, 18, 7);
  ctx.fillRect(13, 17, 18, 7);

  ctx.restore();
}

function drawZombie(z) {
  ctx.fillStyle = "#586852";

  ctx.fillRect(
    z.x - 8,
    z.y - 3,
    16,
    22
  );

  ctx.fillStyle = "#89927b";

  ctx.beginPath();

  ctx.arc(
    z.x,
    z.y - 13,
    9,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawPlayer() {
  if (player.car) return;

  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  ctx.fillStyle = "#1d2525";

  ctx.fillRect(-8, 3, 6, 18);
  ctx.fillRect(2, 3, 6, 18);

  ctx.fillStyle = "#394345";

  ctx.fillRect(
    -11,
    -13,
    22,
    22
  );

  ctx.fillStyle = "#b99c7e";

  ctx.beginPath();

  ctx.arc(
    0,
    -22,
    9,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

function drawInterior() {
  const b = insideBuilding;

  ctx.fillStyle = "#615b50";
  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  ctx.strokeStyle = "#292a28";
  ctx.lineWidth = 18;

  ctx.strokeRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  for (const f of furniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#40322b";
    } else if (f.type === "cabinet") {
      ctx.fillStyle = "#302720";
    } else if (f.type === "table") {
      ctx.fillStyle = "#4b3727";
    } else {
      ctx.fillStyle = "#4b4e4b";
    }

    ctx.fillRect(
      f.x,
      f.y,
      f.w,
      f.h
    );
  }

  ctx.fillStyle = "#b59b5b";

  ctx.fillRect(
    b.x + b.w / 2 - 28,
    b.y + b.h - 12,
    56,
    22
  );
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,.65)";
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

    const near =
      Math.hypot(
        player.x - d.x,
        player.y - (b.y + b.h - 30)
      ) < 70;

    if (near) {
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

  ctx.fillStyle = "rgba(0,0,0,.75)";

  ctx.fillRect(
    450,
    650,
    380,
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

    if (
      !interiorBlocked(
        nx,
        player.y
      )
    ) {
      player.x = nx;
    }

    if (
      !interiorBlocked(
        player.x,
        ny
      )
    ) {
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

  ctx.save();

  ctx.translate(
    canvas.width / 2 - camera.x,
    canvas.height * 0.62 - camera.y
  );

  if (mode === "outside") {
    drawGround();
    drawRoads();

    for (const b of buildings) {
      drawBuilding(b);
    }

    for (const t of trees) {
      drawTree(t);
    }

    for (const c of cars) {
      drawCar(c);
    }

    for (const z of zombies) {
      drawZombie(z);
    }

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
  const dt = Math.min(
    50,
    now - lastTime
  );

  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);