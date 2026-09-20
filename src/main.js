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

  const scene=
    new THREE.Scene();

  scene.background=
    new THREE.Color(
      0x9bb3c2
    );

  scene.fog=
    new THREE.Fog(
      0x9bb3c2,
      55,
      260
    );

  const camera=
    new THREE.PerspectiveCamera(
      60,
      window.innerWidth/
      window.innerHeight,
      .05,
      500
    );

  const renderer=
    new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:
        "high-performance"
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

  renderer.shadowMap.enabled=true;

  renderer.shadowMap.type=
    THREE.PCFSoftShadowMap;

  document.body.appendChild(
    renderer.domElement
  );

  const hemi=
    new THREE.HemisphereLight(
      0xd5e7ff,
      0x45503e,
      2
    );

  scene.add(hemi);

  const sun=
    new THREE.DirectionalLight(
      0xffffff,
      3
    );

  sun.position.set(
    -50,
    80,
    40
  );

  sun.castShadow=true;

  sun.shadow.mapSize.set(
    1024,
    1024
  );

  scene.add(sun);

  const world=
    createWorld(scene);

  const input=
    createInput(renderer);

  const player=
    new Player(
      scene,
      input,
      world
    );

  const cameraSystem=
    new ThirdPersonCamera(
      camera,
      scene,
      player
    );

  player.setCamera(
    cameraSystem
  );

  const context=
    document.getElementById(
      "context"
    );

  const enter=
    document.getElementById(
      "enter"
    );

  const exit=
    document.getElementById(
      "exit"
    );

  function updateContext(){

    const state=
      world.getContext(player);

    enter.classList.add(
      "hidden"
    );

    exit.classList.add(
      "hidden"
    );

    context.textContent="";

    if(state==="enterHouse"){

      enter.classList.remove(
        "hidden"
      );

      context.textContent=
        "Pintu — MASUK";

    }else if(
      state==="enterCar"
    ){

      enter.classList.remove(
        "hidden"
      );

      context.textContent=
        "Mobil — MASUK";

    }else if(
      state==="exitHouse"
    ){

      exit.classList.remove(
        "hidden"
      );

      context.textContent=
        "Di dalam rumah — KELUAR";

    }else if(
      state==="driving"
    ){

      exit.classList.remove(
        "hidden"
      );

      context.textContent=
        "MENGEMUDI — KELUAR";
    }
  }

  function updateInteraction(){

    if(
      input.consumeEnter()
    ){

      world.enterNearest(
        player
      );
    }

    if(
      input.consumeExit()
    ){

      world.exitNearest(
        player
      );
    }
  }

  document
    .getElementById("fullscreen")
    .addEventListener(
      "click",
      async()=>{

        try{

          if(
            !document.fullscreenElement
          ){

            await document.documentElement
              .requestFullscreen();

          }else{

            await document.exitFullscreen();
          }

        }catch(error){}
      }
    );

  document.getElementById(
    "loading"
  ).style.display="none";

  const clock=
    new THREE.Clock();

  function loop(){

    const dt=
      Math.min(
        clock.getDelta(),
        .05
      );

    updateInteraction();

    player.update(dt);

    world.update(
      dt,
      player
    );

    cameraSystem.update(
      dt,
      input
    );

    document.getElementById(
      "hpbar"
    ).style.width=
      `${player.hp}%`;

    document.getElementById(
      "stambar"
    ).style.width=
      `${player.stamina}%`;

    updateContext();

    renderer.render(
      scene,
      camera
    );
  }

  renderer.setAnimationLoop(
    loop
  );

  window.addEventListener(
    "resize",
    ()=>{

      camera.aspect=
        window.innerWidth/
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  );
}