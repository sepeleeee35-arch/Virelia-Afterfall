const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 4200;
const H = 3000;

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
  x: 900,
  y: 500,
  r: 15,
  speed: 3.4,
  hp: 100,
  hunger: 100,
  inCar: false,
  car: null
};

const camera = {
  x: player.x,
  y: player.y
};

let interiorPlayer = {
  x: 500,
  y: 560,
  r: 15
};

/* =========================================================
   CITY
========================================================= */

const roads = [
  { x: 0, y: 380, w: W, h: 210 },
  { x: 0, y: 1120, w: W, h: 210 },
  { x: 0, y: 1870, w: W, h: 210 },
  { x: 0, y: 2620, w: W, h: 210 },

  { x: 470, y: 0, w: 210, h: H },
  { x: 1660, y: 0, w: 210, h: H },
  { x: 2850, y: 0, w: 210, h: H },
  { x: 4040, y: 0, w: 160, h: H }
];

/* =========================================================
   BLOCKS
========================================================= */

const blocks = [
  { x: 45, y: 45, w: 370, h: 290 },
  { x: 735, y: 45, w: 870, h: 290 },
  { x: 1925, y: 45, w: 870, h: 290 },
  { x: 3115, y: 45, w: 850, h: 290 },

  { x: 45, y: 650, w: 370, h: 420 },
  { x: 735, y: 650, w: 870, h: 420 },
  { x: 1925, y: 650, w: 870, h: 420 },
  { x: 3115, y: 650, w: 850, h: 420 },

  { x: 45, y: 1390, w: 370, h: 430 },
  { x: 735, y: 1390, w: 870, h: 430 },
  { x: 1925, y: 1390, w: 870, h: 430 },
  { x: 3115, y: 1390, w: 850, h: 430 },

  { x: 45, y: 2140, w: 370, h: 430 },
  { x: 735, y: 2140, w: 870, h: 430 },
  { x: 1925, y: 2140, w: 870, h: 430 },
  { x: 3115, y: 2140, w: 850, h: 430 }
];

/* =========================================================
   HELPERS
========================================================= */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pointInRect(x, y, r) {
  return (
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function rectOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w + padding < b.x ||
    a.x - padding > b.x + b.w ||
    a.y + a.h + padding < b.y ||
    a.y - padding > b.y + b.h
  );
}

function circleRect(cx, cy, radius, rect) {
  const px = clamp(cx, rect.x, rect.x + rect.w);
  const py = clamp(cy, rect.y, rect.y + rect.h);

  const dx = cx - px;
  const dy = cy - py;

  return dx * dx + dy * dy < radius * radius;
}

/* =========================================================
   BUILDINGS
========================================================= */

const buildings = [];

function touchesRoad(rect, padding = 0) {
  return roads.some(r =>
    rectOverlap(rect, r, padding)
  );
}

function touchesBuilding(rect, padding = 20) {
  return buildings.some(b =>
    rectOverlap(rect, b, padding)
  );
}

function addBuilding(x, y, w, h, type = "house") {
  const b = {
    x,
    y,
    w,
    h,
    type,
    color: [
      "#77746c",
      "#696d68",
      "#706e68",
      "#626761",
      "#807a70"
    ][buildings.length % 5]
  };

  if (touchesRoad(b, 8)) return false;
  if (touchesBuilding(b, 18)) return false;

  buildings.push(b);
  return true;
}

/*
  Bangunan dibuat manual per blok.
  Tidak ada lagi bangunan besar tambahan yang
  ditumpuk di atas bangunan lain.
*/

for (const block of blocks) {
  const margin = 55;

  if (block.w >= 800) {
    addBuilding(
      block.x + margin,
      block.y + margin,
      Math.min(330, block.w - 120),
      Math.min(210, block.h - 110)
    );

    addBuilding(
      block.x + block.w - 390,
      block.y + block.h - 265,
      330,
      210
    );
  } else {
    addBuilding(
      block.x + margin,
      block.y + margin,
      block.w - margin * 2,
      Math.min(220, block.h - margin * 2)
    );
  }
}

/* =========================================================
   TREES
========================================================= */

const trees = [];

function addTree(x, y) {
  if (pointInRoad(x, y)) return;

  const test = {
    x: x - 28,
    y: y - 28,
    w: 56,
    h: 56
  };

  if (touchesBuilding(test, 15)) return;

  for (const t of trees) {
    if (Math.hypot(t.x - x, t.y - y) < 75) {
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
  addTree(block.x + 30, block.y + 30);
  addTree(
    block.x + block.w - 30,
    block.y + 30
  );
  addTree(
    block.x + 30,
    block.y + block.h - 30
  );
  addTree(
    block.x + block.w - 30,
    block.y + block.h - 30
  );
}

/* =========================================================
   CARS
========================================================= */

const cars = [
  { x: 250, y: 485, w: 86, h: 44, color: "#9a3030", angle: 0 },
  { x: 1000, y: 485, w: 86, h: 44, color: "#3d4850", angle: 0 },
  { x: 2200, y: 485, w: 86, h: 44, color: "#a18f36", angle: 0 },
  { x: 3350, y: 485, w: 86, h: 44, color: "#52616b", angle: 0 },

  { x: 575, y: 820, w: 86, h: 44, color: "#813535", angle: Math.PI / 2 },
  { x: 1765, y: 900, w: 86, h: 44, color: "#454e54", angle: Math.PI / 2 },
  { x: 2955, y: 830, w: 86, h: 44, color: "#77713e", angle: Math.PI / 2 },

  { x: 1050, y: 1225, w: 86, h: 44, color: "#56636a", angle: 0 },
  { x: 2300, y: 1225, w: 86, h: 44, color: "#883838", angle: 0 },

  { x: 575, y: 1600, w: 86, h: 44, color: "#414a50", angle: Math.PI / 2 },
  { x: 1765, y: 1720, w: 86, h: 44, color: "#85733a", angle: Math.PI / 2 },
  { x: 2955, y: 1600, w: 86, h: 44, color: "#704848", angle: Math.PI / 2 },

  { x: 1050, y: 1980, w: 86, h: 44, color: "#59666d", angle: 0 },
  { x: 2300, y: 1980, w: 86, h: 44, color: "#7f3737", angle: 0 },

  { x: 1050, y: 2725, w: 86, h: 44, color: "#4e5b62", angle: 0 },
  { x: 2300, y: 2725, w: 86, h: 44, color: "#875151", angle: 0 }
];

for (const car of cars) {
  car.occupied = false;
}

/* =========================================================
   COLLISION
========================================================= */

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
      Math.hypot(x - t.x, y - t.y) <
      r + t.r * 0.72
    ) {
      return true;
    }
  }

  return false;
}

function carCollision(x, y, r, ignore = null) {
  for (const car of cars) {
    if (car === ignore) continue;

    if (
      Math.hypot(
        x - car.x,
        y - car.y
      ) < r + 48
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

  if (buildingCollision(x, y, r)) return true;
  if (treeCollision(x, y, r)) return true;
  if (carCollision(x, y, r, ignoreCar)) return true;

  return false;
}

/* =========================================================
   SAFE SPAWN
========================================================= */

function findSafeSpawn() {
  const candidates = [
    { x: 900, y: 500 },
    { x: 1250, y: 500 },
    { x: 1500, y: 500 },
    { x: 2100, y: 500 },
    { x: 2500, y: 500 },
    { x: 3200, y: 500 },
    { x: 900, y: 1450 },
    { x: 1200, y: 1950 }
  ];

  for (const p of candidates) {
    if (!outsideBlocked(p.x, p.y, 20)) {
      return p;
    }
  }

  return {
    x: 900,
    y: 500
  };
}

const safeSpawn = findSafeSpawn();

player.x = safeSpawn.x;
player.y = safeSpawn.y;

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [];

function spawnZombie(x, y) {
  if (
    outsideBlocked(x, y, 18)
  ) {
    return false;
  }

  zombies.push({
    x,
    y,
    r: 14,
    speed: 0.55 + Math.random() * 0.2
  });

  return true;
}

const zombieSpawns = [
  [250, 485],
  [1300, 485],
  [2400, 485],
  [3400, 485],
  [1000, 1225],
  [2300, 1225],
  [1050, 1980],
  [2400, 1980],
  [1200, 2725],
  [3000, 2725]
];

for (const [x, y] of zombieSpawns) {
  spawnZombie(x + 35, y + 35);
}

/* =========================================================
   INTERIOR SYSTEM
========================================================= */

const INTERIOR = {
  w: 1000,
  h: 700
};

let interiorFurniture = [];

function createInterior(b) {
  interiorFurniture = [];

  const items = [
    {
      x: 110,
      y: 100,
      w: 180,
      h: 80,
      type: "bed"
    },
    {
      x: 700,
      y: 100,
      w: 150,
      h: 90,
      type: "cabinet"
    },
    {
      x: 130,
      y: 330,
      w: 150,
      h: 100,
      type: "table"
    },
    {
      x: 650,
      y: 330,
      w: 210,
      h: 90,
      type: "sofa"
    },
    {
      x: 390,
      y: 180,
      w: 170,
      h: 80,
      type: "table"
    }
  ];

  interiorFurniture = items;
}

function interiorBlocked(x, y, r) {
  if (
    x < r + 25 ||
    y < r + 25 ||
    x > INTERIOR.w - r - 25 ||
    y > INTERIOR.h - r - 25
  ) {
    return true;
  }

  /*
    Bagian bawah tengah adalah KORIDOR PINTU.
    Furniture tidak pernah dipasang di sini.
  */

  for (const f of interiorFurniture) {
    if (circleRect(x, y, r, f)) {
      return true;
    }
  }

  return false;
}

function moveInterior(dx, dy) {
  const nx = interiorPlayer.x + dx;
  const ny = interiorPlayer.y + dy;

  if (
    !interiorBlocked(
      nx,
      interiorPlayer.y,
      interiorPlayer.r
    )
  ) {
    interiorPlayer.x = nx;
  }

  if (
    !interiorBlocked(
      interiorPlayer.x,
      ny,
      interiorPlayer.r
    )
  ) {
    interiorPlayer.y = ny;
  }
}

/* =========================================================
   DOORS
========================================================= */

function getDoor(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h + 10
  };
}

function nearDoor() {
  if (mode !== "outside") return null;

  let result = null;
  let best = 65;

  for (const b of buildings) {
    const d = getDoor(b);

    const distance = Math.hypot(
      player.x - d.x,
      player.y - d.y
    );

    if (distance < best) {
      best = distance;
      result = b;
    }
  }

  return result;
}

function enterBuilding(b) {
  currentBuilding = b;
  mode = "interior";

  createInterior(b);

  interiorPlayer.x = INTERIOR.w / 2;
  interiorPlayer.y = INTERIOR.h - 90;
}

function exitBuilding() {
  if (!currentBuilding) return;

  /*
    EXIT HANYA dari pintu.
  */

  const doorX = INTERIOR.w / 2;
  const doorY = INTERIOR.h - 65;

  const distance = Math.hypot(
    interiorPlayer.x - doorX,
    interiorPlayer.y - doorY
  );

  if (distance > 70) {
    return;
  }

  const outsideDoor = getDoor(currentBuilding);

  const exitX = outsideDoor.x;
  const exitY =
    currentBuilding.y +
    currentBuilding.h +
    65;

  if (
    outsideBlocked(
      exitX,
      exitY,
      player.r
    )
  ) {
    return;
  }

  player.x = exitX;
  player.y = exitY;

  mode = "outside";
  currentBuilding = null;
  interiorFurniture = [];
}

/* =========================================================
   CARS
========================================================= */

function nearestCar() {
  let result = null;
  let best = 68;

  for (const car of cars) {
    if (car.occupied) continue;

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

  /*
    Jangan masuk kalau ada zombie tepat di mobil.
  */

  for (const z of zombies) {
    if (
      Math.hypot(
        z.x - car.x,
        z.y - car.y
      ) < 70
    ) {
      return;
    }
  }

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
    { x: car.x + 72, y: car.y },
    { x: car.x - 72, y: car.y },
    { x: car.x, y: car.y + 72 },
    { x: car.x, y: car.y - 72 }
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
   INTERACTION
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
   PLAYER MOVEMENT
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
   VEHICLE MOVEMENT
========================================================= */

function moveCar(dx, dy) {
  const car = player.car;

  if (!car) return;

  const nx = car.x + dx;
  const ny = car.y + dy;

  /*
    MOBIL SEKARANG TIDAK BISA MENEMBUS:
    - mobil lain
    - bangunan
    - pohon
    - batas map
  */

  if (
    outsideBlocked(
      nx,
      ny,
      48,
      car
    )
  ) {
    return;
  }

  car.x = nx;
  car.y = ny;

  if (
    Math.hypot(dx, dy) > 0.1
  ) {
    car.angle =
      Math.atan2(dy, dx);
  }

  player.x = car.x;
  player.y = car.y;
}

/* =========================================================
   ZOMBIE AI
========================================================= */

function zombieBlocked(x, y, r) {
  return outsideBlocked(x, y, r);
}

function updateZombies() {
  if (mode !== "outside") return;

  for (const z of zombies) {
    const targetX = player.x;
    const targetY = player.y;

    const dx = targetX - z.x;
    const dy = targetY - z.y;

    const distance = Math.hypot(dx, dy);

    if (
      distance > 650 ||
      distance < 1
    ) {
      continue;
    }

    let vx =
      dx / distance * z.speed;

    let vy =
      dy / distance * z.speed;

    /*
      Kalau player sedang di mobil,
      zombie tetap mengejar tetapi MOBIL
      dianggap benda padat.
    */

    const tryX = z.x + vx;
    const tryY = z.y + vy;

    if (
      !zombieBlocked(
        tryX,
        tryY,
        z.r
      )
    ) {
      z.x = tryX;
      z.y = tryY;
      continue;
    }

    /*
      Coba belok 90 derajat.
      Ini mengurangi zombie nyangkut di
      sudut bangunan/mobil.
    */

    const sideX = -vy;
    const sideY = vx;

    if (
      !zombieBlocked(
        z.x + sideX,
        z.y + sideY,
        z.r
      )
    ) {
      z.x += sideX;
      z.y += sideY;
      continue;
    }

    if (
      !zombieBlocked(
        z.x - sideX,
        z.y - sideY,
        z.r
      )
    ) {
      z.x -= sideX;
      z.y -= sideY;
    }
  }
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera(input) {
  if (mode === "interior") {
    camera.x +=
      (interiorPlayer.x - camera.x) * 0.12;

    camera.y +=
      (interiorPlayer.y - camera.y) * 0.12;

    return;
  }

  /*
    Kamera melihat sedikit ke arah gerakan.
    Ini bikin rasa third-person lebih kuat.
  */

  const lookX =
    player.x + input.x * 180;

  const lookY =
    player.y + input.y * 130;

  camera.x +=
    (lookX - camera.x) * 0.09;

  camera.y +=
    (lookY - camera.y) * 0.09;

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
  ctx.fillStyle = "#3d513b";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.strokeStyle =
    "rgba(20,30,20,0.12)";

  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += 80) {
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 7, y + 4);
      ctx.stroke();
    }
  }
}

/* =========================================================
   DRAW ROADS
========================================================= */

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#303236";

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

      ctx.strokeStyle = "#c8bc68";
      ctx.lineWidth = 5;
      ctx.setLineDash([36, 30]);

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

      ctx.strokeStyle = "#c8bc68";
      ctx.lineWidth = 5;
      ctx.setLineDash([36, 30]);

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
   BUILDING
========================================================= */

function drawBuilding(b) {
  ctx.fillStyle =
    "rgba(0,0,0,0.32)";

  ctx.fillRect(
    b.x + 14,
    b.y + 16,
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

  ctx.fillStyle = "#383a36";

  ctx.fillRect(
    b.x - 7,
    b.y - 9,
    b.w + 14,
    17
  );

  /* windows */

  ctx.fillStyle = "#26383b";

  const cols =
    Math.max(
      2,
      Math.floor(b.w / 90)
    );

  const gap =
    b.w / (cols + 1);

  for (
    let i = 1;
    i <= cols;
    i++
  ) {
    ctx.fillRect(
      b.x + gap * i - 17,
      b.y + 30,
      34,
      42
    );
  }

  /* door */

  const d = getDoor(b);

  ctx.fillStyle = "#3a2a20";

  ctx.fillRect(
    d.x - 22,
    b.y + b.h - 55,
    44,
    55
  );

  ctx.fillStyle = "#d0ad5c";

  ctx.beginPath();

  ctx.arc(
    d.x + 12,
    b.y + b.h - 27,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

/* =========================================================
   TREE
========================================================= */

function drawTree(t) {
  ctx.fillStyle =
    "rgba(0,0,0,0.28)";

  ctx.beginPath();

  ctx.ellipse(
    t.x,
    t.y + 24,
    28,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#5a432c";

  ctx.fillRect(
    t.x - 7,
    t.y - 2,
    14,
    32
  );

  ctx.fillStyle = "#29482f";

  ctx.beginPath();

  ctx.arc(
    t.x,
    t.y - 20,
    t.r,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#365d3c";

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
    t.y - 10,
    19,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

/* =========================================================
   CAR
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
    -car.w / 2 + 6,
    -car.h / 2 + 8,
    car.w,
    car.h
  );

  ctx.fillStyle = car.color;

  ctx.fillRect(
    -car.w / 2,
    -car.h / 2,
    car.w,
    car.h
  );

  /* windshield */

  ctx.fillStyle = "#182326";

  ctx.fillRect(
    -15,
    -car.h / 2 + 5,
    30,
    14
  );

  ctx.fillRect(
    -15,
    car.h / 2 - 19,
    30,
    14
  );

  /* headlights */

  ctx.fillStyle = "#e1d69a";

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

  /* wheels */

  ctx.fillStyle = "#141414";

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
   ZOMBIE
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

  ctx.fillStyle = "#566652";

  ctx.fillRect(
    -9,
    -3,
    18,
    24
  );

  ctx.fillStyle = "#8b967e";

  ctx.beginPath();

  ctx.arc(
    0,
    -14,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#1a1d19";

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
   PLAYER
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
    17,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* static legs */

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

  /* body */

  ctx.fillStyle = "#394447";

  ctx.fillRect(
    -11,
    -13,
    22,
    23
  );

  /* backpack */

  ctx.fillStyle = "#222b28";

  ctx.fillRect(
    -14,
    -10,
    5,
    19
  );

  /* head */

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
  ctx.fillStyle = "#686158";

  ctx.fillRect(
    0,
    0,
    INTERIOR.w,
    INTERIOR.h
  );

  /* floor tiles */

  ctx.strokeStyle =
    "rgba(30,30,25,0.15)";

  ctx.lineWidth = 2;

  for (
    let x = 0;
    x < INTERIOR.w;
    x += 50
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, INTERIOR.h);
    ctx.stroke();
  }

  for (
    let y = 0;
    y < INTERIOR.h;
    y += 50
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(INTERIOR.w, y);
    ctx.stroke();
  }

  /* walls */

  ctx.strokeStyle = "#292b28";
  ctx.lineWidth = 28;

  ctx.strokeRect(
    15,
    15,
    INTERIOR.w - 30,
    INTERIOR.h - 30
  );

  /* furniture */

  for (const f of interiorFurniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#3a3029";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#9b9589";
      ctx.fillRect(
        f.x + 10,
        f.y + 10,
        f.w - 20,
        f.h - 20
      );
    }

    if (f.type === "cabinet") {
      ctx.fillStyle = "#332923";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#8b7452";

      ctx.fillRect(
        f.x + 15,
        f.y + 20,
        f.w - 30,
        5
      );

      ctx.fillRect(
        f.x + 15,
        f.y + 50,
        f.w - 30,
        5
      );
    }

    if (f.type === "table") {
      ctx.fillStyle = "#4b3526";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#76583e";

      ctx.fillRect(
        f.x + 12,
        f.y + 12,
        f.w - 24,
        f.h - 24
      );
    }

    if (f.type === "sofa") {
      ctx.fillStyle = "#464b48";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#5c625d";

      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        30
      );
    }
  }

  /* entrance door */

  ctx.fillStyle = "#b49b5e";

  ctx.fillRect(
    INTERIOR.w / 2 - 35,
    INTERIOR.h - 18,
    70,
    18
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
    290,
    110
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

  ctx.fillStyle = "#dc5555";

  ctx.fillText(
    `HP ${Math.round(player.hp)}`,
    32,
    72
  );

  ctx.fillStyle = "#d5bb4e";

  ctx.fillText(
    `HUNGER ${Math.round(player.hunger)}`,
    32,
    96
  );

  ctx.fillStyle = "#fff";

  const minutes =
    Math.floor(
      performance.now() / 1000 / 4
    ) % 1440;

  const hour =
    Math.floor(minutes / 60);

  const minute =
    minutes % 60;

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
    const distance =
      Math.hypot(
        interiorPlayer.x - INTERIOR.w / 2,
        interiorPlayer.y - (INTERIOR.h - 65)
      );

    if (distance < 75) {
      text =
        "INTERACT  •  EXIT";
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
    canvas.width / 2 - 155,
    canvas.height - 62,
    310,
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
      moveCar(
        input.x * 5.4,
        input.y * 5.4
      );
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
    dt * 0.00065;

  player.hunger =
    clamp(
      player.hunger,
      0,
      100
    );

  if (player.hunger <= 0) {
    player.hp -=
      dt * 0.0013;
  }

  player.hp =
    clamp(
      player.hp,
      0,
      100
    );

  updateCamera(input);
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

  if (mode === "outside") {
    ctx.translate(
      Math.round(
        canvas.width / 2 - camera.x
      ),
      Math.round(
        canvas.height / 2 - camera.y
      )
    );

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
    /*
      Interior punya dunia sendiri.
      Jadi tidak mungkin player "kabur"
      lewat sisi bangunan.
    */

    ctx.translate(
      canvas.width / 2 -
        interiorPlayer.x,
      canvas.height / 2 -
        interiorPlayer.y
    );

    drawInterior();

    ctx.save();

    ctx.translate(
      interiorPlayer.x,
      interiorPlayer.y
    );

    ctx.fillStyle =
      "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
      0,
      18,
      17,
      8,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

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

    ctx.fillStyle = "#394447";

    ctx.fillRect(
      -11,
      -13,
      22,
      23
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

requestAnimationFrame(loop);