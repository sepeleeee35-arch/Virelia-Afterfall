import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Player {
  constructor(scene) {
    this.scene = scene;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.visual = new THREE.Group();
    this.group.add(this.visual);

    this.velocity = new THREE.Vector3();

    this.speed = 3.2;
    this.runSpeed = 6.2;
    this.crouchSpeed = 1.65;

    this.gravity = 25;
    this.jumpPower = 5.2;

    this.grounded = true;
    this.driving = false;

    this.crouching = false;
    this.crouchAmount = 0;

    this.targetHeight = 1.76;
    this.normalScale = 1;
    this.crouchScale = 0.67;

    this.hp = 100;
    this.stamina = 100;

    this.animations = {};
    this.mixer = null;
    this.currentAction = null;

    this.moveDirection = new THREE.Vector3();
    this.targetRotation = 0;

    this.loadCharacter();
  }

  loadCharacter() {
    const loader = new GLTFLoader();

    loader.load(
      "https://threejs.org/examples/models/gltf/Soldier.glb",
      gltf => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        const height = size.y || 1;
        const scale = this.targetHeight / height;

        model.scale.setScalar(scale);

        model.rotation.y = Math.PI;

        this.visual.add(model);

        const box2 = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box2.getCenter(center);

        model.position.y -= box2.min.y;

        this.model = model;

        if (gltf.animations && gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(model);

          for (const clip of gltf.animations) {
            this.animations[clip.name.toLowerCase()] =
              this.mixer.clipAction(clip);
          }

          this.playAnimation("idle");
        }
      },
      undefined,
      () => {
        this.createFallback();
      }
    );
  }

  createFallback() {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.85, 5, 10),
      new THREE.MeshStandardMaterial({ color: 0x30343b })
    );

    body.position.y = 0.85;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xb58c72 })
    );

    head.position.y = 1.55;

    this.visual.add(body, head);
    this.model = this.visual;
  }

  playAnimation(name) {
    if (!this.mixer) return;

    const wanted =
      this.animations[name] ||
      this.animations[name.toLowerCase()] ||
      this.animations.idle;

    if (!wanted || this.currentAction === wanted) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(0.18);
    }

    wanted.reset();
    wanted.fadeIn(0.18);
    wanted.play();

    this.currentAction = wanted;
  }

  updateCrouch(dt, input) {
    const wanted = input.crouch && !this.driving;

    this.crouching = wanted;

    const target = wanted ? 1 : 0;

    this.crouchAmount = THREE.MathUtils.damp(
      this.crouchAmount,
      target,
      12,
      dt
    );

    const scale = THREE.MathUtils.lerp(
      this.normalScale,
      this.crouchScale,
      this.crouchAmount
    );

    this.visual.scale.y = scale;

    const heightOffset =
      this.targetHeight * (1 - scale) * 0.5;

    this.visual.position.y = heightOffset;

    return this.crouchAmount;
  }

  update(dt, input, camera) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    if (this.driving) {
      this.velocity.set(0, 0, 0);
      return;
    }

    const crouch = this.updateCrouch(dt, input);

    const moveX = input.moveX;
    const moveY = input.moveY;

    const moving =
      Math.abs(moveX) > 0.08 ||
      Math.abs(moveY) > 0.08;

    let speed = this.speed;

    if (crouch > 0.5) {
      speed = this.crouchSpeed;
    } else if (input.sprint && this.stamina > 0 && moving) {
      speed = this.runSpeed;
      this.stamina -= 24 * dt;
    } else {
      this.stamina += 18 * dt;
    }

    this.stamina = THREE.MathUtils.clamp(
      this.stamina,
      0,
      100
    );

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    this.moveDirection.set(0, 0, 0);

    this.moveDirection.addScaledVector(
      right,
      moveX
    );

    this.moveDirection.addScaledVector(
      forward,
      moveY
    );

    if (this.moveDirection.lengthSq() > 0.01) {
      this.moveDirection.normalize();

      const angle = Math.atan2(
        this.moveDirection.x,
        this.moveDirection.z
      );

      this.targetRotation = angle;

      this.group.rotation.y = THREE.MathUtils.damp(
        this.group.rotation.y,
        angle,
        14,
        dt
      );

      this.velocity.x =
        this.moveDirection.x * speed;

      this.velocity.z =
        this.moveDirection.z * speed;

      if (crouch > 0.5) {
        this.playAnimation("walk");
      } else if (
        input.sprint &&
        this.stamina > 0
      ) {
        this.playAnimation("run");
      } else {
        this.playAnimation("walk");
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;

      this.playAnimation("idle");
    }

    if (input.jumpPressed && this.grounded && crouch < 0.4) {
      this.velocity.y = this.jumpPower;
      this.grounded = false;
    }

    this.velocity.y -= this.gravity * dt;

    this.group.position.x +=
      this.velocity.x * dt;

    this.group.position.z +=
      this.velocity.z * dt;

    this.group.position.y +=
      this.velocity.y * dt;

    if (this.group.position.y <= 0) {
      this.group.position.y = 0;
      this.velocity.y = 0;
      this.grounded = true;
    }
  }

  getCameraHeight() {
    const normal = 1.55;
    const crouched = 0.9;

    return THREE.MathUtils.lerp(
      normal,
      crouched,
      this.crouchAmount
    );
  }

  action() {
    this.playAnimation("idle");
  }
}