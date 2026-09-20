import * as THREE from "three";
import { Input } from "./input.js";
import { CameraController } from "./camera.js";
import { Player } from "./player.js";
import { World } from "./world.js";

export function startGame() {
  try {
    const loading = document.getElementById("loading");
    const loadingStatus = document.getElementById("loadingStatus");

    if (loadingStatus) {
      loadingStatus.textContent = "Membuat dunia...";
    }

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

    camera.position.set(0, 3, 6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
      Math.min(devicePixelRatio, 1.5)
    );

    renderer.setSize(
      innerWidth,
      innerHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    document.body.appendChild(
      renderer.domElement
    );

    const hemi =
      new THREE.HemisphereLight(
        0xddeaff,
        0x4b463f,
        2.2
      );

    scene.add(hemi);

    const sun =
      new THREE.DirectionalLight(
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
      1024,
      1024
    );

    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;

    scene.add(sun);

    if (loadingStatus) {
      loadingStatus.textContent = "Memuat kontrol...";
    }

    const input = new Input();

    if (loadingStatus) {
      loadingStatus.textContent = "Membangun kota...";
    }

    const world = new World(scene);

    if (loadingStatus) {
      loadingStatus.textContent = "Memuat karakter...";
    }

    const player = new Player(scene);

    world.player = player;

    if (loadingStatus) {
      loadingStatus.textContent = "Menyiapkan kamera...";
    }

    const cameraController =
      new CameraController(
        camera,
        renderer.domElement,
        player,
        world
      );

    const hpbar =
      document.getElementById("hpbar");

    const stambar =
      document.getElementById("stambar");

    const context =
      document.getElementById("context");

    const enter =
      document.getElementById("enter");

    const exit =
      document.getElementById("exit");

    const jump =
      document.getElementById("jump");

    const sprint =
      document.getElementById("sprint");

    const crouch =
      document.getElementById("crouch");

    const punch =
      document.getElementById("punch");

    const fullscreen =
      document.getElementById("fullscreen");

    function updateHUD() {
      if (hpbar) {
        hpbar.style.width =
          `${THREE.MathUtils.clamp(
            player.hp / 100,
            0,
            1
          ) * 100}%`;
      }

      if (stambar) {
        stambar.style.width =
          `${THREE.MathUtils.clamp(
            player.stamina / 100,
            0,
            1
          ) * 100}%`;
      }

      if (crouch) {
        crouch.style.opacity =
          player.crouching
            ? "0.55"
            : "1";
      }
    }

    function updateContext() {
      if (!context) return;

      if (player.driving) {
        context.textContent =
          "🚗 Sedang mengemudi";
        return;
      }

      if (world.insideHouse) {
        context.textContent =
          "🏠 Di dalam rumah";
        return;
      }

      const door =
        world.findNearbyDoor?.();

      const car =
        world.findNearbyCar?.();

      if (door) {
        context.textContent =
          "🚪 Tekan MASUK untuk masuk rumah";
      } else if (car) {
        context.textContent =
          "🚗 Tekan MASUK untuk masuk mobil";
      } else {
        context.textContent = "";
      }
    }

    function updateButtons() {
      if (!enter || !exit) return;

      if (player.driving) {
        enter.classList.add("hidden");
        exit.classList.remove("hidden");
        return;
      }

      if (world.insideHouse) {
        enter.classList.add("hidden");
        exit.classList.remove("hidden");
        return;
      }

      exit.classList.add("hidden");

      const door =
        world.findNearbyDoor?.();

      const car =
        world.findNearbyCar?.();

      if (door || car) {
        enter.classList.remove("hidden");
      } else {
        enter.classList.add("hidden");
      }
    }

    function enterWorld() {
      if (player.driving) {
        world.exitCar?.();
        return;
      }

      if (world.insideHouse) {
        world.exitHouse?.();
        return;
      }

      world.tryEnterNearby?.();
    }

    function exitWorld() {
      if (player.driving) {
        world.exitCar?.();
        return;
      }

      if (world.insideHouse) {
        world.exitHouse?.();
      }
    }

    if (enter) {
      enter.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          enterWorld();
        }
      );
    }

    if (exit) {
      exit.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          exitWorld();
        }
      );
    }

    if (punch) {
      punch.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();

          if (!player.driving) {
            world.playerAction?.();
          }
        }
      );
    }

    if (jump) {
      jump.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          input.jumpPressed = true;
        }
      );
    }

    if (sprint) {
      sprint.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          input.sprint = true;
        }
      );

      sprint.addEventListener(
        "pointerup",
        () => {
          input.sprint = false;
        }
      );

      sprint.addEventListener(
        "pointercancel",
        () => {
          input.sprint = false;
        }
      );
    }

    if (crouch) {
      crouch.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          input.crouch = true;
        }
      );

      crouch.addEventListener(
        "pointerup",
        () => {
          input.crouch = false;
        }
      );

      crouch.addEventListener(
        "pointercancel",
        () => {
          input.crouch = false;
        }
      );
    }

    if (fullscreen) {
      fullscreen.addEventListener(
        "click",
        async () => {
          try {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen();
            } else {
              await document.exitFullscreen();
            }
          } catch {}
        }
      );
    }

    addEventListener(
      "keydown",
      event => {
        if (event.key.toLowerCase() === "e") {
          enterWorld();
        }

        if (event.key.toLowerCase() === "q") {
          exitWorld();
        }

        if (
          event.code === "Space"
        ) {
          input.jumpPressed = true;
        }
      }
    );

    const clock =
      new THREE.Clock();

    function update(dt) {
      if (input.consumeEnter?.()) {
        enterWorld();
      }

      if (input.consumeExit?.()) {
        exitWorld();
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
      updateContext();
      updateButtons();

      input.jumpPressed = false;
    }

    function animate() {
      const dt =
        Math.min(
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
          innerWidth /
          innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
          innerWidth,
          innerHeight
        );
      }
    );

    if (loading) {
      loading.remove();
    }

  } catch (error) {
    console.error(
      "VIRELIA ERROR:",
      error
    );

    const loading =
      document.getElementById(
        "loading"
      );

    const status =
      document.getElementById(
        "loadingStatus"
      );

    if (loading) {
      loading.classList.add(
        "error"
      );
    }

    if (status) {
      status.textContent =
        error?.message ||
        String(error);
    }
  }
}