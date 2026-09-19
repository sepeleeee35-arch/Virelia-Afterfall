const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const W = 3600;
const H = 2600;

let lastTime = performance.now();
let mode = "outside";
let currentBuilding = null;

const keys = {};

const joystick = {
  active: false,
  x: 0,
  y: 0
};

/* =========================================================
   PLAYER
========================================================= */

const player = {
  x: 900,
  y: 520,
  r: 15,
  speed: 3.4,
  hp: 100,
  hunger: 100,
  inCar: false,
  car: null
};

/* =========================================================
   CAMERA
========================================================= */

const camera = {
  x: player.x,
  y: player.y
};

/* =========================================================
   ROADS
   Semua jalan ditentukan dulu.
========================================================= */

const roads = [
  // horizontal
  { x: 0, y: 380, w: W, h: 210 },
  { x: 0, y: 1120, w: W, h: 210 },
  { x: 0, y: 1860, w: W, h: 210 },

  // vertical
  { x: 480, y: 0, w: 210, h: H },
  { x: 1695, y: 0, w: 210, h: H },
  { x: 2910, y: 0, w: 210, h: H }
];

/* =========================================================
   BUILDINGS
   MANUAL LAYOUT.
   Tidak ada auto-generate yang bisa numpuk.
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
      "#77756d",
      "#696c67",
      "#817b70",
      "#626762",
      "#706d66"
    ][buildings.length % 5]
  });
}

/*
  BLOCK 1
*/

addBuilding(55, 55, 300, 240, "house");

/*
  BLOCK 2
*/

addBuilding(750, 55, 350, 250, "house");
addBuilding(1190, 70, 380, 230, "shop");

/*
  BLOCK 3
*/

addBuilding(1950, 55, 350, 250, "house");
addBuilding(2420, 70, 350, 230, "house");

/*
  BLOCK 4
*/

addBuilding(3135, 60, 350, 240, "house");

/*
  BLOCK 5
*/

addBuilding(60, 650, 330, 340, "house");

/*
  BLOCK 6
*/

addBuilding(750, 650, 350, 300, "house");
addBuilding(1200, 680, 360, 300, "shop");

/*
  BLOCK 7
   SATU bangunan besar.
   Tidak ada bangunan lain di kavling ini.
*/

addBuilding(1980, 660, 690, 340, "large");

/*
  BLOCK 8
*/

addBuilding(3140, 660, 330, 300, "house");

/*
  BLOCK 9
*/

addBuilding(60, 1390, 330, 330, "house");

/*
  BLOCK 10
*/

addBuilding(750, 1390, 370, 300, "house");
addBuilding(1200, 1420, 350, 280, "shop");

/*
  BLOCK 11
*/

addBuilding(1960, 1390, 350, 300, "house");
addBuilding(2440, 1410, 340, 290, "house");

/*
  BLOCK 12
*/

addBuilding(3140, 1390, 330, 300, "house");

/*
  BLOCK 13
*/

addBuilding(60, 2150, 330, 320, "house");

/*
  BLOCK 14
*/

addBuilding(750, 2140, 380, 320, "house");
addBuilding(1210, 2160, 340, 290, "shop");

/*
  BLOCK 15
*/

addBuilding(1960, 2140, 370, 320, "house");
addBuilding(2450, 2160, 330, 290, "house");

/*
  BLOCK 16
*/

addBuilding(3140, 2140, 330, 320, "house");

/* =========================================================
   GEOMETRY HELPERS
========================================================= */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rectOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w + padding < b.x ||
    a.x - padding > b.x + b.w ||
    a.y + a.h + padding < b.y ||
    a.y - padding > b.y + b.h
  );
}

function rectHitsRoad(rect, padding = 0) {
  return roads.some(r =>
    rectOverlap(rect, r, padding)
  );
}

/*
  Safety check.
  Kalau ada kesalahan layout, bangunan akan dibuang.
*/

const safeBuildings = [];

for (const b of buildings) {
  let bad = false;

  if (rectHitsRoad(b, 8)) {
    bad = true;
  }

  for (const other of safeBuildings) {
    if (rectOverlap(b, other, 15)) {
      bad = true;
      break;
    }
  }

  if (!bad) {
    safeBuildings.push(b);
  }
}

buildings.length = 0;
buildings.push(...safeBuildings);

/* =========================================================
   DOORS
========================================================= */

function getDoor(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h,
    w: 58,
    h: 12
  };
}

/* =========================================================
   TREES
========================================================= */

const trees = [];

function addTree(x, y) {
  if (x < 40 || y < 40 || x > W - 40 || y > H - 40) {
    return;
  }

  if (roads.some(r => circleRect(x, y, 28, r))) {
    return;
  }

  for (const b of buildings) {
    if (circleRect(x, y, 28, {
      x: b.x - 35,
      y: b.y - 35,
      w: b.w + 70,
      h: b.h + 70
    })) {
      return;
    }
  }

  for (const t of trees) {
    if (Math.hypot(x - t.x, y - t.y) < 70) {
      return;
    }
  }

  trees.push({
    x,
    y,
    r: 27
  });
}

/*
  Pohon di ruang kosong.
*/

const treePositions = [
  [430, 80],
  [430, 300],
  [720, 90],
  [1130, 320],
  [1580, 330],

  [420, 700],
  [420, 1020],
  [720, 1020],
  [1140, 1040],
  [1600, 1020],

  [420, 1430],
  [420, 1720],
  [720, 1740],
  [1140, 1730],
  [1580, 1750],

  [420, 2190],
  [420, 2460],
  [720, 2480],
  [1140, 2500],
  [1600, 2480],

  [1900, 350],
  [2700, 340],
  [3200, 350],
  [3500, 340],

  [1900, 1030],
  [2700, 1030],
  [3200, 1030],
  [3500, 1030],

  [1900, 1740],
  [2700, 1740],
  [3200, 1740],
  [3500, 1740],

  [1900, 2500],
  [2700, 2500],
  [3200, 2500],
  [3500, 2500]
];

for (const [x, y] of treePositions) {
  addTree(x, y);
}

/* =========================================================
   CARS
   angle = arah DEPAN mobil.
========================================================= */

const cars = [
  // horizontal road
  { x: 280, y: 485, w: 86, h: 44, color: "#9b3030", angle: 0 },
  { x: 950, y: 485, w: 86, h: 44, color: "#3f4b54", angle: Math.PI },
  { x: 2220, y: 485, w: 86, h: 44, color: "#b09b3d", angle: 0 },
  { x: 3350, y: 485, w: 86, h: 44, color: "#56636d", angle: Math.PI },

  // vertical road
  { x: 585, y: 820, w: 86, h: 44, color: "#7e3333", angle: Math.PI / 2 },
  { x: 1800, y: 900, w: 86, h: 44, color: "#4b555a", angle: -Math.PI / 2 },
  { x: 3015, y: 850, w: 86, h: 44, color: "#807541", angle: Math.PI / 2 },

  // horizontal
  { x: 1000, y: 1225, w: 86, h: 44, color: "#53636a", angle: 0 },
  { x: 2350, y: 1225, w: 86, h: 44, color: "#863939", angle: Math.PI },

  // vertical
  { x: 585, y: 1580, w: 86, h: 44, color: "#454d53", angle: -Math.PI / 2 },
  { x: 1800, y: 1600, w: 86, h: 44, color: "#877239", angle: Math.PI / 2 },
  { x: 3015, y: 1580, w: 86, h: 44, color: "#704747", angle: -Math.PI / 2 },

  // bottom road
  { x: 1000, y: 1965, w: 86, h: 44, color: "#5a686e", angle: 0 },
  { x: 2380, y: 1965, w: 86, h: 44, color: "#823737", angle: Math.PI }
];

for (const car of cars) {
  car.occupied = false;
}

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [
  { x: 250, y: 485, r: 14, speed: 0.65 },
  { x: 1050, y: 485, r: 14, speed: 0.70 },
  { x: 2250, y: 485, r: 14, speed: 0.65 },
  { x: 3300, y: 485, r: 14, speed: 0.68 },

  { x: 1000, y: 1225, r: 14, speed: 0.65 },
  { x: 2350, y: 1225, r: 14, speed: 0.70 },

  { x: 1000, y: 1965, r: 14, speed: 0.68 },
  { x: 2400, y: 1965, r: 14, speed: 0.65 }
];

/* =========================================================
   COLLISION
========================================================= */

function circleRect(cx, cy, radius, rect) {
  const x = clamp(cx, rect.x, rect.x + rect.w);
  const y = clamp(cy, rect.y, rect.y + rect.h);

  const dx = cx - x;
  const dy = cy - y;

  return dx * dx + dy * dy < radius * radius;
}

function circleCircle(x1, y1, r1, x2, y2, r2) {
  return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
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
      circleCircle(
        x,
        y,
        r,
        t.x,
        t.y,
        t.r * 0.65
      )
    ) {
      return true;
    }
  }

  return false;
}

/*
  Mobil dianggap lingkaran collision.
  Ini sengaja supaya mobil tidak bisa menembus mobil lain.
*/

function carCollision(x, y, r, ignore = null) {
  for (const car of cars) {
    if (car === ignore) continue;

    if (
      circleCircle(
        x,
        y,
        r,
        car.x,
        car.y,
        43
      )
    ) {
      return true;
    }
  }

  return false;
}

function outsideBlocked(x, y, r, ignoreCar = null) {
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
      null
    )
  ) {
    player.x = nx;
  }

  if (
    !outsideBlocked(
      player.x,
      ny,
      player.r,
      null
    )
  ) {
    player.y = ny;
  }
}

/* =========================================================
   CAR MOVEMENT
========================================================= */

function moveCar(dx, dy) {
  const car = player.car;

  if (!car) return;

  const len = Math.hypot(dx, dy);

  if (len < 0.01) return;

  const nx = car.x + dx;
  const ny = car.y + dy;

  /*
    Mobil tidak bisa keluar map.
  */

  if (
    nx < 55 ||
    ny < 55 ||
    nx > W - 55 ||
    ny > H - 55
  ) {
    return;
  }

  /*
    Mobil tidak bisa masuk bangunan/pohon/mobil.
  */

  if (buildingCollision(nx, ny, 45)) {
    return;
  }

  if (treeCollision(nx, ny, 45)) {
    return;
  }

  if (carCollision(nx, ny, 45, car)) {
    return;
  }

  car.x = nx;
  car.y = ny;

  /*
    Depan mobil selalu menghadap arah gerakan.
  */

  car.angle = Math.atan2(dy, dx);

  player.x = car.x;
  player.y = car.y;

  /*
    Zombie yang terlalu dekat terdorong.
  */

  for (const z of zombies) {
    const dist = Math.hypot(
      z.x - car.x,
      z.y - car.y
    );

    if (dist < 65) {
      const pushX =
        (z.x - car.x) / Math.max(dist, 1);

      const pushY =
        (z.y - car.y) / Math.max(dist, 1);

      const px = z.x + pushX * 18;
      const py = z.y + pushY * 18;

      if (
        !zombieBlocked(
          px,
          py,
          z.r
        )
      ) {
        z.x = px;
        z.y = py;
      }
    }
  }
}

/* =========================================================
   INTERIOR
========================================================= */

let interiorFurniture = [];

function createInterior(b) {
  const doorX = b.x + b.w / 2;

  const furniture = [];

  /*
    Furniture tidak boleh berada
    di jalur pintu.
  */

  const candidates = [
    {
      x: b.x + 35,
      y: b.y + 40,
      w: 110,
      h: 55,
      type: "bed"
    },
    {
      x: b.x + b.w - 145,
      y: b.y + 40,
      w: 110,
      h: 55,
      type: "cabinet"
    },
    {
      x: b.x + 35,
      y: b.y + 140,
      w: 100,
      h: 65,
      type: "table"
    },
    {
      x: b.x + b.w - 140,
      y: b.y + 140,
      w: 105,
      h: 65,
      type: "sofa"
    },
    {
      x: b.x + b.w / 2 - 45,
      y: b.y + 45,
      w: 90,
      h: 45,
      type: "shelf"
    }
  ];

  /*
    Khusus bangunan besar,
    tambah furniture supaya terasa seperti ruangan.
  */

  if (b.type === "large") {
    candidates.push(
      {
        x: b.x + 220,
        y: b.y + 120,
        w: 130,
        h: 60,
        type: "table"
      },
      {
        x: b.x + b.w - 350,
        y: b.y + 120,
        w: 130,
        h: 60,
        type: "sofa"
      }
    );
  }

  for (const f of candidates) {
    const centerX = f.x + f.w / 2;
    const centerY = f.y + f.h / 2;

    const doorDistance = Math.hypot(
      centerX - doorX,
      centerY - (b.y + b.h)
    );

    if (doorDistance > 125) {
      furniture.push(f);
    }
  }

  interiorFurniture = furniture;
}

function interiorBlocked(x, y, r) {
  const b = currentBuilding;

  if (!b) return true;

  /*
    Dinding.
    Tidak ada celah keluar dari samping/belakang.
  */

  if (
    x < b.x + 18 + r ||
    x > b.x + b.w - 18 - r ||
    y < b.y + 18 + r ||
    y > b.y + b.h - 18 - r
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
  if (mode !== "outside") {
    return null;
  }

  for (const b of buildings) {
    const d = getDoor(b);

    const dist = Math.hypot(
      player.x - d.x,
      player.y - (d.y + 15)
    );

    if (dist < 72) {
      return b;
    }
  }

  return null;
}

function enterBuilding(b) {
  if (!b) return;

  const d = getDoor(b);

  currentBuilding = b;

  createInterior(b);

  mode = "interior";

  /*
    Spawn di area bawah dalam ruangan.
    Bukan di pintu.
  */

  player.x = d.x;
  player.y = b.y + b.h - 70;

  /*
    Kalau furniture somehow menghalangi,
    geser ke tengah bawah.
  */

  if (
    interiorBlocked(
      player.x,
      player.y,
      player.r
    )
  ) {
    player.x =
      b.x + b.w / 2;

    player.y =
      b.y + b.h - 60;
  }
}

function nearInteriorDoor() {
  if (!currentBuilding) {
    return false;
  }

  const b = currentBuilding;

  const doorX =
    b.x + b.w / 2;

  const doorY =
    b.y + b.h - 30;

  return (
    Math.hypot(
      player.x - doorX,
      player.y - doorY
    ) < 48
  );
}

function exitBuilding() {
  if (!currentBuilding) return;

  /*
    WAJIB dekat pintu.
  */

  if (!nearInteriorDoor()) {
    return;
  }

  const b = currentBuilding;

  const outsideX =
    b.x + b.w / 2;

  const outsideY =
    b.y + b.h + 58;

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
   CAR INTERACTION
========================================================= */

function nearestCar() {
  let result = null;
  let best = 75;

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

  car.occupied = true;

  player.inCar = true;
  player.car = car;

  player.x = car.x;
  player.y = car.y;
}

function exitCar() {
  const car = player.car;

  if (!car) return;

  /*
    Keluar dari sisi mobil,
    bukan spawn random.
  */

  const side = Math.PI / 2;

  const spots = [
    {
      x: car.x + Math.cos(car.angle + side) * 65,
      y: car.y + Math.sin(car.angle + side) * 65
    },
    {
      x: car.x + Math.cos(car.angle - side) * 65,
      y: car.y + Math.sin(car.angle - side) * 65
    }
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
    /*
      Tidak bisa keluar dari sembarang tempat.
    */
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
   KEYBOARD
========================================================= */

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (
    e.key.toLowerCase() === "e" ||
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

function updateJoystick(clientX, clientY) {
  const rect =
    joystickEl.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let dx =
    clientX - centerX;

  let dy =
    clientY - centerY;

  const max =
    rect.width * 0.32;

  const length =
    Math.hypot(dx, dy);

  if (length > max) {
    dx =
      dx / length * max;

    dy =
      dy / length * max;
  }

  joystick.x =
    dx / max;

  joystick.y =
    dy / max;

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
    e.preventDefault();

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
   INPUT
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

  const length =
    Math.hypot(x, y);

  if (length > 1) {
    x /= length;
    y /= length;
  }

  return { x, y };
}

/* =========================================================
   ZOMBIES
========================================================= */

function zombieBlocked(x, y, r) {
  return outsideBlocked(
    x,
    y,
    r,
    null
  );
}

function updateZombies() {
  if (mode !== "outside") return;

  for (const z of zombies) {
    /*
      Kalau player di mobil,
      zombie tetap mengejar tapi
      tidak bisa menembus mobil.
    */

    const targetX =
      player.inCar
        ? player.car.x
        : player.x;

    const targetY =
      player.inCar
        ? player.car.y
        : player.y;

    const dx =
      targetX - z.x;

    const dy =
      targetY - z.y;

    const distance =
      Math.hypot(dx, dy);

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
      Kalau ada mobil di depan,
      zombie coba mengitari.
    */

    const directBlocked =
      zombieBlocked(
        z.x + vx,
        z.y + vy,
        z.r
      );

    if (!directBlocked) {
      z.x += vx;
      z.y += vy;
      continue;
    }

    /*
      Coba samping kanan.
    */

    if (
      !zombieBlocked(
        z.x - vy * 2,
        z.y + vx * 2,
        z.r
      )
    ) {
      z.x -= vy * 2;
      z.y += vx * 2;
      continue;
    }

    /*
      Coba samping kiri.
    */

    if (
      !zombieBlocked(
        z.x + vy * 2,
        z.y - vx * 2,
        z.r
      )
    ) {
      z.x += vy * 2;
      z.y -= vx * 2;
      continue;
    }
  }
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {
  /*
    Karakter berada agak bawah layar,
    supaya pandangan lebih banyak ke depan.
  */

  const targetX =
    player.x;

  const targetY =
    player.y - 100;

  camera.x +=
    (targetX - camera.x) * 0.10;

  camera.y +=
    (targetY - camera.y) * 0.10;

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
  ctx.fillStyle = "#3d503b";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /*
    Rumput / tanah.
  */

  ctx.fillStyle =
    "rgba(30,40,28,0.16)";

  for (
    let x = 0;
    x < W;
    x += 55
  ) {
    for (
      let y = 0;
      y < H;
      y += 55
    ) {
      ctx.fillRect(
        x + 12,
        y + 15,
        2,
        2
      );
    }
  }
}

/* =========================================================
   DRAW ROADS
========================================================= */

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle = "#2f3134";

    ctx.fillRect(
      r.x,
      r.y,
      r.w,
      r.h
    );

    /*
      Road edge.
    */

    ctx.fillStyle = "#55585b";

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

      ctx.strokeStyle = "#d0c568";
      ctx.lineWidth = 5;
      ctx.setLineDash([
        42,
        32
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

      ctx.strokeStyle = "#d0c568";
      ctx.lineWidth = 5;
      ctx.setLineDash([
        42,
        32
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
  /*
    shadow
  */

  ctx.fillStyle =
    "rgba(0,0,0,0.32)";

  ctx.fillRect(
    b.x + 15,
    b.y + 17,
    b.w,
    b.h
  );

  /*
    building
  */

  ctx.fillStyle =
    b.color;

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  /*
    roof
  */

  ctx.fillStyle = "#343735";

  ctx.fillRect(
    b.x - 7,
    b.y - 10,
    b.w + 14,
    18
  );

  /*
    windows
  */

  ctx.fillStyle = "#25383a";

  const cols =
    Math.max(
      2,
      Math.floor(b.w / 95)
    );

  const spacing =
    b.w / (cols + 1);

  for (
    let i = 1;
    i <= cols;
    i++
  ) {
    ctx.fillRect(
      b.x + spacing * i - 16,
      b.y + 35,
      32,
      42
    );

    if (b.h > 280) {
      ctx.fillRect(
        b.x + spacing * i - 16,
        b.y + 105,
        32,
        42
      );
    }
  }

  /*
    door.
  */

  const d =
    getDoor(b);

  ctx.fillStyle = "#34271f";

  ctx.fillRect(
    d.x - 21,
    b.y + b.h - 55,
    42,
    55
  );

  ctx.fillStyle = "#d2b867";

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
   TREE DRAW
========================================================= */

function drawTree(t) {
  ctx.fillStyle =
    "rgba(0,0,0,0.3)";

  ctx.beginPath();

  ctx.ellipse(
    t.x,
    t.y + 25,
    28,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#58422d";

  ctx.fillRect(
    t.x - 7,
    t.y - 5,
    14,
    34
  );

  ctx.fillStyle = "#28482f";

  ctx.beginPath();

  ctx.arc(
    t.x,
    t.y - 20,
    t.r,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#365b3b";

  ctx.beginPath();

  ctx.arc(
    t.x - 14,
    t.y - 10,
    19,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    t.x + 14,
    t.y - 10,
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

  /*
    shadow
  */

  ctx.fillStyle =
    "rgba(0,0,0,0.35)";

  ctx.fillRect(
    -car.w / 2 + 5,
    -car.h / 2 + 7,
    car.w,
    car.h
  );

  /*
    body
  */

  ctx.fillStyle =
    car.color;

  ctx.fillRect(
    -car.w / 2,
    -car.h / 2,
    car.w,
    car.h
  );

  /*
    cabin
  */

  ctx.fillStyle = "#1d292d";

  ctx.fillRect(
    -16,
    -car.h / 2 + 5,
    32,
    14
  );

  /*
    FRONT bumper.
    Ini bikin arah mobil lebih jelas.
  */

  ctx.fillStyle = "#d8d29b";

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

  /*
    belakang
  */

  ctx.fillStyle = "#631e1e";

  ctx.fillRect(
    -car.w / 2 + 2,
    -car.h / 2 + 6,
    5,
    9
  );

  ctx.fillRect(
    -car.w / 2 + 2,
    car.h / 2 - 15,
    5,
    9
  );

  /*
    wheels
  */

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
    15,
    13,
    6,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#596953";

  ctx.fillRect(
    -9,
    -3,
    18,
    24
  );

  ctx.fillStyle = "#8a947d";

  ctx.beginPath();

  ctx.arc(
    0,
    -14,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = "#1b1d1b";

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

  /*
    shadow
  */

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

  /*
    static legs
  */

  ctx.fillStyle = "#1b2525";

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

  /*
    body
  */

  ctx.fillStyle = "#3d4949";

  ctx.fillRect(
    -11,
    -13,
    22,
    23
  );

  /*
    backpack
  */

  ctx.fillStyle = "#222a28";

  ctx.fillRect(
    -14,
    -10,
    5,
    19
  );

  /*
    head
  */

  ctx.fillStyle = "#b99b7d";

  ctx.beginPath();

  ctx.arc(
    0,
    -22,
    9,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /*
    hair
  */

  ctx.fillStyle = "#252321";

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

  ctx.fillStyle = "#605b50";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  /*
    floor tiles
  */

  ctx.strokeStyle =
    "rgba(40,40,35,0.18)";

  ctx.lineWidth = 2;

  for (
    let x = b.x;
    x < b.x + b.w;
    x += 45
  ) {
    ctx.beginPath();

    ctx.moveTo(
      x,
      b.y
    );

    ctx.lineTo(
      x,
      b.y + b.h
    );

    ctx.stroke();
  }

  for (
    let y = b.y;
    y < b.y + b.h;
    y += 45
  ) {
    ctx.beginPath();

    ctx.moveTo(
      b.x,
      y
    );

    ctx.lineTo(
      b.x + b.w,
      y
    );

    ctx.stroke();
  }

  /*
    walls
  */

  ctx.strokeStyle = "#292b28";
  ctx.lineWidth = 18;

  ctx.strokeRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  /*
    furniture
  */

  for (const f of interiorFurniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#3c3028";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#91897b";

      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        f.h - 18
      );
    }

    if (f.type === "cabinet") {
      ctx.fillStyle = "#342b23";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#695342";

      ctx.fillRect(
        f.x + 10,
        f.y + 10,
        f.w - 20,
        5
      );
    }

    if (f.type === "table") {
      ctx.fillStyle = "#4d3829";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (f.type === "sofa") {
      ctx.fillStyle = "#454b47";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#626963";

      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        15
      );
    }

    if (f.type === "shelf") {
      ctx.fillStyle = "#403329";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#80634b";

      for (
        let i = 0;
        i < 3;
        i++
      ) {
        ctx.fillRect(
          f.x + 10,
          f.y + 10 + i * 11,
          f.w - 20,
          5
        );
      }
    }
  }

  /*
    pintu
  */

  ctx.fillStyle = "#b49558";

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

let gameTime = 9 * 60;

function updateGameTime(dt) {
  gameTime += dt * 0.02;

  if (gameTime >= 1440) {
    gameTime = 0;
  }
}

function drawHUD() {
  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,0.66)";

  ctx.fillRect(
    18,
    18,
    300,
    112
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

  ctx.fillStyle = "#db5555";

  ctx.fillText(
    `HP ${Math.round(player.hp)}`,
    32,
    72
  );

  ctx.fillStyle = "#d3bb50";

  ctx.fillText(
    `HUNGER ${Math.round(player.hunger)}`,
    32,
    96
  );

  const hour =
    Math.floor(gameTime / 60);

  const minute =
    Math.floor(gameTime % 60);

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
    if (nearInteriorDoor()) {
      text =
        "INTERACT  •  EXIT";
    }
  } else if (player.inCar) {
    text =
      "INTERACT  •  EXIT VEHICLE";
  } else {
    const car =
      nearestCar();

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
    "rgba(0,0,0,0.76)";

  ctx.fillRect(
    canvas.width / 2 - 165,
    canvas.height - 62,
    330,
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
  const input =
    getInput();

  if (mode === "outside") {
    if (player.inCar) {
      const speed = 5.5;

      moveCar(
        input.x * speed,
        input.y * speed
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

  /*
    Hunger.
  */

  player.hunger -=
    dt * 0.0007;

  player.hunger =
    clamp(
      player.hunger,
      0,
      100
    );

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

  updateGameTime(dt);
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

requestAnimationFrame(loop);