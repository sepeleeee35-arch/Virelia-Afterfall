import * as THREE from "three";
import { Input } from "./input.js";
import { CameraController } from "./camera.js";
import { Player } from "./player.js";
import { World } from "./world.js";

export function startGame() {
  const loading =
    document.getElementById("loading");

  const loadingStatus =
    document.getElementById("loadingStatus");

  try {
    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(0x91a0ad);

    scene.fog =
      new THREE.Fog(
        0x91a0ad,
        45,
        180
      );

    const camera =
      new THREE.PerspectiveCamera(
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

    const renderer =
      new THREE.WebGLRenderer({
        antialias:true,
        powerPreference:
          "high-performance"
      });

    renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        1.5
      )
    );

    renderer.setSize(
      innerWidth,
      innerHeight
    );

    renderer.shadowMap.enabled =
      true;

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

    sun.castShadow =
      true;

    sun.shadow.mapSize.set(
      1024,
      1024
    );

    sun.shadow.camera.left =
      -80;

    sun.shadow.camera.right =
      80;

    sun.shadow.camera.top =
      80;

    sun.shadow.camera.bottom =
      -80;

    scene.add(sun);

    if (loadingStatus) {
      loadingStatus.textContent =
        "Membangun kota...";
    }

    const input =
      new Input();

    const world =
      new World(scene);

    if (loadingStatus) {
      loadingStatus.textContent =
        "Memuat karakter...";
    }

    const player =
      new Player(scene);

    world.player =
      player;

    const cameraController =
      new CameraController(
        camera,
        renderer.domElement,
        player,
        world
      );

    const clock =
      new THREE.Clock();

    function updateHUD() {
      const hpbar =
        document.getElementById(
          "hpbar"
        );

      const stambar =
        document.getElementById(
          "stambar"
        );

      if (hpbar) {
        hpbar.style.width =
          THREE.MathUtils.clamp(
            player.hp,
            0,
            100
          ) + "%";
      }

      if (stambar) {
        stambar.style.width =
          THREE.MathUtils.clamp(
            player.stamina,
            0,
            100
          ) + "%";
      }

      const crouch =
        document.getElementById(
          "crouch"
        );

      if (crouch) {
        crouch.style.opacity =
          player.crouching
            ? "0.55"
            : "1";

        crouch.style.transform =
          player.crouching
            ? "scale(.94)"
            : "scale(1)";
      }
    }

    function updateContext() {
      const enter =
        document.getElementById(
          "enter"
        );

      const exit =
        document.getElementById(
          "exit"
        );

      const context =
        document.getElementById(
          "context"
        );

      if (
        !enter ||
        !exit
      ) return;

      if (player.driving) {
        enter.classList.add(
          "hidden"
        );

        exit.classList.remove(
          "hidden"
        );

        if (context) {
          context.textContent =
            "KENDARAAN";
        }

        return;
      }

      exit.classList.add(
        "hidden"
      );

      if (world.insideHouse) {
        enter.classList.remove(
          "hidden"
        );

        enter.textContent =
          "KELUAR";

        if (context) {
          context.textContent =
            "DI DALAM RUMAH";
        }

        return;
      }

      enter.textContent =
        "MASUK";

      const car =
        world.findNearbyCar?.();

      const door =
        world.findNearbyDoor?.();

      if (car) {
        enter.classList.remove(
          "hidden"
        );

        if (context) {
          context.textContent =
            "🚗 MASUK KENDARAAN";
        }

        return;
      }

      if (door) {
        enter.classList.remove(
          "hidden"
        );

        if (context) {
          context.textContent =
            "🚪 MASUK RUMAH";
        }

        return;
      }

      enter.classList.add(
        "hidden"
      );

      if (context) {
        context.textContent =
          "";
      }
    }

    function update(dt) {
      const enterPressed =
        input.consumeEnter
          ? input.consumeEnter()
          : false;

      const exitPressed =
        input.consumeExit
          ? input.consumeExit()
          : false;

      if (enterPressed) {

        if (player.driving) {
          world.exitCar();
        }

        else if (
          world.insideHouse
        ) {
          world.exitHouse();
        }

        else {
          world.tryEnterNearby();
        }
      }

      if (exitPressed) {

        if (player.driving) {
          world.exitCar();
        }

        else if (
          world.insideHouse
        ) {
          world.exitHouse();
        }
      }

      if (
        input.actionPressed
      ) {
        world.playerAction?.();

        input.actionPressed =
          false;
      }

      if (
        !player.driving
      ) {
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

      input.jumpPressed =
        false;
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

    if (loadingStatus) {
      loadingStatus.textContent =
        "Dunia siap!";
    }

    setTimeout(() => {
      loading?.remove();
    }, 500);

  } catch (error) {

    console.error(
      "VIRELIA ERROR:",
      error
    );

    if (loading) {
      loading.classList.add(
        "error"
      );

      loading.innerHTML =
        `
        <div>VIRELIA GAGAL DIMUAT</div>
        <small>
        ${String(error.message || error)}
        </small>
        `;
    }
  }
}