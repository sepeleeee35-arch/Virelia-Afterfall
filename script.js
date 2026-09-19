const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hp");
const hungerText = document.getElementById("hunger");
const timeText = document.getElementById("time");
const message = document.getElementById("message");
const interactButton = document.getElementById("interact");

let W = innerWidth;
let H = innerHeight;

function resize() {
    W = innerWidth;
    H = innerHeight;

    const dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);
resize();

const WORLD_W = 3200;
const WORLD_H = 2400;

/* =========================
   PLAYER
========================= */

const player = {
    x: 1600,
    y: 1200,
    radius: 14,
    speed: 3.2,
    hp: 100,
    hunger: 100,

    inside: false,
    driving: false,
    currentCar: null,
    currentBuilding: null
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

function bindButton(id, key) {
    const el = document.getElementById(id);

    el.addEventListener("pointerdown", e => {
        e.preventDefault();
        input[key] = true;
    });

    el.addEventListener("pointerup", e => {
        e.preventDefault();
        input[key] = false;
    });

    el.addEventListener("pointercancel", () => {
        input[key] = false;
    });

    el.addEventListener("pointerleave", () => {
        input[key] = false;
    });
}

bindButton("up", "up");
bindButton("down", "down");
bindButton("left", "left");
bindButton("right", "right");

addEventListener("keydown", e => {
    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") input.up = true;
    if (k === "s" || k === "arrowdown") input.down = true;
    if (k === "a" || k === "arrowleft") input.left = true;
    if (k === "d" || k === "arrowright") input.right = true;

    if (k === "e") interact();
});

addEventListener("keyup", e => {
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
        doorW: 60
    });
}

addBuilding(180, 180, 330, 230, true);
addBuilding(700, 150, 370, 270, false);
addBuilding(1380, 180, 350, 250, true);
addBuilding(2040, 210, 430, 260, true);

addBuilding(130, 720, 360, 260, false);
addBuilding(650, 700, 300, 230, true);
addBuilding(1770, 690, 400, 280, true);
addBuilding(2380, 760, 360, 240, false);

addBuilding(200, 1400, 420, 260, true);
addBuilding(850, 1350, 350, 280, false);
addBuilding(1480, 1390, 390, 250, true);
addBuilding(2140, 1420, 430, 260, true);

/* =========================
   CARS
========================= */

const cars = [
    {x:560,y:550,a:0.05},
    {x:1120,y:560,a:-0.08},
    {x:1280,y:1030,a:0.12},
    {x:1570,y:1070,a:-0.1},
    {x:2250,y:580,a:0.08},
    {x:720,y:1190,a:-0.1},
    {x:1940,y:1190,a:0.1},
    {x:1320,y:1770,a:0.05},
    {x:2660,y:1160,a:-0.1}
].map(c => ({
    ...c,
    occupied: false
}));

/* =========================
   TREES
========================= */

const trees = [];

for (let i = 0; i < 75; i++) {
    trees.push({
        x: 70 + ((i * 317) % 3000),
        y: 70 + ((i * 191) % 2250),
        size: 20 + (i % 3) * 5
    });
}

/* =========================
   RUBBLE
   Dekorasi SAJA.
   Tidak bikin player nyangkut.
========================= */

const rubble = [];

for (let i = 0; i < 100; i++) {
    rubble.push({
        x: 50 + ((i * 233) % 3050),
        y: 50 + ((i * 149) % 2300),
        size: 4 + (i % 6)
    });
}

/* =========================
   COLLISION
========================= */

function circleRect(x, y, radius, r) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));

    const dx = x - cx;
    const dy = y - cy;

    return dx * dx + dy * dy < radius * radius;
}

function treeBlocked(x, y, radius = player.radius) {

    for (const t of trees) {

        const dx = x - t.x;
        const dy = y - (t.y + t.size * 0.35);

        if (
            Math.hypot(dx, dy) <
            t.size * 0.7 + radius
        ) {
            return true;
        }
    }

    return false;
}

function carBlocked(x, y, radius = player.radius) {

    for (const car of cars) {

        if (car === player.currentCar) continue;

        const r = {
            x: car.x - 42,
            y: car.y - 24,
            w: 84,
            h: 48
        };

        if (circleRect(x, y, radius, r)) {
            return true;
        }
    }

    return false;
}

function doorOpen(b, x, y) {

    const doorX = b.x + b.w / 2;

    return (
        x > doorX - b.doorW / 2 &&
        x < doorX + b.doorW / 2 &&
        y > b.y + b.h - 65 &&
        y < b.y + b.h + 30
    );
}

function buildingBlocked(x, y, radius = player.radius) {

    for (const b of buildings) {

        const expanded = {
            x: b.x - radius,
            y: b.y - radius,
            w: b.w + radius * 2,
            h: b.h + radius * 2
        };

        if (!circleRect(x, y, 0, expanded)) continue;

        if (doorOpen(b, x, y)) {
            continue;
        }

        return true;
    }

    return false;
}

function positionBlocked(x, y, radius = player.radius) {

    if (
        x < radius ||
        y < radius ||
        x > WORLD_W - radius ||
        y > WORLD_H - radius
    ) {
        return true;
    }

    if (treeBlocked(x, y, radius)) return true;
    if (carBlocked(x, y, radius)) return true;
    if (buildingBlocked(x, y, radius)) return true;

    return false;
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

    if (!dx && !dy) return;

    const len = Math.hypot(dx, dy);

    dx /= len;
    dy /= len;

    const speed = player.driving ? 6 : player.speed;

    const nx = player.x + dx * speed;
    const ny = player.y + dy * speed;

    /*
       X dan Y dipisah supaya kalau mentok
       di satu arah, karakter masih bisa geser.
    */

    if (!positionBlocked(nx, player.y)) {
        player.x = nx;
    }

    if (!positionBlocked(player.x, ny)) {
        player.y = ny;
    }

    if (player.driving && player.currentCar) {
        player.currentCar.x = player.x;
        player.currentCar.y = player.y;
    }
}

/* =========================
   INTERACTION
========================= */

function nearestCar() {

    let result = null;
    let best = Infinity;

    for (const car of cars) {

        if (car.occupied) continue;

        const d = Math.hypot(
            player.x - car.x,
            player.y - car.y
        );

        if (d < 90 && d < best) {
            best = d;
            result = car;
        }
    }

    return result;
}

function nearestDoor() {

    let result = null;
    let best = Infinity;

    for (const b of buildings) {

        const doorX = b.x + b.w / 2;
        const doorY = b.y + b.h;

        const d = Math.hypot(
            player.x - doorX,
            player.y - doorY
        );

        if (d < 100 && d < best) {
            best = d;
            result = b;
        }
    }

    return result;
}

function interact() {

    if (player.inside) {
        exitBuilding();
        return;
    }

    if (player.driving) {
        exitCar();
        return;
    }

    const car = nearestCar();

    if (car) {
        enterCar(car);
        return;
    }

    const building = nearestDoor();

    if (building) {
        enterBuilding(building);
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
    }, 700);
}

function exitCar() {

    const car = player.currentCar;

    if (!car) return;

    car.occupied = false;

    player.driving = false;
    player.currentCar = null;

    /*
       Cari posisi kosong di sekitar mobil.
    */

    const spots = [
        [55,0],
        [-55,0],
        [0,55],
        [0,-55]
    ];

    for (const [sx, sy] of spots) {

        const nx = car.x + sx;
        const ny = car.y + sy;

        if (!positionBlocked(nx, ny)) {
            player.x = nx;
            player.y = ny;
            break;
        }
    }

    message.textContent = "ON FOOT";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 700);
}

function enterBuilding(building) {

    player.inside = true;
    player.currentBuilding = building;

    player.x = W / 2;
    player.y = H / 2 + 80;

    message.textContent = "ENTERED BUILDING";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 700);
}

function exitBuilding() {

    const b = player.currentBuilding;

    player.inside = false;
    player.currentBuilding = null;

    player.x = b.x + b.w / 2;
    player.y = b.y + b.h + 55;

    message.textContent = "OUTSIDE";

    setTimeout(() => {
        message.textContent = "SURVIVE";
    }, 700);
}

function moveInside() {

    let dx = 0;
    let dy = 0;

    if (input.up) dy--;
    if (input.down) dy++;
    if (input.left) dx--;
    if (input.right) dx++;

    if (!dx && !dy) return;

    const len = Math.hypot(dx, dy);

    dx /= len;
    dy /= len;

    player.x += dx * player.speed;
    player.y += dy * player.speed;

    player.x = Math.max(70, Math.min(W - 70, player.x));
    player.y = Math.max(120, Math.min(H - 90, player.y));
}

/* =========================
   ZOMBIES
========================= */

const zombies = [];

function validZombieSpawn(x, y) {
    return !positionBlocked(x, y, 16);
}

for (let i = 0; i < 28; i++) {

    let x;
    let y;

    do {
        x = 100 + ((i * 431) % 3000);
        y = 100 + ((i * 293) % 2200);
    } while (
        !validZombieSpawn(x, y) ||
        Math.hypot(x - player.x, y - player.y) < 280
    );

    zombies.push({
        x,
        y,
        radius: 13,
        speed: 0.55 + (i % 4) * 0.08,
        attackCooldown: 0,
        wanderAngle: Math.random() * Math.PI * 2
    });
}

function zombieCanMove(x, y) {

    if (
        x < 25 ||
        y < 25 ||
        x > WORLD_W - 25 ||
        y > WORLD_H - 25
    ) {
        return false;
    }

    if (treeBlocked(x, y, 15)) return false;
    if (buildingBlocked(x, y, 15)) return false;

    /*
       Zombie juga tidak boleh masuk mobil.
    */
    if (carBlocked(x, y, 15)) return false;

    return true;
}

function updateZombies() {

    if (player.inside) return;

    for (const z of zombies) {

        const dx = player.x - z.x;
        const dy = player.y - z.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 500 && distance > 30) {

            let vx = dx / distance;
            let vy = dy / distance;

            /*
               Coba arah utama.
            */

            let nx = z.x + vx * z.speed;
            let ny = z.y + vy * z.speed;

            if (zombieCanMove(nx, ny)) {

                z.x = nx;
                z.y = ny;

            } else {

                /*
                   Kalau mentok, coba 4 arah samping.
                   Ini mencegah zombie diam nempel di gedung.
                */

                const angles = [
                    Math.PI / 2,
                    -Math.PI / 2,
                    Math.PI / 4,
                    -Math.PI / 4
                ];

                let moved = false;

                for (const a of angles) {

                    const ca = Math.cos(a);
                    const sa = Math.sin(a);

                    nx =
                        z.x +
                        (vx * ca - vy * sa) *
                        z.speed * 1.5;

                    ny =
                        z.y +
                        (vx * sa + vy * ca) *
                        z.speed * 1.5;

                    if (zombieCanMove(nx, ny)) {

                        z.x = nx;
                        z.y = ny;

                        moved = true;
                        break;
                    }
                }

                if (!moved) {
                    z.wanderAngle += 0.4;
                }
            }
        }

        if (distance < 32) {

            z.attackCooldown--;

            if (z.attackCooldown <= 0) {
                player.hp = Math.max(0, player.hp - 4);
                z.attackCooldown = 45;
            }
        }
    }
}

/* =========================
   WORLD
========================= */

function drawGround() {

    ctx.fillStyle = "#596056";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    /*
       Jalan utama.
    */

    ctx.fillStyle = "#292d2b";

    ctx.fillRect(0, 510, WORLD_W, 190);
    ctx.fillRect(1120, 0, 190, WORLD_H);
    ctx.fillRect(0, 1030, WORLD_W, 120);
    ctx.fillRect(1780, 0, 100, WORLD_H);

    /*
       Garis jalan.
    */

    ctx.strokeStyle = "#85857a";
    ctx.lineWidth = 4;
    ctx.setLineDash([45, 35]);

    ctx.beginPath();
    ctx.moveTo(0, 605);
    ctx.lineTo(WORLD_W, 605);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1215, 0);
    ctx.lineTo(1215, WORLD_H);
    ctx.stroke();

    ctx.setLineDash([]);

    /*
       Retakan.
    */

    ctx.strokeStyle = "#202422";
    ctx.lineWidth = 4;

    for (let i = 0; i < 50; i++) {

        const x = (i * 179) % WORLD_W;
        const y = (i * 313) % WORLD_H;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 15, y + 15);
        ctx.lineTo(x + 8, y + 30);
        ctx.lineTo(x + 24, y + 42);
        ctx.stroke();
    }
}

/* =========================
   BUILDINGS
========================= */

function drawBuildings() {

    for (const b of buildings) {

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(
            b.x + 15,
            b.y + 18,
            b.w,
            b.h
        );

        ctx.fillStyle =
            b.damaged ? "#50504d" : "#62615b";

        ctx.fillRect(
            b.x,
            b.y,
            b.w,
            b.h
        );

        ctx.strokeStyle = "#343633";
        ctx.lineWidth = 6;

        ctx.strokeRect(
            b.x,
            b.y,
            b.w,
            b.h
        );

        /*
           Windows.
        */

        for (
            let x = b.x + 35;
            x < b.x + b.w - 35;
            x += 70
        ) {

            for (
                let y = b.y + 50;
                y < b.y + b.h - 70;
                y += 70
            ) {

                ctx.fillStyle = "#1c2222";

                ctx.fillRect(
                    x,
                    y,
                    32,
                    42
                );

                ctx.strokeStyle = "#6d6c64";
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 32, y + 42);
                ctx.stroke();
            }
        }

        /*
           Pintu.
        */

        const doorX = b.x + b.w / 2;

        ctx.fillStyle = "#242725";

        ctx.fillRect(
            doorX - 30,
            b.y + b.h - 60,
            60,
            60
        );

        /*
           Pintu sedikit terang kalau player dekat.
        */

        const d = Math.hypot(
            player.x - doorX,
            player.y - (b.y + b.h)
        );

        if (!player.inside && d < 120) {

            ctx.strokeStyle = "#d6c27b";
            ctx.lineWidth = 3;

            ctx.strokeRect(
                doorX - 33,
                b.y + b.h - 63,
                66,
                66
            );
        }

        /*
           Kerusakan bangunan.
        */

        if (b.damaged) {

            ctx.strokeStyle = "#242623";
            ctx.lineWidth = 5;

            ctx.beginPath();
            ctx.moveTo(b.x + 30, b.y + 80);
            ctx.lineTo(b.x + 100, b.y + 135);
            ctx.lineTo(b.x + 60, b.y + 200);
            ctx.stroke();
        }
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

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(-45, -24, 90, 48);

        ctx.fillStyle =
            car.occupied ? "#68776a" : "#363b39";

        ctx.fillRect(-38, -17, 76, 34);

        ctx.fillStyle = "#151a19";
        ctx.fillRect(-22, -13, 44, 15);

        ctx.fillStyle = "#171918";

        ctx.fillRect(-30, -22, 14, 7);
        ctx.fillRect(16, -22, 14, 7);
        ctx.fillRect(-30, 15, 14, 7);
        ctx.fillRect(16, 15, 14, 7);

        ctx.fillStyle = "#6d4b3b";
        ctx.fillRect(-31, 5, 17, 5);

        ctx.restore();
    }
}

/* =========================
   TREES
========================= */

function drawTrees() {

    for (const t of trees) {

        /*
           Shadow.
        */

        ctx.fillStyle = "rgba(0,0,0,0.25)";

        ctx.beginPath();
        ctx.ellipse(
            t.x,
            t.y + t.size * 0.7,
            t.size,
            t.size * 0.35,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        /*
           Trunk.
        */

        ctx.fillStyle = "#38352e";

        ctx.fillRect(
            t.x - 4,
            t.y,
            8,
            t.size
        );

        /*
           Tree crown.
        */

        ctx.fillStyle = "#263d2c";

        ctx.beginPath();

        ctx.moveTo(
            t.x,
            t.y - t.size
        );

        ctx.lineTo(
            t.x - t.size,
            t.y + t.size
        );

        ctx.lineTo(
            t.x + t.size,
            t.y + t.size
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

        ctx.fillStyle = "#3f423e";

        ctx.fillRect(
            r.x,
            r.y,
            r.size,
            r.size
        );

        ctx.fillStyle = "#6b6b62";

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

    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();
    ctx.ellipse(
        0,
        14,
        15,
        6,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#3f4a42";

    ctx.fillRect(
        -9,
        -1,
        18,
        25
    );

    ctx.fillStyle = "#7b8275";

    ctx.beginPath();
    ctx.arc(
        0,
        -10,
        10,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#1b201d";

    ctx.fillRect(-5, -12, 3, 3);
    ctx.fillRect(2, -12, 3, 3);

    ctx.strokeStyle = "#697367";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(-16, 11);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(7, 2);
    ctx.lineTo(16, 11);
    ctx.stroke();

    ctx.restore();
}

/* =========================
   PLAYER
========================= */

function drawPlayer() {

    if (player.driving) return;

    /*
       Shadow.
    */

    ctx.fillStyle = "rgba(0,0,0,0.4)";

    ctx.beginPath();
    ctx.ellipse(
        player.x,
        player.y + 18,
        16,
        7,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    /*
       Body.
    */

    ctx.fillStyle = "#354b55";

    ctx.fillRect(
        player.x - 10,
        player.y - 2,
        20,
        26
    );

    /*
       Head.
    */

    ctx.fillStyle = "#c58e68";

    ctx.beginPath();
    ctx.arc(
        player.x,
        player.y - 13,
        10,
        0,
        Math.PI * 2
    );
    ctx.fill();

    /*
       Hair.
    */

    ctx.fillStyle = "#242321";

    ctx.fillRect(
        player.x - 9,
        player.y - 21,
        18,
        7
    );

    /*
       STATIC LEGS.
    */

    ctx.fillStyle = "#20282b";

    ctx.fillRect(
        player.x - 8,
        player.y + 23,
        6,
        11
    );

    ctx.fillRect(
        player.x + 2,
        player.y + 23,
        6,
        11
    );
}

/* =========================
   INTERIOR
========================= */

function drawInterior() {

    ctx.fillStyle = "#202320";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#55544e";

    ctx.fillRect(
        35,
        75,
        W - 70,
        H - 110
    );

    ctx.fillStyle = "#383a36";

    ctx.fillRect(35, 75, W - 70, 20);
    ctx.fillRect(35, 75, 20, H - 110);
    ctx.fillRect(W - 55, 75, 20, H - 110);
    ctx.fillRect(35, H - 55, W - 70, 20);

    /*
       Furniture.
    */

    ctx.fillStyle = "#3c342d";
    ctx.fillRect(100, 170, 190, 80);

    ctx.fillStyle = "#333a39";
    ctx.fillRect(W - 300, 260, 180, 100);

    ctx.fillStyle = "#484039";
    ctx.fillRect(100, 340, 80, 130);

    drawPlayer();

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";

    ctx.fillText(
        "INTERIOR • cari persediaan",
        55,
        52
    );
}

/* =========================
   CAMERA
   3/4 / OVER-SHOULDER STYLE
========================= */

const camera = {
    x: 0,
    y: 0
};

function updateCamera() {

    if (player.inside) {
        camera.x = 0;
        camera.y = 0;
        return;
    }

    /*
       Player diletakkan lebih bawah,
       bukan tepat di tengah.
    */

    const targetX = player.x - W / 2;
    const targetY = player.y - H * 0.62;

    /*
       Smooth camera.
    */

    camera.x += (targetX - camera.x) * 0.10;
    camera.y += (targetY - camera.y) * 0.10;

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
   PERSPECTIVE DRAW
========================= */

function worldToScreen(x, y) {

    const sx = x - camera.x;

    /*
       Dunia bagian bawah sedikit lebih besar.
       Ini memberi rasa 3/4 perspective.
    */

    const depth =
        Math.max(
            0,
            Math.min(
                1,
                (y - camera.y) / H
            )
        );

    const scale =
        0.78 + depth * 0.22;

    const sy =
        (y - camera.y) * scale;

    return {
        x: W / 2 + (sx - W / 2) * scale,
        y: sy
    };
}

/*
   Untuk versi ini kita pakai kamera smooth
   tanpa merusak collision dunia.
*/

function drawWorld() {

    ctx.save();

    /*
       Sedikit turun untuk feel kamera game.
    */

    ctx.translate(
        -camera.x,
        -camera.y
    );

    drawGround();
    drawRubble();
    drawBuildings();
    drawTrees();
    drawCars();

    for (const z of zombies) {
        drawZombie(z);
    }

    drawPlayer();

    ctx.restore();
}

/* =========================
   DAY / NIGHT
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

function drawLighting() {

    if (player.inside) return;

    const hour = worldTime / 60;

    let darkness = 0;

    if (hour >= 20 || hour < 6) {
        darkness = 0.62;
    } else if (hour >= 18) {
        darkness = 0.30;
    } else if (hour < 8) {
        darkness = 0.18;
    }

    if (darkness > 0) {

        ctx.fillStyle =
            `rgba(7,10,16,${darkness})`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }
}

/* =========================
   SURVIVAL
========================= */

let hungerTimer = 0;

function updateSurvival() {

    hungerTimer++;

    if (hungerTimer >= 300) {

        player.hunger =
            Math.max(
                0,
                player.hunger - 1
            );

        hungerTimer = 0;
    }

    if (player.hunger <= 0) {

        player.hp =
            Math.max(
                0,
                player.hp - 0.08
            );
    }

    hpText.textContent =
        Math.floor(player.hp);

    hungerText.textContent =
        Math.floor(player.hunger);
}

/* =========================
   INTERACTION BUTTON
========================= */

function updateInteraction() {

    if (player.inside) {

        interactButton.style.display = "block";
        interactButton.textContent = "EXIT";

        return;
    }

    if (player.driving) {

        interactButton.style.display = "block";
        interactButton.textContent = "EXIT CAR";

        return;
    }

    const car = nearestCar();

    if (car) {

        interactButton.style.display = "block";
        interactButton.textContent = "ENTER CAR";

        return;
    }

    const building = nearestDoor();

    if (building) {

        interactButton.style.display = "block";
        interactButton.textContent = "ENTER";

        return;
    }

    /*
       Tetap tampil supaya user selalu tahu
       ada tombol interaksi.
    */

    interactButton.style.display = "block";
    interactButton.textContent = "INTERACT";
}

/* =========================
   MAIN DRAW
========================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    updateCamera();

    if (player.inside) {

        drawInterior();

    } else {

        drawWorld();
        drawLighting();
    }
}

/* =========================
   GAME LOOP
========================= */

function loop() {

    if (player.hp > 0) {

        movePlayer();
        updateZombies();
        updateSurvival();
        updateTime();
    }

    updateInteraction();
    draw();

    requestAnimationFrame(loop);
}

loop();