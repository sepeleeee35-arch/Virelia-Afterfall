import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

export class Player{

  constructor(scene,input,world){

    this.scene=scene;
    this.input=input;
    this.world=world;

    this.group=new THREE.Group();

    scene.add(this.group);

    this.hp=100;
    this.stamina=100;

    this.velocityY=0;

    this.grounded=true;

    this.walkSpeed=3.5;
    this.runSpeed=6.4;
    this.crouchSpeed=1.8;

    this.jumpPower=5.2;
    this.gravity=25;

    this.dodgeTimer=0;
    this.dodgeDuration=.32;
    this.dodgeSpeed=9;
    this.dodgeDirection=
      new THREE.Vector3();

    this.cameraSystem=null;

    this.modelRoot=
      new THREE.Group();

    this.group.add(
      this.modelRoot
    );

    this.mixer=null;

    this.actions={};

    this.activeAction=null;

    this.createFallback();

    this.loadGLB();
  }

  setCamera(camera){
    this.cameraSystem=camera;
  }

  createFallback(){

    const root=
      new THREE.Group();

    const armor=
      new THREE.MeshStandardMaterial({
        color:0x30363a,
        metalness:.55,
        roughness:.5
      });

    const dark=
      new THREE.MeshStandardMaterial({
        color:0x171a1d,
        roughness:.85
      });

    const skin=
      new THREE.MeshStandardMaterial({
        color:0xb77d61,
        roughness:.9
      });

    const hair=
      new THREE.MeshStandardMaterial({
        color:0x121416,
        roughness:1
      });

    const torso=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .54,.78,.32
        ),
        armor
      );

    torso.position.y=1.02;

    const head=
      new THREE.Mesh(
        new THREE.SphereGeometry(
          .235,20,16
        ),
        skin
      );

    head.position.y=1.61;

    const hairMesh=
      new THREE.Mesh(
        new THREE.SphereGeometry(
          .25,20,12
        ),
        hair
      );

    hairMesh.scale.set(
      1,.58,1
    );

    hairMesh.position.y=1.78;

    const scarf=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .61,.15,.39
        ),
        dark
      );

    scarf.position.y=1.39;

    const shoulderL=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .25,.17,.38
        ),
        armor
      );

    shoulderL.position.set(
      -.36,1.29,0
    );

    const shoulderR=
      shoulderL.clone();

    shoulderR.position.x=.36;

    const belt=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .62,.11,.36
        ),
        dark
      );

    belt.position.y=.69;

    const legL=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .19,.61,.21
        ),
        dark
      );

    legL.position.set(
      -.16,.32,0
    );

    const legR=
      legL.clone();

    legR.position.x=.16;

    const bootL=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .24,.15,.38
        ),
        dark
      );

    bootL.position.set(
      -.16,.04,-.045
    );

    const bootR=
      bootL.clone();

    bootR.position.x=.16;

    const eyeMat=
      new THREE.MeshBasicMaterial({
        color:0x101010
      });

    const eyeL=
      new THREE.Mesh(
        new THREE.SphereGeometry(
          .032,8,8
        ),
        eyeMat
      );

    eyeL.position.set(
      -.08,1.63,-.225
    );

    const eyeR=
      eyeL.clone();

    eyeR.position.x=.08;

    root.add(
      torso,
      head,
      hairMesh,
      scarf,
      shoulderL,
      shoulderR,
      belt,
      legL,
      legR,
      bootL,
      bootR,
      eyeL,
      eyeR
    );

    root.traverse(o=>{

      if(o.isMesh){

        o.castShadow=true;
        o.receiveShadow=true;
      }
    });

    this.modelRoot.add(root);

    this.fallback=root;
  }

  async loadGLB(){

    try{

      const loader=
        new GLTFLoader();

      const gltf=
        await loader.loadAsync(
          "https://threejs.org/examples/models/gltf/Soldier.glb"
        );

      const model=gltf.scene;

      model.traverse(o=>{

        if(o.isMesh){

          o.castShadow=true;
          o.receiveShadow=true;
        }
      });

      const box=
        new THREE.Box3()
          .setFromObject(model);

      const size=
        box.getSize(
          new THREE.Vector3()
        );

      const scale=
        1.76/size.y;

      model.scale.setScalar(
        scale
      );

      const scaledBox=
        new THREE.Box3()
          .setFromObject(model);

      const center=
        scaledBox.getCenter(
          new THREE.Vector3()
        );

      model.position.x=
        -center.x;

      model.position.z=
        -center.z;

      model.position.y=
        -scaledBox.min.y;

      model.rotation.y=
        Math.PI;

      this.modelRoot.add(
        model
      );

      this.fallback.visible=false;

      this.mixer=
        new THREE.AnimationMixer(
          model
        );

      for(
        const clip of gltf.animations
      ){

        const name=
          clip.name.toLowerCase();

        this.actions[name]=
          this.mixer.clipAction(
            clip
          );
      }

      this.playAnimation("idle");

    }catch(error){

      console.warn(
        "GLB tidak tersedia, memakai karakter fallback.",
        error
      );
    }
  }

  findAnimation(type){

    const names=
      Object.keys(
        this.actions
      );

    if(type==="idle"){

      return names.find(
        n=>n.includes("idle")
      );
    }

    if(type==="walk"){

      return names.find(
        n=>n.includes("walk")
      );
    }

    if(type==="run"){

      return names.find(
        n=>n.includes("run")
      );
    }

    return null;
  }

  playAnimation(type){

    if(!this.mixer){
      return;
    }

    const name=
      this.findAnimation(type);

    if(!name){
      return;
    }

    const next=
      this.actions[name];

    if(
      this.activeAction===next
    ){
      return;
    }

    if(this.activeAction){

      this.activeAction
        .fadeOut(.12);
    }

    next
      .reset()
      .fadeIn(.12)
      .play();

    this.activeAction=next;
  }

  getCameraHeight(){

    if(this.dodgeTimer>0){
      return .78;
    }

    if(this.input.state.crouch){
      return .72;
    }

    if(!this.grounded){
      return .94;
    }

    return 1.02;
  }

  damage(amount){

    this.hp=
      Math.max(
        0,
        this.hp-amount
      );
  }

  startDodge(){

    if(
      this.dodgeTimer>0 ||
      this.stamina<25 ||
      !this.grounded
    ){
      return;
    }

    const input=
      this.input.state;

    const yaw=
      this.cameraSystem
        ? this.cameraSystem.getYaw()
        : 0;

    const forward=
      new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
      );

    const right=
      new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
      );

    this.dodgeDirection.set(0,0,0);

    this.dodgeDirection
      .addScaledVector(
        right,
        input.moveX
      );

    this.dodgeDirection
      .addScaledVector(
        forward,
        -input.moveY
      );

    if(
      this.dodgeDirection.lengthSq()<.01
    ){
      this.dodgeDirection.copy(
        forward
      );
    }

    this.dodgeDirection.normalize();

    this.dodgeTimer=
      this.dodgeDuration;

    this.stamina-=25;
  }

  update(dt){

    this.input.update();

    const input=
      this.input.state;

    if(
      this.input.consumeAction()
    ){

      this.world.playerAction(
        this
      );
    }

    if(
      this.input.consumeJump()
    ){

      if(
        input.crouch &&
        this.grounded
      ){

        this.startDodge();

      }else if(
        this.grounded &&
        !input.crouch
      ){

        this.velocityY=
          this.jumpPower;

        this.grounded=false;
      }
    }

    if(this.dodgeTimer>0){

      this.dodgeTimer-=dt;

      const amount=
        this.dodgeSpeed*dt;

      const nextX=
        this.group.position.x+
        this.dodgeDirection.x*
        amount;

      const nextZ=
        this.group.position.z+
        this.dodgeDirection.z*
        amount;

      if(
        !this.world.isBlocked(
          nextX,
          this.group.position.z,
          .35
        )
      ){

        this.group.position.x=
          nextX;
      }

      if(
        !this.world.isBlocked(
          this.group.position.x,
          nextZ,
          .35
        )
      ){

        this.group.position.z=
          nextZ;
      }

      this.updateAnimation(
        false,
        false
      );

      return;
    }

    const yaw=
      this.cameraSystem
        ? this.cameraSystem.getYaw()
        : 0;

    const forward=
      new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
      );

    const right=
      new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
      );

    const movement=
      new THREE.Vector3();

    movement.addScaledVector(
      right,
      input.moveX
    );

    movement.addScaledVector(
      forward,
      -input.moveY
    );

    if(
      movement.lengthSq()>1
    ){

      movement.normalize();
    }

    const moving=
      movement.lengthSq()>.001;

    let speed=
      this.walkSpeed;

    if(input.crouch){

      speed=
        this.crouchSpeed;

    }else if(
      input.sprint &&
      moving &&
      this.stamina>0
    ){

      speed=
        this.runSpeed;
    }

    if(
      input.sprint &&
      moving &&
      !input.crouch
    ){

      this.stamina=
        Math.max(
          0,
          this.stamina-
          24*dt
        );

    }else{

      this.stamina=
        Math.min(
          100,
          this.stamina+
          18*dt
        );
    }

    if(moving){

      const nextX=
        this.group.position.x+
        movement.x*speed*dt;

      const nextZ=
        this.group.position.z+
        movement.z*speed*dt;

      if(
        !this.world.isBlocked(
          nextX,
          this.group.position.z,
          .38
        )
      ){

        this.group.position.x=
          nextX;
      }

      if(
        !this.world.isBlocked(
          this.group.position.x,
          nextZ,
          .38
        )
      ){

        this.group.position.z=
          nextZ;
      }

      const targetRotation=
        Math.atan2(
          movement.x,
          movement.z
        );

      let difference=
        targetRotation-
        this.group.rotation.y;

      difference=
        Math.atan2(
          Math.sin(difference),
          Math.cos(difference)
        );

      this.group.rotation.y+=
        difference*
        Math.min(
          1,
          dt*14
        );
    }

    this.velocityY-=
      this.gravity*dt;

    this.group.position.y+=
      this.velocityY*dt;

    if(
      this.group.position.y<=0
    ){

      this.group.position.y=0;
      this.velocityY=0;
      this.grounded=true;

    }else{

      this.grounded=false;
    }

    this.updateAnimation(
      moving,
      input.sprint &&
      !input.crouch &&
      this.stamina>0
    );
  }

  updateAnimation(
    moving,
    running
  ){

    if(!this.mixer){
      return;
    }

    if(!this.grounded){

      this.playAnimation("idle");

    }else if(!moving){

      this.playAnimation("idle");

    }else if(running){

      this.playAnimation("run");

    }else{

      this.playAnimation("walk");
    }

    this.mixer.update(
      Math.min(
        .05,
        1/60
      )
    );
  }
}