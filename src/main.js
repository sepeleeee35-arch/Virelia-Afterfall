import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { input, setupInput } from "./input.js";
import { player } from "./player.js";
import { world, createWorld, getZoneState, getNearbyInteraction } from "./world.js";
import { bots, createBots, updateBots, damageBot } from "./bots.js";

const VERSION = "1.5.0";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba9ad);
scene.fog = new THREE.Fog(0x8ba9ad, 1800, 5600);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 8000);
camera.position.set(0, 105, 240);

const hemi = new THREE.HemisphereLight(0xdfe9e5, 0x485044, 2.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1cf, 3.2);
sun.position.set(-900, 1400, 700);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -2500;
sun.shadow.camera.right = 2500;
sun.shadow.camera.top = 2500;
sun.shadow.camera.bottom = -2500;
scene.add(sun);

let running = false;
let lastTime = 0;

let yaw = 0.35;
let pitch = 0.14;

const CAMERA_DISTANCE = 225;
const CAMERA_HEIGHT = 64;
const CAMERA_SHOULDER = 16;
const CAMERA_SMOOTH = 18;

const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const aimDirection = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
let weaponGroup;
let fireCooldown = 0;
let ammo = 30;
let reloadTimer = 0;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function updatePlayer3D(dt) {
  const stickX = input.x;
  const stickY = input.y;
  const magnitude = Math.min(1, Math.hypot(stickX, stickY));

  moveForward.set(Math.sin(yaw), 0, -Math.cos(yaw));
  moveRight.set(Math.cos(yaw), 0, Math.sin(yaw));

  moveVector.set(0, 0, 0);
  moveVector.addScaledVector(moveRight, stickX);
  moveVector.addScaledVector(moveForward, stickY);

  if (moveVector.lengthSq() > 0.0001) {
    moveVector.normalize().multiplyScalar(magnitude);
  }

  let speed = player.speed;
  player.crouch = input.crouch;

  if (player.crouch) {
    speed *= 0.55;
  }

  if (input.run && !player.crouch && player.stamina > 0 && magnitude > 0.2) {
    speed *= 1.55;
    player.stamina = Math.max(0, player.stamina - 28 * dt);
  } else {
    player.stamina = Math.min(100, player.stamina + 18 * dt);
  }

  player.x += moveVector.x * speed * dt;
  player.y += moveVector.z * speed * dt;

  player.x = Math.max(35, Math.min(world.width - 35, player.x));
  player.y = Math.max(35, Math.min(world.height - 35, player.y));
}

let playerGroup;

function createWeapon() {
  weaponGroup = new THREE.Group();
  const stock = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 42), new THREE.MeshStandardMaterial({ color: 0x242b2d }));
  stock.position.set(12, 46, -24);
  stock.rotation.x = -0.12;
  weaponGroup.add(stock);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 46, 8), new THREE.MeshStandardMaterial({ color: 0x111516 }));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(12, 51, -48);
  weaponGroup.add(barrel);
  scene.add(weaponGroup);
}

function createPlayer() {
  playerGroup = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(15, 34, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x263b43 })
  );
  body.position.y = 40;
  body.castShadow = true;
  playerGroup.add(body);

  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(34, 25, 24),
    new THREE.MeshStandardMaterial({ color: 0x435a60 })
  );
  vest.position.y = 44;
  vest.castShadow = true;
  playerGroup.add(vest);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(12, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xc28d73 })
  );
  head.position.y = 76;
  head.castShadow = true;
  playerGroup.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(13, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x20292c })
  );
  helmet.position.y = 81;
  helmet.castShadow = true;
  playerGroup.add(helmet);

  scene.add(playerGroup);
}

function updateCamera(dt) {
  cameraTarget.set(player.x, 52, player.y);

  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  const backX = -Math.sin(yaw) * cp;
  const backZ = Math.cos(yaw) * cp;

  cameraRight.set(Math.cos(yaw), 0, Math.sin(yaw));

  cameraDesired.set(
    player.x + backX * CAMERA_DISTANCE + cameraRight.x * CAMERA_SHOULDER,
    52 + CAMERA_HEIGHT + sp * 155,
    player.y + backZ * CAMERA_DISTANCE + cameraRight.z * CAMERA_SHOULDER
  );

  const smoothing = 1 - Math.exp(-CAMERA_SMOOTH * dt);
  camera.position.lerp(cameraDesired, smoothing);

  camera.lookAt(
    cameraTarget.x,
    cameraTarget.y + 18 + sp * 34,
    cameraTarget.z
  );
}

function fireWeapon(){\n  if(reloadTimer>0 || fireCooldown>0 || ammo<=0) return;\n  ammo--;\n  fireCooldown=0.105;\n\n  aimDirection.set(\n    Math.sin(yaw),\n    Math.sin(pitch),\n    -Math.cos(yaw)\n  ).normalize();\n\n  raycaster.set(camera.position, aimDirection);\n  raycaster.far=650;\n\n  let best=null;\n  let bestDist=Infinity;\n  for(const bot of bots){\n    if(bot.hp<=0 || bot.dead || !bot.mesh.visible) continue;\n    const dx=bot.x-camera.position.x;\n    const dy=42-camera.position.y;\n    const dz=bot.z-camera.position.z;\n    const t=dx*aimDirection.x+dy*aimDirection.y+dz*aimDirection.z;\n    if(t<0 || t>650) continue;\n    const px=camera.position.x+aimDirection.x*t;\n    const py=camera.position.y+aimDirection.y*t;\n    const pz=camera.position.z+aimDirection.z*t;\n    const miss=Math.hypot(bot.x-px,42-py,bot.z-pz);\n    if(miss<34 && t<bestDist){best=bot;bestDist=t;}\n  }\n  if(best){\n    damageBot(best,34);\n    showCombatMessage(best.hp<=0 ? "ELIMINATED" : "HIT  -34");\n  }\n}\n\nfunction showCombatMessage(text){\n  const msg=document.getElementById("message");\n  if(!msg)return;\n  msg.textContent=text;\n  msg.style.opacity="1";\n  clearTimeout(showCombatMessage.timer);\n  showCombatMessage.timer=setTimeout(()=>msg.style.opacity="0",500);\n}\n\nfunction updateHud() {
  const hp = document.getElementById("hpBar");
  const st = document.getElementById("staminaBar");
  const alive = document.getElementById("alive");
  const phase = document.getElementById("phase");
  const msg = document.getElementById("message");
  const zoneTimer = document.getElementById("zoneTimer");

  if (hp) hp.style.width = player.hp + "%";
  if (st) st.style.width = player.stamina + "%";
  if (alive) alive.textContent = String(bots.filter(b => b.hp > 0).length + 1);

  const zone = getZoneState(player.x, player.y);
  if (phase) phase.textContent = zone.outside ? "MOVE TO ZONE" : "SURVIVAL";
  if (zoneTimer) zoneTimer.textContent = "05:00";\n\n  const ammoEl=document.getElementById("ammo");\n  if(ammoEl) ammoEl.textContent=reloadTimer>0 ? "RELOADING" : ammo+" / 30";\n\n  const aimEl=document.getElementById("aimBtn");\n  if(aimEl) aimEl.textContent=input.aim ? "HIPFIRE" : "AIM";

  const nearby = getNearbyInteraction(player.x, player.y);
  if (msg) {
    msg.textContent = nearby ? nearby.label : "";
    msg.style.opacity = nearby ? "1" : "0";
  }

  const compass = document.getElementById("compass");
  if (compass) {
    const deg = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
    const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    compass.textContent = names[Math.round(deg / 45) % 8] + "  •  TPP";
  }
}

function update(dt) {
  yaw = input.cameraYaw;
  pitch = input.cameraPitch;

  if(fireCooldown>0) fireCooldown=Math.max(0,fireCooldown-dt);\n  if(reloadTimer>0){\n    reloadTimer=Math.max(0,reloadTimer-dt);\n    if(reloadTimer===0) ammo=30;\n  }\n  if(input.fire) fireWeapon();\n  updatePlayer3D(dt);
  updateBots(dt);

  if (playerGroup) {
    playerGroup.position.set(player.x, 0, player.y);

    if (moveVector.lengthSq() > 0.0001) {
      playerGroup.rotation.y = Math.atan2(moveVector.x, -moveVector.z);
    }
  }

  updateCamera(dt);
  updateHud();
}

function setupUi() {
  const bag = document.getElementById("bagBtn");
  const inv = document.getElementById("inventory");

  if (bag && inv) {
    bag.onclick = () => {
      inv.style.display = inv.style.display === "block" ? "none" : "block";
    };
  }

  const fire=document.getElementById("fireBtn");\n  if(fire){\n    const start=()=>{input.fire=true; fireWeapon();};\n    const stop=()=>{input.fire=false;};\n    fire.addEventListener("pointerdown",start);\n    fire.addEventListener("pointerup",stop);\n    fire.addEventListener("pointercancel",stop);\n    fire.addEventListener("pointerleave",stop);\n  }\n\n  const aim=document.getElementById("aimBtn");\n  if(aim) aim.onclick=()=>{input.aim=!input.aim;};\n\n  const reload=document.getElementById("reloadBtn");\n  if(reload) reload.onclick=()=>{if(reloadTimer<=0 && ammo<30) reloadTimer=1.15;};\n\n  const action = document.getElementById("actionBtn");

  if (action) {
    action.onclick = () => {
      const n = getNearbyInteraction(player.x, player.y);
      const msg = document.getElementById("message");

      if (msg) {
        msg.textContent = n ? n.result : "Nothing nearby.";
        msg.style.opacity = "1";
        setTimeout(() => {
          msg.style.opacity = "0";
        }, 1200);
      }
    };
  }

  const v = document.querySelector(".version");
  const vs = document.querySelector(".versionStart");

  if (v) v.textContent = "VIRELIA v" + VERSION;
  if (vs) vs.textContent = "VERSION " + VERSION;
}

function loop(t) {
  if (!running) return;

  const dt = Math.min((t - lastTime) / 1000, 0.033);
  lastTime = t;

  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

export function startGame() {
  if (running) return;

  input.cameraYaw = 0.35;
  input.cameraPitch = 0.14;
  input.x = 0;
  input.y = 0;
  input.crouch = false;\n  input.fire = false;\n  input.aim = false;\n  ammo = 30;\n  reloadTimer = 0;

  running = true;

  resize();
  createWorld(scene);
  createBots(scene);
  createPlayer();

  player.x = world.spawn.x;
  player.y = world.spawn.y;
  player.hp = 100;
  player.stamina = 100;

  setupInput();
  setupUi();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 150));
