import * as THREE from "three";
import { Bot } from "./bot.js";

export class World {
  constructor(scene) {
    this.scene = scene;

    this.colliders = [];
    this.cameraMeshes = [];

    this.houses = [];
    this.cars = [];
    this.bots = [];
    this.trees = [];
    this.rocks = [];

    this.insideHouse = false;
    this.currentHouse = null;
    this.activeCar = null;

    this.player = null;

    this.buildWorld();
    this.buildHouses();
    this.buildCars();
    this.buildEnvironment();
    this.buildBots();
  }

  // =========================
  // MATERIAL
  // =========================

  mat(color, roughness = 0.8) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness
    });
  }

  // =========================
  // WORLD
  // =========================

  buildWorld() {
    const groundMat = this.mat(0x536b43);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(220, 0.4, 220),
      groundMat
    );

    ground.position.y = -0.2;
    ground.receiveShadow = true;

    this.scene.add(ground);

    // Roads
    const roadMat = this.mat(0x303236);

    this.makeRoad(0, 0, 220, 16, roadMat);
    this.makeRoad(0, 55, 220, 14, roadMat);
    this.makeRoad(0, -55, 220, 14, roadMat);
    this.makeRoad(55, 0, 14, 220, roadMat);
    this.makeRoad(-55, 0, 14, 220, roadMat);

    // Road markings
    const markMat = this.mat(0xd8d8b0);

    for (let x = -100; x <= 100; x += 12) {
      this.makeBox(
        3,
        0.04,
        0.35,
        x,
        0.02,
        0,
        markMat
      );
    }

    for (let z = -100; z <= 100; z += 12) {
      this.makeBox(
        0.35,
        0.04,
        3,
        0,
        0.02,
        z,
        markMat
      );
    }
  }

  makeRoad(x, z, width, depth, material) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.08, depth),
      material
    );

    road.position.set(x, 0.02, z);
    road.receiveShadow = true;

    this.scene.add(road);
  }

  makeBox(
    sx,
    sy,
    sz,
    x,
    y,
    z,
    material,
    collider = false
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);

    if (collider) {
      this.colliders.push({
        minX: x - sx / 2,
        maxX: x + sx / 2,
        minZ: z - sz / 2,
        maxZ: z + sz / 2
      });
    }

    return mesh;
  }

  // =========================
  // HOUSES
  // =========================

  buildHouses() {
    const positions = [
      [-35, -35],
      [35, -35],
      [-35, 35],
      [35, 35],
      [-82, -35],
      [82, -35],
      [-82, 35],
      [82, 35],
      [-35, -82],
      [35, -82],
      [-35, 82],
      [35, 82]
    ];

    positions.forEach(([x, z], index) => {
      this.createHouse(x, z, index);
    });
  }

  createHouse(x, z, id) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const wallMat = this.mat(0x8a8176);
    const roofMat = this.mat(0x403c38);
    const floorMat = this.mat(0x62584e);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 16),
      floorMat
    );

    floor.position.y = 0.15;
    group.add(floor);

    // Back wall
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(20, 5, 0.5),
      wallMat
    );

    back.position.set(0, 2.5, -8);
    group.add(back);

    // Left wall
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5, 16),
      wallMat
    );

    left.position.set(-10, 2.5, 0);
    group.add(left);

    // Right wall
    const right = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 5, 16),
      wallMat
    );

    right.position.set(10, 2.5, 0);
    group.add(right);

    // Front walls with door gap
    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 0.5),
      wallMat
    );

    frontLeft.position.set(-6.5, 2.5, 8);
    group.add(frontLeft);

    const frontRight = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 0.5),
      wallMat
    );

    frontRight.position.set(6.5, 2.5, 8);
    group.add(frontRight);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(21, 0.6, 17),
      roofMat
    );

    roof.position.y = 5.3;
    group.add(roof);

    // Door
    const doorMat = this.mat(0x49352a);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 3.6, 0.15),
      doorMat
    );

    door.position.set(0, 1.8, 7.85);
    group.add(door);

    // Interior furniture
    const bed = this.makeBox(
      5,
      0.8,
      2.5,
      x - 5,
      0.6,
      z - 4,
      this.mat(0x6e7890)
    );

    const table = this.makeBox(
      2.5,
      1.2,
      2,
      x + 5,
      0.7,
      z - 3,
      this.mat(0x5b4030)
    );

    // House collider
    this.colliders.push({
      minX: x - 10,
      maxX: x + 10,
      minZ: z - 8,
      maxZ: z + 8,
      doorGap: true,
      doorX: x,
      doorZ: z + 8
    });

    this.cameraMeshes.push(
      back,
      left,
      right,
      frontLeft,
      frontRight
    );

    group.userData.houseId = id;

    this.scene.add(group);

    this.houses.push({
      id,
      group,
      x,
      z,
      inside: false
    });

    // Furniture shouldn't block the player
    bed.userData.decorative = true;
    table.userData.decorative = true;
  }

  // =========================
  // CARS
  // =========================

  buildCars() {
    const locations = [
      [-18, 8],
      [18, -8],
      [48, 18],
      [-48, -18],
      [72, 55],
      [-72, -55]
    ];

    locations.forEach(([x, z], index) => {
      this.createCar(x, z, index);
    });
  }

  createCar(x, z, id) {
    const group = new THREE.Group();

    const bodyMat = this.mat(
      id % 2 === 0 ? 0x485b68 : 0x7a4e3f
    );

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.1, 7),
      bodyMat
    );

    body.position.y = 0.9;
    group.add(body);

    const cabinMat = this.mat(0x252c32);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.1, 3.5),
      cabinMat
    );

    cabin.position.y = 1.8;
    group.add(cabin);

    // Wheels
    const wheelMat = this.mat(0x171717);

    const wheelPositions = [
      [-2, 0.5, -2.3],
      [2, 0.5, -2.3],
      [-2, 0.5, 2.3],
      [2, 0.5, 2.3]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.55,
          0.55,
          0.35,
          10
        ),
        wheelMat
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);

      group.add(wheel);
    });

    group.position.set(x, 0, z);

    this.scene.add(group);

    this.cars.push({
      id,
      group,
      x,
      z,
      occupied: false,
      speed: 0,
      rotation: 0
    });
  }

  // =========================
  // ENVIRONMENT
  // =========================

  buildEnvironment() {
    const treeMat = this.mat(0x2f6134);
    const trunkMat = this.mat(0x5b4030);
    const rockMat = this.mat(0x555555);

    // Trees
    const treePositions = [
      [-90, -90],
      [-70, -90],
      [-50, -90],
      [50, -90],
      [70, -90],
      [90, -90],
      [-90, 90],
      [-70, 90],
      [-50, 90],
      [50, 90],
      [70, 90],
      [90, 90],
      [-90, 20],
      [90, 20],
      [-90, -20],
      [90, -20]
    ];

    treePositions.forEach(([x, z]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.35,
          0.45,
          3,
          7
        ),
        trunkMat
      );

      trunk.position.set(x, 1.5, z);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 8, 8),
        treeMat
      );

      crown.position.set(x, 4, z);

      this.scene.add(trunk);
      this.scene.add(crown);

      this.trees.push({
        trunk,
        crown
      });

      this.colliders.push({
        minX: x - 0.7,
        maxX: x + 0.7,
        minZ: z - 0.7,
        maxZ: z + 0.7
      });
    });

    // Rocks
    for (let i = 0; i < 10; i++) {
      const x = THREE.MathUtils.randFloatSpread(190);
      const z = THREE.MathUtils.randFloatSpread(190);

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          THREE.MathUtils.randFloat(0.4, 1.1)
        ),
        rockMat
      );

      rock.position.set(x, 0.5, z);

      this.scene.add(rock);
      this.rocks.push(rock);
    }
  }

  // =========================
  // BOTS
  // =========================

  buildBots() {
    const positions = [
      [-60, -40],
      [60, -40],
      [-60, 40],
      [60, 40],
      [-20, 65],
      [20, -65],
      [80, 20],
      [-80, -20]
    ];

    positions.forEach(([x, z]) => {
      const bot = new Bot(
        this.scene,
        this,
        {
          x,
          z
        }
      );

      this.bots.push(bot);
    });
  }

  // =========================
  // COLLISION
  // =========================

  isBlocked(x, z, radius = 0.6) {
    for (const c of this.colliders) {
      if (
        c.doorGap &&
        Math.abs(z - c.doorZ) < 1.7 &&
        Math.abs(x - c.doorX) < 2
      ) {
        continue;
      }

      if (
        x > c.minX - radius &&
        x < c.maxX + radius &&
        z > c.minZ - radius &&
        z < c.maxZ + radius
      ) {
        return true;
      }
    }

    return false;
  }

  // =========================
  // DOOR
  // =========================

  findNearbyDoor(player) {
    if (!player?.group) return null;

    const p = player.group.position;

    for (const house of this.houses) {
      const dx = p.x - house.x;
      const dz = p.z - (house.z + 8);

      if (Math.hypot(dx, dz) < 4) {
        return house;
      }
    }

    return null;
  }

  tryEnterNearby(player) {
    const house = this.findNearbyDoor(player);

    if (!house) return false;

    this.insideHouse = true;
    this.currentHouse = house;

    player.group.position.set(
      house.x,
      0,
      house.z + 4
    );

    return true;
  }

  exitHouse(player) {
    if (!this.insideHouse || !this.currentHouse) {
      return false;
    }

    const house = this.currentHouse;

    player.group.position.set(
      house.x,
      0,
      house.z + 10
    );

    this.insideHouse = false;
    this.currentHouse = null;

    return true;
  }

  // =========================
  // CAR
  // =========================

  findNearbyCar(player) {
    if (!player?.group) return null;

    const p = player.group.position;

    let nearest = null;
    let distance = 4;

    for (const car of this.cars) {
      if (car.occupied) continue;

      const d = Math.hypot(
        p.x - car.group.position.x,
        p.z - car.group.position.z
      );

      if (d < distance) {
        distance = d;
        nearest = car;
      }
    }

    return nearest;
  }

  enterCar(player) {
    const car = this.findNearbyCar(player);

    if (!car) return false;

    this.activeCar = car;
    car.occupied = true;

    player.driving = true;

    player.group.visible = false;

    return true;
  }

  exitCar(player) {
    if (!this.activeCar) return false;

    const car = this.activeCar;

    player.group.visible = true;

    player.driving = false;

    player.group.position.set(
      car.group.position.x + 4,
      0,
      car.group.position.z
    );

    car.occupied = false;

    this.activeCar = null;

    return true;
  }

  // =========================
  // ACTION
  // =========================

  playerAction() {
    // Sengaja kosong untuk sekarang.
    // Sistem combat aman akan ditambahkan setelah
    // movement, bot, map dan inventory stabil.
  }

  // =========================
  // UPDATE
  // =========================

  update(dt, input, player) {
    this.player = player;

    // Vehicle
    if (this.activeCar && player?.driving) {
      const car = this.activeCar;

      let throttle = 0;

      if (input.forward) throttle += 1;
      if (input.backward) throttle -= 1;

      car.speed += throttle * 12 * dt;

      car.speed *= Math.pow(0.04, dt);

      car.speed = THREE.MathUtils.clamp(
        car.speed,
        -8,
        18
      );

      if (Math.abs(car.speed) > 0.1) {
        if (input.left) {
          car.group.rotation.y +=
            1.7 * dt * Math.sign(car.speed);
        }

        if (input.right) {
          car.group.rotation.y -=
            1.7 * dt * Math.sign(car.speed);
        }
      }

      const direction = new THREE.Vector3(
        0,
        0,
        -1
      );

      direction.applyQuaternion(
        car.group.quaternion
      );

      const nx =
        car.group.position.x +
        direction.x *
        car.speed *
        dt;

      const nz =
        car.group.position.z +
        direction.z *
        car.speed *
        dt;

      if (!this.isBlocked(nx, nz, 2)) {
        car.group.position.x = nx;
        car.group.position.z = nz;
      }

      player.group.position.copy(
        car.group.position
      );

      player.group.position.y = 0;
    }

    // Bots
    for (const bot of this.bots) {
      bot.update(dt);
    }
  }

  // =========================
  // CAMERA COLLISION
  // =========================

  get cameraColliders() {
    return this.cameraMeshes;
  }
}