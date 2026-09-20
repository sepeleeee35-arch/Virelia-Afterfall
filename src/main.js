import * as THREE from "three";
import { Input } from "./input.js";
import { CameraController } from "./camera.js";
import { Player } from "./player.js";
import { World } from "./world.js";

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x91a0ad);

scene.fog = new THREE.Fog(
  0x91a0ad,
  45,
  180
);

const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.05,
  300
);

camera.position.set(
  0,
  3,
  6
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio, 1.7)
);

renderer.setSize(
  innerWidth,
  innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

document.body.appendChild(
  renderer.domElement
);

const hemi = new THREE.HemisphereLight(
  0xddeaff,
  0x4b463f,
  2.2
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
  0xffffff,
  3.2
);

sun.position.set(
  35,
  55,
  25
);

sun.castShadow = true;

sun.shadow.mapSize.set(
  2048,
  2048
);

sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;

scene.add(sun);

const input = new Input();
const world = new World(scene);
const player = new Player(scene);

const cameraController =
  new CameraController(
    camera,
    renderer.domElement,
    player,
    world
  );

world.player = player;

const clock = new THREE.Clock();

function updateHUD() {
  const hp = document.getElementById("hp");
  const stamina =
    document.getElementById("stamina");

  if (hp) {
    hp.textContent =
      `HP ${Math.round(player.hp)}`;
  }

  if (stamina) {
    stamina.textContent =
      `STAMINA ${Math.round(player.stamina)}`;
  }

  const crouchButton =
    document.getElementById("crouch");

  if (crouchButton) {
    crouchButton.style.opacity =
      player.crouching ? "0.55" : "1";

    crouchButton.style.transform =
      player.crouching
        ? "scale(0.94)"
        : "scale(1)";
  }
}

function updateContextButtons() {
  const enter =
    document.getElementById("enterBtn");

  const exit =
    document.getElementById("exitBtn");

  if (!enter || !exit) return;

  if (player.driving) {
    enter.style.display = "none";
    exit.style.display = "flex";
    return;
  }

  exit.style.display = "none";

  const door =
    world.findNearbyDoor?.();

  const car =
    world.findNearbyCar?.();

  if (door || car) {
    enter.style.display = "flex";
  } else {
    enter.style.display = "none";
  }
}

function update(dt) {
  const enterPressed =
    input.consumeEnter?.();

  const exitPressed =
    input.consumeExit?.();

  if (enterPressed) {
    if (player.driving) {
      world.exitCar();
    } else if (world.insideHouse) {
      world.exitHouse();
    } else {
      world.tryEnterNearby();
    }
  }

  if (exitPressed) {
    if (player.driving) {
      world.exitCar();
    } else if (world.insideHouse) {
      world.exitHouse();
    }
  }

  if (input.actionPressed) {
    world.playerAction?.();
    input.actionPressed = false;
  }

  if (!player.driving) {
    player.update(
      dt,
      input,
      camera
    );
  }

  world.update(
    dt,
    input,
    player
  );

  cameraController.update(
    dt,
    input
  );

  updateHUD();
  updateContextButtons();

  input.jumpPressed = false;
}

function animate() {
  const dt = Math.min(
    clock.getDelta(),
    0.033
  );

  update(dt);

  renderer.render(
    scene,
    camera
  );
}

renderer.setAnimationLoop(
  animate
);

addEventListener(
  "resize",
  () => {
    camera.aspect =
      innerWidth / innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      innerWidth,
      innerHeight
    );
  }
);