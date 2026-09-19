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

let keys = {};
let joyX = 0;
let joyY = 0;
let joyActive = false;

let camera = {
  x: 0,
  y: 0
};

let mode = "outside";
let currentBuilding = null;

let timeMinutes = 13 * 60;
let day = 1;

let hp = 100;
let hunger = 100;

let player = {
  x: 1300,
  y: 950,
  r: 16,
  speed: 3.0,
  angle: 0,
  inCar: false,
  car: null
};

// =====================================================
// WORLD
// =====================================================

const buildings = [
  {
    id: 1,
    x: 850,
    y: 520,
    w: 500,
    h: 330,
    door: {
      x: 1075,
      y: 850,
      w: 70,
      h: 18
    }
  },

  {
    id: 2,
    x: 1500,
    y: 450,
    w: 430,
    h: 300,
    door: {
      x: 1680,
      y: 750,
      w: 70,
      h: 18
    }
  },

  {
    id: 3,
    x: 450,
    y: 1050,
    w: 430,
    h: 320,
    door: {
      x: 630,
      y: 1370,
      w: 70,
      h: 18
    }
  },

  {
    id: 4,
    x: 1750,
    y: 1050,
    w: 470,
    h: 330,
    door: {
      x: 1950,
      y: 1380,
      w: 70,
      h: 18
    }
  }
];

const cars = [
  { x: 600, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 930, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 1500, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 2050, y: 300, w: 78, h: 42, angle: 0, occupied: false },
  { x: 400, y: 800, w: 78, h: 42, angle: 1.57, occupied: false },
  { x: 2200, y: 850, w: 78, h: 42, angle: 1.57, occupied: false },
  { x: 1050, y: 1450, w: 78, h: 42, angle: 0, occupied: false }
];

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

const rubble = [
  { x: 550, y: 500, w: 55, h: 35 },
  { x: 2100, y: 950, w: 60, h: 38 },
  { x: 1100, y: 350, w: 55, h: 35 },
  { x: 1250, y: 1500, w: 65, h: 40 },
  { x: 350, y: 900, w: 55, h: 40 }
];

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
// INTERIORS
// =====================================================

function getInterior(building) {
  return {
    x: building.x,
    y: building.y,
    w: building.w,
    h: building.h,

    furniture: [
      {
        x: building.x + 80,
        y: building.y + 70,
        w: 120,
        h: 55,
        type: "bed"
      },

      {
        x: building.x + building.w - 170,
        y: building.y + 70,
        w: 80,
        h: 100,
        type: "cabinet"
      },

      {
        x: building.x + 180,
        y: building.y + 190,
        w: 100,
        h: 60,
        type: "table"
      },

      {
        x: building.x + building.w - 190,
        y: building.y + 210,
        w: 110,
        h: 55,
        type: "table"
      }
    ]
  };
}

// =====================================================
// COLLISION HELPERS
// =====================================================

function circleRectCollision(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < r * r;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function buildingSolidParts(b) {
  const d = b.door;

  return [
    // top
    {
      x: b.x,
      y: b.y,
      w: b.w,
      h: 22
    },

    // left
    {
      x: b.x,
      y: b.y,
      w: 22,
      h: b.h
    },

    // right
    {
      x: b.x + b.w - 22,
      y: b.y,
      w: 22,
      h: b.h
    },

    // bottom-left
    {
      x: b.x,
      y: b.y + b.h - 22,
      w: d.x - b.x,
      h: 22
    },

    // bottom-right
    {
      x: d.x + d.w,
      y: b.y + b.h - 22,
      w: b.x + b.w - (d.x + d.w),
      h: 22
    }
  ];
}

function exteriorBlocked(x, y, r) {
  // MAP BORDER
  if (x - r < 20) return true;
  if (y - r < 20) return true;
  if (x + r > W - 20) return true;
  if (y + r > H - 20) return true;

  // BUILDINGS
  for (const b of buildings) {
    for (const part of buildingSolidParts(b)) {
      if (circleRectCollision(x, y, r, part)) {
        return true;
      }
    }
  }

  // TREES
  for (const t of trees) {
    const dx = x - t.x;
    const dy = y - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r + t.r * 0.75) {
      return true;
    }
  }

  // RUBBLE
  for (const rbl of rubble) {
    if (
      circleRectCollision(x, y, r, {
        x: rbl.x,
        y: rbl.y,
        w: rbl.w,
        h: rbl.h
      })
    ) {
      return true;
    }
  }

  // CARS
  for (const car of cars) {
    if (
      circleRectCollision(x, y, r, {
        x: car.x - car.w / 2,
        y: car.y - car.h / 2,
        w: car.w,
        h: car.h
      })
    ) {
      return true;
    }
  }

  return false;
}

function interiorBlocked(x, y, r) {
  const room = getInterior(currentBuilding);

  // WALLS
  const wall = 22;

  // left wall
  if (x - r < room.x + wall) return true;

  // right wall
  if (x + r > room.x + room.w - wall) return true;

  // top wall
  if (y - r < room.y + wall) return true;

  // bottom wall EXCEPT DOOR
  const d = currentBuilding.door;

  const insideDoor =
    x > d.x &&
    x < d.x + d.w;

  if (
    y + r > room.y + room.h - wall &&
    !insideDoor
  ) {
    return true;
  }

  // FURNITURE
  for (const f of room.furniture) {
    if (
      circleRectCollision(x, y, r, {
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h
      })
    ) {
      return true;
    }
  }

  return false;
}

// =====================================================
// MOVEMENT
// =====================================================

function tryMove(dx, dy) {
  if (mode === "interior") {
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (!interiorBlocked(nx, player.y, player.r)) {
      player.x = nx;
    }

    if (!interiorBlocked(player.x, ny, player.r)) {
      player.y = ny;
    }

    return;
  }

  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!exteriorBlocked(nx, player.y, player.r)) {
    player.x = nx;
  }

  if (!exteriorBlocked(player.x, ny, player.r)) {
    player.y = ny;
  }
}

// =====================================================
// CAR
// =====================================================

function nearCar() {
  let closest = null;
  let best = 70;

  for (const car of cars) {
    const dx = player.x - car.x;
    const dy = player.y - car.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < best) {
      best = dist;
      closest = car;
    }
  }

  return closest;
}

function driveCar(car, dx, dy) {
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 0.01) return;

  const speed = 5.5;

  const nx = car.x + (dx / length) * speed;
  const ny = car.y + (dy / length) * speed;

  // CAR MAP BOUNDARY
  const halfW = car.w / 2;
  const halfH = car.h / 2;

  if (
    nx - halfW < 25 ||
    nx + halfW > W - 25 ||
    ny - halfH < 25 ||
    ny + halfH > H - 25
  ) {
    return;
  }

  // Don't drive through buildings
  for (const b of buildings) {
    const test = {
      x: nx - halfW,
      y: ny - halfH,
      w: car.w,
      h: car.h
    };

    for (const part of buildingSolidParts(b)) {
      if (rectsOverlap(test, part)) {
        return;
      }
    }
  }

  car.x = nx;
  car.y = ny;
  car.angle = Math.atan2(dy, dx);

  player.x = car.x;
  player.y = car.y;
}

// =====================================================
// BUILDING ENTRY
// =====================================================

function nearBuildingDoor() {
  for (const b of buildings) {
    const d = b.door;

    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;

    const dx = player.x - cx;
    const dy = player.y - cy;

    if (Math.sqrt(dx * dx + dy * dy) < 80) {
      return b;
    }
  }

  return null;
}

function enterBuilding(b) {
  currentBuilding = b;
  mode = "interior";

  const d = b.door;

  // Start just INSIDE the door
  player.x = d.x + d.w / 2;
  player.y = b.y + b.h - 65;

  player.inCar = false;
  player.car = null;
}

function exitBuilding() {
  if (!currentBuilding) return;

  const b = currentBuilding;
  const d = b.door;

  const nearDoor =
    player.x > d.x - 45 &&
    player.x < d.x + d.w + 45 &&
    player.y > b.y + b.h - 100;

  if (!nearDoor) {
    return;
  }

  mode = "outside";

  // Put player safely OUTSIDE the door
  player.x = d.x + d.w / 2;
  player.y = b.y + b.h + 45;

  currentBuilding = null;
}

// =====================================================
// INTERACT
// =====================================================

function interact() {
  // INSIDE
  if (mode === "interior") {
    exitBuilding();
    return;
  }

  // CAR
  const car = nearCar();

  if (car && !player.inCar) {
    player.inCar = true;
    player.car = car;
    car.occupied = true;

    player.x = car.x;
    player.y = car.y;

    return;
  }

  // EXIT CAR
  if (player.inCar) {
    const c = player.car;

    player.inCar = false;
    player.car = null;

    c.occupied = false;

    player.x = c.x + 55;
    player.y = c.y;

    return;
  }

  // BUILDING
  const building = nearBuildingDoor();

  if (building) {
    enterBuilding(building);
  }
}

// =====================================================
// INPUT
// =====================================================

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

// =====================================================
// JOYSTICK
// =====================================================

function updateJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const max = rect.width * 0.32;

  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > max) {
    dx = dx / dist * max;
    dy = dy / dist * max;
  }

  joyX = dx / max;
  joyY = dy / max;

  stick.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener("pointerdown", e => {
  joyActive = true;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointermove", e => {
  if (!joyActive) return;
  updateJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointerup", e => {
  joyActive = false;
  joyX = 0;
  joyY = 0;
  stick.style.transform = "translate(0px, 0px)";
});

joystick.addEventListener("pointercancel", () => {
  joyActive = false;
  joyX = 0;
  joyY = 0;
  stick.style.transform = "translate(0px, 0px)";
});

if (interactBtn) {
  interactBtn.addEventListener("pointerdown", e => {
    e.preventDefault();
    interact();
  });
}

// =====================================================
// FULLSCREEN
// =====================================================

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();

        if (screen.orientation?.lock) {
          await screen.orientation.lock("landscape");
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.log("Fullscreen/orientation:", err);
    }
  });
}

// =====================================================
// INPUT VECTOR
// =====================================================

function getInput() {
  let x = joyX;
  let y = joyY;

  if (keys["a"] || keys["arrowleft"]) x -= 1;
  if (keys["d"] || keys["arrowright"]) x += 1;
  if (keys["w"] || keys["arrowup"]) y -= 1;
  if (keys["s"] || keys["arrowdown"]) y += 1;

  const len = Math.sqrt(x * x + y * y);

  if (len > 1) {
    x /= len;
    y /= len;
  }

  return { x, y };
}

// =====================================================
// UPDATE
// =====================================================

function update() {
  const input = getInput();

  if (player.inCar && player.car) {
    driveCar(player.car, input.x, input.y);
  } else {
    const speed =
      mode === "interior"
        ? 2.7
        : player.speed;

    tryMove(
      input.x * speed,
      input.y * speed
    );

    if (Math.abs(input.x) > 0.05 ||
        Math.abs(input.y) > 0.05) {
      player.angle =
        Math.atan2(input.y, input.x);
    }
  }

  // ZOMBIES ONLY OUTSIDE
  if (mode === "outside" && !player.inCar) {
    for (const z of zombies) {
      const dx = player.x - z.x;
      const dy = player.y - z.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1 && dist < 420) {
        const zx = dx / dist * z.speed;
        const zy = dy / dist * z.speed;

        if (!exteriorBlocked(
          z.x + zx,
          z.y,
          z.r
        )) {
          z.x += zx;
        }

        if (!exteriorBlocked(
          z.x,
          z.y + zy,
          z.r
        )) {
          z.y += zy;
        }
      }
    }
  }

  // TIME
  timeMinutes += 0.04;

  if (timeMinutes >= 1440) {
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
  const targetX = player.x;
  const targetY = player.y - 100;

  camera.x +=
    (targetX - canvas.width / 2 - camera.x) * 0.10;

  camera.y +=
    (targetY - canvas.height * 0.60 - camera.y) * 0.10;

  camera.x = Math.max(
    0,
    Math.min(
      camera.x,
      W - canvas.width
    )
  );

  camera.y = Math.max(
    0,
    Math.min(
      camera.y,
      H - canvas.height
    )
  );
}

// =====================================================
// DRAW WORLD
// =====================================================

function drawGround() {
  ctx.fillStyle = "#17261b";
  ctx.fillRect(0, 0, W, H);

  // ROAD
  ctx.fillStyle = "#36383a";

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

  // ROAD LINES
  ctx.strokeStyle = "#686868";
  ctx.lineWidth = 4;

  ctx.setLineDash([40, 30]);

  ctx.beginPath();
  ctx.moveTo(0, 295);
  ctx.lineTo(W, 295);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1125, 0);
  ctx.lineTo(1125, H);
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawBuilding(b) {
  ctx.fillStyle = "#77756f";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // roof
  ctx.fillStyle = "#55534f";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    28
  );

  // windows
  ctx.fillStyle = "#26383b";

  for (let x = b.x + 55; x < b.x + b.w - 35; x += 80) {
    ctx.fillRect(
      x,
      b.y + 80,
      38,
      48
    );
  }

  // door
  ctx.fillStyle = "#34271f";

  ctx.fillRect(
    b.door.x,
    b.door.y - 35,
    b.door.w,
    35
  );
}

function drawInterior() {
  const b = currentBuilding;

  ctx.fillStyle = "#6e6a63";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    b.h
  );

  // FLOOR
  ctx.fillStyle = "#8b887f";

  ctx.fillRect(
    b.x + 22,
    b.y + 22,
    b.w - 44,
    b.h - 44
  );

  // WALLS
  ctx.fillStyle = "#4a4844";

  ctx.fillRect(
    b.x,
    b.y,
    b.w,
    22
  );

  ctx.fillRect(
    b.x,
    b.y,
    22,
    b.h
  );

  ctx.fillRect(
    b.x + b.w - 22,
    b.y,
    22,
    b.h
  );

  // bottom wall left/right
  const d = b.door;

  ctx.fillRect(
    b.x,
    b.y + b.h - 22,
    d.x - b.x,
    22
  );

  ctx.fillRect(
    d.x + d.w,
    b.y + b.h - 22,
    b.x + b.w - (d.x + d.w),
    22
  );

  // FURNITURE
  const room = getInterior(b);

  for (const f of room.furniture) {
    if (f.type === "bed") {
      ctx.fillStyle = "#51484a";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );

      ctx.fillStyle = "#aaa5a0";
      ctx.fillRect(
        f.x + 8,
        f.y + 8,
        f.w - 16,
        25
      );
    }

    if (f.type === "cabinet") {
      ctx.fillStyle = "#4a3930";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }

    if (f.type === "table") {
      ctx.fillStyle = "#4b382c";
      ctx.fillRect(
        f.x,
        f.y,
        f.w,
        f.h
      );
    }
  }

  // DOOR
  ctx.fillStyle = "#33251d";

  ctx.fillRect(
    d.x,
    b.y + b.h - 22,
    d.w,
    22
  );
}

function drawTrees() {
  for (const t of trees) {
    ctx.fillStyle = "#102318";
    ctx.beginPath();
    ctx.arc(
      t.x + 7,
      t.y + 10,
      t.r,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#315c39";
    ctx.beginPath();
    ctx.arc(
      t.x,
      t.y,
      t.r,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#624934";

    ctx.fillRect(
      t.x - 7,
      t.y + 20,
      14,
      28
    );
  }
}

function drawRubble() {
  for (const r of rubble) {
    ctx.fillStyle = "#555653";

    ctx.fillRect(
      r.x,
      r.y,
      r.w,
      r.h
    );

    ctx.fillStyle = "#777872";

    ctx.fillRect(
      r.x + 8,
      r.y + 7,
      r.w - 18,
      7
    );
  }
}

function drawCars() {
  for (const car of cars) {
    ctx.save();

    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

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

    ctx.fillStyle = "#27363a";

    ctx.fillRect(
      -20,
      -15,
      40,
      30
    );

    ctx.fillStyle = "#171918";

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

function drawZombies() {
  if (mode === "interior") return;

  for (const z of zombies) {
    ctx.fillStyle = "#514e47";

    ctx.beginPath();

    ctx.arc(
      z.x,
      z.y,
      z.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#292927";

    ctx.fillRect(
      z.x - 10,
      z.y + 10,
      20,
      22
    );
  }
}

function drawPlayer() {
  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  // shadow
  ctx.fillStyle = "rgba(0,0,0,.35)";

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
  ctx.fillStyle = "#4d6470";

  ctx.fillRect(
    -13,
    -5,
    26,
    30
  );

  // HEAD
  ctx.fillStyle = "#b59a83";

  ctx.beginPath();

  ctx.arc(
    0,
    -16,
    13,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // static legs
  ctx.fillStyle = "#24282a";

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

  ctx.fillStyle = "rgba(0,0,0,.65)";

  ctx.fillRect(
    18,
    18,
    250,
    105
  );

  ctx.fillStyle = "#ffffff";

  ctx.font = "bold 22px Arial";

  ctx.fillText(
    "VIRELIA: AFTERFALL",
    32,
    45
  );

  ctx.font = "14px Arial";

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

  ctx.fillStyle = "#333";

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

  ctx.fillStyle = "#c95757";

  ctx.fillRect(
    78,
    59,
    130 * Math.max(0, hp / 100),
    13
  );

  ctx.fillStyle = "#c5a847";

  ctx.fillRect(
    78,
    87,
    130 * Math.max(0, hunger / 100),
    13
  );

  let hour = Math.floor(timeMinutes / 60);
  let minute = Math.floor(timeMinutes % 60);

  const timeText =
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  ctx.fillStyle = "#d0b85c";

  ctx.font = "bold 18px Arial";

  ctx.fillText(
    `DAY ${day}  ${timeText}`,
    1070,
    43
  );

  ctx.restore();
}

// =====================================================
// INTERACT PROMPT
// =====================================================

function drawPrompt() {
  let text = "";

  if (mode === "interior") {
    const b = currentBuilding;
    const d = b.door;

    const nearDoor =
      player.x > d.x - 45 &&
      player.x < d.x + d.w + 45 &&
      player.y > b.y + b.h - 100;

    if (nearDoor) {
      text = "INTERACT  •  KELUAR";
    }
  } else if (player.inCar) {
    text = "INTERACT  •  KELUAR MOBIL";
  } else if (nearCar()) {
    text = "INTERACT  •  MASUK MOBIL";
  } else if (nearBuildingDoor()) {
    text = "INTERACT  •  MASUK";
  }

  if (!text) return;

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,.70)";

  ctx.fillRect(
    canvas.width / 2 - 145,
    canvas.height - 65,
    290,
    40
  );

  ctx.fillStyle = "#fff";

  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";

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

  if (mode === "outside") {
    drawGround();

    for (const b of buildings) {
      drawBuilding(b);
    }

    drawRubble();
    drawTrees();
    drawCars();
    drawZombies();
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

// =====================================================
// LOOP
// =====================================================

function loop() {
  update();
  updateCamera();
  render();

  requestAnimationFrame(loop);
}

loop();