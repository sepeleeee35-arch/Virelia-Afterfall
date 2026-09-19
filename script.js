const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const hungerText = document.getElementById("hunger");
const timeText = document.getElementById("time");
const message = document.getElementById("message");
const interactButton = document.getElementById("interact");

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

const WORLD_W = 3000;
const WORLD_H = 2200;

const player = {
    x: 1500,
    y: 1100,
    radius: 14,
    speed: 3.3,
    hp: 100,
    hunger: 100,
    inside: false,
    driving: false,
    currentBuilding: null,
    currentCar: null
};

const camera = {
    x: 0,
    y: 0
};

const input = {
    up: false,
    down: false,
    left: false,
    right: false
};

/* =========================
   CONTROLS
========================= */

function bindButton(id, direction) {
    const button = document.getElementById(id);

    const start = e => {
        e.preventDefault();
        input[direction] = true;
    };

    const end = e => {
        e.preventDefault();
        input[direction] = false;
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("pointerleave", end);
}

bindButton("up", "up");
bindButton("down", "down");
bindButton("left", "left");
bindButton("right", "right");

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") input.up = true;
    if (k === "s" || k === "arrowdown") input.down = true;
    if (k === "a" || k === "arrowleft") input.left = true;
    if (k === "d" || k === "arrowright") input.right = true;

    if (k === "e") interact();
});

window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") input.up = false;
    if (k === "s" || k === "arrowdown") input.down = false;
    if (k === "a" || k === "arrowleft") input.left = false;
    if (k === "d" || k === "arrowright") input.right = false;
});

interactButton.addEventListener("click", interact);

/* =========================
   BUILDINGS
========================= */

const buildings = [];

function addBuilding(x, y, w, h, damaged = false) {
    buildings.push({
        x,
        y,
        w,
        h,
        damaged,
        doorW: 48
    });
}

addBuilding(180, 170, 330, 230, true);
addBuilding(650, 130, 370, 270, false);
addBuilding(1350, 160, 350, 250, true);
addBuilding(2000, 200, 430, 260, true);

addBuilding(120, 720, 360, 260, false);
addBuilding(650, 690, 300, 230, true);
addBuilding(1750, 680, 400, 280, true);
addBuilding(2350, 750, 360, 240, false);

addBuilding(200, 1370, 420, 260, true);
addBuilding(820, 1330, 350, 280, false);
addBuilding(1450, 1370, 390, 250, true);
addBuilding(2100, 1390, 430, 260, true);

/* =========================
   CARS
========================= */

const cars = [
    {x:560,y:530,a:0.1},
    {x:1110,y:540,a:-0.1},
    {x:1270,y:1000,a:0.2},
    {x:1560,y:1050,a:-0.1},
    {x:2240,y:560,a:0.1},
    {x:700,y:1180,a:-0.2},
    {x:1920,y:1170,a:0.15},
    {x:1300,y:1750,a:0.1},
    {x:2650,y:1150,a:-0.15}
].map(car => ({
    ...car,
    occupied: false
}));

/* =========================
   TREES
========================= */

const trees = [];

for (let i = 0; i < 80; i++) {
    trees.push({
        x: 60 + ((i * 317) % 2880),
        y: 60 + ((i * 191) % 2080),
        size: 18 + (i % 3) * 5
    });
}

/* =========================
   RUBBLE
========================= */

const rubble = [];

for (let i = 0; i < 70; i++) {
    rubble.push({
        x: 80 + ((i * 233) % 2840),
        y: 80 + ((i * 149) % 2040),
        size: 5 + (i % 5)
    });
}

/* =========================
   ZOMBIES
========================= */

const zombies = [];

for (let i = 0; i < 22; i++) {
    zombies.push({
        x: 200 + ((i * 431) % 2600),
        y: 150 + ((i * 293) % 1900),
        radius: 13,
        speed: 0.65 + (i % 4) * 0.08,
        wander: Math.random() * Math.PI * 2,
        attackCooldown: 0
    });
}

/* =========================
   COLLISION
========================= */

function circleRectCollision(cx, cy, radius, r) {
    const closestX = Math.max(r.x, Math.min(cx, r.x + r.w));
    const closestY = Math.max(r.y, Math.min(cy, r.y + r.h));

    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
}

function treeCollision(x, y) {
    for (const tree of trees) {
        const dx = x - tree.x;
        const dy = y - (tree.y + tree.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < tree.size + player.radius) {
            return true;
        }
    }

    return false;
}

function carCollision(x, y) {
    for (const car of cars) {
        if (car === player.currentCar) continue;

        const r = {
            x: car.x - 38,
            y: car.y - 20,
            w: 76,
            h: 40
        };

        if (circleRectCollision(x, y, player.radius, r)) {
            return true;
        }
    }

    return false;
}

function buildingCollision(x, y) {
    for (const b of buildings) {

        const doorLeft = b.x + b.w / 2 - b.doorW / 2;
        const doorRight = b.x + b.w / 2 + b.doorW / 2;

        const insideX =
            x > b.x - player.radius &&
            x < b.x + b.w + player.radius;

        const insideY =
            y > b.y - player.radius &&
            y < b.y + b.h + player.radius;

        if (!insideX || !insideY) continue;

        const atDoor =
            x > doorLeft &&
            x < doorRight &&
            y > b.y + b.h - 55 &&
            y < b.y + b.h + 25;

        if (!atDoor) {
            return true;
        }
    }

    return false;
}

function blocked(x, y) {
    return (
        x < 20 ||
        y < 20 ||
        x > WORLD_W - 20 ||
        y > WORLD_H - 20 ||
        treeCollision(x, y) ||
        carCollision(x, y) ||
        buildingCollision(x, y)
    );
}

/* =========================
   MOVEMENT
========================= */

function movePlayer() {

    if (player.inside) {
        moveInside();
        return;
    }

    let dx = 0;
    let dy = 0;

    if (input.up) dy--;
    if (input.down) dy++;
    if (input.left) dx--;
    if (input.right) dx++;

    if (dx === 0 && dy === 0) return;

    const length = Math.sqrt(dx * dx + dy * dy);

    dx /= length;
    dy /= length;

    const speed = player.driving ? 6 : player.speed;

    const nx = player.x + dx * speed;
    const ny = player.y + dy * speed;

    if (!blocked(nx, player.y)) {
        player.x = nx;
    }

    if (!blocked(player.x, ny)) {
        player.y = ny;
    }

    if (player.driving && player.currentCar) {
        player.currentCar.x = player.x;
        player.currentCar.y = player.y;
    }
}

/* =========================
   FIND INTERACTION
========================= */

function findInteraction() {

    if (player.inside) {
        return {
            type: "exit"
        };
    }

    let nearestCar = null;
    let nearestCarDistance = Infinity;

    for (const car of cars) {

        if (car.occupied) continue;

        const d = Math.hypot(
            player.x - car.x,
            player.y - car.y
        );

        if (d < 65 && d < nearestCarDistance) {
            nearestCar = car;
            nearestCarDistance = d;
        }
    }

    if (nearestCar) {
        return {
            type: "car",
            object: nearestCar
        };
    }

    for (const b of buildings) {

        const doorX = b.x + b.w / 2;
        const doorY = b.y + b.h;

        const d = Math.hypot(
            player.x - doorX,
            player.y - doorY
        );

        if (d < 70) {
            return {
                type: "building",
                object: b
            };
        }
    }

    return null;
}

/* =========================
   INTERACTION
========================= */

function interact() {

    if (player.inside) {
        exitBuilding();
        return;
    }

    const target = findInteraction();

    if (!target) return;

    if (target.type === "car") {
        enterCar(target.object);
    }

    if (target.type === "building") {
        enterBuilding(target.object);
    }
}

function enterCar(car) {

    player.driving = true;
    player.currentCar = car;

    car.occupied = true;

    player.x = car.x;
    player.y = car.y;

    message.textContent = "DRIVING";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 800);
}

function exitCar() {

    if (!player.currentCar) return;

    const car = player.currentCar;

    car.occupied = false;

    player.driving = false;
    player.currentCar = null;

    player.x += 48;

    message.textContent = "ON FOOT";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 800);
}

/* =========================
   BUILDING INTERIOR
========================= */

function enterBuilding(building) {

    if (player.driving) {
        exitCar();
    }

    player.inside = true;
    player.currentBuilding = building;

    player.x = W / 2;
    player.y = H / 2;

    message.textContent = "INSIDE";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 800);
}

function exitBuilding() {

    const b = player.currentBuilding;

    player.inside = false;
    player.currentBuilding = null;

    player.x = b.x + b.w / 2;
    player.y = b.y + b.h + 30;

    message.textContent = "BACK OUTSIDE";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 800);
}

function moveInside() {

    let dx = 0;
    let dy = 0;

    if (input.up) dy--;
    if (input.down) dy++;
    if (input.left) dx--;
    if (input.right) dx++;

    if (dx === 0 && dy === 0) return;

    const length = Math.sqrt(dx * dx + dy * dy);

    dx /= length;
    dy /= length;

    player.x += dx * player.speed;
    player.y += dy * player.speed;

    player.x = Math.max(50, Math.min(W - 50, player.x));
    player.y = Math.max(90, Math.min(H - 50, player.y));
}

/* =========================
   DRAW GROUND
========================= */

function drawGround() {

    ctx.fillStyle = "#555b51";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.fillStyle = "#4d5649";

    for (let x = 0; x < WORLD_W; x += 90) {
        for (let y = 0; y < WORLD_H; y += 90) {
            ctx.fillRect(
                x + ((y * 7) % 17),
                y + ((x * 5) % 13),
                3,
                3
            );
        }
    }

    ctx.fillStyle = "#292c2a";

    ctx.fillRect(0, 520, WORLD_W, 180);
    ctx.fillRect(1100, 0, 190, WORLD_H);
    ctx.fillRect(0, 1040, WORLD_W, 120);
    ctx.fillRect(1760, 0, 110, WORLD_H);

    ctx.strokeStyle = "#77776d";
    ctx.lineWidth = 3;
    ctx.setLineDash([40, 35]);

    ctx.beginPath();
    ctx.moveTo(0, 610);
    ctx.lineTo(WORLD_W, 610);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1195, 0);
    ctx.lineTo(1195, WORLD_H);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.strokeStyle = "#1d211f";
    ctx.lineWidth = 3;

    for (let i = 0; i < 45; i++) {

        const x = (i * 179) % WORLD_W;
        const y = (i * 313) % WORLD_H;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 15, y + 15);
        ctx.lineTo(x + 8, y + 30);
        ctx.lineTo(x + 22, y + 42);
        ctx.stroke();
    }
}

/* =========================
   DRAW BUILDINGS
========================= */

function drawBuildings() {

    for (const b of buildings) {

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(b.x + 14, b.y + 14, b.w, b.h);

        ctx.fillStyle = b.damaged ? "#565653" : "#65635d";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = "#30312f";
        ctx.fillRect(b.x, b.y, b.w, 28);

        ctx.strokeStyle = "#393a37";
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        const columns = Math.max(2, Math.floor(b.w / 75));

        for (let c = 0; c < columns; c++) {

            const wx = b.x + 30 + c * 70;

            if (wx + 28 > b.x + b.w - 15) continue;

            for (let wy = b.y + 55; wy < b.y + b.h - 30; wy += 65) {

                ctx.fillStyle = "#1e2423";
                ctx.fillRect(wx, wy, 30, 38);

                ctx.strokeStyle = "#77766d";
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + 30, wy + 38);
                ctx.stroke();
            }
        }

        if (b.damaged) {

            ctx.strokeStyle = "#242724";
            ctx.lineWidth = 5;

            ctx.beginPath();
            ctx.moveTo(b.x + 30, b.y + 80);
            ctx.lineTo(b.x + 90, b.y + 130);
            ctx.lineTo(b.x + 60, b.y + 190);
            ctx.stroke();
        }

        // Door
        ctx.fillStyle = "#252724";
        ctx.fillRect(
            b.x + b.w / 2 - 24,
            b.y + b.h - 48,
            48,
            48
        );

        // Door handle
        ctx.fillStyle = "#aaa";
        ctx.fillRect(
            b.x + b.w / 2 + 10,
            b.y + b.h - 25,
            5,
            5
        );
    }
}

/* =========================
   DRAW CARS
========================= */

function drawCars() {

    for (const car of cars) {

        ctx.save();

        ctx.translate(car.x, car.y);
        ctx.rotate(car.a);

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-40, -20, 80, 40);

        ctx.fillStyle = car.occupied
            ? "#59645c"
            : "#343937";

        ctx.fillRect(-34, -14, 68, 28);

        ctx.fillStyle = "#161b1b";
        ctx.fillRect(-20, -11, 40, 13);

        ctx.fillStyle = "#141615";

        ctx.fillRect(-26, -18, 12, 7);
        ctx.fillRect(14, -18, 12, 7);
        ctx.fillRect(-26, 11, 12, 7);
        ctx.fillRect(14, 11, 12, 7);

        ctx.fillStyle = "#674c3c";
        ctx.fillRect(-28, 5, 15, 4);

        ctx.restore();
    }
}

/* =========================
   TREES
========================= */

function drawTrees() {

    for (const tree of trees) {

        ctx.fillStyle = "#34362f";
        ctx.fillRect(
            tree.x - 3,
            tree.y,
            6,
            tree.size
        );

        ctx.fillStyle = "#273d2b";

        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - tree.size);
        ctx.lineTo(
            tree.x - tree.size,
            tree.y + tree.size
        );
        ctx.lineTo(
            tree.x + tree.size,
            tree.y + tree.size
        );
        ctx.closePath();

        ctx.fill();
    }
}

/* =========================
   RUBBLE
========================= */

function drawRubble() {

    for (const r of rubble) {

        ctx.fillStyle = "#3d403c";

        ctx.fillRect(
            r.x,
            r.y,
            r.size,
            r.size
        );

        ctx.fillStyle = "#686960";

        ctx.fillRect(
            r.x + r.size,
            r.y - 2,
            r.size / 2,
            r.size / 2
        );
    }
}

/* =========================
   ZOMBIES
========================= */

function drawZombie(z) {

    ctx.save();

    ctx.translate(z.x, z.y);

    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#414b43";
    ctx.fillRect(-8, -2, 16, 24);

    ctx.fillStyle = "#7c8272";

    ctx.beginPath();
    ctx.arc(0, -9, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1b201c";
    ctx.fillRect(-5, -11, 3, 3);
    ctx.fillRect(2, -11, 3, 3);

    ctx.strokeStyle = "#6e7668";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(-15, 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(7, 2);
    ctx.lineTo(15, 10);
    ctx.stroke();

    ctx.restore();
}

/* =========================
   PLAYER
========================= */

function drawPlayer() {

    if (player.driving) return;

    ctx.save();

    ctx.translate(player.x, player.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(0, 17, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#334b56";
    ctx.fillRect(-9, -1, 18, 25);

    // Head
    ctx.fillStyle = "#c38d68";

    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#252321";
    ctx.fillRect(-8, -17, 16, 6);

    // Static legs
    ctx.fillStyle = "#20282b";
    ctx.fillRect(-8, 22, 6, 10);
    ctx.fillRect(2, 22, 6, 10);

    ctx.restore();
}

/* =========================
   INTERIOR
========================= */

function drawInterior() {

    ctx.fillStyle = "#242623";
    ctx.fillRect(0, 0, W, H);

    // Floor
    ctx.fillStyle = "#57564f";
    ctx.fillRect(35, 70, W - 70, H - 105);

    // Walls
    ctx.fillStyle = "#383a36";
    ctx.fillRect(35, 70, W - 70, 18);
    ctx.fillRect(35, 70, 18, H - 105);
    ctx.fillRect(W - 53, 70, 18, H - 105);
    ctx.fillRect(35, H - 53, W - 70, 18);

    // Window
    ctx.fillStyle = "#171d1d";
    ctx.fillRect(W - 180, 120, 90, 75);

    ctx.strokeStyle = "#777";
    ctx.lineWidth = 5;
    ctx.strokeRect(W - 180, 120, 90, 75);

    // Table
    ctx.fillStyle = "#40372f";
    ctx.fillRect(120, 150, 180, 80);

    // Bed
    ctx.fillStyle = "#343a3a";
    ctx.fillRect(W - 310, 280, 190, 100);

    // Cabinet
    ctx.fillStyle = "#4a4138";
    ctx.fillRect(100, 330, 80, 130);

    drawPlayer();

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("INTERIOR • Explore & find supplies", 55, 50);
}

/* =========================
   ZOMBIE AI
========================= */

function updateZombies() {

    if (player.inside) return;

    for (const z of zombies) {

        const dx = player.x - z.x;
        const dy = player.y - z.y;

        const distance = Math.hypot(dx, dy);

        if (distance < 330 && distance > 28) {

            const nx = z.x + (dx / distance) * z.speed;
            const ny = z.y + (dy / distance) * z.speed;

            if (!treeCollision(nx, ny) && !buildingCollision(nx, ny)) {
                z.x = nx;
                z.y = ny;
            }
        }

        if (distance < 32) {

            z.attackCooldown--;

            if (z.attackCooldown <= 0) {
                player.hp -= 4;
                z.attackCooldown = 45;
            }
        }
    }
}

/* =========================
   SURVIVAL
========================= */

let hungerTimer = 0;

function updateSurvival() {

    hungerTimer++;

    if (hungerTimer >= 300) {

        player.hunger = Math.max(
            0,
            player.hunger - 1
        );

        hungerTimer = 0;
    }

    if (player.hunger <= 0) {
        player.hp = Math.max(
            0,
            player.hp - 0.08
        );
    }

    hpText.textContent = Math.floor(player.hp);
    hungerText.textContent = Math.floor(player.hunger);
}

/* =========================
   TIME
========================= */

let worldTime = 8 * 60;

function updateTime() {

    worldTime += 0.035;

    if (worldTime >= 1440) {
        worldTime = 0;
    }

    const hour = Math.floor(worldTime / 60);
    const minute = Math.floor(worldTime % 60);

    timeText.textContent =
        `DAY 1 • ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;
}

/* =========================
   INTERACTION UI
========================= */

function updateInteractionUI() {

    if (player.driving) {
        interactButton.style.display = "block";
        interactButton.textContent = "EXIT CAR";
        return;
    }

    const target = findInteraction();

    if (!target) {
        interactButton.style.display = "none";
        return;
    }

    interactButton.style.display = "block";

    if (target.type === "car") {
        interactButton.textContent = "ENTER CAR";
    } else if (target.type === "building") {
        interactButton.textContent = "ENTER";
    }
}

/* =========================
   CAMERA
========================= */

function updateCamera() {

    if (player.inside) {
        camera.x = 0;
        camera.y = 0;
        return;
    }

    camera.x = player.x - W / 2;
    camera.y = player.y - H / 2;

    camera.x = Math.max(
        0,
        Math.min(WORLD_W - W, camera.x)
    );

    camera.y = Math.max(
        0,
        Math.min(WORLD_H - H, camera.y)
    );
}

/* =========================
   LIGHTING
========================= */

function drawLighting() {

    if (player.inside) return;

    const hour = worldTime / 60;

    let darkness = 0;

    if (hour >= 19 || hour < 6) {
        darkness = 0.58;
    } else if (hour >= 17) {
        darkness = 0.25;
    } else if (hour < 8) {
        darkness = 0.18;
    }

    if (darkness > 0) {
        ctx.fillStyle = `rgba(8,12,20,${darkness})`;
        ctx.fillRect(0, 0, W, H);
    }
}

/* =========================
   DRAW
========================= */

function draw() {

    ctx.clearRect(0, 0, W, H);

    updateCamera();

    if (player.inside) {

        drawInterior();

    } else {

        ctx.save();

        ctx.translate(
            -camera.x,
            -camera.y
        );

        drawGround();
        drawTrees();
        drawRubble();
        drawBuildings();
        drawCars();

        for (const z of zombies) {
            drawZombie(z);
        }

        drawPlayer();

        ctx.restore();

        drawLighting();
    }
}

/* =========================
   LOOP
========================= */

function gameLoop() {

    if (player.hp > 0) {

        movePlayer();
        updateZombies();
        updateSurvival();
        updateTime();
    }

    updateInteractionUI();

    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();