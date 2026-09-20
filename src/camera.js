import * as THREE from "three";

export class CameraController {
  constructor(camera, dom, player, world) {
    this.camera = camera;
    this.dom = dom;
    this.player = player;
    this.world = world;

    this.yaw = 0;
    this.pitch = -0.18;

    this.targetYaw = 0;
    this.targetPitch = -0.18;

    this.distance = 5.2;
    this.targetDistance = 5.2;

    this.height = 1.45;

    this.minPitch = -1.15;
    this.maxPitch = 0.55;

    this.minDistance = 2.0;
    this.maxDistance = 6.5;

    this.lookTarget = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();

    this.pointerActive = false;
    this.lastX = 0;
    this.lastY = 0;

    this.bindTouch();
  }

  bindTouch() {
    this.dom.addEventListener(
      "pointerdown",
      e => {
        if (
          e.clientX <
          innerWidth * 0.42
        ) return;

        this.pointerActive = true;

        this.lastX = e.clientX;
        this.lastY = e.clientY;
      }
    );

    this.dom.addEventListener(
      "pointermove",
      e => {
        if (!this.pointerActive) return;

        const dx =
          e.clientX - this.lastX;

        const dy =
          e.clientY - this.lastY;

        this.lastX = e.clientX;
        this.lastY = e.clientY;

        this.targetYaw -= dx * 0.006;
        this.targetPitch -= dy * 0.004;

        this.targetPitch =
          THREE.MathUtils.clamp(
            this.targetPitch,
            this.minPitch,
            this.maxPitch
          );
      }
    );

    this.dom.addEventListener(
      "pointerup",
      () => {
        this.pointerActive = false;
      }
    );

    this.dom.addEventListener(
      "pointercancel",
      () => {
        this.pointerActive = false;
      }
    );
  }

  update(dt, input) {
    if (
      Math.abs(input.cameraDX) >
        0.001 ||
      Math.abs(input.cameraDY) >
        0.001
    ) {
      this.targetYaw -=
        input.cameraDX * 0.006;

      this.targetPitch -=
        input.cameraDY * 0.004;

      this.targetPitch =
        THREE.MathUtils.clamp(
          this.targetPitch,
          this.minPitch,
          this.maxPitch
        );
    }

    this.yaw =
      THREE.MathUtils.damp(
        this.yaw,
        this.targetYaw,
        12,
        dt
      );

    this.pitch =
      THREE.MathUtils.damp(
        this.pitch,
        this.targetPitch,
        12,
        dt
      );

    const crouch =
      this.player.crouchAmount || 0;

    const wantedHeight =
      THREE.MathUtils.lerp(
        1.45,
        0.88,
        crouch
      );

    this.height =
      THREE.MathUtils.damp(
        this.height,
        wantedHeight,
        10,
        dt
      );

    this.targetDistance =
      this.player.driving
        ? 7.0
        : 5.2;

    this.distance =
      THREE.MathUtils.damp(
        this.distance,
        this.targetDistance,
        8,
        dt
      );

    const p =
      this.player.group.position;

    this.lookTarget.set(
      p.x,
      p.y + this.height,
      p.z
    );

    const offset =
      new THREE.Vector3(
        0,
        0,
        this.distance
      );

    offset.applyEuler(
      new THREE.Euler(
        this.pitch,
        this.yaw,
        0,
        "YXZ"
      )
    );

    const desired =
      this.lookTarget.clone()
        .add(offset);

    const safe =
      this.resolveCollision(
        this.lookTarget,
        desired
      );

    this.cameraTarget.lerp(
      safe,
      1 - Math.pow(0.001, dt)
    );

    this.camera.position.copy(
      this.cameraTarget
    );

    this.camera.lookAt(
      this.lookTarget
    );
  }

  resolveCollision(from, to) {
    const direction =
      to.clone().sub(from);

    const length =
      direction.length();

    if (length <= 0.01) {
      return to;
    }

    direction.normalize();

    this.raycaster.set(
      from,
      direction
    );

    this.raycaster.far =
      length;

    const objects =
      this.world.cameraColliders || [];

    const hits =
      this.raycaster.intersectObjects(
        objects,
        true
      );

    if (hits.length) {
      const d =
        Math.max(
          0.35,
          hits[0].distance - 0.25
        );

      return from.clone().add(
        direction.multiplyScalar(d)
      );
    }

    return to;
  }
}