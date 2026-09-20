import * as THREE from "three";

export class ThirdPersonCamera{

  constructor(camera,scene,player){

    this.camera=camera;
    this.scene=scene;
    this.player=player;

    this.yaw=0;
    this.pitch=.24;

    this.distance=4.9;
    this.height=1.02;

    this.target=new THREE.Vector3();
    this.desired=new THREE.Vector3();
    this.direction=new THREE.Vector3();

    this.raycaster=new THREE.Raycaster();

    this.currentDistance=this.distance;
  }

  getYaw(){
    return this.yaw;
  }

  isBlocker(object){

    let current=object;

    while(current){

      if(
        current.userData &&
        current.userData.cameraBlocker
      ){
        return true;
      }

      if(current===this.player.group){
        return false;
      }

      current=current.parent;
    }

    return false;
  }

  update(dt,input){

    const delta=
      input.consumeCameraDelta();

    this.yaw-=delta.x*.0055;
    this.pitch-=delta.y*.0045;

    this.pitch=
      THREE.MathUtils.clamp(
        this.pitch,
        -.55,
        .95
      );

    const playerHeight=
      this.player.getCameraHeight();

    this.target.copy(
      this.player.group.position
    );

    this.target.y+=playerHeight;

    const horizontal=
      Math.cos(this.pitch)*
      this.distance;

    this.desired.set(
      this.target.x+
      Math.sin(this.yaw)*horizontal,

      this.target.y+
      Math.sin(this.pitch)*
      this.distance,

      this.target.z+
      Math.cos(this.yaw)*horizontal
    );

    this.direction
      .copy(this.desired)
      .sub(this.target)
      .normalize();

    this.raycaster.set(
      this.target,
      this.direction
    );

    this.raycaster.far=
      this.distance;

    const hits=
      this.raycaster.intersectObjects(
        this.scene.children,
        true
      );

    let wantedDistance=
      this.distance;

    for(const hit of hits){

      if(hit.distance<.4){
        continue;
      }

      if(this.isBlocker(hit.object)){

        wantedDistance=
          Math.max(
            .9,
            hit.distance-.3
          );

        break;
      }
    }

    const distanceSmooth=
      1-Math.pow(.002,dt);

    this.currentDistance=
      THREE.MathUtils.lerp(
        this.currentDistance,
        wantedDistance,
        distanceSmooth
      );

    const finalPosition=
      this.target.clone().add(
        this.direction.clone()
          .multiplyScalar(
            this.currentDistance
          )
      );

    const positionSmooth=
      1-Math.pow(.0005,dt);

    this.camera.position.lerp(
      finalPosition,
      positionSmooth
    );

    this.camera.lookAt(
      this.target
    );
  }
}