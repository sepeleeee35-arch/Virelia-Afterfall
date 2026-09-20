import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

export class Player{

  constructor(scene,input,world){

    this.scene = scene;
    this.input = input;
    this.world = world;

    this.group = new THREE.Group();

    scene.add(this.group);

    this.hp = 100;
    this.stamina = 100;

    this.velocityY = 0;
    this.grounded = true;

    this.walkSpeed = 3.8;
    this.runSpeed = 6.8;
    this.crouchSpeed = 2.0;

    this.cameraSystem = null;

    this.modelRoot = new THREE.Group();

    this.group.add(this.modelRoot);

    this.mixer = null;
    this.actions = {};
    this.activeAction = null;

    this.createFallback();
    this.loadGLB();
  }

  setCamera(cameraSystem){
    this.cameraSystem = cameraSystem;
  }

  createFallback(){

    const root = new THREE.Group();

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color:0x25282b,
        roughness:.75
      });

    const armorMaterial =
      new THREE.MeshStandardMaterial({
        color:0x3d4247,
        metalness:.55,
        roughness:.5
      });

    const skinMaterial =
      new THREE.MeshStandardMaterial({
        color:0xb98265,
        roughness:.85
      });

    const hairMaterial =
      new THREE.MeshStandardMaterial({
        color:0x151515,
        roughness:.9
      });

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(.58,.82,.34),
        armorMaterial
      );

    body.position.y = 1.05;

    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(.25,18,14),
        skinMaterial
      );

    head.position.set(0,1.66,0);

    const hair =
      new THREE.Mesh(
        new THREE.SphereGeometry(.26,18,12),
        hairMaterial
      );

    hair.scale.set(1,.6,1);
    hair.position.set(0,1.82,.015);

    const scarf =
      new THREE.Mesh(
        new THREE.BoxGeometry(.64,.18,.42),
        bodyMaterial
      );

    scarf.position.set(0,1.42,0);

    const belt =
      new THREE.Mesh(
        new THREE.BoxGeometry(.66,.12,.39),
        bodyMaterial
      );

    belt.position.set(0,.72,0);

    const legMaterial =
      new THREE.MeshStandardMaterial({
        color:0x191b1d,
        roughness:.9
      });

    const leftLeg =
      new THREE.Mesh(
        new THREE.BoxGeometry(.2,.65,.23),
        legMaterial
      );

    leftLeg.position.set(-.17,.34,0);

    const rightLeg =
      new THREE.Mesh(
        new THREE.BoxGeometry(.2,.65,.23),
        legMaterial
      );

    rightLeg.position.set(.17,.34,0);

    const leftBoot =
      new THREE.Mesh(
        new THREE.BoxGeometry(.25,.16,.42),
        bodyMaterial
      );

    leftBoot.position.set(-.17,.05,-.05);

    const rightBoot =
      new THREE.Mesh(
        new THREE.BoxGeometry(.25,.16,.42),
        bodyMaterial
      );

    rightBoot.position.set(.17,.05,-.05);

    const eyeMaterial =
      new THREE.MeshBasicMaterial({
        color:0x111111
      });

    const leftEye =
      new THREE.Mesh(
        new THREE.SphereGeometry(.035,8,8),
        eyeMaterial
      );

    leftEye.position.set(-.09,1.68,-.235);

    const rightEye =
      new THREE.Mesh(
        new THREE.SphereGeometry(.035,8,8),
        eyeMaterial
      );

    rightEye.position.set(.09,1.68,-.235);

    root.add(
      body,
      head,
      hair,
      scarf,
      belt,
      leftLeg,
      rightLeg,
      leftBoot,
      rightBoot,
      leftEye,
      rightEye
    );

    root.traverse(object=>{
      if(object.isMesh){
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    this.modelRoot.add(root);

    this.fallback = root;
  }

  async loadGLB(){

    const loader = new GLTFLoader();

    try{

      const gltf =
        await loader.loadAsync(
          "https://threejs.org/examples/models/gltf/Soldier.glb"
        );

      const model = gltf.scene;

      model.traverse(object=>{
        if(object.isMesh){
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      const box =
        new THREE.Box3()
          .setFromObject(model);

      const size =
        box.getSize(
          new THREE.Vector3()
        );

      const scale =
        1.76 / size.y;

      model.scale.setScalar(scale);

      const scaledBox =
        new THREE.Box3()
          .setFromObject(model);

      const center =
        scaledBox.getCenter(
          new THREE.Vector3()
        );

      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -scaledBox.min.y;

      model.rotation.y = Math.PI;

      this.modelRoot.add(model);

      this.fallback.visible = false;

      this.mixer =
        new THREE.AnimationMixer(model);

      for(const clip of gltf.animations){

        const name =
          clip.name.toLowerCase();

        this.actions[name] =
          this.mixer.clipAction(clip);
      }

      this.playAnimation("idle");

    }catch(error){

      console.warn(
        "GLB gagal dimuat. Fallback digunakan.",
        error
      );
    }
  }

  findAction(type){

    const names =
      Object.keys(this.actions);

    if(type === "idle"){

      return names.find(
        name => name.includes("idle")
      );
    }

    if(type === "walk"){

      return names.find(
        name => name.includes("walk")
      );
    }

    if(type === "run"){

      return names.find(
        name =>
          name.includes("run") &&
          !name.includes("running")
      ) || names.find(
        name => name.includes("run")
      );
    }

    return null;
  }

  playAnimation(type){

    if(!this.mixer) return;

    const name =
      this.findAction(type);

    if(!name) return;

    const next =
      this.actions[name];

    if(this.activeAction === next){
      return;
    }

    if(this.activeAction){

      this.activeAction.fadeOut(.15);
    }

    next
      .reset()
      .fadeIn(.15)
      .play();

    this.activeAction = next;
  }

  getCameraHeight(){

    return this.input.state.crouch
      ? .72
      : 1.02;
  }

  damage(amount){

    this.hp =
      Math.max(
        0,
        this.hp - amount
      );
  }

  update(dt){

    this.input.update();

    const input =
      this.input.state;

    const cameraYaw =
      this.cameraSystem
        ? this.cameraSystem.getYaw()
        : 0;

    const forward =
      new THREE.Vector3(
        -Math.sin(cameraYaw),
        0,
        -Math.cos(cameraYaw)
      );

    const right =
      new THREE.Vector3(
        Math.cos(cameraYaw),
        0,
        -Math.sin(cameraYaw)
      );

    const movement =
      new THREE.Vector3();

    movement.addScaledVector(
      right,
      input.moveX
    );

    movement.addScaledVector(
      forward,
      -input.moveY
    );

    if(movement.lengthSq() > 1){

      movement.normalize();
    }

    const moving =
      movement.lengthSq() > .001;

    let speed =
      this.walkSpeed;

    if(input.crouch){

      speed =
        this.crouchSpeed;

    }else if(input.sprint && moving){

      speed =
        this.runSpeed;
    }

    if(
      input.sprint &&
      moving &&
      !input.crouch &&
      this.stamina > 0
    ){

      this.stamina =
        Math.max(
          0,
          this.stamina - 25 * dt
        );

    }else{

      this.stamina =
        Math.min(
          100,
          this.stamina + 16 * dt
        );
    }

    if(
      this.input.consumeJump() &&
      this.grounded &&
      !input.crouch
    ){

      this.velocityY = 6.0;
      this.grounded = false;
    }

    this.velocityY -= 24 * dt;

    this.group.position.y +=
      this.velocityY * dt;

    if(this.group.position.y <= 0){

      this.group.position.y = 0;
      this.velocityY = 0;
      this.grounded = true;
    }

    if(moving){

      const desiredX =
        this.group.position.x +
        movement.x * speed * dt;

      const desiredZ =
        this.group.position.z +
        movement.z * speed * dt;

      if(
        !this.world.isBlocked(
          desiredX,
          this.group.position.z,
          .38
        )
      ){

        this.group.position.x =
          desiredX;
      }

      if(
        !this.world.isBlocked(
          this.group.position.x,
          desiredZ,
          .38
        )
      ){

        this.group.position.z =
          desiredZ;
      }

      const targetRotation =
        Math.atan2(
          movement.x,
          movement.z
        );

      let difference =
        targetRotation -
        this.group.rotation.y;

      difference =
        Math.atan2(
          Math.sin(difference),
          Math.cos(difference)
        );

      this.group.rotation.y +=
        difference *
        Math.min(1,dt * 12);
    }

    if(this.mixer){

      if(!this.grounded){

        this.playAnimation("idle");

      }else if(!moving){

        this.playAnimation("idle");

      }else if(
        input.sprint &&
        !input.crouch &&
        this.stamina > 0
      ){

        this.playAnimation("run");

      }else{

        this.playAnimation("walk");
      }

      this.mixer.update(dt);
    }
  }
}