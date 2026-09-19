const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 600;

const WORLD_W = 2400;
const WORLD_H = 1800;

let player = {
    x: 1200,
    y: 900,
    size: 28,
    speed: 4,
    hp: 100,
    hunger: 100
};

let camera = {
    x: 0,
    y: 0
};

let keys = {};

const buildings = [
    { x: 250, y: 220, w: 280, h: 190, type: "🏚️" },
    { x: 700, y: 180, w: 330, h: 210, type: "🏢" },
    { x: 1450, y: 180, w: 300, h: 230, type: "🏚️" },
    { x: 1950, y: 300, w: 300, h: 200, type: "🏭" },

    { x: 180, y: 750, w: 300, h: 220, type: "🏢" },
    { x: 620, y: 720, w: 260, h: 180, type: "🏚️" },
    { x: 1550, y: 700, w: 330, h: 230, type: "🏬" },
    { x: 2010, y: 850, w: 260, h: 190, type: "🏚️" },

    { x: 300, y: 1250, w: 350, h: 230, type: "🏭" },
    { x: 850, y: 1280, w: 280, h: 190, type: "🏚️" },
    { x: 1450, y: 1250, w: 320, h: 220, type: "🏢" },
    { x: 2000, y: 1300, w: 280, h: 200, type: "🏚️" }
];

const cars = [
    { x: 570, y: 520, r: -0.1 },
    { x: 1100, y: 500, r: 0.2 },
    { x: 1370, y: 1050, r: -0.2 },
    { x: 530, y: 1120, r: 0.1 },
    { x: 1900, y: 620, r: -0.15 },
    { x: 1250, y: 1450, r: 0.2 },
    { x: 2200, y: 1120, r: -0.1 }
];

const trees = [
    [100,100], [580,120], [1100,100], [1850,120], [2300,150],
    [80,550], [500,620], [1050,650], [1350,600], [2300,650],
    [100,1100], [700,1100], [1150,1150], [1900,1150], [2350,1200],
    [100,1600], [700,1600], [1200,1600], [1850,1600], [2300,1600]
];

const rubble = [
    [620,450], [1060,430], [1820,480],
    [500,1000], [1200,1000], [1920,1050],
    [720,1500], [1350,1500], [1880,1500]
];

function resizeCanvas() {
    const ratio = 900 / 600;
    let width = window.innerWidth;
    let height = window.innerHeight - 90;

    if (width / height > ratio) {
        width = height * ratio;
    } else {
        height = width / ratio;
    }

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function movePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed;
        player.y += dy * player.speed;
    }

    player.x = Math.max(30, Math.min(WORLD_W - 30, player.x));
    player.y = Math.max(30, Math.min(WORLD_H - 30, player.y));
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    camera.x = Math.max(0, Math.min(WORLD_W - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H - canvas.height, camera.y));
}

function drawGround() {
    ctx.fillStyle = "#4b5148";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Jalan utama
    ctx.fillStyle = "#303330";

    ctx.fillRect(0, 560, WORLD_W, 150);
    ctx.fillRect(1080, 0, 170, WORLD_H);

    // Jalan kecil
    ctx.fillRect(0, 1050, WORLD_W, 100);
    ctx.fillRect(1650, 0, 100, WORLD_H);

    // Retakan jalan
    ctx.strokeStyle = "#1e211e";
    ctx.lineWidth = 5;

    for (let i = 0; i < 35; i++) {
        const x = (i * 173) % WORLD_W;
        const y = (i * 311) % WORLD_H;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y + 30);
        ctx.lineTo(x + 8, y + 55);
        ctx.stroke();
    }

    // Garis jalan yang sudah pudar
    ctx.strokeStyle = "#77796c";
    ctx.lineWidth = 3;
    ctx.setLineDash([35, 30]);

    ctx.beginPath();
    ctx.moveTo(0, 635);
    ctx.lineTo(WORLD_W, 635);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1165, 0);
    ctx.lineTo(1165, WORLD_H);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawBuildings() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const b of buildings) {
        // Bayangan
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(b.x + 12, b.y + 14, b.w, b.h);

        // Bangunan
        ctx.fillStyle = "#555752";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Atap
        ctx.fillStyle = "#3c3e3b";
        ctx.fillRect(b.x, b.y, b.w, 35);

        // Jendela rusak
        ctx.fillStyle = "#202522";

        for (let xx = b.x + 35; xx < b.x + b.w - 25; xx += 55) {
            for (let yy = b.y + 65; yy < b.y + b.h - 25; yy += 60) {
                ctx.fillRect(xx, yy, 25, 30);
            }
        }

        // Emoji penanda bangunan
        ctx.font = "42px Arial";
        ctx.fillText(b.type, b.x + b.w / 2, b.y + 20);
    }
}

function drawCars() {
    for (const car of cars) {
        ctx.save();

        ctx.translate(car.x, car.y);
        ctx.rotate(car.r);

        ctx.fillStyle = "#252827";
        ctx.fillRect(-32, -16, 64, 32);

        ctx.fillStyle = "#151817";
        ctx.fillRect(-20, -11, 40, 18);

        ctx.fillStyle = "#555";
        ctx.fillRect(-25, -18, 12, 6);
        ctx.fillRect(13, -18, 12, 6);
        ctx.fillRect(-25, 12, 12, 6);
        ctx.fillRect(13, 12, 12, 6);

        ctx.restore();
    }
}

function drawTrees() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "38px Arial";

    for (const [x, y] of trees) {
        ctx.fillText("🌲", x, y);
    }
}

function drawRubble() {
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const [x, y] of rubble) {
        ctx.fillText("🧱", x, y);
        ctx.fillText("🪨", x + 28, y + 15);
        ctx.fillText("🧱", x - 25, y + 18);
    }
}

function drawPlayer() {
    ctx.save();

    ctx.translate(player.x, player.y);

    // Bayangan player
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "42px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("🧑", 0, 0);

    ctx.restore();
}

function drawHUD() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(15, 15, 240, 82);

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";

    ctx.fillText("VIRELIA: AFTERFALL", 28, 40);

    ctx.fillText("HP", 28, 68);
    ctx.fillStyle = "#222";
    ctx.fillRect(60, 55, 150, 15);

    ctx.fillStyle = "#d44";
    ctx.fillRect(60, 55, player.hp * 1.5, 15);

    ctx.fillStyle = "white";
    ctx.fillText("HP " + player.hp, 60, 90);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateCamera();

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawGround();
    drawTrees();
    drawBuildings();
    drawCars();
    drawRubble();
    drawPlayer();

    ctx.restore();

    drawHUD();
}

function gameLoop() {
    movePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();