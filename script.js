const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 3600;
const H = 2600;

let mode = "outside";
let currentBuilding = null;
let lastTime = performance.now();

const keys = {};
const joystick = {
  active: false,
  x: 0,
  y: 0
};

const player = {
  x: 1800,
  y: 600,
  r: 15,
  speed: 3.2,
  hp: 100,
  hunger: 100,
  inCar: false,
  car: null
};

const camera = {
  x: player.x,
  y: player.y
};

/* =========================================================
   CITY GRID
   Jalan dibuat TERLEBIH DAHULU.
   Semua bangunan hanya boleh hidup di area blok.
========================================================= */

const roads = [
  // horizontal
  { x: 0, y: 400, w: W, h: 190 },
  { x: 0, y: 1120, w: W, h: 190 },
  { x: 0, y: 1840, w: W, h: 190 },

  // vertical
  { x: 500, y: 0, w: 190, h: H },
  { x: 1680, y: 0, w: 190, h: H },
  { x: 2860, y: 0, w: 190, h: H }
];

/*
  Blok kota:

  Kolom:
  0 - 500
  690 - 1680
  1870 - 2860
  3050 - 3600

  Baris:
  0 - 400
  590 - 1120
  1310 - 1840
  2030 - 2600

  Bangunan dibuat DI DALAM blok tersebut.
*/

const blocks = [
  { x: 40, y: 40, w: 420, h: 320 },
  { x: 730, y: 40, w: 900, h: 320 },
  { x: 1910, y: 40, w: 900, h: 320 },
  { x: 3090, y: 40, w: 470, h: 320 },

  { x: 40, y: 630, w: 420, h: 450 },
  { x: 730, y: 630, w: 900, h: 450 },
  { x: 1910, y: 630, w: 900, h: 450 },
  { x: 3090, y: 630, w: 470, h: 450 },

  { x: 40, y: 1360, w: 420, h: 430 },
  { x: 730, y: 1360, w: 900, h: 430 },
  { x: 1910, y: 1360, w: 900, h: 430 },
  { x: 3090, y: 1360, w: 470, h: 430 },

  { x: 40, y: 2090, w: 420, h: 470 },
  { x: 730, y: 2090, w: 900, h: 470 },
  { x: 1910, y: 2090, w: 900, h: 470 },
  { x: 3090, y: 2090, w: 470, h: 470 }
];

/* =========================================================
   BUILDINGS
   Ukuran dibatasi supaya tidak memenuhi seluruh jalan.
========================================================= */

const buildings = [];

function addBuilding(x, y, w, h, type = "house") {
  buildings.push({
    x,
    y,
    w,
    h,
    type,
    color: [
      "#77746c",
      "#686b65",
      "#716e67",
      "#626660",
      "#7a756c"
    ][buildings.length % 5]
  });
}

/*
  Setiap blok mendapatkan bangunan yang sengaja
  diletakkan di tengah blok dengan ruang kosong
  di sekelilingnya.
*/

for (const block of blocks) {
  const margin = 55;

  let bw = Math.min(block.w - margin * 2, 340);
  let bh = Math.min(block.h - margin * 2, 250);

  // blok besar bisa punya 2 bangunan
  if (block.w >= 800) {
    addBuilding(
      block.x + margin,
      block.y + margin,
      bw,
      bh
    );

    addBuilding(
      block.x + block.w - bw - margin,
      block.y + block.h - bh - margin,
      bw,
      bh
    );
  } else {
    addBuilding(
      block.x + (block.w - bw) / 2,
      block.y + (block.h - bh) / 2,
      bw,
      bh
    );
  }
}

/* =========================================================
   EXTRA LARGE BUILDING
   Ini tetap berada DI DALAM blok.
========================================================= */

addBuilding(
  2050,
  700,
  560,
  270,
  "large"
);

/* =========================================================
   ROAD CHECK
========================================================= */

function pointInRoad(x, y) {
  return roads.some(r =>
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function rectTouchesRoad(b, padding = 0) {
  return roads.some(r => {
    return !(
      b.x + b.w + padding < r.x ||
      b.x - padding > r.x + r.w ||
      b.y + b.h + padding < r.y ||
      b.y - padding > r.y + r.h
    );
  });
}

/*
  Safety check:
  Kalau entah bagaimana building menyentuh jalan,
  otomatis digeser ke area blok terdekat.
*/

function validateBuildings() {
  for (const b of buildings) {
    if (rectTouchesRoad(b, 4)) {
      console.warn("Building touched road:", b);

      const block = blocks.find(bl =>
        b.x >= bl.x &&
        b.y >= bl.y &&
        b.x + b.w <= bl.x + bl.w &&
        b.y + b.h <= bl.y + bl.h
      );

      if (block) {
        b.x = block.x + (block.w - b.w) / 2;
        b.y = block.y + (block.h - b.h) / 2;
      }
    }
  }
}

validateBuildings();

/* =========================================================
   CARS
   Semua kendaraan diletakkan DI JALAN.
========================================================= */

const cars = [
  { x: 300, y: 495, w: 86, h: 44, color: "#8b2929", angle: 0 },
  { x: 980, y: 495, w: 86, h: 44, color: "#38434a", angle: 0 },
  { x: 2220, y: 495, w: 86, h: 44, color: "#9b8b35", angle: 0 },
  { x: 3260, y: 495, w: 86, h: 44, color: "#53616b", angle: 0 },

  { x: 595, y: 850, w: 86, h: 44, color: "#7d3030", angle: Math.PI / 2 },
  { x: 1775, y: 950, w: 86, h: 44, color: "#444d53", angle: Math.PI / 2 },
  { x: 2955, y: 900, w: 86, h: 44, color: "#777344", angle: Math.PI / 2 },

  { x: 1100, y: 1210, w: 86, h: 44, color: "#55636a", angle: 0 },
  { x: 2350, y: 1210, w: 86, h: 44, color: "#833737", angle: 0 },

  { x: 600, y: 1650, w: 86, h: 44, color: "#454b50", angle: Math.PI / 2 },
  { x: 1800, y: 1700, w: 86, h: 44, color: "#806e38", angle: Math.PI / 2 },
  { x: 2980, y: 1600, w: 86, h: 44, color: "#6a4545", angle: Math.PI / 2 },

  { x: 1050, y: 1935, w: 86, h: 44, color: "#59666d", angle: 0 },
  { x: 2400, y: 1935, w: 86, h: 44, color: "#7d3434", angle: 0 }
];

for (const car of cars) {
  car.occupied = false;
}

/* =========================================================
   TREES
   Trees ONLY on grass inside blocks.
========================================================= */

const trees = [];

function addTree(x, y) {
  if (pointInRoad(x, y)) return;

  for (const b of buildings) {
    if (
      x > b.x - 55 &&
      x < b.x + b.w + 55 &&
      y > b.y - 55 &&
      y < b.y + b.h + 55
    ) {
      return;
    }
  }

  trees.push({
    x,
    y,
    r: 27
  });
}

for (const block of blocks) {
  const candidates = [
    [block.x + 25, block.y + 25],
    [block.x + block.w - 25, block.y + 25],
    [block.x + 25, block.y + block.h - 25],
    [block.x + block.w - 25, block.y + block.h - 25]
  ];

  for (const [x, y] of candidates) {
    addTree(x, y);
  }
}

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [
  { x: 300, y: 500, r: 14, speed: 0.65 },
  { x: 1100, y: 500, r: 14, speed: 0.7 },
  { x: 2200, y: 500, r: 14, speed: 0.65 },
  { x: 3300, y: 500, r: 14, speed: 0.7 },

  { x: 1100, y: 1210, r: 14, speed: 0.65 },
  { x: 2300, y: 1210, r: 14, speed: 0.7 },

  { x: 1100, y: 1935, r: 14, speed: 0.68 },
  { x: 2400, y: 1935, r: 14, speed: 0.65 }
];

/* =========================================================
   INTERIOR
========================================================= */

let interiorFurniture = [];

function getDoor(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h + 3,
    w: 64,
    h: 18
  };
}

function createInterior(b) {
  /*
    Furniture sengaja dibuat JAUH dari pintu.
    Area tengah-bawah selalu kosong.
  */

  const doorX = b.x + b.w / 2;

  interiorFurniture = [
    {
      x: b.x + 35,
      y: b.y + 35,
      w: 110,
      h: 55,
      type: "bed"
    },

    {
      x: b.x + b.w - 150,
      y: b.y + 35,
      w: 100,
      h: 55,
      type: "cabinet"
    },

    {
      x: b.x + 35,
      y: b.y + 135,
      w: 90,
      h: 60,
      type: "table"
    },

    {
      x: b.x + b.w - 145,
      y: b.y + 135,
      w: 100,
      h: 60,
      type: "sofa"
    }
  ];

  // Safety:
  // jangan sampai furniture masuk radius pintu.
  interiorFurniture = interiorFurniture.filter(f => {
    const centerX = f.x + f.w / 2;
    const centerY = f.y + f.h / 2;

    const distance = Math.hypot(
      centerX - doorX,
      centerY - (b.y + b.h)
    );

    return distance > 115;
  });
}

/* =========================================================
   COLLISION
========================================================= */

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function circleRect(cx, cy, radius, rect) {
  const x = clamp(
    cx,
    rect.x,
    rect.x + rect.w
  );

  const y = clamp(
    cy,
    rect.y,
    rect.y + rect.h
  );

  const dx = cx - x;
  const dy = cy - y;

  return dx * dx + dy * dy < radius * radius;
}

function circleCircle(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  ) < a.r + b.r;
}

function buildingCollision(x, y, r) {
  for (const b of buildings) {
    if (circleRect(x, y, r, b)) {
      return true;
    }
  }

  return false;
}

function treeCollision(x, y, r) {
  for (const t of trees) {
    if (
      Math.hypot(x - t.x, y - t.y)
      < r + t.r * 0.65
    ) {
      return true;
    }
  }

  return false;
}

function carCollision(
  x,
  y,
  r,
  ignore = null
) {
  for (const car of cars) {
    if (car === ignore) continue;

    const safeRadius = 48;

    if (
      Math.hypot(
        x - car.x,
        y - car.y
      ) < r + safeRadius
    ) {
      return true;
    }
  }

  return false;
}

function outsideBlocked(
  x,
  y,
  r,
  ignoreCar = null
) {
  if (
    x < r ||
    y < r ||
    x > W - r ||
    y > H - r
  ) {
    return true;
  }

  if (buildingCollision(x, y, r)) {
    return true;
  }

  if (treeCollision(x, y, r)) {
    return true;
  }

  if (carCollision(x, y, r, ignoreCar)) {
    return true;
  }

  return false;
}

/* =========================================================
   PLAYER
========================================================= */

function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (
    !outsideBlocked(
      nx,
      player.y,
      player.r,
      player.car
    )
  ) {
    player.x = nx;
  }

  if (
    !outsideBlocked(
      player.x,
      ny,
      player.r,
      player.car
    )
  ) {
    player.y = ny;
  }
}

/* =========================================================
   CAR
========================================================= */

function moveCar(dx, dy) {
  const car = player.car;

  if (!car) return;

  const nx = car.x + dx;
  const ny = car.y + dy;

  if (
    nx < 55 ||
    ny < 55 ||
    nx > W - 55 ||
    ny > H - 55
  ) {
    return;
  }

  if (buildingCollision(nx, ny, 48)) {
    return;
  }

  if (treeCollision(nx, ny, 48)) {
    return;
  }

  if (carCollision(nx, ny, 48, car)) {
    return;
  }

  car.x = nx;
  car.y = ny;

  player.x = nx;
  player.y = ny;
}

/* =========================================================
   INTERIOR COLLISION
========================================================= */

function interiorBlocked(x, y, r) {
  if (!currentBuilding) {
    return true;
  }

  const b = currentBuilding;

  /*
    Ruang di dalam bangunan.
    Player tidak boleh melewati dinding.
  */

  if (
    x < b.x + r ||
    x > b.x + b.w - r ||
    y < b.y + r ||
    y > b.y + b.h - r
  ) {
    return true;
  }

  for (const f of interiorFurniture) {
    if (circleRect(x, y, r, f)) {
      return true;
    }
  }

  return false;
}

function moveInterior(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (
    !interiorBlocked(
      nx,
      player.y,
      player.r
    )
  ) {
    player.x = nx;
  }

  if (
    !interiorBlocked(
      player.x,
      ny,
      player.r
    )
  ) {
    player.y = ny;
  }
}

/* =========================================================
   BUILDING INTERACTION
========================================================= */

function nearDoor() {
  if (mode !== "outside") return null;

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

function enterBuilding(b) {
  const d = getDoor(b);

  currentBuilding = b;

  createInterior(b);

  mode = "interior";

  /*
    Spawn INSIDE, not on furniture.
  */

  player.x = d.x;
  player.y = b.y + b.h - 45;

  // Safety fallback
  if (
    interiorBlocked(
      player.x,
      player.y,
      player.r
    )
  ) {
    player.x = b.x + b.w / 2;
    player.y = b.y + b.h - 70;
  }
}

function exitBuilding() {
  if (!currentBuilding) return;

  const b = currentBuilding;

  const door = getDoor(b);

  /*
    EXIT hanya boleh kalau player benar-benar
    berada di area pintu.
  */

  const near =
    Math.hypot(
      player.x - door.x,
      player.y - (b.y + b.h - 35)
    ) < 60;

  if (!near) return;

  const outsideX = door.x;
  const outsideY = b.y + b.h + 55;

  if (
    outsideBlocked(
      outsideX,
      outsideY,
      player.r
    )
  ) {
    return;
  }

  player.x = outsideX;
  player.y = outsideY;

  mode = "outside";
  currentBuilding = null;
  interiorFurniture = [];
}

/* =========================================================
   CARS INTERACTION
========================================================= */

function nearestCar() {
  let result = null;
  let best = 75;

  for (const car of cars) {
    const d = Math.hypot(
      player.x - car.x,
      player.y - car.y
    );

    if (d < best) {
      best = d;
      result = car;
    }
  }

  return result;
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
  const car = player.car;

  if (!car) return;

  const spots = [
    { x: car.x + 70, y: car.y },
    { x: car.x - 70, y: car.y },
    { x: car.x, y: car.y + 70 },
    { x: car.x, y: car.y - 70 }
  ];

  for (const p of spots) {
    if (
      !outsideBlocked(
        p.x,
        p.y,
        player.r,
        car
      )
    ) {
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

  const building = nearDoor();

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

const joystickEl =
  document.getElementById("joystick");

const stickEl =
  document.getElementById("joystick-stick");

function updateJoystick(x, y) {
  const rect =
    joystickEl.getBoundingClientRect();

  const cx =
    rect.left + rect.width / 2;

  const cy =
    rect.top + rect.height / 2;

  let dx = x - cx;
  let dy = y - cy;

  const max = rect.width * 0.32;

  const length =
    Math.hypot(dx, dy);

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

joystickEl.addEventListener(
  "pointerdown",
  e => {
    joystick.active = true;

    try {
      joystickEl.setPointerCapture(
        e.pointerId
      );
    } catch {}

    updateJoystick(
      e.clientX,
      e.clientY
    );
  }
);

joystickEl.addEventListener(
  "pointermove",
  e => {
    if (!joystick.active) return;

    updateJoystick(
      e.clientX,
      e.clientY
    );
  }
);

joystickEl.addEventListener(
  "pointerup",
  resetJoystick
);

joystickEl.addEventListener(
  "pointercancel",
  resetJoystick
);

joystickEl.addEventListener(
  "lostpointercapture",
  resetJoystick
);

/* =========================================================
   BUTTONS
========================================================= */

document
  .getElementById("interact")
  .addEventListener(
    "pointerdown",
    e => {
      e.preventDefault();
      interact();
    }
  );

document
  .getElementById("fullscreen")
  .addEventListener(
    "click",
    async () => {
      try {
        await document.documentElement.requestFullscreen();

        if (
          screen.orientation &&
          screen.orientation.lock
        ) {
          await screen.orientation.lock(
            "landscape"
          );
        }
      } catch {}
    }
  );

/* =========================================================
   INPUT VECTOR
========================================================= */

function getInput() {
  let x = joystick.x;
  let y = joystick.y;

  if (
    keys["w"] ||
    keys["arrowup"]
  ) {
    y -= 1;
  }

  if (
    keys["s"] ||
    keys["arrowdown"]
  ) {
    y += 1;
  }

  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {
    x -= 1;
  }

  if (
    keys["d"] ||
    keys["arrowright"]
  ) {
    x += 1;
  }

  const len = Math.hypot(x, y);

  if (len > 1) {
    x /= len;
    y /= len;
  }

  return { x, y };
}

/* =========================================================
   ZOMBIES
========================================================= */

function zombieBlocked(x, y, r) {
  return outsideBlocked(x, y, r);
}

function updateZombies() {
  if (mode !== "outside") return;

  for (const z of zombies) {
    const dx = player.x - z.x;
    const dy = player.y - z.y;

    const d = Math.hypot(dx, dy);

    if (d > 550 || d < 1) {
      continue;
    }

    const vx =
      dx / d * z.speed;

    const vy =
      dy / d * z.speed;

    // direct
    if (
      !zombieBlocked(
        z.x + vx,
        z.y + vy,
        z.r
      )
    ) {
      z.x += vx;
      z.y += vy;
      continue;
    }

    // horizontal
    if (
      !zombieBlocked(
        z.x + vx,
        z.y,
        z.r
      )
    ) {
      z.x += vx;
    }

    // vertical
    if (
      !zombieBlocked(
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
   CAMERA
========================================================= */

function updateCamera() {
  camera.x +=
    (player.x - camera.x) * 0.08;

  camera.y +=
    (player.y - camera.y) * 0.08;

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
   DRAW GROUND
========================================================= */

function drawGround() {
  ctx.fillStyle = "#3e513c";
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.strokeStyle =
    "rgba(20,30,20,0.14)";

  ctx.lineWidth = 1;

  for (
    let x = 0;
    x < W;
    x += 70
  ) {
    for (
      let y = 0;
      y < H;
      y += 70
    ) {
      ctx.beginPath();

      ctx.moveTo(x, y);
      ctx.lineTo(
        x + 8,
        y + 4
      );

      ctx.stroke();
    }
  }
}

/* =========================================================
   DRAW ROADS
========================================================= */

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#303235";

    ctx.fillRect(
      r.x,
      r.y,
      r.w,
      r.h
    );

    ctx.fillStyle = "#55575a";

    if (r.w > r.h) {
      ctx.fillRect(
        r.x,
        r.y,
        r.w,
        8
      );

      ctx.fillRect(
        r.x,
        r.y + r.h - 8,
        r.w,
        8
      );

      ctx.strokeStyle = "#c5b969";
      ctx.lineWidth = 5;
      ctx.setLineDash([
        36,
        30
      ]);

      ctx.beginPath();

      ctx.moveTo(
        r.x,
        r.y + r.h / 2
      );

      ctx.lineTo(
        r.x + r.w,
        r.y + r.h / 2
      );

      ctx.stroke();

      ctx.setLineDash([]);
    } else {
      ctx.fillRect(
        r.x,
        r.y,
        8,
        r.h
      );

      ctx.fillRect(
        r.x + r.w - 8,
        r.y,
        8,
        r.h
      );

      ctx.strokeStyle = "#c5b969";
      ctx.lineWidth = 5;
      ctx.setLineDash([
        36,
        30
      ]);

      ctx.beginPath();

      ctx.moveTo(
        r.x + r.w / 2,
        r.y
      );

      ctx.lineTo(
        r.x + r.w / 2,
        r.y + r.h
      );

      ctx.stroke();

      ctx.setLineDash([]);
    }
  }
}

/* =========================================================
   BUILDING DRAW
========================================================= */

function drawBuilding(b) {
  ctx.fillStyle =
    "rgba(0,0,0,0.30)";

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

  ctx.fillStyle = "#353835";

  ctx.fillRect(
    b.x - 8,
    b.y - 10,
    b.w + 16,
    18
  );

  // windows
  ctx.fillStyle = "#26383a";

  const cols =
    Math.max(
      2,
      Math.floor(b.w / 90)
    );

  const spacing =
    b.w / (cols + 1);

  for (
    let i = 1;
    i <= cols;
    i++
  ) {
    ctx.fillRect(
      b.x + spacing * i - 17,
      b.y + 32,
      34,
      42
    );
  }

  // door
  const d = getDoor(b);

  ctx.fillStyle = "#34271e";

  ctx.fillRect(
    d.x - 20,
    b.y + b.h - 54,
    40,
    54
  );

  ctx.fillStyle = "#b29b5d";

  ctx.beginPath();

  ctx.arc(
    d.x + 11,
    b.y + b.h - 27,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

/* =========================================================
   TREE DRAW
========================================================= */

function drawTree(t) {
  ctx.fillStyle =
    "rgba(0,0,0,0.30)";

  ctx.beginPath();

  ctx.ellipse(
    t.x,
    t.y + 22,
    27,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#59432d";

  ctx.fillRect(
    t.x - 7,
    t.y - 2,
    14,
    32
  );

  ctx.fillStyle = "#29472f";

  ctx.beginPath();

  ctx.arc(
    t.x,
    t.y - 20,
    t.r,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#365c3b";

  ctx.beginPath();

  ctx.arc(
    t.x - 13,
    t.y - 10,
    19,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    t.x + 13,
    t.y - 11,
    19,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

/* =========================================================
   CAR DRAW
========================================================= */

function drawCar(car) {
  ctx.save();

  ctx.translate(
    car.x,
    car.y
  );

  ctx.rotate(
    car.angle
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.35)";

  ctx.fillRect(
    -car.w / 2 + 5,
    -car.h / 2 + 7,
    car.w,
    car.h
  );

  ctx.fillStyle =
    car.color;

  ctx.fillRect(
    -car.w / 2,
    -car.h / 2,
    car.w,
    car.h
  );

  // windows
  ctx.fillStyle = "#1b2528";

  ctx.fillRect(
    -18,
    -car.h / 2 + 5,
    36,
    14
  );

  // headlights
  ctx.fillStyle = "#ddd39d";

  ctx.fillRect(
    car.w / 2 - 7,
    -car.h / 2 + 6,
    5,
    9
  );

  ctx.fillRect(
    car.w / 2 - 7,
    car.h / 2 - 15,
    5,
    9
  );

  // wheels
  ctx.fillStyle = "#151515";

  ctx.fillRect(
    -car.w / 2 + 12,
    -car.h / 2 - 3,
    17,
    7
  );

  ctx.fillRect(
    -car.w / 2 + 12,
    car.h / 2 - 4,
    17,
    7
  );

  ctx.fillRect(
    car.w / 2 - 29,
    -car.h / 2 - 3,
    17,
    7
  );

  ctx.fillRect(
    car.w / 2 - 29,
    car.h / 2 - 4,
    17,
    7
  );

  ctx.restore();
}

/* =========================================================
   ZOMBIE DRAW
========================================================= */

function drawZombie(z) {
  ctx.save();

  ctx.translate(
    z.x,
    z.y
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.3)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    14,
    13,
    6,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#596954";

  ctx.fillRect(
    -9,
    -3,
    18,
    24
  );

  ctx.fillStyle = "#89927b";

  ctx.beginPath();

  ctx.arc(
    0,
    -14,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#1b1e1a";

  ctx.fillRect(
    -5,
    -16,
    3,
    3
  );

  ctx.fillRect(
    2,
    -16,
    3,
    3
  );

  ctx.restore();
}

/* =========================================================
   PLAYER DRAW
========================================================= */

function drawPlayer() {
  if (player.inCar) return;

  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.4)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    18,
    16,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // STATIC LEGS
  ctx.fillStyle = "#1c2525";

  ctx.fillRect(
    -9,
    4,
    7,
    18
  );

  ctx.fillRect(
    2,
    4,
    7,
    18
  );

  // body
  ctx.fillStyle = "#394345";

  ctx.fillRect(
    -11,
    -13,
    22,
    23
  );

  // backpack
  ctx.fillStyle = "#222b28";

  ctx.fillRect(
    -14,
    -10,
    5,
    19
  );

  // head
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

  ctx.restore();
}

/* =========================================================
   INTERIOR DRAW
========================================================= */

function drawInterior() {
  const b = currentBuilding;

  if (!b) return;

  ctx.fillStyle = "#5b564d";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  ctx.strokeStyle = "#292b28";
  ctx.lineWidth = 18;

  ctx.strokeRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  for (const f of interiorFurniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#392f28";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#8a8274";

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
      ctx.fillStyle = "#484b47";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }
  }

  // door
  ctx.fillStyle = "#aa8d55";

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

  ctx.fillStyle =
    "rgba(0,0,0,0.62)";

  ctx.fillRect(
    18,
    18,
    285,
    108
  );

  ctx.fillStyle = "#fff";

  ctx.font =
    "bold 20px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    32,
    45
  );

  ctx.font =
    "bold 15px Arial";

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

  const totalMinutes =
    Math.floor(
      performance.now() / 1000 / 4
    ) % 1440;

  const hour =
    Math.floor(totalMinutes / 60);

  const minute =
    totalMinutes % 60;

  ctx.fillStyle = "#fff";

  ctx.fillText(
    `DAY 1   ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    32,
    118
  );

  ctx.textAlign = "right";

  if (player.inCar) {
    ctx.fillText(
      "VEHICLE",
      canvas.width - 25,
      35
    );
  }

  if (mode === "interior") {
    ctx.fillText(
      "INDOORS",
      canvas.width - 25,
      60
    );
  }

  ctx.restore();
}

/* =========================================================
   PROMPT
========================================================= */

function drawPrompt() {
  let text = "";

  if (mode === "interior") {
    const b = currentBuilding;

    if (b) {
      const d = getDoor(b);

      const distance =
        Math.hypot(
          player.x - d.x,
          player.y - (b.y + b.h - 35)
        );

      if (distance < 65) {
        text = "INTERACT  •  EXIT";
      }
    }
  } else if (player.inCar) {
    text =
      "INTERACT  •  EXIT VEHICLE";
  } else {
    const car = nearestCar();

    if (car) {
      text =
        "INTERACT  •  ENTER VEHICLE";
    } else if (nearDoor()) {
      text =
        "INTERACT  •  ENTER BUILDING";
    }
  }

  if (!text) return;

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,0.72)";

  ctx.fillRect(
    canvas.width / 2 - 150,
    canvas.height - 62,
    300,
    40
  );

  ctx.fillStyle = "#fff";

  ctx.font =
    "bold 14px Arial";

  ctx.textAlign = "center";

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height - 37
  );

  ctx.restore();
}

/* =========================================================
   UPDATE
========================================================= */

function update(dt) {
  const input = getInput();

  if (mode === "outside") {
    if (player.inCar) {
      const speed = 5.2;

      moveCar(
        input.x * speed,
        input.y * speed
      );

      if (
        Math.hypot(
          input.x,
          input.y
        ) > 0.15
      ) {
        player.car.angle =
          Math.atan2(
            input.y,
            input.x
          );
      }
    } else {
      movePlayer(
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

  player.hunger -=
    dt * 0.0007;

  if (player.hunger < 0) {
    player.hunger = 0;
  }

  if (player.hunger <= 0) {
    player.hp -=
      dt * 0.0015;
  }

  player.hp =
    clamp(
      player.hp,
      0,
      100
    );

  updateCamera();
}

/* =========================================================
   DRAW
========================================================= */

function draw() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.save();

  ctx.translate(
    Math.round(
      canvas.width / 2 - camera.x
    ),
    Math.round(
      canvas.height / 2 - camera.y
    )
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

    for (const car of cars) {
      drawCar(car);
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

/* =========================================================
   LOOP
========================================================= */

function loop(now) {
  const dt =
    Math.min(
      50,
      now - lastTime
    );

  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

/* =========================================================
   START
========================================================= */

requestAnimationFrame(loop);