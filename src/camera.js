import * as THREE from "three";

export class ThirdPersonCamera{

  constructor(camera,scene,player){

    this.camera = camera;
    this.scene = scene;
    this.player = player;

    this.yaw = 0;
    this.pitch = .28;

    this.distance = 4.4;

    this.target = new THREE.Vector3();
    this.desired = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();

    this.tmpDirection = new THREE.Vector3();
  }

  getYaw(){
    return this.yaw;
  }

  isCameraBlocker(object){

    let current = object;

    while(current){

      if(current.userData && current.userData.cameraBlocker){
        return true;
      }

      if(current === this.player.group){
        return false;
      }

      current = current.parent;
    }

    return false;
  }

  update(dt,input){

    const delta = input.consumeCameraDelta();

    this.yaw -= delta.x * .006;
    this.pitch -= delta.y * .005;

    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      -.65,
      1.05
    );

    const cameraHeight =
      this.player.getCameraHeight();

    this.target.copy(this.player.group.position);

    this.target.y += cameraHeight;

    const horizontal =
      Math.cos(this.pitch) * this.distance;

    this.desired.set(
      this.target.x +
      Math.sin(this.yaw) * horizontal,

      this.target.y +
      Math.sin(this.pitch) * this.distance,

      this.target.z +
      Math.cos(this.yaw) * horizontal
    );

    this.tmpDirection
      .copy(this.desired)
      .sub(this.target)
      .normalize();

    this.raycaster.set(
      this.target,
      this.tmpDirection
    );

    this.raycaster.far = this.distance;

    const hits =
      this.raycaster.intersectObjects(
        this.scene.children,
        true
      );

    let finalDistance = this.distance;

    for(const hit of hits){

      if(hit.distance < .35) continue;

      if(this.isCameraBlocker(hit.object)){

        finalDistance =
          Math.max(
            .8,
            hit.distance - .25
          );

        break;
      }
    }

    const finalPosition =
      this.target.clone().add(
        this.tmpDirection
          .multiplyScalar(finalDistance)
      );

    const smooth =
      1 - Math.pow(.001,dt);

    this.camera.position.lerp(
      finalPosition,
      smooth
    );

    this.camera.lookAt(this.target);
  }
}