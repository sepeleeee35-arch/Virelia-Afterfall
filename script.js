// ================================================
// VIRELIA: AFTERFALL
// MOBILE LANDSCAPE + ANALOG BUILD
// ================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const joystick = document.getElementById("joystick");
const stick = document.getElementById("joystick-stick");
const interactButton = document.getElementById("interact");
const fullscreenButton = document.getElementById("fullscreen");

// ------------------------------------------------
// CANVAS
// ------------------------------------------------

const VIEW_W = 1280;
const VIEW_H = 720;

canvas.width = VIEW_W;
canvas.height = VIEW_H;

const WORLD_W = 2600;
const WORLD_H = 1900;

// ------------------------------------------------
// GAME STATE
// ------------------------------------------------

let lastTime = performance.now();
let elapsed = 0;

let mode = "outside";

let currentBuilding = null;

let message = "";
let messageTimer = 0;

// ------------------------------------------------
// PLAYER
// ------------------------------------------------

const player = {
  x: 1300,
  y: 980,

  radius: 15,

  speed: 205,

  hp: 100,
  hunger: 100,

  angle: 0,

  car: null
};

// ------------------------------------------------
// ANALOG
// ------------------------------------------------

const analog = {
  active: false,
  pointerId: null,

  x: 0,
  y: 0,

  power: 0
};

function updateAnalog(clientX, clientY) {

  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const maxDistance = rect.width * 0.38;

  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance) {
    dx = dx / distance * maxDistance;
    dy = dy / distance * maxDistance;
  }

  analog.x = dx / maxDistance;
  analog.y = dy / maxDistance;

  analog.power = Math.min(1, Math.hypot(analog.x, analog.y));

  const stickX = analog.x * maxDistance;
  const stickY = analog.y * maxDistance;

  stick.style.transform =
    `translate(${stickX}px, ${stickY}px)`;
}

function resetAnalog() {

  analog.active = false;
  analog.pointerId = null;

  analog.x = 0;
  analog.y = 0;
  analog.power = 0;

  stick.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerdown", e => {

  e.preventDefault();

  analog.active = true;
  analog.pointerId = e.pointerId;

  joystick.setPointerCapture(e.pointerId);

  updateAnalog(e.clientX, e.clientY);
});

joystick.addEventListener("pointermove", e => {

  if (!analog.active) return;

  if (e.pointerId !== analog.pointerId) return;

  e.preventDefault();

  updateAnalog(e.clientX, e.clientY);
});

joystick.addEventListener("pointerup", e => {

  if (e.pointerId === analog.pointerId) {
    resetAnalog();
  }
});

joystick.addEventListener("pointercancel", resetAnalog);

// ------------------------------------------------
// WORLD
// ------------------------------------------------

const roads = [

  {
    x: 0,
    y: 800,
    w: WORLD_W,
    h: 190
  },

  {
    x: 1100,
    y: 0,
    w: 190,
    h: WORLD_H
  }

];

const buildings = [

  {
    x: 250,
    y: 280,
    w: 340,
    h: 260,
    doorX: 420,
    doorY: 550
  },

  {
    x: 720,
    y: 220,
    w: 280,
    h: 300,
    doorX: 860,
    doorY: 530
  },

  {
    x: 1500,
    y: 240,
    w: 340,
    h: 260,
    doorX: 1670,
    doorY: 510
  },

  {
    x: 1990,
    y: 350,
    w: 300,
    h: 270,
    doorX: 2140,
    doorY: 630
  },

  {
    x: 260,
    y: 1200,
    w: 310,
    h: 270,
    doorX: 415,
    doorY: 1190
  },

  {
    x: 720,
    y: 1320,
    w: 300,
    h: 250,
    doorX: 870,
    doorY: 1310
  },

  {
    x: 1530,
    y: 1220,
    w: 350,
    h: 280,
    doorX: 1705,
    doorY: 1210
  }

];

// ------------------------------------------------
// CARS
// ------------------------------------------------

const cars = [

  {
    x: 650,
    y: 875,
    angle: 0,
    occupied: false
  },

  {
    x: 900,
    y: 920,
    angle: 0,
    occupied: false
  },

  {
    x: 1370,
    y: 875,
    angle: 0,
    occupied: false
  },

  {
    x: 1660,
    y: 930,
    angle: 0,
    occupied: false
  },

  {
    x: 2010,
    y: 860,
    angle: 0,
    occupied: false
  },

  {
    x: 1170,
    y: 1170,
    angle: 0,
    occupied: false
  },

  {
    x: 1370,
    y: 1450,
    angle: 0,
    occupied: false
  }

];

// ------------------------------------------------
// TREES
// ------------------------------------------------

const trees = [

  [100,180],
  [180,650],
  [100,1120],
  [620,160],
  [1120,160],
  [1370,150],
  [1840,170],
  [2300,200],
  [2320,700],
  [2160,1120],
  [2290,1510],
  [1180,1580],
  [1010,1460],
  [580,1600],
  [120,1600],
  [1370,620],
  [1830,720],
  [700,650],
  [1980,1460],
  [2100,1250]

].map(([x,y]) => ({
  x,
  y,
  r: 27
}));

// ------------------------------------------------
// RUBBLE
// ------------------------------------------------

const rubble = [

  [650,700],
  [780,1060],
  [980,690],
  [1420,700],
  [1790,700],
  [1870,1040],
  [1160,1320],
  [1300,500]

].map(([x,y]) => ({
  x,
  y,
  r: 18
}));

// ------------------------------------------------
// ZOMBIES
// ------------------------------------------------

const zombies = [

  [500,720],
  [680,1080],
  [920,700],
  [1100,620],
  [1330,650],
  [1530,760],
  [1770,1080],
  [2040,760]

].map(([x,y], i) => ({

  x,
  y,

  radius: 14,

  speed: 42 + i % 3 * 5,

  wander: Math.random() * Math.PI * 2,

  attack: 0

}));

// ------------------------------------------------
// CAMERA
// ------------------------------------------------

const camera = {

  x: 0,
  y: 0,

  smooth: 0.13

};

// ------------------------------------------------
// COLLISION
// ------------------------------------------------

function circleRectCollision(cx, cy, r, rect) {

  const nearestX =
    Math.max(rect.x, Math.min(cx, rect.x + rect.w));

  const nearestY =
    Math.max(rect.y, Math.min(cy, rect.y + rect.h));

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < r * r;
}

function blocked(x, y, radius) {

  for (const b of buildings) {

    if (
      circleRectCollision(
        x,
        y,
        radius,
        b
      )
    ) {
      return true;
    }

  }

  for (const t of trees) {

    const dx = x - t.x;
    const dy = y - t.y;

    if (
      dx * dx +
      dy * dy <
      (radius + t.r) *
      (radius + t.r)
    ) {
      return true;
    }

  }

  for (const r of rubble) {

    const dx = x - r.x;
    const dy = y - r.y;

    if (
      dx * dx +
      dy * dy <
      (radius + r.r) *
      (radius + r.r)
    ) {
      return true;
    }

  }

  return false;
}

// ------------------------------------------------
// MOVEMENT
// ------------------------------------------------

function movePlayer(dx, dy) {

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (!blocked(nextX, player.y, player.radius)) {
    player.x = nextX;
  }

  if (!blocked(player.x, nextY, player.radius)) {
    player.y = nextY;
  }

  player.x =
    Math.max(
      25,
      Math.min(
        WORLD_W - 25,
        player.x
      )
    );

  player.y =
    Math.max(
      25,
      Math.min(
        WORLD_H - 25,
        player.y
      )
    );
}

// ------------------------------------------------
// OUTSIDE UPDATE
// ------------------------------------------------

function updateOutside(dt) {

  const inputX = analog.x;
  const inputY = analog.y;

  if (analog.power > 0.05) {

    const length =
      Math.hypot(inputX, inputY);

    const nx = inputX / length;
    const ny = inputY / length;

    player.angle =
      Math.atan2(ny, nx);

    if (player.car) {

      const car = player.car;

      const speed =
        330 * analog.power;

      const nextX =
        car.x + nx * speed * dt;

      const nextY =
        car.y + ny * speed * dt;

      if (!blocked(nextX, nextY, 25)) {

        car.x = nextX;
        car.y = nextY;

      }

      car.angle =
        Math.atan2(ny, nx);

      player.x = car.x;
      player.y = car.y;

    } else {

      const speed =
        player.speed * analog.power;

      movePlayer(
        nx * speed * dt,
        ny * speed * dt
      );

    }

  }
}

// ------------------------------------------------
// ZOMBIES
// ------------------------------------------------

function updateZombies(dt) {

  if (mode !== "outside") return;

  for (const z of zombies) {

    const dx =
      player.x - z.x;

    const dy =
      player.y - z.y;

    const distance =
      Math.hypot(dx, dy);

    if (
      distance < 430 &&
      distance > 40
    ) {

      const nx = dx / distance;
      const ny = dy / distance;

      const testX =
        z.x + nx * z.speed * dt;

      const testY =
        z.y + ny * z.speed * dt;

      if (!blocked(testX, testY, z.radius)) {

        z.x = testX;
        z.y = testY;

      } else {

        const sideX = -ny;
        const sideY = nx;

        const altX =
          z.x +
          sideX *
          z.speed *
          dt;

        const altY =
          z.y +
          sideY *
          z.speed *
          dt;

        if (!blocked(altX, altY, z.radius)) {

          z.x = altX;
          z.y = altY;

        }

      }

    } else {

      z.wander +=
        (Math.random() - 0.5) *
        dt;

      const wx =
        Math.cos(z.wander);

      const wy =
        Math.sin(z.wander);

      const nx =
        z.x +
        wx *
        z.speed *
        0.3 *
        dt;

      const ny =
        z.y +
        wy *
        z.speed *
        0.3 *
        dt;

      if (!blocked(nx, ny, z.radius)) {

        z.x = nx;
        z.y = ny;

      }

    }

    if (
      distance < 38 &&
      !player.car
    ) {

      z.attack -= dt;

      if (z.attack <= 0) {

        player.hp =
          Math.max(
            0,
            player.hp - 4
          );

        z.attack = 1.2;

        showMessage(
          "A zombie is nearby!"
        );

      }

    }

  }

}

// ------------------------------------------------
// INTERACTION
// ------------------------------------------------

function nearestCar() {

  let result = null;
  let best = Infinity;

  for (const car of cars) {

    const distance =
      Math.hypot(
        player.x - car.x,
        player.y - car.y
      );

    if (
      distance < best &&
      distance < 90
    ) {

      best = distance;
      result = car;

    }

  }

  return result;
}

function nearestDoor() {

  let result = null;
  let best = Infinity;

  for (const building of buildings) {

    const distance =
      Math.hypot(
        player.x - building.doorX,
        player.y - building.doorY
      );

    if (
      distance < best &&
      distance < 80
    ) {

      best = distance;
      result = building;

    }

  }

  return result;
}

function interact() {

  // Inside building
  if (mode === "inside") {

    exitBuilding();

    return;
  }

  // Already driving
  if (player.car) {

    exitCar();

    return;
  }

  // Vehicle
  const car =
    nearestCar();

  if (car) {

    enterCar(car);

    return;
  }

  // Building
  const door =
    nearestDoor();

  if (door) {

    enterBuilding(door);

    return;
  }

  showMessage(
    "Nothing nearby"
  );
}

function enterCar(car) {

  player.car = car;

  car.occupied = true;

  player.x = car.x;
  player.y = car.y;

  showMessage(
    "Vehicle entered"
  );
}

function exitCar() {

  const car =
    player.car;

  if (!car) return;

  player.car = null;

  car.occupied = false;

  const sideX =
    Math.cos(
      car.angle + Math.PI / 2
    );

  const sideY =
    Math.sin(
      car.angle + Math.PI / 2
    );

  const exitX =
    car.x + sideX * 55;

  const exitY =
    car.y + sideY * 55;

  if (!blocked(exitX, exitY, 15)) {

    player.x = exitX;
    player.y = exitY;

  } else {

    player.x =
      car.x - sideX * 55;

    player.y =
      car.y - sideY * 55;

  }

  showMessage(
    "Exited vehicle"
  );
}

function enterBuilding(building) {

  currentBuilding =
    building;

  mode = "inside";

  showMessage(
    "Entered building"
  );
}

function exitBuilding() {

  if (!currentBuilding) return;

  player.x =
    currentBuilding.doorX;

  player.y =
    currentBuilding.doorY + 55;

  currentBuilding = null;

  mode = "outside";

  showMessage(
    "Exited building"
  );
}

// ------------------------------------------------
// INTERIOR
// ------------------------------------------------

const interiorPlayer = {

  x: 640,
  y: 580

};

function updateInterior(dt) {

  const inputX =
    analog.x;

  const inputY =
    analog.y;

  const power =
    analog.power;

  if (power > 0.05) {

    interiorPlayer.x +=
      inputX *
      180 *
      power *
      dt;

    interiorPlayer.y +=
      inputY *
      180 *
      power *
      dt;

  }

  interiorPlayer.x =
    Math.max(
      60,
      Math.min(
        VIEW_W - 60,
        interiorPlayer.x
      )
    );

  interiorPlayer.y =
    Math.max(
      70,
      Math.min(
        VIEW_H - 60,
        interiorPlayer.y
      )
    );

}

// ------------------------------------------------
// CAMERA
// ------------------------------------------------

function updateCamera() {

  if (mode !== "outside") return;

  // Character lower on screen.
  const targetX =
    player.x -
    VIEW_W / 2;

  const targetY =
    player.y -
    VIEW_H * 0.68;

  camera.x +=
    (
      targetX -
      camera.x
    ) *
    camera.smooth;

  camera.y +=
    (
      targetY -
      camera.y
    ) *
    camera.smooth;

  camera.x =
    Math.max(
      0,
      Math.min(
        WORLD_W - VIEW_W,
        camera.x
      )
    );

  camera.y =
    Math.max(
      0,
      Math.min(
        WORLD_H - VIEW_H,
        camera.y
      )
    );
}

// ------------------------------------------------
// DRAW
// ------------------------------------------------

function drawGround() {

  ctx.fillStyle =
    "#263226";

  ctx.fillRect(
    0,
    0,
    VIEW_W,
    VIEW_H
  );

  // Ground lines
  ctx.strokeStyle =
    "rgba(255,255,255,0.025)";

  ctx.lineWidth = 1;

  const startX =
    Math.floor(camera.x / 80) * 80;

  const startY =
    Math.floor(camera.y / 80) * 80;

  for (
    let x = startX;
    x < camera.x + VIEW_W + 80;
    x += 80
  ) {

    const sx =
      x - camera.x;

    ctx.beginPath();

    ctx.moveTo(
      sx,
      0
    );

    ctx.lineTo(
      sx,
      VIEW_H
    );

    ctx.stroke();

  }

  for (
    let y = startY;
    y < camera.y + VIEW_H + 80;
    y += 80
  ) {

    const sy =
      y - camera.y;

    ctx.beginPath();

    ctx.moveTo(
      0,
      sy
    );

    ctx.lineTo(
      VIEW_W,
      sy
    );

    ctx.stroke();

  }

}

function drawRoads() {

  for (const road of roads) {

    ctx.fillStyle =
      "#353638";

    ctx.fillRect(
      road.x - camera.x,
      road.y - camera.y,
      road.w,
      road.h
    );

    ctx.strokeStyle =
      "#55575a";

    ctx.lineWidth = 3;

    if (road.w > road.h) {

      ctx.beginPath();

      ctx.moveTo(
        road.x - camera.x,
        road.y +
        road.h / 2 -
        camera.y
      );

      ctx.lineTo(
        road.x +
        road.w -
        camera.x,
        road.y +
        road.h / 2 -
        camera.y
      );

      ctx.stroke();

    } else {

      ctx.beginPath();

      ctx.moveTo(
        road.x +
        road.w / 2 -
        camera.x,
        road.y -
        camera.y
      );

      ctx.lineTo(
        road.x +
        road.w / 2 -
        camera.x,
        road.y +
        road.h -
        camera.y
      );

      ctx.stroke();

    }

  }

}

function drawBuildings() {

  for (const b of buildings) {

    const x =
      b.x - camera.x;

    const y =
      b.y - camera.y;

    if (
      x > VIEW_W ||
      y > VIEW_H ||
      x + b.w < 0 ||
      y + b.h < 0
    ) continue;

    // Shadow
    ctx.fillStyle =
      "rgba(0,0,0,0.35)";

    ctx.fillRect(
      x + 12,
      y + 14,
      b.w,
      b.h
    );

    // Main
    ctx.fillStyle =
      "#74726b";

    ctx.fillRect(
      x,
      y,
      b.w,
      b.h
    );

    // Roof
    ctx.fillStyle =
      "#55534e";

    ctx.fillRect(
      x + 8,
      y + 8,
      b.w - 16,
      28
    );

    // Windows
    ctx.fillStyle =
      "#293436";

    for (
      let wx = x + 35;
      wx < x + b.w - 30;
      wx += 65
    ) {

      ctx.fillRect(
        wx,
        y + 75,
        35,
        42
      );

    }

    // Door
    ctx.fillStyle =
      "#282522";

    ctx.fillRect(
      b.doorX -
        camera.x -
        15,

      b.doorY -
        camera.y -
        30,

      30,
      50
    );

  }

}

function drawTrees() {

  for (const t of trees) {

    const x =
      t.x - camera.x;

    const y =
      t.y - camera.y;

    if (
      x < -60 ||
      y < -70 ||
      x > VIEW_W + 60 ||
      y > VIEW_H + 70
    ) continue;

    // Shadow
    ctx.fillStyle =
      "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
      x + 8,
      y + 18,
      28,
      10,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Trunk
    ctx.fillStyle =
      "#554333";

    ctx.fillRect(
      x - 7,
      y - 2,
      14,
      32
    );

    // Tree
    ctx.fillStyle =
      "#27432e";

    ctx.beginPath();

    ctx.arc(
      x,
      y - 17,
      28,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "#35583a";

    ctx.beginPath();

    ctx.arc(
      x - 10,
      y - 27,
      18,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }

}

function drawRubble() {

  for (const r of rubble) {

    const x =
      r.x - camera.x;

    const y =
      r.y - camera.y;

    ctx.fillStyle =
      "#57534d";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      r.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }

}

function drawCars() {

  for (const car of cars) {

    const x =
      car.x - camera.x;

    const y =
      car.y - camera.y;

    ctx.save();

    ctx.translate(
      x,
      y
    );

    ctx.rotate(
      car.angle
    );

    // Shadow
    ctx.fillStyle =
      "rgba(0,0,0,0.4)";

    ctx.fillRect(
      -39,
      -16,
      78,
      36
    );

    // Body
    ctx.fillStyle =
      car.occupied
        ? "#87766f"
        : "#686c6c";

    ctx.fillRect(
      -38,
      -19,
      76,
      38
    );

    // Glass
    ctx.fillStyle =
      "#202b2d";

    ctx.fillRect(
      -15,
      -15,
      30,
      30
    );

    // Wheels
    ctx.fillStyle =
      "#161616";

    ctx.fillRect(
      -30,
      -25,
      16,
      7
    );

    ctx.fillRect(
      14,
      -25,
      16,
      7
    );

    ctx.fillRect(
      -30,
      18,
      16,
      7
    );

    ctx.fillRect(
      14,
      18,
      16,
      7
    );

    ctx.restore();

  }

}

function drawZombies() {

  for (const z of zombies) {

    const x =
      z.x - camera.x;

    const y =
      z.y - camera.y;

    if (
      x < -40 ||
      y < -50 ||
      x > VIEW_W + 40 ||
      y > VIEW_H + 50
    ) continue;

    // Shadow
    ctx.fillStyle =
      "rgba(0,0,0,0.3)";

    ctx.beginPath();

    ctx.ellipse(
      x,
      y + 14,
      15,
      7,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Body
    ctx.fillStyle =
      "#69735f";

    ctx.fillRect(
      x - 10,
      y - 2,
      20,
      27
    );

    // Head
    ctx.fillStyle =
      "#858b70";

    ctx.beginPath();

    ctx.arc(
      x,
      y - 14,
      11,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
      "#20221e";

    ctx.fillRect(
      x - 5,
      y - 16,
      3,
      3
    );

    ctx.fillRect(
      x + 2,
      y - 16,
      3,
      3
    );

  }

}

function drawPlayer() {

  if (player.car) return;

  const x =
    player.x - camera.x;

  const y =
    player.y - camera.y;

  // Shadow
  ctx.fillStyle =
    "rgba(0,0,0,0.45)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 20,
    20,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // STATIC LEGS
  ctx.fillStyle =
    "#24272a";

  ctx.fillRect(
    x - 10,
    y + 5,
    8,
    27
  );

  ctx.fillRect(
    x + 2,
    y + 5,
    8,
    27
  );

  // Body
  ctx.fillStyle =
    "#40515a";

  ctx.fillRect(
    x - 14,
    y - 16,
    28,
    30
  );

  // Backpack
  ctx.fillStyle =
    "#293136";

  ctx.fillRect(
    x - 18,
    y - 12,
    7,
    24
  );

  // Head
  ctx.fillStyle =
    "#b58d6d";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 27,
    12,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Hair
  ctx.fillStyle =
    "#24211e";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 31,
    10,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

}

function drawInterior() {

  ctx.fillStyle =
    "#151715";

  ctx.fillRect(
    0,
    0,
    VIEW_W,
    VIEW_H
  );

  // Floor
  ctx.fillStyle =
    "#4b4943";

  ctx.fillRect(
    80,
    70,
    VIEW_W - 160,
    VIEW_H - 140
  );

  // Walls
  ctx.fillStyle =
    "#69665e";

  ctx.fillRect(
    80,
    70,
    VIEW_W - 160,
    25
  );

  ctx.fillRect(
    80,
    70,
    25,
    VIEW_H - 140
  );

  ctx.fillRect(
    VIEW_W - 105,
    70,
    25,
    VIEW_H - 140
  );

  ctx.fillRect(
    80,
    VIEW_H - 95,
    VIEW_W - 160,
    25
  );

  // Furniture
  ctx.fillStyle =
    "#35312d";

  ctx.fillRect(
    170,
    150,
    190,
    65
  );

  ctx.fillRect(
    850,
    155,
    170,
    60
  );

  ctx.fillRect(
    490,
    330,
    240,
    65
  );

  // Player
  const x =
    interiorPlayer.x;

  const y =
    interiorPlayer.y;

  ctx.fillStyle =
    "rgba(0,0,0,0.4)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 20,
    20,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#25272a";

  ctx.fillRect(
    x - 10,
    y + 5,
    8,
    27
  );

  ctx.fillRect(
    x + 2,
    y + 5,
    8,
    27
  );

  ctx.fillStyle =
    "#40515a";

  ctx.fillRect(
    x - 14,
    y - 16,
    28,
    30
  );

  ctx.fillStyle =
    "#b58d6d";

  ctx.beginPath();

  ctx.arc(
    x,
    y - 27,
    12,
    0,
    Math.PI * 2
  );

  ctx.fill();

}

// ------------------------------------------------
// HUD
// ------------------------------------------------

function drawHUD() {

  ctx.fillStyle =
    "rgba(0,0,0,0.62)";

  ctx.fillRect(
    20,
    20,
    260,
    112
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 23px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    35,
    48
  );

  ctx.font =
    "15px Arial";

  ctx.fillText(
    "HP",
    35,
    74
  );

  ctx.fillStyle =
    "#303030";

  ctx.fillRect(
    70,
    64,
    170,
    13
  );

  ctx.fillStyle =
    "#c95d55";

  ctx.fillRect(
    70,
    64,
    170 * player.hp / 100,
    13
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "HUNGER",
    35,
    103
  );

  ctx.fillStyle =
    "#303030";

  ctx.fillRect(
    100,
    93,
    140,
    13
  );

  ctx.fillStyle =
    "#b8a04b";

  ctx.fillRect(
    100,
    93,
    140 * player.hunger / 100,
    13
  );

  // Time
  const totalMinutes =
    Math.floor(
      elapsed * 2
    );

  const hours =
    8 +
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  const shownHour =
    hours % 24;

  const time =
    String(shownHour)
      .padStart(2, "0") +
    ":" +
    String(minutes)
      .padStart(2, "0");

  ctx.font =
    "bold 20px Arial";

  ctx.textAlign =
    "right";

  ctx.fillText(
    "DAY 1  " + time,
    VIEW_W - 30,
    45
  );

  ctx.textAlign =
    "left";

  // Center objective
  if (mode === "outside") {

    ctx.fillStyle =
      "rgba(0,0,0,0.35)";

    ctx.font =
      "bold 30px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "SURVIVE",
      VIEW_W / 2,
      250
    );

    ctx.textAlign =
      "left";

  }

  // Message
  if (messageTimer > 0) {

    ctx.fillStyle =
      "rgba(0,0,0,0.72)";

    ctx.fillRect(
      VIEW_W / 2 - 180,
      VIEW_H - 80,
      360,
      42
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "bold 16px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      message,
      VIEW_W / 2,
      VIEW_H - 53
    );

    ctx.textAlign =
      "left";

  }

}

// ------------------------------------------------
// SURVIVAL
// ------------------------------------------------

function updateSurvival(dt) {

  if (mode !== "outside") return;

  player.hunger -=
    dt * 0.08;

  player.hunger =
    Math.max(
      0,
      player.hunger
    );

  if (
    player.hunger <= 0
  ) {

    player.hp -=
      dt * 1.5;

  }

  player.hp =
    Math.max(
      0,
      player.hp
    );

  if (
    player.hp <= 0
  ) {

    player.hp = 100;

    player.hunger = 60;

    player.x = 1300;
    player.y = 980;

    showMessage(
      "You collapsed..."
    );

  }

}

// ------------------------------------------------
// MESSAGE
// ------------------------------------------------

function showMessage(text) {

  message = text;

  messageTimer = 2;

}

// ------------------------------------------------
// FULLSCREEN + LANDSCAPE
// ------------------------------------------------

async function enterFullscreenLandscape() {

  try {

    if (
      !document.fullscreenElement
    ) {

      await document.documentElement
        .requestFullscreen();

    }

  } catch (error) {
    // Browser may refuse fullscreen.
  }

  try {

    if (
      screen.orientation &&
      screen.orientation.lock
    ) {

      await screen.orientation
        .lock("landscape");

    }

  } catch (error) {
    // Orientation lock is not supported.
  }

}

fullscreenButton.addEventListener(
  "click",
  enterFullscreenLandscape
);

// Try once after first interaction.
document.addEventListener(
  "pointerdown",
  () => {
    enterFullscreenLandscape();
  },
  {
    once: true
  }
);

// ------------------------------------------------
// INTERACT BUTTON
// ------------------------------------------------

interactButton.addEventListener(
  "pointerdown",
  e => {

    e.preventDefault();

    interact();

  }
);

// ------------------------------------------------
// KEYBOARD
// ------------------------------------------------

const keyboard = {
  up: false,
  down: false,
  left: false,
  right: false
};

window.addEventListener(
  "keydown",
  e => {

    const k =
      e.key.toLowerCase();

    if (
      k === "w" ||
      k === "arrowup"
    ) {
      keyboard.up = true;
    }

    if (
      k === "s" ||
      k === "arrowdown"
    ) {
      keyboard.down = true;
    }

    if (
      k === "a" ||
      k === "arrowleft"
    ) {
      keyboard.left = true;
    }

    if (
      k === "d" ||
      k === "arrowright"
    ) {
      keyboard.right = true;
    }

    if (
      k === "e" ||
      k === "enter"
    ) {
      interact();
    }

  }
);

window.addEventListener(
  "keyup",
  e => {

    const k =
      e.key.toLowerCase();

    if (
      k === "w" ||
      k === "arrowup"
    ) {
      keyboard.up = false;
    }

    if (
      k === "s" ||
      k === "arrowdown"
    ) {
      keyboard.down = false;
    }

    if (
      k === "a" ||
      k === "arrowleft"
    ) {
      keyboard.left = false;
    }

    if (
      k === "d" ||
      k === "arrowright"
    ) {
      keyboard.right = false;
    }

  }
);

// Keyboard -> analog
function updateKeyboardAnalog() {

  if (analog.active) return;

  let x = 0;
  let y = 0;

  if (keyboard.left) x--;
  if (keyboard.right) x++;

  if (keyboard.up) y--;
  if (keyboard.down) y++;

  const length =
    Math.hypot(x, y);

  if (length > 0) {

    analog.x = x / length;
    analog.y = y / length;
    analog.power = 1;

  } else {

    analog.x = 0;
    analog.y = 0;
    analog.power = 0;

  }

}

// ------------------------------------------------
// UPDATE
// ------------------------------------------------

function update(dt) {

  elapsed += dt;

  if (messageTimer > 0) {

    messageTimer -= dt;

  }

  updateKeyboardAnalog();

  if (mode === "outside") {

    updateOutside(dt);

    updateZombies(dt);

    updateSurvival(dt);

    updateCamera();

  } else {

    updateInterior(dt);

  }

}

// ------------------------------------------------
// DRAW
// ------------------------------------------------

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

// ------------------------------------------------
// GAME LOOP
// ------------------------------------------------

function loop(now) {

  let dt =
    (now - lastTime) / 1000;

  dt =
    Math.min(
      dt,
      0.05
    );

  lastTime = now;

  update(dt);

  draw();

  requestAnimationFrame(
    loop
  );

}

showMessage(
  "Explore the ruined city"
);

requestAnimationFrame(
  loop
);