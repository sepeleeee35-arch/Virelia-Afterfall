const player = document.getElementById("player");
const world = document.getElementById("world");

const game = document.getElementById("game");

// Posisi Player di dunia.
let playerX = 950;
let playerY = 675;

// Kecepatan Player.
const speed = 4;

// Ukuran dunia.
const worldWidth = 2000;
const worldHeight = 1400;

// Ukuran Player.
const playerSize = 55;

// Tombol yang sedang ditekan.
const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// ================================
// KONTROL KEYBOARD
// ================================

document.addEventListener("keydown", function(event) {

    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        keys.up = true;
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        keys.down = true;
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }

});

document.addEventListener("keyup", function(event) {

    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        keys.up = false;
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        keys.down = false;
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }

});

// ================================
// KONTROL TOMBOL MOBILE
// ================================

const controlButtons = document.querySelectorAll("#controls button");

controlButtons.forEach(function(button) {

    const direction = button.dataset.key;

    button.addEventListener("pointerdown", function(event) {

        event.preventDefault();

        keys[direction] = true;

    });

    button.addEventListener("pointerup", function(event) {

        event.preventDefault();

        keys[direction] = false;

    });

    button.addEventListener("pointercancel", function() {

        keys[direction] = false;

    });

    button.addEventListener("pointerleave", function() {

        keys[direction] = false;

    });

});

// ================================
// UPDATE PLAYER
// ================================

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;

    if (keys.left) {
        moveX -= speed;
    }

    if (keys.right) {
        moveX += speed;
    }

    if (keys.up) {
        moveY -= speed;
    }

    if (keys.down) {
        moveY += speed;
    }

    // Bergerak secara diagonal tetap normal kecepatannya.
    if (moveX !== 0 && moveY !== 0) {

        moveX *= 0.707;
        moveY *= 0.707;

    }

    playerX += moveX;
    playerY += moveY;

    // Batasi Player agar tidak keluar dunia.
    playerX = Math.max(
        0,
        Math.min(worldWidth - playerSize, playerX)
    );

    playerY = Math.max(
        0,
        Math.min(worldHeight - playerSize, playerY)
    );

    // Terapkan posisi Player.
    player.style.left = playerX + "px";
    player.style.top = playerY + "px";

}

// ================================
// CAMERA
// ================================

function updateCamera() {

    // Tentukan posisi Player di tengah layar.
    let cameraX =
        playerX -
        window.innerWidth / 2 +
        playerSize / 2;

    let cameraY =
        playerY -
        window.innerHeight / 2 +
        playerSize / 2;

    // Batasi kamera agar tidak keluar dunia.
    const maxCameraX =
        worldWidth - window.innerWidth;

    const maxCameraY =
        worldHeight - window.innerHeight;

    cameraX = Math.max(
        0,
        Math.min(maxCameraX, cameraX)
    );

    cameraY = Math.max(
        0,
        Math.min(maxCameraY, cameraY)
    );

    // Gerakkan dunia berlawanan dengan kamera.
    world.style.transform =
        `translate(${-cameraX}px, ${-cameraY}px)`;
}

// ================================
// GAME LOOP
// ================================

function gameLoop() {

    updatePlayer();

    updateCamera();

    requestAnimationFrame(gameLoop);

}

// Jalankan game.
gameLoop();