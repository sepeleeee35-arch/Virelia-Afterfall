import * as THREE from "three";

export function createWorld(scene){

  const colliders = [];
  const zombies = [];
  const cars = [];

  const world = {

    isBlocked(x,z,radius){

      for(const box of colliders){

        const closestX =
          THREE.MathUtils.clamp(
            x,
            box.minX,
            box.maxX
          );

        const closestZ =
          THREE.MathUtils.clamp(
            z,
            box.minZ,
            box.maxZ
          );

        const dx = x - closestX;
        const dz = z - closestZ;

        if(
          dx * dx +
          dz * dz <
          radius * radius
        ){
          return true;
        }
      }

      return false;
    },

    update(dt,player){

      for(const zombie of zombies){

        zombie.attackTimer -= dt;

        const dx =
          player.group.position.x -
          zombie.group.position.x;

        const dz =
          player.group.position.z -
          zombie.group.position.z;

        const distance =
          Math.hypot(dx,dz);

        if(
          distance < 30 &&
          distance > 1.55
        ){

          const nx = dx / distance;
          const nz = dz / distance;

          const speed = .9;

          const nextX =
            zombie.group.position.x +
            nx * speed * dt;

          const nextZ =
            zombie.group.position.z +
            nz * speed * dt;

          if(
            !world.isBlocked(
              nextX,
              zombie.group.position.z,
              .32
            )
          ){

            zombie.group.position.x =
              nextX;
          }

          if(
            !world.isBlocked(
              zombie.group.position.x,
              nextZ,
              .32
            )
          ){

            zombie.group.position.z =
              nextZ;
          }

          zombie.group.rotation.y =
            Math.atan2(nx,nz);

        }else if(distance <= 1.55){

          zombie.group.rotation.y =
            Math.atan2(dx,dz);

          if(zombie.attackTimer <= 0){

            player.damage(5);

            zombie.attackTimer = 1.2;
          }
        }
      }
    },

    playerAction(player){

      let closest = null;
      let closestDistance = Infinity;

      const playerPosition =
        player.group.position;

      const forward =
        new THREE.Vector3(
          Math.sin(player.group.rotation.y),
          0,
          Math.cos(player.group.rotation.y)
        );

      for(const zombie of zombies){

        const direction =
          zombie.group.position
            .clone()
            .sub(playerPosition);

        direction.y = 0;

        const distance =
          direction.length();

        if(
          distance > 2.3 ||
          distance < .1
        ){
          continue;
        }

        direction.normalize();

        const facing =
          forward.dot(direction);

        if(
          facing < .15
        ){
          continue;
        }

        if(
          distance < closestDistance
        ){

          closest = zombie;
          closestDistance = distance;
        }
      }

      if(closest){

        const knock =
          new THREE.Vector3(
            Math.sin(player.group.rotation.y),
            0,
            Math.cos(player.group.rotation.y)
          );

        closest.group.position.addScaledVector(
          knock,
          .9
        );
      }
    }
  };

  createGround();
  createRoads();
  createHouses();
  createTrees();
  createRocks();
  createCars();
  createZombies();

  return world;

  function createGround(){

    const ground =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          280,
          280
        ),
        new THREE.MeshStandardMaterial({
          color:0x536c4b,
          roughness:1
        })
      );

    ground.rotation.x =
      -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);
  }

  function createRoads(){

    const roadMaterial =
      new THREE.MeshStandardMaterial({
        color:0x363a3d,
        roughness:.9
      });

    const roadA =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          280,
          .06,
          11
        ),
        roadMaterial
      );

    roadA.position.y = .03;

    scene.add(roadA);

    const roadB =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          11,
          .06,
          280
        ),
        roadMaterial
      );

    roadB.position.y = .035;

    scene.add(roadB);

    const lineMaterial =
      new THREE.MeshBasicMaterial({
        color:0xd4c47a
      });

    for(
      let i = -130;
      i <= 130;
      i += 16
    ){

      const line =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            7,
            .065,
            .12
          ),
          lineMaterial
        );

      line.position.set(
        i,
        .065,
        0
      );

      scene.add(line);

      const line2 =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            .12,
            .065,
            7
          ),
          lineMaterial
        );

      line2.position.set(
        0,
        .065,
        i
      );

      scene.add(line2);
    }
  }

  function createHouse(x,z,rotation=0){

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.rotation.y =
      rotation;

    group.userData.cameraBlocker = true;

    const wallMaterial =
      new THREE.MeshStandardMaterial({
        color:0xb5aaa0,
        roughness:.85
      });

    const roofMaterial =
      new THREE.MeshStandardMaterial({
        color:0x45484a,
        roughness:.8
      });

    const windowMaterial =
      new THREE.MeshStandardMaterial({
        color:0x7695a2,
        roughness:.25,
        metalness:.1
      });

    const base =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          8,
          .35,
          6
        ),
        wallMaterial
      );

    base.position.y = .18;

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          7.6,
          3.2,
          5.6
        ),
        wallMaterial
      );

    body.position.y = 1.75;

    const roof =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          5.4,
          2.1,
          4
        ),
        roofMaterial
      );

    roof.rotation.y =
      Math.PI / 4;

    roof.position.y = 4.4;

    group.add(
      base,
      body,
      roof
    );

    const door =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.15,
          2.0,
          .12
        ),
        new THREE.MeshStandardMaterial({
          color:0x46372d,
          roughness:.9
        })
      );

    door.position.set(
      0,
      1.05,
      -2.86
    );

    group.add(door);

    const windows = [
      [-2.1,1.8,-2.87],
      [2.1,1.8,-2.87],
      [-3.87,1.8,0],
      [3.87,1.8,0]
    ];

    for(const p of windows){

      const windowMesh =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            .95,
            .8,
            .08
          ),
          windowMaterial
        );

      windowMesh.position.set(
        p[0],
        p[1],
        p[2]
      );

      if(Math.abs(p[0]) > 3){

        windowMesh.rotation.y =
          Math.PI / 2;
      }

      group.add(windowMesh);
    }

    group.traverse(object=>{

      if(object.isMesh){

        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    scene.add(group);

    addBoxCollider(
      x,
      z,
      4.1,
      3.1
    );
  }

  function createHouses(){

    createHouse(-25,-25);
    createHouse(25,-25);
    createHouse(-25,25);
    createHouse(25,25);

    createHouse(-72,-25);
    createHouse(72,-25);

    createHouse(-72,30);
    createHouse(72,30);

    createHouse(-25,72);
    createHouse(25,72);

    createHouse(-25,-72);
    createHouse(25,-72);
  }

  function createTree(x,z,scale=1){

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.scale.setScalar(scale);

    group.userData.cameraBlocker = true;

    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          .22,
          .3,
          2.1,
          8
        ),
        new THREE.MeshStandardMaterial({
          color:0x5a3d27,
          roughness:1
        })
      );

    trunk.position.y = 1.05;

    const crown =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.25,
          10,
          8
        ),
        new THREE.MeshStandardMaterial({
          color:0x355a36,
          roughness:1
        })
      );

    crown.position.y = 2.45;

    group.add(
      trunk,
      crown
    );

    group.traverse(object=>{

      if(object.isMesh){

        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    scene.add(group);

    colliders.push({
      minX:x-.65*scale,
      maxX:x+.65*scale,
      minZ:z-.65*scale,
      maxZ:z+.65*scale
    });
  }

  function createTrees(){

    const positions = [
      [-12,-18,1],
      [12,-18,.9],
      [-12,18,1],
      [12,18,1],
      [-55,-12,1.2],
      [55,-12,1],
      [-55,15,1],
      [55,15,1.1],
      [-88,-65,1.3],
      [88,-65,1.2],
      [-88,65,1.1],
      [88,65,1.3],
      [-15,-95,1],
      [15,-95,1],
      [-15,95,1],
      [15,95,1]
    ];

    for(const p of positions){

      createTree(
        p[0],
        p[1],
        p[2]
      );
    }
  }

  function createRocks(){

    const rockMaterial =
      new THREE.MeshStandardMaterial({
        color:0x777875,
        roughness:1
      });

    const positions = [
      [-42,-38],
      [42,-38],
      [-42,38],
      [42,38],
      [-95,-10],
      [95,10],
      [-95,50],
      [95,-50]
    ];

    for(const [x,z] of positions){

      const rock =
        new THREE.Mesh(
          new THREE.DodecahedronGeometry(
            .8,
            0
          ),
          rockMaterial
        );

      rock.position.set(
        x,
        .55,
        z
      );

      rock.scale.y = .65;

      rock.castShadow = true;

      rock.userData.cameraBlocker = true;

      scene.add(rock);

      colliders.push({
        minX:x-.9,
        maxX:x+.9,
        minZ:z-.9,
        maxZ:z+.9
      });
    }
  }

  function createCars(){

    const carPositions = [
      [-8,-5,0],
      [8,5,Math.PI],
      [-5,8,Math.PI/2],
      [5,-8,-Math.PI/2],
      [-48,0,0],
      [48,0,Math.PI]
    ];

    for(const p of carPositions){

      const car =
        createCar(
          p[0],
          p[1],
          p[2]
        );

      cars.push(car);

      colliders.push({
        minX:p[0]-1.35,
        maxX:p[0]+1.35,
        minZ:p[1]-2.2,
        maxZ:p[1]+2.2
      });
    }
  }

  function createCar(x,z,rotation){

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.rotation.y =
      rotation;

    group.userData.cameraBlocker = true;

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          2.3,
          .55,
          4
        ),
        new THREE.MeshStandardMaterial({
          color:0x4d5960,
          metalness:.55,
          roughness:.45
        })
      );

    body.position.y = .55;

    const cabin =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.75,
          .65,
          1.8
        ),
        new THREE.MeshStandardMaterial({
          color:0x252c31,
          metalness:.2,
          roughness:.35
        })
      );

    cabin.position.set(
      0,
      1.05,
      .1
    );

    group.add(
      body,
      cabin
    );

    const wheelMaterial =
      new THREE.MeshStandardMaterial({
        color:0x151515,
        roughness:1
      });

    const wheelPositions = [
      [-1.15,.38,-1.35],
      [1.15,.38,-1.35],
      [-1.15,.38,1.35],
      [1.15,.38,1.35]
    ];

    for(const p of wheelPositions){

      const wheel =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            .38,
            .38,
            .25,
            12
          ),
          wheelMaterial
        );

      wheel.rotation.z =
        Math.PI / 2;

      wheel.position.set(
        p[0],
        p[1],
        p[2]
      );

      group.add(wheel);
    }

    group.traverse(object=>{

      if(object.isMesh){

        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    scene.add(group);

    return group;
  }

  function createZombies(){

    const positions = [
      [-18,-48],
      [18,-48],
      [-48,18],
      [48,18],
      [-78,-45],
      [78,-45],
      [-78,55],
      [78,55]
    ];

    for(const [x,z] of positions){

      zombies.push(
        createZombie(x,z)
      );
    }
  }

  function createZombie(x,z){

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    group.userData.cameraBlocker = false;

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color:0x59665b,
        roughness:1
      });

    const skinMaterial =
      new THREE.MeshStandardMaterial({
        color:0x879082,
        roughness:1
      });

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .48,
          .65,
          .3
        ),
        bodyMaterial
      );

    body.position.y = .76;

    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          .22,
          12,
          10
        ),
        skinMaterial
      );

    head.position.y = 1.32;

    const leftArm =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .14,
          .62,
          .14
        ),
        bodyMaterial
      );

    leftArm.position.set(
      -.36,
      .76,
      0
    );

    leftArm.rotation.z = -.08;

    const rightArm =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .14,
          .62,
          .14
        ),
        bodyMaterial
      );

    rightArm.position.set(
      .36,
      .76,
      0
    );

    rightArm.rotation.z = .08;

    const leftLeg =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .16,
          .48,
          .18
        ),
        bodyMaterial
      );

    leftLeg.position.set(
      -.14,
      .28,
      0
    );

    const rightLeg =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .16,
          .48,
          .18
        ),
        bodyMaterial
      );

    rightLeg.position.set(
      .14,
      .28,
      0
    );

    group.add(
      body,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg
    );

    group.traverse(object=>{

      if(object.isMesh){

        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    scene.add(group);

    return {
      group,
      attackTimer:0
    };
  }

  function addBoxCollider(
    x,
    z,
    halfX,
    halfZ
  ){

    colliders.push({
      minX:x-halfX,
      maxX:x+halfX,
      minZ:z-halfZ,
      maxZ:z+halfZ
    });
  }
}