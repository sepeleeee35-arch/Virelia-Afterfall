import * as THREE from "three";

export class Bot {
  constructor(scene, world, id, x, z) {
    this.scene = scene;
    this.world = world;
    this.id = id;

    this.group = new THREE.Group();
    this.group.position.set(x, 0.35, z);

    this.hp = 100;

    this.velocity = new THREE.Vector3();

    this.speed = 3.2;
    this.runSpeed = 5.2;

    this.gravity = 18;
    this.jumpPower = 5.2;

    this.grounded = true;
    this.crouching = false;

    this.state = "idle";

    this.target = null;

    this.thinkTimer = 0;
    this.directionTimer = 0;

    this.walkTime = Math.random() * 10;

    this.targetPoint =
      new THREE.Vector3(x, 0.35, z);

    this.buildCharacter();

    scene.add(this.group);
  }

  material(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9
    });
  }

  buildCharacter() {
    const skin =
      this.material(0x8b6b57);

    const shirt =
      this.material(0x46535b);

    const pants =
      this.material(0x292c31);

    const shoes =
      this.material(0x17191b);

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.62,
          1.0,
          0.38
        ),
        shirt
      );

    body.position.y = 1.0;

    this.group.add(body);

    this.body = body;

    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.31,
          8,
          6
        ),
        skin
      );

    head.position.y = 1.72;

    this.group.add(head);

    this.head = head;

    this.leftLeg =
      this.createLimb(
        0.18,
        0.3,
        pants
      );

    this.rightLeg =
      this.createLimb(
        -0.18,
        0.3,
        pants
      );

    this.leftArm =
      this.createLimb(
        0.45,
        1.05,
        shirt,
        true
      );

    this.rightArm =
      this.createLimb(
        -0.45,
        1.05,
        shirt,
        true
      );

    this.group.add(
      this.leftLeg
    );

    this.group.add(
      this.rightLeg
    );

    this.group.add(
      this.leftArm
    );

    this.group.add(
      this.rightArm
    );

    this.shadow =
      new THREE.Mesh(
        new THREE.CircleGeometry(
          0.48,
          8
        ),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.18
        })
      );

    this.shadow.rotation.x =
      -Math.PI / 2;

    this.shadow.position.y =
      0.02;

    this.group.add(
      this.shadow
    );
  }

  createLimb(
    x,
    y,
    material,
    arm = false
  ) {
    const mesh =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          arm ? 0.18 : 0.20,
          arm ? 0.8 : 0.72,
          arm ? 0.18 : 0.22
        ),
        material
      );

    mesh.position.set(
      x,
      y,
      0
    );

    return mesh;
  }

  chooseTarget() {
    if (
      !this.world.player ||
      this.world.player.driving ||
      this.world.insideHouse
    ) {
      this.target = null;
      return;
    }

    const player =
      this.world.player.group.position;

    const dx =
      player.x -
      this.group.position.x;

    const dz =
      player.z -
      this.group.position.z;

    const distance =
      Math.hypot(dx, dz);

    if (distance < 22) {
      this.target =
        this.world.player;

      this.state = "follow";

      return;
    }

    this.target = null;

    this.state = "wander";

    this.targetPoint.set(
      this.group.position.x +
        (Math.random() * 30 - 15),
      0.35,
      this.group.position.z +
        (Math.random() * 30 - 15)
    );
  }

  think(dt) {
    this.thinkTimer -= dt;

    if (
      this.thinkTimer > 0
    ) {
      return;
    }

    this.thinkTimer =
      0.35 +
      Math.random() * 0.35;

    this.chooseTarget();
  }

  moveToward(
    target,
    dt,
    speed
  ) {
    const dx =
      target.x -
      this.group.position.x;

    const dz =
      target.z -
      this.group.position.z;

    const distance =
      Math.hypot(dx, dz);

    if (
      distance < 0.2
    ) {
      return;
    }

    const nx =
      dx / distance;

    const nz =
      dz / distance;

    const desiredX =
      nx * speed;

    const desiredZ =
      nz * speed;

    this.velocity.x =
      THREE.MathUtils.lerp(
        this.velocity.x,
        desiredX,
        0.12
      );

    this.velocity.z =
      THREE.MathUtils.lerp(
        this.velocity.z,
        desiredZ,
        0.12
      );

    this.group.rotation.y =
      Math.atan2(
        this.velocity.x,
        this.velocity.z
      );
  }

  avoidObstacles() {
    const p =
      this.group.position;

    for (
      const collider
      of this.world.colliders
    ) {
      const dx =
        p.x -
        collider.x;

      const dz =
        p.z -
        collider.z;

      const distance =
        Math.hypot(dx, dz);

      const limit =
        Math.max(
          collider.sx,
          collider.sz
        ) *
          0.5 +
        0.8;

      if (
        distance < limit &&
        distance > 0.01
      ) {
        const nx =
          dx / distance;

        const nz =
          dz / distance;

        this.velocity.x +=
          nx * 1.8;

        this.velocity.z +=
          nz * 1.8;
      }
    }
  }

  updateAnimation(dt) {
    const horizontalSpeed =
      Math.hypot(
        this.velocity.x,
        this.velocity.z
      );

    this.walkTime +=
      dt *
      horizontalSpeed *
      2.5;

    if (
      horizontalSpeed > 0.35
    ) {
      const swing =
        Math.sin(
          this.walkTime
        ) * 0.45;

      this.leftLeg.rotation.x =
        swing;

      this.rightLeg.rotation.x =
        -swing;

      this.leftArm.rotation.x =
        -swing * 0.7;

      this.rightArm.rotation.x =
        swing * 0.7;
    } else {
      this.leftLeg.rotation.x =
        THREE.MathUtils.lerp(
          this.leftLeg.rotation.x,
          0,
          0.15
        );

      this.rightLeg.rotation.x =
        THREE.MathUtils.lerp(
          this.rightLeg.rotation.x,
          0,
          0.15
        );

      this.leftArm.rotation.x =
        THREE.MathUtils.lerp(
          this.leftArm.rotation.x,
          0,
          0.15
        );

      this.rightArm.rotation.x =
        THREE.MathUtils.lerp(
          this.rightArm.rotation.x,
          0,
          0.15
        );
    }
  }

  update(dt) {
    if (
      !this.group.visible
    ) {
      return;
    }

    this.think(dt);

    if (
      this.state === "follow" &&
      this.target
    ) {
      const target =
        this.target.group.position;

      const distance =
        this.group.position.distanceTo(
          target
        );

      if (
        distance > 3
      ) {
        this.moveToward(
          target,
          dt,
          this.runSpeed
        );
      } else {
        this.velocity.x *=
          0.82;

        this.velocity.z *=
          0.82;
      }
    } else {
      this.moveToward(
        this.targetPoint,
        dt,
        this.speed
      );
    }

    this.avoidObstacles();

    const nextX =
      this.group.position.x +
      this.velocity.x *
        dt;

    const nextZ =
      this.group.position.z +
      this.velocity.z *
        dt;

    if (
      !this.world.isBlocked(
        nextX,
        this.group.position.z,
        0.45
      )
    ) {
      this.group.position.x =
        nextX;
    } else {
      this.velocity.x *=
        -0.2;
    }

    if (
      !this.world.isBlocked(
        this.group.position.x,
        nextZ,
        0.45
      )
    ) {
      this.group.position.z =
        nextZ;
    } else {
      this.velocity.z *=
        -0.2;
    }

    if (
      !this.grounded
    ) {
      this.velocity.y -=
        this.gravity * dt;

      this.group.position.y +=
        this.velocity.y * dt;

      if (
        this.group.position.y <=
        0.35
      ) {
        this.group.position.y =
          0.35;

        this.velocity.y = 0;

        this.grounded = true;
      }
    }

    this.updateAnimation(dt);
  }
}