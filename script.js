const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const hungerText = document.getElementById("hunger");
const timeText = document.getElementById("time");

let W = 900;
let H = 600;

const WORLD_W = 3000;
const WORLD_H = 2200;

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

/* =========================
   PLAYER
========================= */

const player = {
    x: 1500,
    y: 1100,
    radius: 14,
    speed: 3.4,
    hp: 100,
    hunger: 100
};

/* =========================
   CAMERA
========================= */

const camera = {
    x: 0,
    y: 0
};

/* =========================
   INPUT
========================= */

const input = {
    up: false,
    down: false,
    left: false,
    right: false
};

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
    const key = e.key.toLowerCase();

    if (key === "w" || key === "arrowup") input.up = true;
    if (key === "s" || key === "arrowdown") input.down = true;
    if (key === "a" || key === "arrowleft") input.left = true;
    if (key === "d" || key === "arrowright") input.right = true;
});

window.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();

    if (key === "w" || key === "arrowup") input.up = false;
    if (key === "s" || key === "arrowdown") input.down = false;
    if (key === "a" || key === "arrowleft") input.left = false;
    if (key === "d" || key === "arrowright") input.right = false;
});

/* =========================
   CITY
========================= */

const buildings = [];

function addBuilding(x, y, w, h, damaged = false) {
    buildings.push({
        x,
        y,
        w,
        h,
        damaged
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
];

/* =========================
   TREES
========================= */

const trees = [];

for (let i = 0; i < 80; i++) {
    const x = 60 + ((i * 317) % 2880);
    const y = 60 + ((i * 191) % 2080);

    trees.push({
        x,
        y,
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

    let x = 200 + ((i * 431) % 2600);
    let y = 150 + ((i * 293) % 1900);

    zombies.push({
        x,
        y,
        radius: 13,
        speed: 0.65 + (i % 4) * 0.08,
        wander: Math.random() * Math.PI * 2,
        chase: false,
        attackCooldown: 0
    });
}

/* =========================
   DRAW GROUND
========================= */

function drawGround() {

    ctx.fillStyle = "#555b51";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Rumput
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

    // Jalan besar
    ctx.fillStyle = "#292c2a";

    ctx.fillRect(0, 520, WORLD_W, 180);
    ctx.fillRect(1100, 0, 190, WORLD_H);
    ctx.fillRect(0, 1040, WORLD_W, 120);
    ctx.fillRect(1760, 0, 110, WORLD_H);

    // Trotoar
    ctx.fillStyle = "#77766e";

    ctx.fillRect(0, 520, WORLD_W, 10);
    ctx.fillRect(0, 690, WORLD_W, 10);

    ctx.fillRect(1100, 0, 10, WORLD_H);
    ctx.fillRect(1280, 0, 10, WORLD_H);

    // Garis jalan pudar
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

    // Retakan
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
   BUILDINGS
========================= */

function drawBuildings() {

    for (const b of buildings) {

        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(
            b.x + 14,
            b.y + 14,
            b.w,
            b.h
        );

        // building body
        ctx.fillStyle = b.damaged ? "#565653" : "#65635d";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // roof
        ctx.fillStyle = "#30312f";
        ctx.fillRect(b.x, b.y, b.w, 28);

        // wall lines
        ctx.strokeStyle = "#393a37";
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // windows
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

        // damaged wall
        if (b.damaged) {

            ctx.strokeStyle = "#242724";
            ctx.lineWidth = 5;

            ctx.beginPath();
            ctx.moveTo(b.x + 30, b.y + 80);
            ctx.lineTo(b.x + 90, b.y + 130);
            ctx.lineTo(b.x + 60, b.y + 190);
            ctx.stroke();
        }

        // door
        ctx.fillStyle = "#252724";
        ctx.fillRect(
            b.x + b.w / 2 - 18,
            b.y + b.h - 48,
            36,
            48
        );
    }
}

/* =========================
   CARS
========================= */

function drawCars() {

    for (const car of cars) {

        ctx.save();

        ctx.translate(car.x, car.y);
        ctx.rotate(car.a);

        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-38, -17, 76, 34);

        // body
        ctx.fillStyle = "#343937";
        ctx.fillRect(-34, -14, 68, 28);

        // windows
        ctx.fillStyle = "#161b1b";
        ctx.fillRect(-20, -11, 40, 13);

        // wheels
        ctx.fillStyle = "#141615";

        ctx.fillRect(-26, -18, 12, 7);
        ctx.fillRect(14, -18, 12, 7);
        ctx.fillRect(-26, 11, 12, 7);
        ctx.fillRect(14, 11, 12, 7);

        // rust
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
   ZOMBIE
========================= */

function drawZombie(z) {

    ctx.save();

    ctx.translate(z.x, z.y);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = "#414b43";
    ctx.fillRect(-8, -2, 16, 24);

    // head
    ctx.fillStyle = "#7c8272";

    ctx.beginPath();
    ctx.arc(0, -9, 9, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#1b201c";
    ctx.fillRect(-5, -11, 3, 3);
    ctx.fillRect(2, -11, 3, 3);

    // arms
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

    ctx.save();

    ctx.translate(player.x, player.y);

    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(0, 17, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = "#334b56";
    ctx.fillRect(-9, -1, 18, 25);

    // head
    ctx.fillStyle = "#c38d68";

    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI * 2);
    ctx.fill();

    // hair
    ctx.fillStyle = "#252321";
    ctx.fillRect(-8, -17, 16, 6);

    // legs
    ctx.fillStyle = "#20282b";
    ctx.fillRect(-8, 22, 6, 10);
    ctx.fillRect(2, 22, 6, 10);

    ctx.restore();
}

/* =========================
   MOVEMENT
========================= */

function movePlayer() {

    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed;
        player.y += dy * player.speed;
    }

    player.x = Math.max(25, Math.min(WORLD_W - 25, player.x));
    player.y = Math.max(25, Math.min(WORLD_H - 25, player.y));
}

/* =========================
   ZOMBIE AI
========================= */

function updateZombies() {

    for (const z of zombies) {

        const dx = player.x - z.x;
        const dy = player.y - z.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 330) {
            z.chase = true;
        } else if (distance > 500) {
            z.chase = false;
        }

        if (z.chase) {

            if (distance > 30) {

                z.x += (dx / distance) * z.speed;
                z.y += (dy / distance) * z.speed;
            }

        } else {

            z.wander += (Math.random() - 0.5) * 0.15;

            z.x += Math.cos(z.wander) * 0.25;
            z.y += Math.sin(z.wander) * 0.25;
        }

        z.x = Math.max(20, Math.min(WORLD_W - 20, z.x));
        z.y = Math.max(20, Math.min(WORLD_H - 20, z.y));

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

    if (player.hp <= 0) {

        document.getElementById("message").textContent =
            "YOU DIDN'T SURVIVE";

    } else if (player.hp < 30) {

        document.getElementById("message").textContent =
            "LOW HEALTH";

    } else {

        document.getElementById("message").textContent =
            "SURVIVE";
    }
}

/* =========================
   DAY / NIGHT
========================= */

let worldTime = 8 * 60;

function updateTime() {

    worldTime += 0.035;

    if (worldTime >= 24 * 60) {
        worldTime = 0;
    }

    const hour = Math.floor(worldTime / 60);
    const minute = Math.floor(worldTime % 60);

    const formattedHour =
        String(hour).padStart(2, "0");

    const formattedMinute =
        String(minute).padStart(2, "0");

    timeText.textContent =
        `DAY 1 • ${formattedHour}:${formattedMinute}`;
}

/* =========================
   NIGHT OVERLAY
========================= */

function drawLighting() {

    const hour = worldTime / 60;

    let darkness = 0;

    if (hour >= 19 || hour < 6) {
        darkness = 0.58;
    } else if (hour >= 17) {
        darkness = 0.25;
    } else if (hour < 8) {
        darkness = 0.18;
    }

    if (darkness <= 0) return;

    ctx.fillStyle = `rgba(8,12,20,${darkness})`;
    ctx.fillRect(0, 0, W, H);
}

/* =========================
   CAMERA
========================= */

function updateCamera() {

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
   DRAW
========================= */

function draw() {

    ctx.clearRect(0, 0, W, H);

    updateCamera();

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

/* =========================
   GAME LOOP
========================= */

let lastTime = performance.now();

function gameLoop(now) {

    const delta = Math.min(
        40,
        now - lastTime
    );

    lastTime = now;

    if (player.hp > 0) {

        movePlayer();
        updateZombies();
        updateSurvival();
        updateTime();
    }

    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);