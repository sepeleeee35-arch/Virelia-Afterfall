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

/* =========================================================
   PLAYER
========================================================= */

const player = {
  x: 0,
  y: 0,
  r: 16,
  speed: 3.4,
  hp: 100,
  hunger: 100,
  inCar: false,
  car: null
};

/* =========================================================
   CAMERA
   Player dibuat agak bawah layar supaya terasa
   lebih third-person / open-world.
========================================================= */

const camera = {
  x: 0,
  y: 0
};

/* =========================================================
   CITY
========================================================= */

const roads = [
  { x: 0, y: 470, w: W, h: 190 },
  { x: 0, y: 1350, w: W, h: 190 },
  { x: 0, y: 2230, w: W, h: 190 },

  { x: 620, y: 0, w: 190, h: H },
  { x: 2005, y: 0, w: 190, h: H },
  { x: 3390, y: 0, w: 190, h: H }
];

/* =========================================================
   BLOCKS
========================================================= */

const blocks = [
  { x: 45, y: 45, w: 530, h: 375 },
  { x: 855, y: 45, w: 1095, h: 375 },
  { x: 2240, y: 45, w: 1095, h: 375 },
  { x: 3630, y: 45, w: 520, h: 375 },

  { x: 45, y: 710, w: 530, h: 590 },
  { x: 855, y: 710, w: 1095, h: 590 },
  { x: 2240, y: 710, w: 1095, h: 590 },
  { x: 3630, y: 710, w: 520, h: 590 },

  { x: 45, y: 1590, w: 530, h: 590 },
  { x: 855, y: 1590, w: 1095, h: 590 },
  { x: 2240, y: 1590, w: 1095, h: 590 },
  { x: 3630, y: 1590, w: 520, h: 590 },

  { x: 45, y: 2470, w: 530, h: 480 },
  { x: 855, y: 2470, w: 1095, h: 480 },
  { x: 2240, y: 2470, w: 1095, h: 480 },
  { x: 3630, y: 2470, w: 520, h: 480 }
];

/* =========================================================
   BUILDINGS
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
      "#77736a",
      "#666b65",
      "#706d66",
      "#5f645f",
      "#7a756c"
    ][buildings.length % 5]
  });
}

/*
  IMPORTANT:
  Bangunan dibuat manual per block.
  Tidak ada bangunan random yang bisa numpuk.
*/

/* ROW 1 */

addBuilding(95, 90, 300, 220, "house");

addBuilding(930, 90, 360, 230, "house");
addBuilding(1420, 135, 390, 210, "shop");

addBuilding(2320, 90, 420, 230, "large");
addBuilding(2860, 140, 330, 190, "house");

addBuilding(3730, 90, 300, 220, "house");

/* ROW 2 */

addBuilding(90, 770, 330, 250, "house");

addBuilding(930, 760, 400, 250, "large");
addBuilding(1500, 820, 330, 220, "house");

addBuilding(2320, 760, 420, 260, "large");
addBuilding(2890, 820, 350, 220, "shop");

addBuilding(3730, 770, 300, 250, "house");

/* ROW 3 */

addBuilding(90, 1660, 330, 250, "house");

addBuilding(930, 1640, 360, 240, "shop");
addBuilding(1450, 1910, 380, 210, "house");

addBuilding(2320, 1640, 420, 240, "large");
addBuilding(2890, 1920, 350, 190, "house");

addBuilding(3730, 1660, 300, 250, "house");

/* ROW 4 */

addBuilding(95, 2540, 320, 250, "house");

addBuilding(930, 2530, 400, 240, "large");
addBuilding(1510, 2560, 300, 210, "house");

addBuilding(2320, 2530, 410, 240, "large");
addBuilding(2900, 2570, 340, 190, "shop");

addBuilding(3730, 2540, 300, 250, "house");

/* =========================================================
   RECT HELPERS
========================================================= */

function rectOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w + padding <= b.x ||
    a.x - padding >= b.x + b.w ||
    a.y + a.h + padding <= b.y ||
    a.y - padding >= b.y + b.h
  );
}

function buildingTouchesRoad(b, padding = 0) {
  return roads.some(r =>
    rectOverlap(b, r, padding)
  );
}

/*
  Safety validator.
  Kalau ada bangunan salah posisi, kita tandai.
*/

function validateBuildings() {
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];

    if (buildingTouchesRoad(b, 8)) {
      console.warn("Building touches road", b);
    }

    for (let j = 0; j < i; j++) {
      if (rectOverlap(b, buildings[j], 12)) {
        console.warn(
          "Building overlap:",
          b,
          buildings[j]
        );
      }
    }
  }
}

validateBuildings();

/* =========================================================
   DOORS
========================================================= */

function getDoor(b) {
  return {
    x: b.x + b.w / 2,
    y: b.y + b.h,
    w: 58,
    h: 16
  };
}

/* =========================================================
   CARS
========================================================= */

const cars = [
  { x: 290, y: 565, w: 88, h: 46, color: "#a52e32", angle: 0 },
  { x: 1080, y: 565, w: 88, h: 46, color: "#3f4d55", angle: 0 },
  { x: 2480, y: 565, w: 88, h: 46, color: "#b19a38", angle: 0 },
  { x: 3860, y: 565, w: 88, h: 46, color: "#52646d", angle: 0 },

  { x: 715, y: 900, w: 88, h: 46, color: "#773838", angle: Math.PI / 2 },
  { x: 2100, y: 1080, w: 88, h: 46, color: "#454d54", angle: Math.PI / 2 },
  { x: 3485, y: 950, w: 88, h: 46, color: "#77713c", angle: Math.PI / 2 },

  { x: 1050, y: 1445, w: 88, h: 46, color: "#586870", angle: 0 },
  { x: 2600, y: 1445, w: 88, h: 46, color: "#893737", angle: 0 },

  { x: 710, y: 1800, w: 88, h: 46, color: "#454b51", angle: Math.PI / 2 },
  { x: 2100, y: 2020, w: 88, h: 46, color: "#8a7537", angle: Math.PI / 2 },
  { x: 3485, y: 1800, w: 88, h: 46, color: "#704848", angle: Math.PI / 2 },

  { x: 1100, y: 2315, w: 88, h: 46, color: "#596970", angle: 0 },
  { x: 2550, y: 2315, w: 88, h: 46, color: "#813838", angle: 0 },

  { x: 1000, y: 2860, w: 88, h: 46, color: "#48545a", angle: 0 },
  { x: 2700, y: 2860, w: 88, h: 46, color: "#9a8135", angle: 0 }
];

for (const car of cars) {
  car.occupied = false;
}

/* =========================================================
   TREES
========================================================= */

const trees = [];

function canPlaceTree(x, y) {
  if (pointInRoad(x, y)) {
    return false;
  }

  for (const b of buildings) {
    if (
      x > b.x - 65 &&
      x < b.x + b.w + 65 &&
      y > b.y - 65 &&
      y < b.y + b.h + 65
    ) {
      return false;
    }
  }

  for (const c of cars) {
    if (
      Math.hypot(
        x - c.x,
        y - c.y
      ) < 80
    ) {
      return false;
    }
  }

  return true;
}

function addTree(x, y) {
  if (!canPlaceTree(x, y)) return;

  trees.push({
    x,
    y,
    r: 28
  });
}

for (const block of blocks) {
  const spots = [
    [block.x + 35, block.y + 35],
    [block.x + block.w - 35, block.y + 35],
    [block.x + 35, block.y + block.h - 35],
    [block.x + block.w - 35, block.y + block.h - 35]
  ];

  for (const p of spots) {
    addTree(p[0], p[1]);
  }
}

/* =========================================================
   COLLISION
========================================================= */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
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

  return (
    dx * dx +
    dy * dy <
    radius * radius
  );
}

function pointInRoad(x, y) {
  return roads.some(r =>
    x >= r.x &&
    x <= r.x + r.w &&
    y >= r.y &&
    y <= r.y + r.h
  );
}

function buildingCollision(x, y, r) {
  return buildings.some(b =>
    circleRect(x, y, r, b)
  );
}

function treeCollision(x, y, r) {
  return trees.some(t =>
    Math.hypot(
      x - t.x,
      y - t.y
    ) < r + t.r * 0.65
  );
}

function carCollision(
  x,
  y,
  r,
  ignore = null
) {
  return cars.some(car => {
    if (car === ignore) return false;

    const radius =
      Math.max(car.w, car.h) * 0.55;

    return (
      Math.hypot(
        x - car.x,
        y - car.y
      ) <
      r + radius
    );
  });
}

/* =========================================================
   ZOMBIE COLLISION
========================================================= */

function zombieCollision(x, y, r, ignore = null) {
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

  /*
    Zombie benar-benar dianggap menabrak mobil.
    Ini yang mencegah zombie nongkrong di dalam mobil.
  */

  if (carCollision(x, y, r, ignore)) {
    return true;
  }

  return false;
}

/* =========================================================
   SAFE SPAWN
========================================================= */

function safeSpawn(
  radius = 16,
  preferredX = 1000,
  preferredY = 565
) {
  if (
    !buildingCollision(
      preferredX,
      preferredY,
      radius
    ) &&
    !treeCollision(
      preferredX,
      preferredY,
      radius
    ) &&
    !carCollision(
      preferredX,
      preferredY,
      radius
    ) &&
    preferredX > radius &&
    preferredY > radius &&
    preferredX < W - radius &&
    preferredY < H - radius
  ) {
    return {
      x: preferredX,
      y: preferredY
    };
  }

  /*
    Cari titik kosong di jalan.
  */

  for (const road of roads) {
    const x =
      road.x +
      road.w / 2;

    const y =
      road.y +
      road.h / 2;

    if (
      !buildingCollision(x, y, radius) &&
      !carCollision(x, y, radius)
    ) {
      return { x, y };
    }
  }

  return {
    x: W / 2,
    y: H / 2
  };
}

/* =========================================================
   PLAYER SPAWN
========================================================= */

const spawn = safeSpawn(
  player.r,
  1080,
  565
);

player.x = spawn.x;
player.y = spawn.y;

camera.x = player.x;
camera.y = player.y;

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [];

function addZombie(x, y) {
  if (
    zombieCollision(
      x,
      y,
      14
    )
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

const zombieSpawnPoints = [
  [260, 565],
  [1500, 565],
  [2700, 565],
  [3900, 565],

  [1000, 1445],
  [2800, 1445],

  [1000, 2315],
  [2800, 2315],

  [720, 1150],
  [2100, 1150],
  [3480, 1150],

  [720, 2600],
  [2100, 2600],
  [3480, 2600]
];

for (const p of zombieSpawnPoints) {
  addZombie(
    p[0],
    p[1]
  );
}

/* =========================================================
   INTERIOR
========================================================= */

let interiorFurniture = [];

function createInterior(b) {
  const door = getDoor(b);

  const furniture = [];

  const addFurniture = (
    x,
    y,
    w,
    h,
    type
  ) => {
    const f = {
      x,
      y,
      w,
      h,
      type
    };

    /*
      Jangan pernah taruh furniture di
      koridor pintu.
    */

    const corridor = {
      x: door.x - 60,
      y: b.y + b.h - 150,
      w: 120,
      h: 150
    };

    if (
      rectOverlap(
        f,
        corridor,
        10
      )
    ) {
      return;
    }

    furniture.push(f);
  };

  addFurniture(
    b.x + 35,
    b.y + 35,
    110,
    55,
    "bed"
  );

  addFurniture(
    b.x + b.w - 145,
    b.y + 35,
    100,
    55,
    "cabinet"
  );

  addFurniture(
    b.x + 35,
    b.y + 130,
    90,
    60,
    "table"
  );

  addFurniture(
    b.x + b.w - 145,
    b.y + 130,
    100,
    60,
    "sofa"
  );

  /*
    Bangunan besar punya isi tambahan.
  */

  if (b.type === "large") {
    addFurniture(
      b.x + b.w / 2 - 45,
      b.y + 75,
      90,
      50,
      "table"
    );

    addFurniture(
      b.x + 50,
      b.y + 220,
      90,
      50,
      "cabinet"
    );

    addFurniture(
      b.x + b.w - 140,
      b.y + 220,
      90,
      50,
      "table"
    );
  }

  interiorFurniture = furniture;
}

/* =========================================================
   OUTSIDE COLLISION
========================================================= */

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

  if (
    buildingCollision(
      x,
      y,
      r
    )
  ) {
    return true;
  }

  if (
    treeCollision(
      x,
      y,
      r
    )
  ) {
    return true;
  }

  if (
    carCollision(
      x,
      y,
      r,
      ignoreCar
    )
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function movePlayer(dx, dy) {
  const nx =
    player.x + dx;

  const ny =
    player.y + dy;

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
   CAR MOVEMENT
========================================================= */

function moveCar(dx, dy) {
  const car = player.car;

  if (!car) return;

  const nx =
    car.x + dx;

  const ny =
    car.y + dy;

  if (
    outsideBlocked(
      nx,
      ny,
      45,
      car
    )
  ) {
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

function interiorBlocked(
  x,
  y,
  r
) {
  if (!currentBuilding) {
    return true;
  }

  const b =
    currentBuilding;

  /*
    Player tetap berada di dalam ruangan.
    Tidak ada lubang keluar selain pintu.
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
    if (
      circleRect(
        x,
        y,
        r,
        f
      )
    ) {
      return true;
    }
  }

  return false;
}

function moveInterior(dx, dy) {
  const nx =
    player.x + dx;

  const ny =
    player.y + dy;

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

  let result = null;
  let best = 65;

  for (const b of buildings) {
    const d = getDoor(b);

    const distance =
      Math.hypot(
        player.x - d.x,
        player.y -
          (b.y + b.h + 18)
      );

    if (
      distance < best
    ) {
      best = distance;
      result = b;
    }
  }

  return result;
}

function enterBuilding(b) {
  if (player.inCar) {
    return;
  }

  const d =
    getDoor(b);

  currentBuilding = b;

  createInterior(b);

  mode = "interior";

  player.x =
    d.x;

  player.y =
    b.y + b.h - 55;

  /*
    Safety.
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
      b.y + b.h - 75;
  }
}

function exitBuilding() {
  if (!currentBuilding) {
    return;
  }

  const b =
    currentBuilding;

  const door =
    getDoor(b);

  /*
    Harus benar-benar berada
    dekat pintu.
  */

  const distance =
    Math.hypot(
      player.x - door.x,
      player.y -
        (b.y + b.h - 38)
    );

  if (distance > 52) {
    return;
  }

  const outsideX =
    door.x;

  const outsideY =
    b.y + b.h + 65;

  if (
    outsideBlocked(
      outsideX,
      outsideY,
      player.r
    )
  ) {
    return;
  }

  player.x =
    outsideX;

  player.y =
    outsideY;

  mode = "outside";

  currentBuilding = null;

  interiorFurniture = [];
}

/* =========================================================
   CAR INTERACTION
========================================================= */

function nearestCar() {
  if (player.inCar) {
    return null;
  }

  let result = null;
  let best = 70;

  for (const car of cars) {
    if (car.occupied) {
      continue;
    }

    const distance =
      Math.hypot(
        player.x - car.x,
        player.y - car.y
      );

    if (
      distance < best
    ) {
      best = distance;
      result = car;
    }
  }

  return result;
}

function enterCar(car) {
  if (!car) return;

  if (
    car.occupied
  ) {
    return;
  }

  car.occupied = true;

  player.inCar = true;
  player.car = car;

  player.x =
    car.x;

  player.y =
    car.y;
}

function exitCar() {
  const car =
    player.car;

  if (!car) return;

  const spots = [
    {
      x: car.x + 72,
      y: car.y
    },
    {
      x: car.x - 72,
      y: car.y
    },
    {
      x: car.x,
      y: car.y + 72
    },
    {
      x: car.x,
      y: car.y - 72
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
      player.x =
        p.x;

      player.y =
        p.y;

      car.occupied =
        false;

      player.inCar =
        false;

      player.car =
        null;

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

  const car =
    nearestCar();

  if (car) {
    enterCar(car);
    return;
  }

  const building =
    nearDoor();

  if (building) {
    enterBuilding(
      building
    );
  }
}

/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
  "keydown",
  e => {
    keys[
      e.key.toLowerCase()
    ] = true;

    if (
      e.key === "e" ||
      e.key === "Enter"
    ) {
      interact();
    }
  }
);

window.addEventListener(
  "keyup",
  e => {
    keys[
      e.key.toLowerCase()
    ] = false;
  }
);

/* =========================================================
   JOYSTICK
========================================================= */

const joystickEl =
  document.getElementById(
    "joystick"
  );

const stickEl =
  document.getElementById(
    "joystick-stick"
  );

function updateJoystick(
  x,
  y
) {
  const rect =
    joystickEl.getBoundingClientRect();

  const cx =
    rect.left +
    rect.width / 2;

  const cy =
    rect.top +
    rect.height / 2;

  let dx =
    x - cx;

  let dy =
    y - cy;

  const max =
    rect.width * 0.32;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (
    length > max
  ) {
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
  joystick.active =
    false;

  joystick.x = 0;
  joystick.y = 0;

  stickEl.style.transform =
    "translate(0px, 0px)";
}

joystickEl.addEventListener(
  "pointerdown",
  e => {
    joystick.active =
      true;

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
    if (
      !joystick.active
    ) {
      return;
    }

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
  .getElementById(
    "interact"
  )
  .addEventListener(
    "pointerdown",
    e => {
      e.preventDefault();
      interact();
    }
  );

document
  .getElementById(
    "fullscreen"
  )
  .addEventListener(
    "click",
    async () => {
      try {
        await document
          .documentElement
          .requestFullscreen();

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
  let x =
    joystick.x;

  let y =
    joystick.y;

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
    Math.hypot(
      x,
      y
    );

  if (
    length > 1
  ) {
    x /= length;
    y /= length;
  }

  return {
    x,
    y
  };
}

/* =========================================================
   ZOMBIE AI
========================================================= */

function updateZombies() {
  if (
    mode !== "outside"
  ) {
    return;
  }

  for (const z of zombies) {
    /*
      Jangan mengejar kalau terlalu jauh.
    */

    const dx =
      player.x - z.x;

    const dy =
      player.y - z.y;

    const distance =
      Math.hypot(
        dx,
        dy
      );

    if (
      distance > 650 ||
      distance < 1
    ) {
      continue;
    }

    const vx =
      dx / distance *
      z.speed;

    const vy =
      dy / distance *
      z.speed;

    /*
      Coba diagonal.
    */

    if (
      !zombieCollision(
        z.x + vx,
        z.y + vy,
        z.r
      )
    ) {
      z.x += vx;
      z.y += vy;
      continue;
    }

    /*
      Kalau ketabrak mobil/building,
      coba samping.
    */

    if (
      !zombieCollision(
        z.x + vx,
        z.y,
        z.r
      )
    ) {
      z.x += vx;
    }

    if (
      !zombieCollision(
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
  /*
    Kamera melihat sedikit ke depan.
    Ini bikin karakter tidak selalu berada
    tepat di tengah layar.
  */

  const targetX =
    player.x;

  const targetY =
    player.y - 145;

  camera.x +=
    (targetX - camera.x) *
    0.10;

  camera.y +=
    (targetY - camera.y) *
    0.10;

  camera.x =
    clamp(
      camera.x,
      canvas.width / 2,
      W - canvas.width / 2
    );

  camera.y =
    clamp(
      camera.y,
      canvas.height / 2,
      H - canvas.height / 2
    );
}

/* =========================================================
   GROUND
========================================================= */

function drawGround() {
  ctx.fillStyle =
    "#3e513c";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /*
    Area kota kecil.
  */

  ctx.strokeStyle =
    "rgba(20,30,20,0.12)";

  ctx.lineWidth = 1;

  for (
    let x = 0;
    x < W;
    x += 80
  ) {
    for (
      let y = 0;
      y < H;
      y += 80
    ) {
      ctx.beginPath();

      ctx.moveTo(
        x,
        y
      );

      ctx.lineTo(
        x + 8,
        y + 4
      );

      ctx.stroke();
    }
  }
}

/* =========================================================
   ROADS
========================================================= */

function drawRoads() {
  for (const r of roads) {
    ctx.fillStyle =
      "#303236";

    ctx.fillRect(
      r.x,
      r.y,
      r.w,
      r.h
    );

    ctx.fillStyle =
      "#57595c";

    if (
      r.w > r.h
    ) {
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

      ctx.strokeStyle =
        "#c5b969";

      ctx.lineWidth = 5;

      ctx.setLineDash([
        38,
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

      ctx.strokeStyle =
        "#c5b969";

      ctx.lineWidth = 5;

      ctx.setLineDash([
        38,
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
   BUILDINGS
========================================================= */

function drawBuilding(b) {
  /*
    Shadow
  */

  ctx.fillStyle =
    "rgba(0,0,0,0.30)";

  ctx.fillRect(
    b.x + 14,
    b.y + 16,
    b.w,
    b.h
  );

  /*
    Building
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
    Roof
  */

  ctx.fillStyle =
    "#353835";

  ctx.fillRect(
    b.x - 8,
    b.y - 10,
    b.w + 16,
    18
  );

  /*
    Windows
  */

  ctx.fillStyle =
    "#26383a";

  const cols =
    Math.max(
      2,
      Math.floor(
        b.w / 95
      )
    );

  const spacing =
    b.w /
    (cols + 1);

  for (
    let i = 1;
    i <= cols;
    i++
  ) {
    ctx.fillRect(
      b.x +
        spacing * i -
        17,
      b.y + 35,
      34,
      42
    );
  }

  /*
    Door
  */

  const d =
    getDoor(b);

  ctx.fillStyle =
    "#34271e";

  ctx.fillRect(
    d.x - 20,
    b.y + b.h - 54,
    40,
    54
  );

  ctx.fillStyle =
    "#b29b5d";

  ctx.beginPath();

  ctx.arc(
    d.x + 11,
    b.y + b.h - 27,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /*
    Sign untuk shop
  */

  if (
    b.type === "shop"
  ) {
    ctx.fillStyle =
      "#403d35";

    ctx.fillRect(
      b.x + 20,
      b.y + b.h - 25,
      b.w - 40,
      18
    );

    ctx.fillStyle =
      "#c6b875";

    ctx.font =
      "bold 11px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "SHOP",
      b.x + b.w / 2,
      b.y + b.h - 12
    );

    ctx.textAlign =
      "left";
  }
}

/* =========================================================
   TREES
========================================================= */

function drawTree(t) {
  ctx.fillStyle =
    "rgba(0,0,0,0.30)";

  ctx.beginPath();

  ctx.ellipse(
    t.x,
    t.y + 22,
    28,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#59432d";

  ctx.fillRect(
    t.x - 7,
    t.y - 2,
    14,
    32
  );

  ctx.fillStyle =
    "#29472f";

  ctx.beginPath();

  ctx.arc(
    t.x,
    t.y - 20,
    t.r,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#365c3b";

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
   CARS
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
    Shadow
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
    Body
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
    Windshield
  */

  ctx.fillStyle =
    "#182326";

  ctx.fillRect(
    -18,
    -car.h / 2 + 5,
    36,
    14
  );

  /*
    Headlights
  */

  ctx.fillStyle =
    "#ddd39d";

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
    Wheels
  */

  ctx.fillStyle =
    "#151515";

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

  /*
    Occupied indicator.
  */

  if (car.occupied) {
    ctx.fillStyle =
      "#d6c55b";

    ctx.fillRect(
      -4,
      -car.h / 2 - 9,
      8,
      4
    );
  }

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

  ctx.fillStyle =
    "#596954";

  ctx.fillRect(
    -9,
    -3,
    18,
    24
  );

  ctx.fillStyle =
    "#89927b";

  ctx.beginPath();

  ctx.arc(
    0,
    -14,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#1b1e1a";

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
  if (
    player.inCar
  ) {
    return;
  }

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

  /*
    Static legs.
  */

  ctx.fillStyle =
    "#1c2525";

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
    Body.
  */

  ctx.fillStyle =
    "#394345";

  ctx.fillRect(
    -11,
    -13,
    22,
    23
  );

  /*
    Backpack.
  */

  ctx.fillStyle =
    "#222b28";

  ctx.fillRect(
    -14,
    -10,
    5,
    19
  );

  /*
    Head.
  */

  ctx.fillStyle =
    "#b99c7e";

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
    Hair.
  */

  ctx.fillStyle =
    "#252322";

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
   INTERIOR
========================================================= */

function drawInterior() {
  const b =
    currentBuilding;

  if (!b) return;

  ctx.fillStyle =
    "#5b564d";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  /*
    Floor pattern.
  */

  ctx.strokeStyle =
    "rgba(20,20,20,0.15)";

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
    Walls.
  */

  ctx.strokeStyle =
    "#292b28";

  ctx.lineWidth = 18;

  ctx.strokeRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  /*
    Furniture.
  */

  for (
    const f of interiorFurniture
  ) {
    if (
      f.type === "bed"
    ) {
      ctx.fillStyle =
        "#392f28";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle =
        "#8a8274";

      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        f.h - 18
      );
    }

    if (
      f.type === "cabinet"
    ) {
      ctx.fillStyle =
        "#332a23";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (
      f.type === "table"
    ) {
      ctx.fillStyle =
        "#4b3627";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (
      f.type === "sofa"
    ) {
      ctx.fillStyle =
        "#484b47";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }
  }

  /*
    Door.
  */

  ctx.fillStyle =
    "#aa8d55";

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

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 20px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    32,
    45
  );

  ctx.font =
    "bold 15px Arial";

  ctx.fillStyle =
    "#d34c4c";

  ctx.fillText(
    `HP ${Math.round(player.hp)}`,
    32,
    72
  );

  ctx.fillStyle =
    "#d1b84e";

  ctx.fillText(
    `HUNGER ${Math.round(player.hunger)}`,
    32,
    96
  );

  const totalMinutes =
    Math.floor(
      performance.now() /
      1000 /
      4
    ) % 1440;

  const hour =
    Math.floor(
      totalMinutes / 60
    );

  const minute =
    totalMinutes % 60;

  ctx.fillStyle =
    "#fff";

  ctx.fillText(
    `DAY 1   ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    32,
    118
  );

  ctx.textAlign =
    "right";

  if (
    player.inCar
  ) {
    ctx.fillText(
      "VEHICLE",
      canvas.width - 25,
      35
    );
  }

  if (
    mode === "interior"
  ) {
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

  if (
    mode === "interior"
  ) {
    const b =
      currentBuilding;

    if (b) {
      const d =
        getDoor(b);

      const distance =
        Math.hypot(
          player.x - d.x,
          player.y -
            (b.y + b.h - 38)
        );

      if (
        distance < 65
      ) {
        text =
          "INTERACT  •  EXIT";
      }
    }
  } else if (
    player.inCar
  ) {
    text =
      "INTERACT  •  EXIT VEHICLE";
  } else {
    const car =
      nearestCar();

    if (car) {
      text =
        "INTERACT  •  ENTER VEHICLE";
    } else if (
      nearDoor()
    ) {
      text =
        "INTERACT  •  ENTER BUILDING";
    }
  }

  if (!text) {
    return;
  }

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,0.72)";

  ctx.fillRect(
    canvas.width / 2 - 150,
    canvas.height - 62,
    300,
    40
  );

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 14px Arial";

  ctx.textAlign =
    "center";

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

  if (
    mode === "outside"
  ) {
    if (
      player.inCar
    ) {
      const speed = 5.4;

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
        input.x *
          player.speed,
        input.y *
          player.speed
      );
    }

    updateZombies();
  } else {
    moveInterior(
      input.x *
        player.speed,
      input.y *
        player.speed
    );
  }

  player.hunger -=
    dt * 0.0007;

  player.hunger =
    clamp(
      player.hunger,
      0,
      100
    );

  if (
    player.hunger <= 0
  ) {
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

  /*
    Player berada kira-kira 60% layar.
  */

  const screenX =
    canvas.width / 2;

  const screenY =
    canvas.height * 0.60;

  ctx.translate(
    Math.round(
      screenX - camera.x
    ),
    Math.round(
      screenY - camera.y
    )
  );

  if (
    mode === "outside"
  ) {
    drawGround();
    drawRoads();

    for (
      const b of buildings
    ) {
      drawBuilding(b);
    }

    for (
      const t of trees
    ) {
      drawTree(t);
    }

    for (
      const car of cars
    ) {
      drawCar(car);
    }

    for (
      const z of zombies
    ) {
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

  lastTime =
    now;

  update(dt);
  draw();

  requestAnimationFrame(
    loop
  );
}

/* =========================================================
   START
========================================================= */

requestAnimationFrame(
  loop
);