import * as THREE from "three";

export class World {
  constructor(scene) {
    this.scene = scene;

    this.colliders = [];
    this.cameraMeshes = [];
    this.houses = [];
    this.cars = [];
    this.bots = [];

    this.insideHouse = false;
    this.currentHouse = null;
    this.activeCar = null;

    this.buildWorld();
  }

  buildWorld() {
    // GROUND
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(220, 0.4, 220),
      new THREE.MeshStandardMaterial({
        color: 0x526b45
      })
    );

    ground.position.y = -0.2;
    this.scene.add(ground);

    // ROAD
    const roadMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x303236
      });

    const road1 = new THREE.Mesh(
      new THREE.BoxGeometry(220, 0.1, 16),
      roadMaterial
    );

    road1.position.y = 0.02;
    this.scene.add(road1);

    const road2 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.1, 220),
      roadMaterial
    );

    road2.position.y = 0.025;
    this.scene.add(road2);

    // HOUSES
    const positions = [
      [-35, -35],
      [35, -35],
      [-35, 35],
      [35, 35]
    ];

    for (const [x, z] of positions) {
      this.createHouse(x, z);
    }

    // CARS
    this.createCar(-18, 8);
    this.createCar(18, -8);

    console.log("WORLD OK");
  }

  createHouse(x, z) {
    const material =
      new THREE.MeshStandardMaterial({
        color: 0x81766b
      });

    const house = new THREE.Mesh(
      new THREE.BoxGeometry(18, 6, 14),
      material
    );

    house.position.set(x, 3, z);

    this.scene.add(house);

    this.houses.push({
      group: house,
      x,
      z
    });

    this.cameraMeshes.push(house);

    this.colliders.push({
      minX: x - 9,
      maxX: x + 9,
      minZ: z - 7,
      maxZ: z + 7
    });
  }

  createCar(x, z) {
    const material =
      new THREE.MeshStandardMaterial({
        color: 0x4d5965
      });

    const car = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 7),
      material
    );

    car.position.set(x, 0.7, z);

    this.scene.add(car);

    this.cars.push({
      group: car,
      occupied: false
    });
  }

  isBlocked(x, z, radius = 0.6) {
    for (const c of this.colliders) {
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

  findNearbyDoor(player) {
    return null;
  }

  tryEnterNearby(player) {
    return false;
  }

  exitHouse(player) {
    return false;
  }

  findNearbyCar(player) {
    if (!player?.group) return null;

    let nearest = null;
    let nearestDistance = 4;

    for (const car of this.cars) {
      if (car.occupied) continue;

      const dx =
        player.group.position.x -
        car.group.position.x;

      const dz =
        player.group.position.z -
        car.group.position.z;

      const distance = Math.hypot(dx, dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
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

  playerAction() {}

  update(dt, input, player) {
    if (this.activeCar && player?.driving) {
      player.group.position.copy(
        this.activeCar.group.position
      );
    }
  }

  get cameraColliders() {
    return this.cameraMeshes;
  }
}