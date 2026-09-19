const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("joystick-stick");
const interactBtn = document.getElementById("interact");
const fullscreenBtn = document.getElementById("fullscreen");

canvas.width = 1280;
canvas.height = 720;

const W = 2600;
const H = 1900;

const MAP_MARGIN = 25;

let keys = {};
let joyX = 0;
let joyY = 0;
let joyActive = false;

let camera = { x: 0, y: 0 };

let mode = "outside";
let currentBuilding = null;

let timeMinutes = 13 * 60;
let day = 1;

let hp = 100;
let hunger = 100;

const player = {
  x: 1300,
  y: 950,
  r: 16,
  speed: 3,
  angle: 0,
  inCar: false,
  car: null
};

// =====================================================
// BUILDINGS
// =====================================================

const buildings = [
  {
    id: 1,
    x: 850,
    y: 520,
    w: 500,
    h: 330,
    door: { x: 1075, w: 70 }
  },

  {
    id: 2,
    x: 1500,
    y: 450,
    w: 430,
    h: 300,
    door: { x: 1680, w: 70 }
  },

  {
    id: 3,
    x: 450,
    y: 1050,
    w: 430,
    h: 320,
    door: { x: 630, w: 70 }
  },

  {
    id: 4,
    x: 1750,
    y: 1050,
    w: 470,
    h: 330,
    door: { x: 1950, w: 70 }
  }
];

// =====================================================
// CARS
// =====================================================

const cars = [
  { x: 600, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 930, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 1500, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 2050, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 400, y: 800, w: 78, h: 42, angle: Math.PI / 2, occupied: false },
  { x: 2200, y: 850, w: 78, h: 42, angle: Math.PI / 2, occupied: false },
  { x: 1050, y: 1450, w: 78, h: 42, angle: 0, occupied: false }
];

// =====================================================
// TREES
// =====================================================

const trees = [
  { x: 300, y: 350, r: 32 },
  { x: 360, y: 500, r: 30 },
  { x: 400, y: 700, r: 34 },
  { x: 300, y: 1500, r: 34 },
  { x: 1000, y: 1550, r: 32 },
  { x: 1450, y: 1450, r: 30 },
  { x: 2200, y: 500, r: 35 },
  { x: 2350, y: 700, r: 30 },
  { x: 2350, y: 1500, r: 35 },
  { x: 1500, y: 1650, r: 32 },
  { x: 700, y: 1650, r: 35 }
];

// =====================================================
// RUBBLE
// =====================================================

const rubble = [
  { x: 550, y: 500, w: 55, h: 35 },
  { x: 2100, y: 950, w: 60, h: 38 },
  { x: 1100, y: 350, w: 55, h: 35 },
  { x: 1250, y: 1500, w: 65, h: 40 },
  { x: 350, y: 900, w: 55, h: 40 }
];

// =====================================================
// ZOMBIES
// =====================================================

const zombies = [
  { x: 500, y: 450, r: 14, speed: 0.55 },
  { x: 1450, y: 900, r: 14, speed: 0.55 },
  { x: 2050, y: 900, r: 14, speed: 0.55 },
  { x: 700, y: 1500, r: 14, speed: 0.55 },
  { x: 2300, y: 1200, r: 14, speed: 0.55 },
  { x: 1500, y: 1100, r: 14, speed: 0.55 },
  { x: 300, y: 1100, r: 14, speed: 0.55 },
  { x: 2100, y: 1550, r: 14, speed: 0.55 }
];

// =====================================================
// INTERIOR FURNITURE
// =====================================================

function getInterior(building) {
  return [
    {
      x: building.x + 70,
      y: building.y + 70,
      w: 120,
      h: 55,
      type: "bed"
    },

    {
      x: building.x + building.w - 150,
      y: building.y + 70,
      w: 80,
      h: 100,
      type: "cabinet"
    },

    {
      x: building.x + 170,
      y: building.y + 190,
      w: 100,
      h: 60,
      type: "table"
    },

    {
      x: building.x + building.w - 200,
      y: building.y + 205,
      w: 110,
      h: 55,
      type: "table"
    }
  ];
}

// =====================================================
// BASIC COLLISION
// =====================================================

function circleRectCollision(cx, cy, radius, rect) {
  const nearestX = Math.max(
    rect.x,
    Math.min(cx, rect.x + rect.w)
  );

  const nearestY = Math.max(
    rect.y,
    Math.min(cy, rect.y + rect.h)
  );

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < radius * radius;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleCircleCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const distanceSquared = dx * dx + dy * dy;
  const radius = a.r + b.r;

  return distanceSquared < radius * radius;
}

// =====================================================
// BUILDING WALLS
// =====================================================

function getBuildingWalls(b) {
  const wall = 24;

  const bottomY = b.y + b.h - wall;

  return [
    // TOP
    {
      x: b.x,
      y: b.y,
      w: b.w,
      h: wall
    },

    // LEFT
    {
      x: b.x,
      y: b.y,
      w: wall,
      h: b.h
    },

    // RIGHT
    {
      x: b.x + b.w - wall,
      y: b.y,
      w: wall,
      h: b.h
    },

    // BOTTOM LEFT
    {
      x: b.x,
      y: bottomY,
      w: b.door.x - b.x,
      h: wall
    },

    // BOTTOM RIGHT
    {
      x: b.door.x + b.door.w,
      y: bottomY,
      w:
        b.x +
        b.w -
        (b.door.x + b.door.w),
      h: wall
    }
  ];
}

// =====================================================
// OUTSIDE COLLISION
// =====================================================

function outsideBlocked(x, y, radius, ignoreCar = null) {

  // MAP BORDER
  if (x - radius < MAP_MARGIN) return true;
  if (y - radius < MAP_MARGIN) return true;
  if (x + radius > W - MAP_MARGIN) return true;
  if (y + radius > H - MAP_MARGIN) return true;

  // BUILDINGS
  for (const b of buildings) {
    const walls = getBuildingWalls(b);

    for (const wall of walls) {
      if (circleRectCollision(x, y, radius, wall)) {
        return true;
      }
    }
  }

  // TREES
  for (const tree of trees) {
    const dx = x - tree.x;
    const dy = y - tree.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius + tree.r * 0.75) {
      return true;
    }
  }

  // RUBBLE
  for (const r of rubble) {
    if (
      circleRectCollision(
        x,
        y,
        radius,
        r
      )
    ) {
      return true;
    }
  }

  // OTHER CARS
  for (const car of cars) {

    if (car === ignoreCar) continue;
    if (car.occupied && car === player.car) continue;

    const hitRadius =
      Math.max(car.w, car.h) * 0.55;

    const dx = x - car.x;
    const dy = y - car.y;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    if (distance < radius + hitRadius) {
      return true;
    }
  }

  return false;
}

// =====================================================
// INTERIOR COLLISION
// =====================================================

function interiorBlocked(x, y, radius) {

  if (!currentBuilding) return true;

  const b = currentBuilding;
  const wall = 24;

  // TOP
  if (y - radius < b.y + wall) {
    return true;
  }

  // LEFT
  if (x - radius < b.x + wall) {
    return true;
  }

  // RIGHT
  if (x + radius > b.x + b.w - wall) {
    return true;
  }

  // BOTTOM WALL
  const doorLeft = b.door.x;
  const doorRight = b.door.x + b.door.w;

  const playerOverDoor =
    x > doorLeft + 4 &&
    x < doorRight - 4;

  if (
    y + radius > b.y + b.h - wall &&
    !playerOverDoor
  ) {
    return true;
  }

  // FURNITURE
  const furniture = getInterior(b);

  for (const item of furniture) {
    if (
      circleRectCollision(
        x,
        y,
        radius,
        item
      )
    ) {
      return true;
    }
  }

  return false;
}

// =====================================================
// SAFE MOVEMENT
// =====================================================

function moveOutside(dx, dy) {

  const distance =
    Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.001) return;

  // Small substeps prevent tunneling
  const steps =
    Math.max(1, Math.ceil(distance / 2));

  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {

    const nx = player.x + sx;

    if (
      !outsideBlocked(
        nx,
        player.y,
        player.r,
        player.inCar ? player.car : null
      )
    ) {
      player.x = nx;
    }

    const ny = player.y + sy;

    if (
      !outsideBlocked(
        player.x,
        ny,
        player.r,
        player.inCar ? player.car : null
      )
    ) {
      player.y = ny;
    }
  }
}

function moveInside(dx, dy) {

  const distance =
    Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.001) return;

  const steps =
    Math.max(1, Math.ceil(distance / 2));

  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {

    const nx = player.x + sx;

    if (
      !interiorBlocked(
        nx,
        player.y,
        player.r
      )
    ) {
      player.x = nx;
    }

    const ny = player.y + sy;

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
}

// =====================================================
// CAR COLLISION
// =====================================================

function carBlocked(car, x, y) {

  const halfW = car.w / 2;
  const halfH = car.h / 2;

  // MAP
  if (
    x - halfW < MAP_MARGIN ||
    x + halfW > W - MAP_MARGIN ||
    y - halfH < MAP_MARGIN ||
    y + halfH > H - MAP_MARGIN
  ) {
    return true;
  }

  // BUILDINGS
  const testRect = {
    x: x - halfW,
    y: y - halfH,
    w: car.w,
    h: car.h
  };

  for (const b of buildings) {

    const walls =
      getBuildingWalls(b);

    for (const wall of walls) {
      if (rectsOverlap(testRect, wall)) {
        return true;
      }
    }
  }

  // TREES
  const carRadius =
    Math.max(halfW, halfH);

  for (const tree of trees) {

    const dx = x - tree.x;
    const dy = y - tree.y;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    if (
      distance <
      carRadius + tree.r * 0.75
    ) {
      return true;
    }
  }

  // RUBBLE
  for (const r of rubble) {

    if (
      rectsOverlap(
        testRect,
        r
      )
    ) {
      return true;
    }
  }

  // OTHER CARS
  for (const other of cars) {

    if (other === car) continue;

    const otherRadius =
      Math.max(
        other.w,
        other.h
      ) * 0.55;

    const dx =
      x - other.x;

    const dy =
      y - other.y;

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    if (
      distance <
      carRadius +
      otherRadius
    ) {
      return true;
    }
  }

  return false;
}

function driveCar(car, dx, dy) {

  const length =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (length < 0.05) return;

  const speed = 5;

  const moveX =
    dx / length * speed;

  const moveY =
    dy / length * speed;

  const distance =
    Math.sqrt(
      moveX * moveX +
      moveY * moveY
    );

  const steps =
    Math.max(
      1,
      Math.ceil(distance / 2)
    );

  const sx =
    moveX / steps;

  const sy =
    moveY / steps;

  for (let i = 0; i < steps; i++) {

    const nx = car.x + sx;
    const ny = car.y + sy;

    if (
      carBlocked(
        car,
        nx,
        ny
      )
    ) {
      break;
    }

    car.x = nx;
    car.y = ny;
  }

  car.angle =
    Math.atan2(
      dy,
      dx
    );

  player.x = car.x;
  player.y = car.y;
}

// =====================================================
// DOOR DETECTION
// =====================================================

function distanceToDoor(b) {

  const doorCenterX =
    b.door.x +
    b.door.w / 2;

  const doorOutsideY =
    b.y +
    b.h +
    35;

  const dx =
    player.x -
    doorCenterX;

  const dy =
    player.y -
    doorOutsideY;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );
}

function nearBuildingDoor() {

  if (mode !== "outside") {
    return null;
  }

  let closest = null;
  let best = 65;

  for (const b of buildings) {

    const distance =
      distanceToDoor(b);

    if (
      distance < best
    ) {
      best = distance;
      closest = b;
    }
  }

  return closest;
}

// =====================================================
// ENTER BUILDING
// =====================================================

function enterBuilding(b) {

  if (
    mode !== "outside" ||
    player.inCar
  ) {
    return;
  }

  if (
    distanceToDoor(b) > 65
  ) {
    return;
  }

  currentBuilding = b;
  mode = "interior";

  const centerX =
    b.door.x +
    b.door.w / 2;

  // Spawn clearly inside
  player.x = centerX;
  player.y = b.y + b.h - 55;

  player.inCar = false;
  player.car = null;
}

// =====================================================
// EXIT BUILDING
// =====================================================

function playerAtInteriorDoor() {

  if (
    mode !== "interior" ||
    !currentBuilding
  ) {
    return false;
  }

  const b = currentBuilding;

  const centerX =
    b.door.x +
    b.door.w / 2;

  const dx =
    Math.abs(
      player.x - centerX
    );

  const doorInsideY =
    b.y + b.h - 55;

  const dy =
    Math.abs(
      player.y - doorInsideY
    );

  return (
    dx < 48 &&
    dy < 45
  );
}

function exitBuilding() {

  if (
    mode !== "interior" ||
    !currentBuilding
  ) {
    return;
  }

  // IMPORTANT:
  // INTERACT ONLY WORKS AT THE DOOR
  if (!playerAtInteriorDoor()) {
    return;
  }

  const b = currentBuilding;

  const outsideX =
    b.door.x +
    b.door.w / 2;

  const outsideY =
    b.y +
    b.h +
    45;

  mode = "outside";
  currentBuilding = null;

  player.x = outsideX;
  player.y = outsideY;
}

// =====================================================
// CAR DETECTION
// =====================================================

function nearCar() {

  if (
    mode !== "outside" ||
    player.inCar
  ) {
    return null;
  }

  let closest = null;
  let best = 70;

  for (const car of cars) {

    if (car.occupied) {
      continue;
    }

    const dx =
      player.x - car.x;

    const dy =
      player.y - car.y;

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    if (
      distance < best
    ) {
      best = distance;
      closest = car;
    }
  }

  return closest;
}

// =====================================================
// ENTER / EXIT CAR
// =====================================================

function enterCar(car) {

  if (
    mode !== "outside" ||
    player.inCar ||
    !car
  ) {
    return;
  }

  const dx =
    player.x - car.x;

  const dy =
    player.y - car.y;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (distance > 70) {
    return;
  }

  player.inCar = true;
  player.car = car;

  car.occupied = true;

  player.x = car.x;
  player.y = car.y;
}

function exitCar() {

  if (
    !player.inCar ||
    !player.car
  ) {
    return;
  }

  const car = player.car;

  // Try several safe positions around car
  const spots = [
    {
      x: car.x + 65,
      y: car.y
    },

    {
      x: car.x - 65,
      y: car.y
    },

    {
      x: car.x,
      y: car.y + 65
    },

    {
      x: car.x,
      y: car.y - 65
    }
  ];

  for (const spot of spots) {

    if (
      !outsideBlocked(
        spot.x,
        spot.y,
        player.r,
        car
      )
    ) {

      player.inCar = false;
      player.car = null;

      car.occupied = false;

      player.x = spot.x;
      player.y = spot.y;

      return;
    }
  }

  // No safe exit position:
  // stay inside car.
}

// =====================================================
// INTERACT
// =====================================================

function interact() {

  // ---------------------------------------------
  // INSIDE BUILDING
  // ---------------------------------------------

  if (mode === "interior") {

    // DO NOT EXIT FROM RANDOM LOCATION
    if (
      playerAtInteriorDoor()
    ) {
      exitBuilding();
    }

    return;
  }

  // ---------------------------------------------
  // INSIDE CAR
  // ---------------------------------------------

  if (player.inCar) {
    exitCar();
    return;
  }

  // ---------------------------------------------
  // CAR
  // ---------------------------------------------

  const car = nearCar();

  if (car) {
    enterCar(car);
    return;
  }

  // ---------------------------------------------
  // BUILDING
  // ---------------------------------------------

  const building =
    nearBuildingDoor();

  if (building) {
    enterBuilding(building);
  }
}

// =====================================================
// KEYBOARD
// =====================================================

window.addEventListener(
  "keydown",
  e => {

    keys[
      e.key.toLowerCase()
    ] = true;

    if (
      e.key.toLowerCase() === "e" ||
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

// =====================================================
// JOYSTICK
// =====================================================

function updateJoystick(
  clientX,
  clientY
) {

  const rect =
    joystick.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  let dx =
    clientX - centerX;

  let dy =
    clientY - centerY;

  const max =
    rect.width * 0.32;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (distance > max) {

    dx =
      dx / distance * max;

    dy =
      dy / distance * max;
  }

  joyX = dx / max;
  joyY = dy / max;

  stick.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener(
  "pointerdown",
  e => {

    joyActive = true;

    joystick.setPointerCapture(
      e.pointerId
    );

    updateJoystick(
      e.clientX,
      e.clientY
    );
  }
);

joystick.addEventListener(
  "pointermove",
  e => {

    if (!joyActive) return;

    updateJoystick(
      e.clientX,
      e.clientY
    );
  }
);

function resetJoystick() {

  joyActive = false;
  joyX = 0;
  joyY = 0;

  stick.style.transform =
    "translate(0px, 0px)";
}

joystick.addEventListener(
  "pointerup",
  resetJoystick
);

joystick.addEventListener(
  "pointercancel",
  resetJoystick
);

if (interactBtn) {

  interactBtn.addEventListener(
    "pointerdown",
    e => {

      e.preventDefault();

      interact();
    }
  );
}

// =====================================================
// FULLSCREEN
// =====================================================

if (fullscreenBtn) {

  fullscreenBtn.addEventListener(
    "click",
    async () => {

      try {

        if (
          !document.fullscreenElement
        ) {

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

        } else {

          await document.exitFullscreen();
        }

      } catch (error) {

        console.log(
          "Fullscreen:",
          error
        );
      }
    }
  );
}

// =====================================================
// INPUT
// =====================================================

function getInput() {

  let x = joyX;
  let y = joyY;

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

  const length =
    Math.sqrt(
      x * x +
      y * y
    );

  if (length > 1) {

    x /= length;
    y /= length;
  }

  return { x, y };
}

// =====================================================
// ZOMBIE COLLISION
// =====================================================

function zombieBlocked(
  x,
  y,
  radius
) {

  return outsideBlocked(
    x,
    y,
    radius
  );
}

function updateZombies() {

  if (
    mode !== "outside" ||
    player.inCar
  ) {
    return;
  }

  for (const z of zombies) {

    const dx =
      player.x - z.x;

    const dy =
      player.y - z.y;

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    if (
      distance <= 1 ||
      distance > 420
    ) {
      continue;
    }

    const vx =
      dx / distance *
      z.speed;

    const vy =
      dy / distance *
      z.speed;

    const nx =
      z.x + vx;

    const ny =
      z.y + vy;

    if (
      !zombieBlocked(
        nx,
        z.y,
        z.r
      )
    ) {
      z.x = nx;
    }

    if (
      !zombieBlocked(
        z.x,
        ny,
        z.r
      )
    ) {
      z.y = ny;
    }
  }
}

// =====================================================
// UPDATE
// =====================================================

function update() {

  const input =
    getInput();

  // ---------------------------------------------
  // CAR
  // ---------------------------------------------

  if (
    player.inCar &&
    player.car
  ) {

    driveCar(
      player.car,
      input.x,
      input.y
    );

  }

  // ---------------------------------------------
  // PLAYER
  // ---------------------------------------------

  else {

    const speed =
      mode === "interior"
        ? 2.7
        : player.speed;

    const dx =
      input.x * speed;

    const dy =
      input.y * speed;

    if (
      mode === "interior"
    ) {

      moveInside(
        dx,
        dy
      );

    } else {

      moveOutside(
        dx,
        dy
      );
    }

    if (
      Math.abs(input.x) > 0.05 ||
      Math.abs(input.y) > 0.05
    ) {

      player.angle =
        Math.atan2(
          input.y,
          input.x
        );
    }
  }

  updateZombies();

  // TIME
  timeMinutes += 0.04;

  if (
    timeMinutes >= 1440
  ) {

    timeMinutes = 0;
    day++;
  }

  hunger -= 0.0008;

  if (hunger < 0) {

    hunger = 0;
    hp -= 0.002;
  }
}

// =====================================================
// CAMERA
// =====================================================

function updateCamera() {

  const targetX =
    player.x;

  const targetY =
    player.y - 100;

  camera.x +=
    (
      targetX -
      canvas.width / 2 -
      camera.x
    ) * 0.10;

  camera.y +=
    (
      targetY -
      canvas.height * 0.60 -
      camera.y
    ) * 0.10;

  camera.x =
    Math.max(
      0,
      Math.min(
        camera.x,
        W - canvas.width
      )
    );

  camera.y =
    Math.max(
      0,
      Math.min(
        camera.y,
        H - canvas.height
      )
    );
}

// =====================================================
// DRAW GROUND
// =====================================================

function drawGround() {

  ctx.fillStyle =
    "#17261b";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.fillStyle =
    "#36383a";

  ctx.fillRect(
    0,
    220,
    W,
    150
  );

  ctx.fillRect(
    1050,
    0,
    150,
    H
  );

  ctx.fillRect(
    0,
    880,
    W,
    130
  );

  ctx.strokeStyle =
    "#686868";

  ctx.lineWidth = 4;

  ctx.setLineDash(
    [40, 30]
  );

  ctx.beginPath();
  ctx.moveTo(
    0,
    295
  );
  ctx.lineTo(
    W,
    295
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    1125,
    0
  );
  ctx.lineTo(
    1125,
    H
  );
  ctx.stroke();

  ctx.setLineDash([]);
}

// =====================================================
// DRAW BUILDING
// =====================================================

function drawBuilding(b) {

  ctx.fillStyle =
    "#77756f";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  ctx.fillStyle =
    "#55534f";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    28
  );

  ctx.fillStyle =
    "#26383b";

  for (
    let x = b.x + 55;
    x < b.x + b.w - 35;
    x += 80
  ) {

    ctx.fillRect(
      x,
      b.y + 80,
      38,
      48
    );
  }

  // DOOR
  ctx.fillStyle =
    "#34271f";

  ctx.fillRect(
    b.door.x,
    b.y + b.h - 35,
    b.door.w,
    35
  );
}

// =====================================================
// DRAW INTERIOR
// =====================================================

function drawInterior() {

  if (!currentBuilding) return;

  const b =
    currentBuilding;

  // FLOOR
  ctx.fillStyle =
    "#8b887f";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // WALLS
  ctx.fillStyle =
    "#4a4844";

  const walls =
    getBuildingWalls(b);

  for (const wall of walls) {

    ctx.fillRect(
      wall.x,
      wall.y,
      wall.w,
      wall.h
    );
  }

  // FURNITURE
  const furniture =
    getInterior(b);

  for (const f of furniture) {

    if (
      f.type === "bed"
    ) {

      ctx.fillStyle =
        "#51484a";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle =
        "#aaa5a0";

      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        25
      );
    }

    if (
      f.type === "cabinet"
    ) {

      ctx.fillStyle =
        "#4a3930";

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
        "#4b382c";

      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }
  }

  // DOOR
  ctx.fillStyle =
    "#33251d";

  ctx.fillRect(
    b.door.x,
    b.y + b.h - 24,
    b.door.w,
    24
  );
}

// =====================================================
// DRAW TREES
// =====================================================

function drawTrees() {

  for (const t of trees) {

    ctx.fillStyle =
      "#102318";

    ctx.beginPath();

    ctx.arc(
      t.x + 7,
      t.y + 10,
      t.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "#315c39";

    ctx.beginPath();

    ctx.arc(
      t.x,
      t.y,
      t.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "#624934";

    ctx.fillRect(
      t.x - 7,
      t.y + 20,
      14,
      28
    );
  }
}

// =====================================================
// DRAW RUBBLE
// =====================================================

function drawRubble() {

  for (const r of rubble) {

    ctx.fillStyle =
      "#555653";

    ctx.fillRect(
      r.x,
      r.y,
      r.w,
      r.h
    );

    ctx.fillStyle =
      "#777872";

    ctx.fillRect(
      r.x + 8,
      r.y + 7,
      r.w - 18,
      7
    );
  }
}

// =====================================================
// DRAW CARS
// =====================================================

function drawCars() {

  for (const car of cars) {

    ctx.save();

    ctx.translate(
      car.x,
      car.y
    );

    ctx.rotate(
      car.angle
    );

    ctx.fillStyle =
      car.occupied
        ? "#9a7350"
        : "#6d7475";

    ctx.fillRect(
      -car.w / 2,
      -car.h / 2,
      car.w,
      car.h
    );

    ctx.fillStyle =
      "#27363a";

    ctx.fillRect(
      -20,
      -15,
      40,
      30
    );

    ctx.fillStyle =
      "#171918";

    ctx.fillRect(
      -car.w / 2 - 5,
      -car.h / 2,
      8,
      12
    );

    ctx.fillRect(
      -car.w / 2 - 5,
      car.h / 2 - 12,
      8,
      12
    );

    ctx.fillRect(
      car.w / 2 - 3,
      -car.h / 2,
      8,
      12
    );

    ctx.fillRect(
      car.w / 2 - 3,
      car.h / 2 - 12,
      8,
      12
    );

    ctx.restore();
  }
}

// =====================================================
// DRAW ZOMBIES
// =====================================================

function drawZombies() {

  if (
    mode === "interior"
  ) {
    return;
  }

  for (const z of zombies) {

    ctx.fillStyle =
      "#514e47";

    ctx.beginPath();

    ctx.arc(
      z.x,
      z.y,
      z.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "#292927";

    ctx.fillRect(
      z.x - 10,
      z.y + 10,
      20,
      22
    );
  }
}

// =====================================================
// DRAW PLAYER
// =====================================================

function drawPlayer() {

  // Don't draw separate player
  // while physically inside car.
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

  // SHADOW
  ctx.fillStyle =
    "rgba(0,0,0,.35)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    17,
    20,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // BODY
  ctx.fillStyle =
    "#4d6470";

  ctx.fillRect(
    -13,
    -5,
    26,
    30
  );

  // HEAD
  ctx.fillStyle =
    "#b59a83";

  ctx.beginPath();

  ctx.arc(
    0,
    -16,
    13,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // STATIC LEGS
  ctx.fillStyle =
    "#24282a";

  ctx.fillRect(
    -10,
    22,
    8,
    18
  );

  ctx.fillRect(
    2,
    22,
    8,
    18
  );

  ctx.restore();
}

// =====================================================
// HUD
// =====================================================

function drawHUD() {

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,.65)";

  ctx.fillRect(
    18,
    18,
    250,
    105
  );

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 22px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    32,
    45
  );

  ctx.font =
    "14px Arial";

  ctx.fillText(
    "HP",
    32,
    70
  );

  ctx.fillText(
    "HUNGER",
    32,
    98
  );

  ctx.fillStyle =
    "#333";

  ctx.fillRect(
    78,
    59,
    130,
    13
  );

  ctx.fillRect(
    78,
    87,
    130,
    13
  );

  ctx.fillStyle =
    "#c95757";

  ctx.fillRect(
    78,
    59,
    130 *
      Math.max(
        0,
        hp / 100
      ),
    13
  );

  ctx.fillStyle =
    "#c5a847";

  ctx.fillRect(
    78,
    87,
    130 *
      Math.max(
        0,
        hunger / 100
      ),
    13
  );

  const hour =
    Math.floor(
      timeMinutes / 60
    );

  const minute =
    Math.floor(
      timeMinutes % 60
    );

  const timeText =
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  ctx.fillStyle =
    "#d0b85c";

  ctx.font =
    "bold 18px Arial";

  ctx.fillText(
    `DAY ${day}  ${timeText}`,
    1070,
    43
  );

  ctx.restore();
}

// =====================================================
// PROMPT
// =====================================================

function drawPrompt() {

  let text = "";

  if (
    mode === "interior"
  ) {

    if (
      playerAtInteriorDoor()
    ) {
      text =
        "INTERACT  •  KELUAR";
    }

  } else if (
    player.inCar
  ) {

    text =
      "INTERACT  •  KELUAR MOBIL";

  } else if (
    nearCar()
  ) {

    text =
      "INTERACT  •  MASUK MOBIL";

  } else if (
    nearBuildingDoor()
  ) {

    text =
      "INTERACT  •  MASUK";
  }

  if (!text) return;

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,.70)";

  ctx.fillRect(
    canvas.width / 2 - 145,
    canvas.height - 65,
    290,
    40
  );

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 15px Arial";

  ctx.textAlign =
    "center";

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height - 39
  );

  ctx.restore();
}

// =====================================================
// RENDER
// =====================================================

function render() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.save();

  ctx.translate(
    -camera.x,
    -camera.y
  );

  if (
    mode === "outside"
  ) {

    drawGround();

    for (
      const b of buildings
    ) {
      drawBuilding(b);
    }

    drawRubble();
    drawTrees();
    drawCars();
    drawZombies();
    drawPlayer();

  } else {

    drawInterior();
    drawPlayer();
  }

  ctx.restore();

  drawHUD();
  drawPrompt();
}

// =====================================================
// GAME LOOP
// =====================================================

function loop() {

  update();
  updateCamera();
  render();

  requestAnimationFrame(
    loop
  );
}

loop();