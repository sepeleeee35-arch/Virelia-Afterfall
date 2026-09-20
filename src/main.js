import * as THREE from "three";

import {createInput}
from "./input.js";

import {ThirdPersonCamera}
from "./camera.js";

import {Player}
from "./player.js";

import {createWorld}
from "./world.js";

export function startGame(){

  const scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(0x9bb3c2);

  scene.fog =
    new THREE.Fog(
      0x9bb3c2,
      55,
      260
    );

  const camera =
    new THREE.PerspectiveCamera(
      60,
      window.innerWidth /
      window.innerHeight,
      .05,
      500
    );

  camera.position.set(
    0,
    2,
    5
  );

  const renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:"high-performance"
    });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      1.5
    )
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  document.body.appendChild(
    renderer.domElement
  );

  const hemi =
    new THREE.HemisphereLight(
      0xcfe4ff,
      0x42503d,
      2.0
    );

  scene.add(hemi);

  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      3.0
    );

  sun.position.set(
    -50,
    80,
    35
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    1024,
    1024
  );

  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;

  scene.add(sun);

  const world =
    createWorld(scene);

  const input =
    createInput(renderer);

  const player =
    new Player(
      scene,
      input,
      world
    );

  const cameraSystem =
    new ThirdPersonCamera(
      camera,
      scene,
      player
    );

  player.setCamera(
    cameraSystem
  );

  document.getElementById(
    "loading"
  ).style.display = "none";

  document.getElementById(
    "fullscreen"
  ).addEventListener(
    "click",
    async ()=>{
      try{

        if(!document.fullscreenElement){

          await document.documentElement
            .requestFullscreen();

        }else{

          await document.exitFullscreen();
        }

      }catch(error){}
    }
  );

  const clock =
    new THREE.Clock();

  function updateHUD(){

    document.getElementById(
      "hpbar"
    ).style.width =
      `${player.hp}%`;

    document.getElementById(
      "stambar"
    ).style.width =
      `${player.stamina}%`;
  }

  function animate(){

    requestAnimationFrame(
      animate
    );

    const dt =
      Math.min(
        clock.getDelta(),
        .05
      );

    player.update(dt);

    world.update(
      dt,
      player
    );

    cameraSystem.update(
      dt,
      input
    );

    updateHUD();

    renderer.render(
      scene,
      camera
    );
  }

  animate();

  window.addEventListener(
    "resize",
    ()=>{
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  );
}