import * as THREE from "three";

export class World {
  constructor(scene) {
    this.scene = scene;

    this.player = null;
    this.insideHouse = false;
    this.activeCar = null;

    this.colliders = [];
    this.cameraColliders = [];
    this.houses = [];
    this.cars = [];
    this.zombies = [];
    this.decorations = [];

    this.clock = 0;

    this.buildGround();
    this.buildRoads();
    this.buildCity();
    this.buildStreetLights();
    this.buildCars();
    this.buildZombies();
  }

  material(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });
  }

  box(
    x,
    y,
    z,
    sx,
    sy,
    sz,
    color,
    parent = this.scene
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        sx,
        sy,
        sz
      ),
      this.material(color)
    );

    mesh.position.set(
      x,
      y,
      z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
  }

  addCollider(
    minX,
    maxX,
    minZ,
    maxZ,
    data = {}
  ) {
    const box = {
      minX,
      maxX,
      minZ,
      maxZ,
      ...data
    };

    this.colliders.push(box);
    return box;
  }

  buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(
        240,
        240
      ),
      this.material(
        0x56634f,
        1
      )
    );

    ground.rotation.x =
      -Math.PI / 2;

    ground.receiveShadow = true;

    this.scene.add(ground);
  }

  buildRoads() {
    const roadMat =
      this.material(
        0x24272a,
        0.95
      );

    const sidewalkMat =
      this.material(
        0x777b7d,
        0.9
      );

    const roads = [
      {
        x: 0,
        z: 0,
        w: 13,
        d: 220
      },
      {
        x: 0,
        z: 0,
        w: 220,
        d: 13
      },
      {
        x: -55,
        z: 0,
        w: 9,
        d: 220
      },
      {
        x: 55,
        z: 0,
        w: 9,
        d: 220
      },
      {
        x: 0,
        z: -55,
        w: 220,
        d: 9
      },
      {
        x: 0,
        z: 55,
        w: 220,
        d: 9
      }
    ];

    for (const r of roads) {
      const road =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            r.w,
            0.08,
            r.d
          ),
          roadMat
        );

      road.position.set(
        r.x,
        0.04,
        r.z
      );

      road.receiveShadow = true;

      this.scene.add(road);
    }

    const sidewalks = [
      [-9, 0, 2, 220],
      [9, 0, 2, 220],
      [-64, 0, 2, 220],
      [64, 0, 2, 220],
      [0, -9, 220, 2],
      [0, 9, 220, 2],
      [0, -64, 220, 2],
      [0, 64, 220, 2]
    ];

    for (const s of sidewalks) {
      const sidewalk =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            s[2],
            0.12,
            s[3]
          ),
          sidewalkMat
        );

      sidewalk.position.set(
        s[0],
        0.08,
        s[1]
      );

      sidewalk.receiveShadow = true;

      this.scene.add(sidewalk);
    }

    this.addRoadMarkings();
  }

  addRoadMarkings() {
    const markMat =
      this.material(0xe7dfb2);

    for (
      let i = -105;
      i <= 105;
      i += 9
    ) {
      this.box(
        0,
        0.1,
        i,
        0.22,
        0.03,
        4,
        0xe7dfb2
      );

      this.box(
        i,
        0.1,
        0,
        4,
        0.03,
        0.22,
        0xe7dfb2
      );
    }
  }

  buildCity() {
    const positions = [
      [-28, -28, 1],
      [28, -28, 2],
      [-28, 28, 3],
      [28, 28, 4],

      [-82, -28, 5],
      [82, -28, 6],
      [-82, 28, 7],
      [82, 28, 8],

      [-28, -82, 9],
      [28, -82, 10],
      [-28, 82, 11],
      [28, 82, 12]
    ];

    for (const [
      x,
      z,
      type
    ] of positions) {
      this.buildHouse(
        x,
        z,
        type
      );
    }

    this.buildParks();
    this.buildTrees();
    this.buildRubble();
  }

  buildHouse(x, z, type) {
    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    const width =
      type % 2 === 0
        ? 8.5
        : 7.5;

    const depth =
      type % 3 === 0
        ? 7
        : 6.5;

    const wallColor =
      [
        0xb6afa0,
        0x9d9fa0,
        0xb8a58e,
        0x8d9698
      ][type % 4];

    const roofColor =
      [
        0x3e4144,
        0x51433b,
        0x45484b,
        0x5a4b42
      ][type % 4];

    this.box(
      0,
      1.5,
      -depth / 2,
      width,
      3,
      0.35,
      wallColor,
      group
    );

    this.box(
      0,
      1.5,
      depth / 2,
      width,
      3,
      0.35,
      wallColor,
      group
    );

    this.box(
      -width / 2,
      1.5,
      0,
      0.35,
      3,
      depth,
      wallColor,
      group
    );

    this.box(
      width / 2,
      1.5,
      0,
      0.35,
      3,
      depth,
      wallColor,
      group
    );

    const roof =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width + 0.7,
          0.35,
          depth + 0.7
        ),
        this.material(
          roofColor,
          0.9
        )
      );

    roof.position.y =
      3.15;

    roof.castShadow = true;
    roof.receiveShadow = true;

    group.add(roof);

    const door =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.35,
          2.2,
          0.12
        ),
        this.material(
          0x34251f
        )
      );

    door.position.set(
      0,
      1.1,
      -depth / 2 - 0.2
    );

    group.add(door);

    this.addWindows(
      group,
      width,
      depth
    );

    this.addInterior(
      group,
      width,
      depth,
      type
    );

    const halfW =
      width / 2;

    const halfD =
      depth / 2;

    this.addCollider(
      x - halfW,
      x - 0.75,
      z - halfD - 0.2,
      z - halfD + 0.2,
      { house: group }
    );

    this.addCollider(
      x + 0.75,
      x + halfW,
      z - halfD - 0.2,
      z - halfD + 0.2,
      { house: group }
    );

    this.addCollider(
      x - halfW,
      x + halfW,
      z + halfD - 0.2,
      z + halfD + 0.2,
      { house: group }
    );

    this.addCollider(
      x - halfW - 0.2,
      x - halfW + 0.2,
      z - halfD,
      z + halfD,
      { house: group }
    );

    this.addCollider(
      x + halfW - 0.2,
      x + halfW + 0.2,
      z - halfD,
      z + halfD,
      { house: group }
    );

    this.houses.push({
      group,
      x,
      z,
      width,
      depth
    });
  }

  addWindows(
    group,
    width,
    depth
  ) {
    const glass =
      this.material(
        0x5e91a3,
        0.25,
        0.1
      );

    for (const side of [-1, 1]) {
      const window =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.5,
            1.1,
            0.08
          ),
          glass
        );

      window.position.set(
        side * width * 0.28,
        1.55,
        -depth / 2 - 0.2
      );

      group.add(window);
    }

    for (const side of [-1, 1]) {
      const window =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.08,
            1.1,
            1.5
          ),
          glass
        );

      window.position.set(
        side * width / 2 + side * 0.2,
        1.55,
        0
      );

      group.add(window);
    }
  }

  addInterior(
    group,
    width,
    depth,
    type
  ) {
    const floor =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width - 0.5,
          0.12,
          depth - 0.5
        ),
        this.material(
          type % 2
            ? 0x766456
            : 0x8a735c
        )
      );

    floor.position.y =
      0.06;

    floor.receiveShadow = true;

    group.add(floor);

    const bed =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          2.1,
          0.35,
          1.3
        ),
        this.material(
          0xaaa7a0
        )
      );

    bed.position.set(
      width * 0.25,
      0.35,
      depth * 0.22
    );

    bed.castShadow = true;

    group.add(bed);

    const table =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.3,
          0.15,
          0.8
        ),
        this.material(
          0x62462f
        )
      );

    table.position.set(
      -width * 0.25,
      0.8,
      depth * 0.18
    );

    table.castShadow = true;

    group.add(table);

    for (
      let i = 0;
      i < 2;
      i++
    ) {
      const leg =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.12,
            0.7,
            0.12
          ),
          this.material(
            0x513722
          )
        );

      leg.position.set(
        -width * 0.25 +
          (i ? 0.45 : -0.45),
        0.4,
        depth * 0.18
      );

      group.add(leg);
    }

    const lamp =
      new THREE.PointLight(
        0xffd9a3,
        1.8,
        9
      );

    lamp.position.set(
      0,
      2.4,
      0
    );

    group.add(lamp);
  }

  buildParks() {
    const parks = [
      [-82, 82],
      [82, -82]
    ];

    for (const [
      x,
      z
    ] of parks) {
      const grass =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            28,
            0.15,
            28
          ),
          this.material(
            0x4d6946
          )
        );

      grass.position.set(
        x,
        0.08,
        z
      );

      grass.receiveShadow = true;

      this.scene.add(grass);

      for (
        let i = 0;
        i < 8;
        i++
      ) {
        const tx =
          x +
          (Math.random() - 0.5) *
            22;

        const tz =
          z +
          (Math.random() - 0.5) *
            22;

        this.createTree(
          tx,
          tz,
          0.8 +
            Math.random() *
              0.45
        );
      }
    }
  }

  buildTrees() {
    for (
      let i = 0;
      i < 45;
      i++
    ) {
      let x =
        (Math.random() - 0.5) *
        210;

      let z =
        (Math.random() - 0.5) *
        210;

      if (
        Math.abs(x) < 14 ||
        Math.abs(z) < 14
      ) {
        continue;
      }

      this.createTree(
        x,
        z,
        0.65 +
          Math.random() * 0.65
      );
    }
  }

  createTree(
    x,
    z,
    scale
  ) {
    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.scale.setScalar(
      scale
    );

    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.22,
          0.3,
          2.4,
          8
        ),
        this.material(
          0x5b3d29
        )
      );

    trunk.position.y =
      1.2;

    trunk.castShadow = true;

    group.add(trunk);

    const crown =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.15,
          10,
          8
        ),
        this.material(
          0x3f633d
        )
      );

    crown.position.y =
      2.65;

    crown.castShadow = true;

    group.add(crown);

    this.scene.add(group);

    this.addCollider(
      x - 0.45 * scale,
      x + 0.45 * scale,
      z - 0.45 * scale,
      z + 0.45 * scale
    );
  }

  buildRubble() {
    for (
      let i = 0;
      i < 25;
      i++
    ) {
      const x =
        (Math.random() - 0.5) *
        190;

      const z =
        (Math.random() - 0.5) *
        190;

      if (
        Math.abs(x) < 12 ||
        Math.abs(z) < 12
      ) {
        continue;
      }

      const size =
        0.3 +
        Math.random() *
          0.7;

      const rock =
        new THREE.Mesh(
          new THREE.DodecahedronGeometry(
            size,
            0
          ),
          this.material(
            0x686662
          )
        );

      rock.position.set(
        x,
        size * 0.5,
        z
      );

      rock.rotation.set(
        Math.random(),
        Math.random(),
        Math.random()
      );

      rock.castShadow = true;

      this.scene.add(rock);
    }
  }

  buildStreetLights() {
    const positions = [];

    for (
      let i = -100;
      i <= 100;
      i += 20
    ) {
      positions.push(
        [-7, i],
        [7, i],
        [i, -7],
        [i, 7]
      );
    }

    for (const [
      x,
      z
    ] of positions) {
      const pole =
        this.box(
          x,
          2.2,
          z,
          0.12,
          4.4,
          0.12,
          0x3a3b3c
        );

      const lamp =
        new THREE.PointLight(
          0xffdca8,
          0.9,
          12
        );

      lamp.position.set(
        x,
        4.4,
        z
      );

      this.scene.add(lamp);
    }
  }

  buildCars() {
    const positions = [
      [-4.2, -20, 0],
      [4.2, 18, Math.PI],
      [-20, 4.2, Math.PI / 2],
      [20, -4.2, -Math.PI / 2],
      [-58, -18, 0],
      [58, 20, Math.PI]
    ];

    for (const [
      x,
      z,
      rot
    ] of positions) {
      const car =
        this.createCar(
          x,
          z,
          rot
        );

      this.cars.push(car);
    }
  }

  createCar(
    x,
    z,
    rotation
  ) {
    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.rotation.y =
      rotation;

    this.scene.add(group);

    const body =
      this.box(
        0,
        0.65,
        0,
        2.2,
        0.65,
        4.2,
        0x58616b,
        group
      );

    const cabin =
      this.box(
        0,
        1.15,
        0.15,
        1.75,
        0.8,
        2.0,
        0x222b32,
        group
      );

    const glass =
      this.material(
        0x6c9aab,
        0.15,
        0.1
      );

    const windshield =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.5,
          0.5,
          0.08
        ),
        glass
      );

    windshield.position.set(
      0,
      1.22,
      -0.86
    );

    windshield.rotation.x =
      -0.15;

    group.add(windshield);

    const wheelMat =
      this.material(
        0x151515
      );

    for (const [
      wx,
      wz
    ] of [
      [-1.12, -1.35],
      [1.12, -1.35],
      [-1.12, 1.35],
      [1.12, 1.35]
    ]) {
      const wheel =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.42,
            0.42,
            0.28,
            12
          ),
          wheelMat
        );

      wheel.rotation.z =
        Math.PI / 2;

      wheel.position.set(
        wx,
        0.43,
        wz
      );

      wheel.castShadow = true;

      group.add(wheel);
    }

    const car = {
      group,
      speed: 0,
      steering: 0,
      driving: false
    };

    this.addCollider(
      x - 1.35,
      x + 1.35,
      z - 2.25,
      z + 2.25,
      { car }
    );

    return car;
  }

  buildZombies() {
    for (
      let i = 0;
      i < 10;
      i++
    ) {
      const zombie =
        this.createZombie(
          -45 +
            Math.random() *
              90,
          -45 +
            Math.random() *
              90
        );

      this.zombies.push(
        zombie
      );
    }
  }

  createZombie(x, z) {
    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.scale.setScalar(
      0.78
    );

    this.scene.add(group);

    const body =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.3,
          0.85,
          5,
          8
        ),
        this.material(
          0x59605b
        )
      );

    body.position.y =
      0.8;

    body.castShadow = true;

    group.add(body);

    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.25,
          12,
          10
        ),
        this.material(
          0x777b6d
        )
      );

    head.position.y =
      1.55;

    head.castShadow = true;

    group.add(head);

    return {
      group,
      hp: 100,
      speed:
        0.65 +
        Math.random() * 0.35,
      attackTimer: 0,
      hitTimer: 0
    };
  }

  findNearbyDoor() {
    if (this.insideHouse)
      return null;

    if (!this.player)
      return null;

    let nearest = null;
    let best = 3.0;

    for (const house of this.houses) {
      const dx =
        this.player.group.position.x -
        house.x;

      const dz =
        this.player.group.position.z -
        (house.z -
          house.depth / 2 -
          0.35);

      const d =
        Math.hypot(dx, dz);

      if (d < best) {
        best = d;
        nearest = house;
      }
    }

    return nearest;
  }

  findNearbyCar() {
    if (!this.player)
      return null;

    let nearest = null;
    let best = 3.1;

    for (const car of this.cars) {
      if (car.driving)
        continue;

      const dx =
        this.player.group.position.x -
        car.group.position.x;

      const dz =
        this.player.group.position.z -
        car.group.position.z;

      const d =
        Math.hypot(dx, dz);

      if (d < best) {
        best = d;
        nearest = car;
      }
    }

    return nearest;
  }

  tryEnterNearby() {
    if (this.insideHouse) {
      this.exitHouse();
      return;
    }

    if (this.player.driving) {
      this.exitCar();
      return;
    }

    const car =
      this.findNearbyCar();

    if (car) {
      this.enterCar(car);
      return;
    }

    const door =
      this.findNearbyDoor();

    if (door) {
      this.enterHouse(door);
    }
  }

  enterHouse(house) {
    this.insideHouse = true;

    this.player.group.position.set(
      house.x,
      0,
      house.z
    );
  }

  exitHouse() {
    const house =
      this.findCurrentHouse();

    if (!house) {
      this.insideHouse = false;
      return;
    }

    this.insideHouse = false;

    this.player.group.position.set(
      house.x,
      0,
      house.z -
        house.depth / 2 -
        1.8
    );
  }

  findCurrentHouse() {
    if (!this.player)
      return null;

    let nearest = null;
    let best = 10;

    for (const house of this.houses) {
      const d =
        Math.hypot(
          this.player.group.position.x -
            house.x,
          this.player.group.position.z -
            house.z
        );

      if (d < best) {
        best = d;
        nearest = house;
      }
    }

    return nearest;
  }

  enterCar(car) {
    this.activeCar = car;
    car.driving = true;

    this.player.driving = true;
    this.player.group.visible = false;

    car.speed = 0;
  }

  exitCar() {
    if (!this.activeCar)
      return;

    const car =
      this.activeCar;

    const side =
      new THREE.Vector3(
        2.5,
        0,
        0
      );

    side.applyQuaternion(
      car.group.quaternion
    );

    this.player.group.position.copy(
      car.group.position
    );

    this.player.group.position.add(
      side
    );

    this.player.group.visible = true;
    this.player.driving = false;

    car.driving = false;

    this.activeCar = null;
  }

  updateCar(
    dt,
    input
  ) {
    if (!this.activeCar)
      return;

    const car =
      this.activeCar;

    const throttle =
      -input.moveY;

    const steering =
      input.moveX;

    car.speed +=
      throttle *
      14 *
      dt;

    car.speed *=
      Math.pow(0.985, dt * 60);

    car.speed =
      THREE.MathUtils.clamp(
        car.speed,
        -5,
        13
      );

    car.group.rotation.y -=
      steering *
      car.speed *
      0.012;

    const forward =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    forward.applyQuaternion(
      car.group.quaternion
    );

    const next =
      car.group.position.clone()
        .add(
          forward.multiplyScalar(
            car.speed * dt
          )
        );

    if (
      !this.isBlocked(
        next.x,
        next.z,
        1.25
      )
    ) {
      car.group.position.copy(
        next
      );
    } else {
      car.speed *= -0.2;
    }

    this.player.group.position.copy(
      car.group.position
    );
  }

  updateZombies(dt) {
    if (!this.player)
      return;

    if (
      this.player.driving ||
      this.insideHouse
    ) {
      return;
    }

    const px =
      this.player.group.position.x;

    const pz =
      this.player.group.position.z;

    for (const zombie of this.zombies) {
      const dx =
        px -
        zombie.group.position.x;

      const dz =
        pz -
        zombie.group.position.z;

      const dist =
        Math.hypot(dx, dz);

      if (
        dist > 22 ||
        dist < 1.45
      ) {
        continue;
      }

      const nx =
        dx / dist;

      const nz =
        dz / dist;

      zombie.group.position.x +=
        nx *
        zombie.speed *
        dt;

      zombie.group.position.z +=
        nz *
        zombie.speed *
        dt;

      zombie.group.rotation.y =
        Math.atan2(
          nx,
          nz
        );
    }
  }

  playerAction() {
    if (!this.player)
      return;

    if (
      this.player.driving ||
      this.insideHouse
    ) {
      return;
    }

    let closest = null;
    let best = 2.4;

    for (const zombie of this.zombies) {
      const dx =
        zombie.group.position.x -
        this.player.group.position.x;

      const dz =
        zombie.group.position.z -
        this.player.group.position.z;

      const d =
        Math.hypot(dx, dz);

      if (d < best) {
        best = d;
        closest = zombie;
      }
    }

    if (!closest)
      return;

    closest.hp -= 25;

    const dx =
      closest.group.position.x -
      this.player.group.position.x;

    const dz =
      closest.group.position.z -
      this.player.group.position.z;

    const len =
      Math.max(
        0.01,
        Math.hypot(dx, dz)
      );

    closest.group.position.x +=
      dx / len *
      0.7;

    closest.group.position.z +=
      dz / len *
      0.7;

    if (closest.hp <= 0) {
      closest.group.visible = false;
    }
  }

  isBlocked(
    x,
    z,
    radius = 0.4
  ) {
    if (this.insideHouse) {
      const house =
        this.findCurrentHouse();

      if (house) {
        const left =
          house.x -
          house.width / 2 +
          0.5;

        const right =
          house.x +
          house.width / 2 -
          0.5;

        const top =
          house.z -
          house.depth / 2 +
          0.5;

        const bottom =
          house.z +
          house.depth / 2 -
          0.5;

        return (
          x < left + radius ||
          x > right - radius ||
          z < top + radius ||
          z > bottom - radius
        );
      }
    }

    for (const box of this.colliders) {
      if (
        box.car &&
        box.car ===
          this.activeCar
      ) {
        continue;
      }

      const cx =
        THREE.MathUtils.clamp(
          x,
          box.minX,
          box.maxX
        );

      const cz =
        THREE.MathUtils.clamp(
          z,
          box.minZ,
          box.maxZ
        );

      const dx =
        x - cx;

      const dz =
        z - cz;

      if (
        dx * dx +
          dz * dz <
        radius * radius
      ) {
        return true;
      }
    }

    return false;
  }

  update(
    dt,
    input,
    player
  ) {
    this.clock += dt;

    this.player = player;

    if (this.activeCar) {
      this.updateCar(
        dt,
        input
      );
    }

    this.updateZombies(dt);
  }

  get cameraColliders() {
    return this.scene.children.filter(
      obj =>
        obj.isMesh &&
        obj.visible
    );
  }
}