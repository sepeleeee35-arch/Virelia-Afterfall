import * as THREE from "three";

export function createWorld(scene){

  const colliders=[];
  const houses=[];
  const cars=[];
  const zombies=[];

  let insideHouse=null;
  let activeCar=null;

  const world={

    isBlocked(x,z,radius){

      if(insideHouse){

        const h=insideHouse;

        const left=h.x-3.55;
        const right=h.x+3.55;
        const top=h.z-2.55;
        const bottom=h.z+2.55;

        if(
          x<left+radius ||
          x>right-radius ||
          z<top+radius ||
          z>bottom-radius
        ){
          return true;
        }

        return false;
      }

      for(const box of colliders){

        if(box.car===activeCar){
          continue;
        }

        const cx=
          THREE.MathUtils.clamp(
            x,
            box.minX,
            box.maxX
          );

        const cz=
          THREE.MathUtils.clamp(
            z,
            box.minZ,
            box.maxZ
          );

        const dx=x-cx;
        const dz=z-cz;

        if(
          dx*dx+
          dz*dz<
          radius*radius
        ){
          return true;
        }
      }

      return false;
    },

    getContext(player){

      if(player.driving){
        return "driving";
      }

      if(insideHouse){
        return "exitHouse";
      }

      const door=
        findNearbyDoor(player);

      if(door){
        return "enterHouse";
      }

      const car=
        findNearbyCar(player);

      if(car){
        return "enterCar";
      }

      return "none";
    },

    enterNearest(player){

      if(player.driving){
        return;
      }

      if(insideHouse){
        exitHouse(player);
        return;
      }

      const door=
        findNearbyDoor(player);

      if(door){

        enterHouse(
          player,
          door
        );

        return;
      }

      const car=
        findNearbyCar(player);

      if(car){

        enterCar(
          player,
          car
        );
      }
    },

    exitNearest(player){

      if(player.driving){

        exitCar(player);
        return;
      }

      if(insideHouse){

        exitHouse(player);
      }
    },

    update(dt,player){

      if(activeCar){

        updateCar(
          dt,
          player
        );
      }

      updateZombies(
        dt,
        player
      );
    },

    playerAction(player){

      if(player.driving){
        return;
      }

      let best=null;
      let bestDistance=Infinity;

      for(const zombie of zombies){

        const dx=
          zombie.group.position.x-
          player.group.position.x;

        const dz=
          zombie.group.position.z-
          player.group.position.z;

        const distance=
          Math.hypot(dx,dz);

        if(distance<2.2){

          if(distance<bestDistance){

            best=zombie;
            bestDistance=distance;
          }
        }
      }

      if(best){

        const dx=
          best.group.position.x-
          player.group.position.x;

        const dz=
          best.group.position.z-
          player.group.position.z;

        const len=
          Math.hypot(dx,dz)||1;

        best.group.position.x+=
          dx/len*1.1;

        best.group.position.z+=
          dz/len*1.1;
      }
    }
  };

  buildGround();
  buildRoads();
  buildHouses();
  buildTrees();
  buildCars();
  buildRocks();
  buildZombies();

  return world;

  function buildGround(){

    const ground=
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          300,
          300
        ),
        new THREE.MeshStandardMaterial({
          color:0x536d4e,
          roughness:1
        })
      );

    ground.rotation.x=
      -Math.PI/2;

    ground.receiveShadow=true;

    scene.add(ground);
  }

  function buildRoads(){

    const material=
      new THREE.MeshStandardMaterial({
        color:0x35393c,
        roughness:.95
      });

    const road1=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          300,.06,12
        ),
        material
      );

    road1.position.y=.03;

    scene.add(road1);

    const road2=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          12,.06,300
        ),
        material
      );

    road2.position.y=.035;

    scene.add(road2);

    const lineMaterial=
      new THREE.MeshBasicMaterial({
        color:0xd7c477
      });

    for(
      let i=-140;
      i<=140;
      i+=18
    ){

      const a=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            8,.07,.12
          ),
          lineMaterial
        );

      a.position.set(
        i,.07,0
      );

      scene.add(a);

      const b=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            .12,.07,8
          ),
          lineMaterial
        );

      b.position.set(
        0,.07,i
      );

      scene.add(b);
    }
  }

  function buildHouses(){

    const positions=[
      [-25,-25],
      [25,-25],
      [-25,25],
      [25,25],
      [-72,-25],
      [72,-25],
      [-72,35],
      [72,35],
      [-25,72],
      [25,72]
    ];

    for(const p of positions){
      createHouse(
        p[0],
        p[1]
      );
    }
  }

  function createHouse(x,z){

    const group=
      new THREE.Group();

    group.position.set(
      x,0,z
    );

    group.userData.cameraBlocker=true;

    const wall=
      new THREE.MeshStandardMaterial({
        color:0xb8ada2,
        roughness:.9
      });

    const darkWall=
      new THREE.MeshStandardMaterial({
        color:0x77716b,
        roughness:.95
      });

    const roofMat=
      new THREE.MeshStandardMaterial({
        color:0x45494b,
        roughness:.8
      });

    const floor=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          7.8,.12,5.8
        ),
        darkWall
      );

    floor.position.y=.06;

    group.add(floor);

    const back=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          7.8,3.2,.18
        ),
        wall
      );

    back.position.set(
      0,1.65,2.8
    );

    group.add(back);

    const left=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .18,3.2,5.6
        ),
        wall
      );

    left.position.set(
      -3.8,1.65,0
    );

    group.add(left);

    const right=
      left.clone();

    right.position.x=3.8;

    group.add(right);

    const frontLeft=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          2.8,3.2,.18
        ),
        wall
      );

    frontLeft.position.set(
      -2.5,1.65,-2.8
    );

    group.add(frontLeft);

    const frontRight=
      frontLeft.clone();

    frontRight.position.x=2.5;

    group.add(frontRight);

    const roof=
      new THREE.Mesh(
        new THREE.ConeGeometry(
          5.1,1.8,4
        ),
        roofMat
      );

    roof.rotation.y=
      Math.PI/4;

    roof.position.y=4.1;

    group.add(roof);

    const door=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.25,2.1,.12
        ),
        new THREE.MeshStandardMaterial({
          color:0x4b392e,
          roughness:.9
        })
      );

    door.position.set(
      0,1.05,-2.88
    );

    group.add(door);

    const windowMat=
      new THREE.MeshStandardMaterial({
        color:0x73929f,
        metalness:.15,
        roughness:.3
      });

    for(
      const xPos of [-2.1,2.1]
    ){

      const win=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            .9,.75,.08
          ),
          windowMat
        );

      win.position.set(
        xPos,
        1.8,
        -2.9
      );

      group.add(win);
    }

    const table=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.5,.12,.8
        ),
        darkWall
      );

    table.position.set(
      1.7,.9,.8
    );

    group.add(table);

    const sofa=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.7,.6,.7
        ),
        new THREE.MeshStandardMaterial({
          color:0x4d5960,
          roughness:1
        })
      );

    sofa.position.set(
      -1.7,.35,.9
    );

    group.add(sofa);

    group.traverse(o=>{

      if(o.isMesh){

        o.castShadow=true;
        o.receiveShadow=true;
      }
    });

    scene.add(group);

    const house={
      x,
      z,
      group
    };

    houses.push(house);

    colliders.push({
      minX:x-3.95,
      maxX:x+3.95,
      minZ:z-2.95,
      maxZ:z+2.95,
      house
    });
  }

  function findNearbyDoor(player){

    let result=null;
    let best=2.2;

    for(const house of houses){

      const dx=
        player.group.position.x-
        house.x;

      const dz=
        player.group.position.z-
        (house.z-3.25);

      const distance=
        Math.hypot(dx,dz);

      if(distance<best){

        best=distance;
        result=house;
      }
    }

    return result;
  }

  function enterHouse(player,house){

    insideHouse=house;

    player.group.position.set(
      house.x,
      0,
      house.z-1.4
    );
  }

  function exitHouse(player){

    const house=insideHouse;

    if(!house){
      return;
    }

    player.group.position.set(
      house.x,
      0,
      house.z-4.2
    );

    insideHouse=null;
  }

  function buildCars(){

    const positions=[
      [-8,-6,0],
      [8,6,Math.PI],
      [-6,8,Math.PI/2],
      [6,-8,-Math.PI/2],
      [-48,0,0],
      [48,0,Math.PI]
    ];

    for(const p of positions){

      const car=
        createCar(
          p[0],
          p[1],
          p[2]
        );

      cars.push(car);

      colliders.push({
        minX:p[0]-1.4,
        maxX:p[0]+1.4,
        minZ:p[1]-2.2,
        maxZ:p[1]+2.2,
        car
      });
    }
  }

  function createCar(x,z,rotation){

    const group=
      new THREE.Group();

    group.position.set(
      x,0,z
    );

    group.rotation.y=
      rotation;

    group.userData.cameraBlocker=true;

    const body=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          2.25,.55,4
        ),
        new THREE.MeshStandardMaterial({
          color:0x52606a,
          metalness:.55,
          roughness:.45
        })
      );

    body.position.y=.55;

    const cabin=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.7,.65,1.8
        ),
        new THREE.MeshStandardMaterial({
          color:0x20282d,
          metalness:.2,
          roughness:.3
        })
      );

    cabin.position.set(
      0,1.02,.15
    );

    group.add(
      body,
      cabin
    );

    const wheelMat=
      new THREE.MeshStandardMaterial({
        color:0x151515,
        roughness:1
      });

    for(
      const p of [
        [-1.15,.37,-1.35],
        [1.15,.37,-1.35],
        [-1.15,.37,1.35],
        [1.15,.37,1.35]
      ]
    ){

      const wheel=
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            .37,.37,.24,12
          ),
          wheelMat
        );

      wheel.rotation.z=
        Math.PI/2;

      wheel.position.set(
        p[0],
        p[1],
        p[2]
      );

      group.add(wheel);
    }

    group.traverse(o=>{

      if(o.isMesh){
        o.castShadow=true;
        o.receiveShadow=true;
      }
    });

    scene.add(group);

    group.userData.speed=0;

    return group;
  }

  function findNearbyCar(player){

    let result=null;
    let best=2.8;

    for(const car of cars){

      const dx=
        player.group.position.x-
        car.position.x;

      const dz=
        player.group.position.z-
        car.position.z;

      const distance=
        Math.hypot(dx,dz);

      if(distance<best){

        best=distance;
        result=car;
      }
    }

    return result;
  }

  function enterCar(player,car){

    activeCar=car;

    player.driving=true;

    player.group.visible=false;

    player.group.position.copy(
      car.position
    );

    player.group.position.y=1;

    car.userData.speed=0;
  }

  function exitCar(player){

    if(!activeCar){
      return;
    }

    const car=activeCar;

    const forward=
      new THREE.Vector3(
        -Math.sin(car.rotation.y),
        0,
        -Math.cos(car.rotation.y)
      );

    player.group.position.copy(
      car.position
    );

    player.group.position.addScaledVector(
      forward,
      -2.8
    );

    player.group.position.y=0;

    player.group.visible=true;

    player.driving=false;

    car.userData.speed=0;

    activeCar=null;
  }

  function updateCar(dt,player){

    if(!activeCar){
      return;
    }

    const input=
      player.input.state;

    const car=activeCar;

    const forwardInput=
      -input.moveY;

    if(
      Math.abs(forwardInput)>.05
    ){

      car.userData.speed+=
        forwardInput*
        13*
        dt;

    }else{

      car.userData.speed*=
        Math.pow(.25,dt);
    }

    car.userData.speed=
      THREE.MathUtils.clamp(
        car.userData.speed,
        -5,
        11
      );

    const steer=
      input.moveX;

    const steeringStrength=
      1.8*
      Math.min(
        1,
        Math.abs(
          car.userData.speed
        )/3
      );

    car.rotation.y-=
      steer*
      steeringStrength*
      dt*
      Math.sign(
        car.userData.speed||1
      );

    const forward=
      new THREE.Vector3(
        -Math.sin(car.rotation.y),
        0,
        -Math.cos(car.rotation.y)
      );

    const nextX=
      car.position.x+
      forward.x*
      car.userData.speed*
      dt;

    const nextZ=
      car.position.z+
      forward.z*
      car.userData.speed*
      dt;

    if(
      !world.isBlocked(
        nextX,
        nextZ,
        1.2
      )
    ){

      car.position.x=nextX;
      car.position.z=nextZ;

    }else{

      car.userData.speed*=.15;
    }

    player.group.position.copy(
      car.position
    );

    player.group.position.y=1;
  }

  function buildTrees(){

    const positions=[
      [-12,-18],
      [12,-18],
      [-12,18],
      [12,18],
      [-55,-12],
      [55,-12],
      [-55,16],
      [55,16],
      [-90,-60],
      [90,-60],
      [-90,60],
      [90,60]
    ];

    for(const [x,z] of positions){

      const tree=
        new THREE.Group();

      tree.position.set(
        x,0,z
      );

      tree.userData.cameraBlocker=true;

      const trunk=
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            .22,.3,2.1,8
          ),
          new THREE.MeshStandardMaterial({
            color:0x5a3d27
          })
        );

      trunk.position.y=1.05;

      const crown=
        new THREE.Mesh(
          new THREE.SphereGeometry(
            1.25,10,8
          ),
          new THREE.MeshStandardMaterial({
            color:0x355b38
          })
        );

      crown.position.y=2.4;

      tree.add(
        trunk,
        crown
      );

      scene.add(tree);

      colliders.push({
        minX:x-.7,
        maxX:x+.7,
        minZ:z-.7,
        maxZ:z+.7
      });
    }
  }

  function buildRocks(){

    for(
      const [x,z] of [
        [-42,-38],
        [42,-38],
        [-42,38],
        [42,38],
        [-92,0],
        [92,0]
      ]
    ){

      const rock=
        new THREE.Mesh(
          new THREE.DodecahedronGeometry(
            .8,0
          ),
          new THREE.MeshStandardMaterial({
            color:0x777875
          })
        );

      rock.position.set(
        x,.5,z
      );

      rock.scale.y=.65;

      rock.userData.cameraBlocker=true;

      scene.add(rock);

      colliders.push({
        minX:x-.9,
        maxX:x+.9,
        minZ:z-.9,
        maxZ:z+.9
      });
    }
  }

  function buildZombies(){

    for(
      const [x,z] of [
        [-18,-48],
        [18,-48],
        [-48,18],
        [48,18],
        [-78,-45],
        [78,-45],
        [-78,55],
        [78,55]
      ]
    ){

      createZombie(x,z);
    }
  }

  function createZombie(x,z){

    const group=
      new THREE.Group();

    group.position.set(
      x,0,z
    );

    const bodyMat=
      new THREE.MeshStandardMaterial({
        color:0x59665b
      });

    const skinMat=
      new THREE.MeshStandardMaterial({
        color:0x879082
      });

    const body=
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .48,.65,.3
        ),
        bodyMat
      );

    body.position.y=.76;

    const head=
      new THREE.Mesh(
        new THREE.SphereGeometry(
          .22,12,10
        ),
        skinMat
      );

    head.position.y=1.32;

    group.add(
      body,
      head
    );

    group.traverse(o=>{

      if(o.isMesh){
        o.castShadow=true;
      }
    });

    scene.add(group);

    zombies.push({
      group,
      attackTimer:0
    });
  }

  function updateZombies(dt,player){

    if(
      player.driving ||
      insideHouse
    ){
      return;
    }

    for(const zombie of zombies){

      zombie.attackTimer-=dt;

      const dx=
        player.group.position.x-
        zombie.group.position.x;

      const dz=
        player.group.position.z-
        zombie.group.position.z;

      const distance=
        Math.hypot(dx,dz);

      if(
        distance<28 &&
        distance>1.5
      ){

        const nx=dx/distance;
        const nz=dz/distance;

        const speed=.75;

        const nextX=
          zombie.group.position.x+
          nx*speed*dt;

        const nextZ=
          zombie.group.position.z+
          nz*speed*dt;

        if(
          !world.isBlocked(
            nextX,
            zombie.group.position.z,
            .3
          )
        ){
          zombie.group.position.x=
            nextX;
        }

        if(
          !world.isBlocked(
            zombie.group.position.x,
            nextZ,
            .3
          )
        ){
          zombie.group.position.z=
            nextZ;
        }

        zombie.group.rotation.y=
          Math.atan2(nx,nz);

      }else if(
        distance<=1.5 &&
        zombie.attackTimer<=0
      ){

        player.damage(4);

        zombie.attackTimer=1.3;
      }
    }
  }
}