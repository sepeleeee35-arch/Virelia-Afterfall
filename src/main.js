import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { input, setupInput } from "./input.js";
import { player } from "./player.js";
import { world, createWorld, getZoneState, getNearbyInteraction, canMoveTo } from "./world.js";
import { bots, createBots, updateBots, damageBot } from "./bots.js";

const VERSION = "2.4.0";
const canvas = document.getElementById("game");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x879da0);
scene.fog = new THREE.Fog(0x879da0, 900, 5600);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 8000);

scene.add(new THREE.HemisphereLight(0xdcebe7, 0x3f4b45, 2.2));

const sun = new THREE.DirectionalLight(0xffedc5, 3.1);
sun.position.set(-900, 1500, 700);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 100;
sun.shadow.camera.far = 3600;
sun.shadow.camera.left = -1600;
sun.shadow.camera.right = 1600;
sun.shadow.camera.top = 1600;
sun.shadow.camera.bottom = -1600;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x9fc5d8, 0.65);
fill.position.set(900, 500, -1000);
scene.add(fill);

let running = false;
let lastTime = 0;
let yaw = 0.35;
let pitch = 0.08;

const CAMERA_DISTANCE = 104;
const CAMERA_HEIGHT = 60;
const CAMERA_SHOULDER = 28;
const CAMERA_SMOOTH = 14;

const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const aimDirection = new THREE.Vector3();

const raycaster = new THREE.Raycaster();

let playerGroup = null;
let weaponGroup = null;
let muzzle = null;
let fireCooldown = 0;
let ammo = 30;
let reloadTimer = 0;
let zoneClock = 300;
let lastHp = 100;

const inventory = {
  medkit: 0,
  food: 0,
  helmet: "-",
  vest: "-",
  backpack: "-",
  shoes: "-"
};

function resize() {
  const w = Math.max(1, innerWidth);
  const h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function makeMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.08
  });
}

function createPlayer() {
  playerGroup = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(13, 30, 6, 10),
    makeMaterial(0x243842)
  );
  body.position.y = 38;
  body.castShadow = true;
  playerGroup.add(body);

  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(30, 23, 22),
    makeMaterial(0x4a5d61)
  );
  vest.position.y = 42;
  vest.castShadow = true;
  playerGroup.add(vest);

  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(18, 27, 11),
    makeMaterial(0x303a38)
  );
  backpack.position.set(0, 43, 13);
  backpack.castShadow = true;
  playerGroup.add(backpack);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(10.5, 12, 10),
    makeMaterial(0xc28d73)
  );
  head.position.y = 72;
  head.castShadow = true;
  playerGroup.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(13, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    makeMaterial(0x20292c)
  );
  helmet.position.y = 77;
  helmet.castShadow = true;
  playerGroup.add(helmet);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(4.5, 20, 4, 7),
      makeMaterial(0x31474d)
    );
    arm.position.set(side * 17, 44, -1);
    arm.rotation.z = side * 0.18;
    arm.castShadow = true;
    playerGroup.add(arm);

    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(5, 24, 4, 7),
      makeMaterial(0x20292c)
    );
    leg.position.set(side * 7, 16, 0);
    leg.castShadow = true;
    playerGroup.add(leg);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(10, 7, 16),
      makeMaterial(0x171c1d)
    );
    boot.position.set(side * 7, 4, -3);
    boot.castShadow = true;
    playerGroup.add(boot);
  }

  createWeapon();
  scene.add(playerGroup);
}

function createWeapon() {
  weaponGroup = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x202629,
    metalness: 0.25,
    roughness: 0.65
  });

  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(9, 7, 38),
    mat
  );
  stock.position.set(13, 45, -22);
  stock.castShadow = true;
  weaponGroup.add(stock);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 3, 48, 8),
    mat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(13, 50, -48);
  barrel.castShadow = true;
  weaponGroup.add(barrel);

  muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd36a })
  );
  muzzle.position.set(13, 50, -73);
  muzzle.visible = false;
  weaponGroup.add(muzzle);

  playerGroup.add(weaponGroup);
}

function updatePlayer(dt) {
  const sx = input.x;
  const sy = input.y;
  const magnitude = Math.min(1, Math.hypot(sx, sy));

  moveForward.set(Math.sin(yaw), 0, -Math.cos(yaw));
  moveRight.set(Math.cos(yaw), 0, Math.sin(yaw));
  moveVector.set(0, 0, 0);

  moveVector
    .addScaledVector(moveRight, sx)
    .addScaledVector(moveForward, sy);

  if (moveVector.lengthSq() > 0.0001) {
    moveVector.normalize().multiplyScalar(magnitude);
  }

  let speed = player.speed;

  player.crouch = input.crouch;

  if (player.crouch) {
    speed *= 0.52;
  }

  if (input.run && !player.crouch && player.stamina > 0 && magnitude > 0.2) {
    speed *= 1.55;
    player.stamina = Math.max(0, player.stamina - 30 * dt);
  } else {
    player.stamina = Math.min(100, player.stamina + 20 * dt);
  }

  const stepX = moveVector.x * speed * dt;
  const stepZ = moveVector.z * speed * dt;
  const nextX = player.x + stepX;
  const nextZ = player.y + stepZ;

  if (canMoveTo(nextX, player.y, 28)) player.x = nextX;
  if (canMoveTo(player.x, nextZ, 28)) player.y = nextZ;

  player.x = Math.max(28, Math.min(world.width - 28, player.x));
  player.y = Math.max(28, Math.min(world.height - 28, player.y));
}

function updatePlayerVisual() {
  if (!playerGroup) return;

  playerGroup.position.set(player.x, 0, player.y);

  if (moveVector.lengthSq() > 0.0001) {
    playerGroup.rotation.y = Math.atan2(moveVector.x, -moveVector.z);
  }

  const targetScaleY = input.crouch ? 0.78 : 1;
  playerGroup.scale.y += (targetScaleY - playerGroup.scale.y) * 0.2;
}

function updateCamera(dt) {
  const distance = input.aim ? 52 : CAMERA_DISTANCE;
  const height = input.crouch ? 38 : CAMERA_HEIGHT;
  const lookHeight = input.crouch ? 34 : 47;

  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  const backX = -Math.sin(yaw) * cp;
  const backZ = Math.cos(yaw) * cp;

  cameraRight.set(Math.cos(yaw), 0, Math.sin(yaw));

  cameraTarget.set(player.x, lookHeight, player.y);

  cameraDesired.set(
    player.x + backX * distance + cameraRight.x * CAMERA_SHOULDER,
    height + sp * distance * 0.2,
    player.y + backZ * distance + cameraRight.z * CAMERA_SHOULDER
  );

  camera.position.lerp(
    cameraDesired,
    1 - Math.exp(-CAMERA_SMOOTH * dt)
  );

  camera.lookAt(
    cameraTarget.x,
    cameraTarget.y + sp * 8,
    cameraTarget.z
  );
}

function showCombatMessage(text) {
  const message = document.getElementById("message");
  if (!message) return;

  message.textContent = text;
  message.style.opacity = "1";

  clearTimeout(showCombatMessage.timer);
  showCombatMessage.timer = setTimeout(() => {
    message.style.opacity = "0";
  }, 700);
}

function fireWeapon() {
  if (reloadTimer > 0 || fireCooldown > 0 || ammo <= 0) return;

  ammo -= 1;
  fireCooldown = 0.11;

  if (muzzle) {
    muzzle.visible = true;
    clearTimeout(fireWeapon.flash);
    fireWeapon.flash = setTimeout(() => {
      if (muzzle) muzzle.visible = false;
    }, 55);
  }

  aimDirection
    .set(Math.sin(yaw), Math.sin(pitch), -Math.cos(yaw))
    .normalize();

  raycaster.set(camera.position, aimDirection);
  raycaster.far = 700;

  let best = null;
  let bestDistance = Infinity;

  for (const bot of bots) {
    if (bot.dead || bot.hp <= 0 || !bot.mesh.visible) continue;

    const dx = bot.x - camera.position.x;
    const dy = 42 - camera.position.y;
    const dz = bot.z - camera.position.z;

    const along = dx * aimDirection.x + dy * aimDirection.y + dz * aimDirection.z;

    if (along < 0 || along > 700) continue;

    const px = camera.position.x + aimDirection.x * along;
    const py = camera.position.y + aimDirection.y * along;
    const pz = camera.position.z + aimDirection.z * along;

    const miss = Math.hypot(bot.x - px, 42 - py, bot.z - pz);

    if (miss < 30 && along < bestDistance) {
      best = bot;
      bestDistance = along;
    }
  }

  if (best) {
    const damage = input.aim ? 40 : 34;
    damageBot(best, damage);
    showCombatMessage(best.hp <= 0 ? "ELIMINATED" : "HIT -" + damage);
  }
}

function pickupNearby() {
  const nearby = getNearbyInteraction(player.x, player.y);

  if (!nearby) {
    showCombatMessage("NOTHING TO PICK UP");
    return;
  }

  if (nearby.type === "loot") {
    const loot = nearby.object;
    const slot = loot.type.toLowerCase();

    if (["helmet", "vest", "backpack", "shoes"].includes(slot)) {
      if (inventory[slot] !== "-") {
        showCombatMessage(slot.toUpperCase() + " SLOT FULL");
        return;
      }

      inventory[slot] = "LV1";
      loot.taken = true;
      loot.mesh.visible = false;
      showCombatMessage(slot.toUpperCase() + " EQUIPPED");
      return;
    }

    inventory[slot] = (inventory[slot] || 0) + 1;
    loot.taken = true;
    loot.mesh.visible = false;
    showCombatMessage(loot.type + " +1");
    return;
  }

  showCombatMessage("VEHICLE READY");
}

function updateInventoryHud() {
  for (const key of Object.keys(inventory)) {
    const element = document.getElementById(key);
    if (element) element.textContent = inventory[key];
  }
}

function drawMinimap() {
  const canvasMini = document.getElementById("mini");
  const ctx = canvasMini && canvasMini.getContext("2d");
  if (!ctx) return;

  const width = Math.max(1, canvasMini.clientWidth * 2);
  const height = Math.max(1, canvasMini.clientHeight * 2);

  canvasMini.width = width;
  canvasMini.height = height;

  const sx = width / world.width;
  const sy = height / world.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#5d7555";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#4f6f7a";
  ctx.fillRect(world.width * sx * 0.78, 0, width * 0.22, height);

  ctx.fillStyle = "#4b4f4e";
  for (const road of world.roads) {
    ctx.fillRect(
      road.x * sx,
      road.z * sy,
      road.w * sx,
      road.d * sy
    );
  }

  ctx.strokeStyle = "rgba(255,255,255,.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    world.safeZone.x * sx,
    world.safeZone.y * sy,
    world.safeZone.radius * sx,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.fillStyle = "#d54d4d";
  for (const bot of bots) {
    if (!bot.dead) {
      ctx.fillRect(bot.x * sx - 2, bot.z * sy - 2, 4, 4);
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(player.x * sx, player.y * sy, 6, 0, Math.PI * 2);
  ctx.fill();
}

function updateHud(dt) {
  const hpBar = document.getElementById("hpBar");
  const staminaBar = document.getElementById("staminaBar");
  const alive = document.getElementById("alive");
  const phase = document.getElementById("phase");
  const zoneTimer = document.getElementById("zoneTimer");
  const hpText = document.getElementById("hpText");
  const armorBar = document.getElementById("armorBar");

  if (hpBar) hpBar.style.width = Math.max(0, player.hp) + "%";
  if (staminaBar) staminaBar.style.width = player.stamina + "%";
  if (hpText) hpText.textContent = Math.ceil(player.hp) + " / 100";
  if (armorBar) armorBar.style.width = inventory.vest !== "-" ? "50%" : "0%";

  if (player.hp < lastHp) {
    const flash = document.getElementById("damageFlash");
    if (flash) {
      flash.style.opacity = "1";
      clearTimeout(updateHud.flashTimer);
      updateHud.flashTimer = setTimeout(() => {
        flash.style.opacity = "0";
      }, 90);
    }
  }
  lastHp = player.hp;

  if (alive) {
    alive.textContent = String(
      bots.filter(bot => bot.hp > 0 && !bot.dead).length + 1
    );
  }

  const zone = getZoneState(player.x, player.y);

  if (phase) {
    phase.textContent = zone.outside ? "OUTSIDE ZONE" : "SURVIVAL";
  }

  if (zoneTimer) {
    const seconds = Math.max(0, Math.floor(zoneClock));
    zoneTimer.textContent =
      String(Math.floor(seconds / 60)).padStart(2, "0") +
      ":" +
      String(seconds % 60).padStart(2, "0");
  }

  const ammoElement = document.getElementById("ammo");
  if (ammoElement) {
    ammoElement.textContent =
      reloadTimer > 0 ? "RELOADING" : ammo + " / 30";
  }

  const aimButton = document.getElementById("aimBtn");
  if (aimButton) {
    aimButton.textContent = input.aim ? "AIM ON" : "AIM";
  }

  const nearby = getNearbyInteraction(player.x, player.y);
  const message = document.getElementById("message");

  if (message && !message.dataset.combat) {
    message.textContent = nearby ? nearby.label : "";
    message.style.opacity = nearby ? "1" : "0";
  }

  const compass = document.getElementById("compass");
  if (compass) {
    const degrees = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    compass.textContent =
      directions[Math.round(degrees / 45) % 8] +
      " • " +
      Math.round(degrees) +
      "°";
  }

  updateInventoryHud();
  drawMinimap();

  zoneClock = Math.max(0, zoneClock - dt);

  const progress = Math.min(1, (300 - zoneClock) / 300);
  world.safeZone.radius = 1850 - progress * 1400;

  if (zone.outside) {
    player.hp = Math.max(0, player.hp - 4 * dt);
  }

  if (player.hp <= 0) {
    showCombatMessage("ELIMINATED");
    input.fire = false;
    input.x = 0;
    input.y = 0;
    input.run = false;
  }
}

function update(dt) {
  yaw = input.cameraYaw;
  pitch = input.cameraPitch;

  if (fireCooldown > 0) {
    fireCooldown = Math.max(0, fireCooldown - dt);
  }

  if (reloadTimer > 0) {
    reloadTimer = Math.max(0, reloadTimer - dt);
    if (reloadTimer === 0) ammo = 30;
  }

  if (input.fire && player.hp > 0) {
    fireWeapon();
  }

  updatePlayer(dt);
  updatePlayerVisual();
  updateBots(dt, player);
  updateCamera(dt);
  updateHud(dt);
}

function setupUi() {
  const bag = document.getElementById("bagBtn");
  const inventoryElement = document.getElementById("inventory");

  if (bag && inventoryElement) {
    bag.onclick = () => {
      inventoryElement.style.display =
        inventoryElement.style.display === "block" ? "none" : "block";
    };
  }

  const fire = document.getElementById("fireBtn");

  if (fire) {
    const press = () => {
      input.fire = true;
      fireWeapon();
    };

    const release = () => {
      input.fire = false;
    };

    fire.addEventListener("pointerdown", press);
    fire.addEventListener("pointerup", release);
    fire.addEventListener("pointercancel", release);
    fire.addEventListener("pointerleave", release);
  }

  const aim = document.getElementById("aimBtn");
  if (aim) {
    aim.onclick = () => {
      input.aim = !input.aim;
    };
  }

  const reload = document.getElementById("reloadBtn");
  if (reload) {
    reload.onclick = () => {
      if (reloadTimer <= 0 && ammo < 30) {
        reloadTimer = 1.05;
      }
    };
  }

  const action = document.getElementById("actionBtn");
  if (action) {
    action.onclick = pickupNearby;
  }

  const version = document.querySelector(".version");
  const versionStart = document.querySelector(".versionStart");

  if (version) version.textContent = "VIRELIA v" + VERSION;
  if (versionStart) versionStart.textContent = "VERSION " + VERSION;
}

function loop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  update(dt);
  renderer.render(scene, camera);

  requestAnimationFrame(loop);
}

export function startGame() {
  if (running) return;

  input.cameraYaw = 0.35;
  input.cameraPitch = 0.08;
  input.x = 0;
  input.y = 0;
  input.run = false;
  input.crouch = false;
  input.fire = false;
  input.aim = false;

  ammo = 30;
  reloadTimer = 0;
  fireCooldown = 0;
  zoneClock = 300;
  world.safeZone.radius = 1850;
  player.hp = 100;
  player.stamina = 100;
  lastHp = 100;

  for (const key of Object.keys(inventory)) {
    inventory[key] =
      ["helmet", "vest", "backpack", "shoes"].includes(key)
        ? "-"
        : 0;
  }

  running = true;

  resize();
  createWorld(scene);
  createBots(scene);

  player.x = world.spawn.x;
  player.y = world.spawn.y;

  createPlayer();
  setupInput();
  setupUi();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

addEventListener("resize", resize);
addEventListener("orientationchange", () => setTimeout(resize, 150));
