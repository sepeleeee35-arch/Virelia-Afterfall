import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

const canvas = document.getElementById("game");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87948b);
scene.fog = new THREE.Fog(0x87948b, 80, 260);

const camera = new THREE.PerspectiveCamera(
  58,
  innerWidth / innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;

const ambient = new THREE.HemisphereLight(
  0xcbd8d0,
  0x30352f,
  2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffe5bd,
  2
);

sun.position.set(80,120,50);
scene.add(sun);

const player = {
  pos: new THREE.Vector3(0,1,18),
  speed: 7,
  hp: 100,
  hunger: 100,
  car: null,
  mesh: null
};

const cameraTarget = new THREE.Vector3();
const obstacles = [];
const cars = [];
const zombies = [];
const buildings = [];

let mode = "outside";
let inside = null;
let cameraYaw = 0;
let last = performance.now();

const joy = {
  x: 0,
  y: 0,
  active: false
};

const keys = {};

const mats = {
  ground: new THREE.MeshLambertMaterial({color:0x3d513d}),
  road: new THREE.MeshLambertMaterial({color:0x303238}),
  line: new THREE.MeshBasicMaterial({color:0xc8b85f}),
  wall: new THREE.MeshLambertMaterial({color:0x77776f}),
  roof: new THREE.MeshLambertMaterial({color:0x40423f}),
  window: new THREE.MeshLambertMaterial({color:0x263d42}),
  tree: new THREE.MeshLambertMaterial({color:0x315936}),
  trunk: new THREE.MeshLambertMaterial({color:0x65472f}),
  carRed: new THREE.MeshLambertMaterial({color:0x913838}),
  carBlue: new THREE.MeshLambertMaterial({color:0x56636b}),
  carYellow: new THREE.MeshLambertMaterial({color:0x9b8334}),
  zombieBody: new THREE.MeshLambertMaterial({color:0x526451}),
  zombieHead: new THREE.MeshLambertMaterial({color:0x8b947c}),
  playerBody: new THREE.MeshLambertMaterial({color:0x38484b}),
  skin: new THREE.MeshLambertMaterial({color:0xb89a7d}),
  dark: new THREE.MeshLambertMaterial({color:0x202526})
};

function box(w,h,d,mat) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    mat
  );
}

function addGround() {
  const g = box(240,0.5,180,mats.ground);
  g.position.y = -0.25;
  scene.add(g);
}

function addRoad(x,z,w,d) {
  const road = box(w,0.12,d,mats.road);
  road.position.set(x,0,z);
  scene.add(road);

  if (w > d) {
    for(let i=-w/2+8;i<w/2;i+=12) {
      const line = box(5,0.03,0.35,mats.line);
      line.position.set(x+i,0.08,z);
      scene.add(line);
    }
  } else {
    for(let i=-d/2+8;i<d/2;i+=12) {
      const line = box(0.35,0.03,5,mats.line);
      line.position.set(x,0.08,z+i);
      scene.add(line);
    }
  }
}

function addBuilding(x,z,w,d,h) {
  const group = new THREE.Group();

  const body = box(w,h,d,mats.wall);
  body.position.y = h/2;
  group.add(body);

  const roof = box(w+1,0.7,d+1,mats.roof);
  roof.position.y = h+0.35;
  group.add(roof);

  for(let i=0;i<4;i++) {
    const win = box(5,5,0.3,mats.window);
    win.position.set(
      -w/2+10+i*(w-20)/3,
      h*0.62,
      d/2+0.18
    );
    group.add(win);
  }

  const door = box(4,7,0.35,mats.dark);
  door.position.set(0,3.5,d/2+0.2);
  group.add(door);

  group.position.set(x,0,z);
  scene.add(group);

  const data = {
    x,
    z,
    w,
    d,
    h,
    group
  };

  buildings.push(data);

  obstacles.push({
    x1:x-w/2,
    x2:x+w/2,
    z1:z-d/2,
    z2:z+d/2
  });
}

function addTree(x,z) {
  const group = new THREE.Group();

  const trunk = box(1.2,4,1.2,mats.trunk);
  trunk.position.y=2;
  group.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(3.2,8,6),
    mats.tree
  );

  crown.position.y=5;
  group.add(crown);

  group.position.set(x,0,z);
  scene.add(group);

  obstacles.push({
    x1:x-2.5,
    x2:x+2.5,
    z1:z-2.5,
    z2:z+2.5
  });
}

function createPlayer() {
  const group = new THREE.Group();

  const body = box(1.3,2,0.8,mats.playerBody);
  body.position.y=2.2;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.58,10,8),
    mats.skin
  );

  head.position.y=3.65;
  group.add(head);

  const leg1 = box(0.38,1.4,0.4,mats.dark);
  leg1.position.set(-0.3,0.7,0);
  group.add(leg1);

  const leg2 = box(0.38,1.4,0.4,mats.dark);
  leg2.position.set(0.3,0.7,0);
  group.add(leg2);

  group.position.copy(player.pos);
  scene.add(group);

  player.mesh=group;
}

function createCar(x,z,mat,rot=0) {
  const group = new THREE.Group();

  const body = box(5.2,1.2,2.5,mat);
  body.position.y=1.1;
  group.add(body);

  const cabin = box(2.6,1.1,2.0,mats.window);
  cabin.position.set(-0.2,2,0);
  group.add(cabin);

  const bumper = box(0.35,0.5,2.7,mats.dark);
  bumper.position.set(2.75,0.75,0);
  group.add(bumper);

  group.position.set(x,0,z);
  group.rotation.y=rot;
  scene.add(group);

  const car={
    group,
    x,
    z,
    rot,
    occupied:false
  };

  cars.push(car);
  return car;
}

function createZombie(x,z) {
  const group = new THREE.Group();

  const body = box(1.1,2,0.8,mats.zombieBody);
  body.position.y=1.6;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.48,8,6),
    mats.zombieHead
  );

  head.position.y=3;
  group.add(head);

  group.position.set(x,0,z);
  scene.add(group);

  zombies.push({
    group,
    x,
    z,
    speed:1.3
  });
}

function buildCity() {
  addGround();

  addRoad(0,0,240,12);
  addRoad(0,-55,240,12);
  addRoad(0,55,240,12);

  addRoad(-75,0,12,180);
  addRoad(0,0,12,180);
  addRoad(75,0,12,180);

  const spots=[
    [-100,-78,24,18,10],
    [-35,-78,30,18,12],
    [35,-78,30,18,11],
    [100,-78,24,18,10],

    [-100,-35,24,18,11],
    [-35,-35,30,18,13],
    [35,-35,30,18,12],
    [100,-35,24,18,11],

    [-100,35,24,18,11],
    [-35,35,30,18,12],
    [35,35,30,18,13],
    [100,35,24,18,10],

    [-100,78,24,18,10],
    [-35,78,30,18,12],
    [35,78,30,18,11],
    [100,78,24,18,10]
  ];

  for(const s of spots) {
    addBuilding(...s);
  }

  const treeSpots=[
    [-112,-65],[-55,-65],[55,-65],[112,-65],
    [-112,-20],[112,-20],
    [-112,20],[112,20],
    [-112,65],[-55,65],[55,65],[112,65]
  ];

  for(const p of treeSpots) addTree(...p);

  createCar(-50,-6,mats.carRed,Math.PI/2);
  createCar(48,-6,mats.carBlue,Math.PI/2);
  createCar(-20,55,mats.carYellow,0);
  createCar(25,-55,mats.carBlue,0);
  createCar(92,15,mats.carRed,Math.PI/2);

  createZombie(-30,7);
  createZombie(30,7);
  createZombie(-65,12);
  createZombie(65,-12);
  createZombie(0,-35);
  createZombie(0,35);
}

function collides(x,z,r=0.8,ignore=null) {
  for(const o of obstacles) {
    if(
      x+r>o.x1 &&
      x-r<o.x2 &&
      z+r>o.z1 &&
      z-r<o.z2
    ) return true;
  }

  for(const c of cars) {
    if(c===ignore) continue;

    if(
      Math.hypot(
        x-c.group.position.x,
        z-c.group.position.z
      ) < 4
    ) return true;
  }

  return false;
}

function movePlayer(dx,dz) {
  const nx=player.pos.x+dx;
  const nz=player.pos.z+dz;

  if(!collides(nx,player.pos.z,0.7,player.car)) {
    player.pos.x=nx;
  }

  if(!collides(player.pos.x,nz,0.7,player.car)) {
    player.pos.z=nz;
  }

  if(player.mesh) {
    player.mesh.position.copy(player.pos);

    if(Math.hypot(dx,dz)>0.01) {
      player.mesh.rotation.y=Math.atan2(dx,dz);
    }
  }
}

function moveCar(dx,dz) {
  const c=player.car;
  if(!c) return;

  const nx=c.group.position.x+dx;
  const nz=c.group.position.z+dz;

  if(
    Math.abs(nx)>115 ||
    Math.abs(nz)>85
  ) return;

  if(collides(nx,nz,2.2,c)) return;

  c.group.position.x=nx;
  c.group.position.z=nz;

  player.pos.x=nx;
  player.pos.z=nz;

  if(Math.hypot(dx,dz)>0.1) {
    c.group.rotation.y=Math.atan2(dx,dz);
  }
}

function nearestCar() {
  let best=null;
  let dist=5;

  for(const c of cars) {
    if(c.occupied) continue;

    const d=Math.hypot(
      player.pos.x-c.group.position.x,
      player.pos.z-c.group.position.z
    );

    if(d<dist) {
      dist=d;
      best=c;
    }
  }

  return best;
}

function nearestBuilding() {
  let best=null;
  let dist=4;

  for(const b of buildings) {
    const d=Math.hypot(
      player.pos.x-b.x,
      player.pos.z-(b.z+b.d/2+3)
    );

    if(d<dist) {
      dist=d;
      best=b;
    }
  }

  return best;
}

function enterCar(c) {
  if(!c) return;

  c.occupied=true;
  player.car=c;
  player.mesh.visible=false;
}

function exitCar() {
  const c=player.car;
  if(!c) return;

  const angle=c.group.rotation.y;

  const x=c.group.position.x+Math.sin(angle)*5;
  const z=c.group.position.z+Math.cos(angle)*5;

  if(collides(x,z,0.7,c)) return;

  player.pos.set(x,1,z);
  c.occupied=false;
  player.car=null;
  player.mesh.visible=true;
  player.mesh.position.copy(player.pos);
}

function enterBuilding(b) {
  inside=b;
  mode="interior";

  player.mesh.visible=false;

  scene.children.forEach(o=>{
    if(o!==camera && o!==player.mesh) {
      o.visible=false;
    }
  });

  const floor=box(30,0.2,20,new THREE.MeshLambertMaterial({color:0x625d53}));
  floor.position.y=0;
  floor.userData.temp=true;
  scene.add(floor);

  for(const p of [
    [-12,0,-7],
    [12,0,-7],
    [-12,0,7],
    [12,0,7]
  ]) {
    const wall=box(0.5,5,20,new THREE.MeshLambertMaterial({color:0x77736a}));
    wall.position.set(p[0],2.5,p[1]);
    wall.userData.temp=true;
    scene.add(wall);
  }

  player.pos.set(0,1,6);
}

function leaveBuilding() {
  if(mode!=="interior") return;

  scene.children
    .filter(o=>o.userData.temp)
    .forEach(o=>scene.remove(o));

  scene.children.forEach(o=>{
    o.visible=true;
  });

  player.mesh.visible=true;
  player.pos.set(inside.x,1,inside.z+inside.d/2+5);
  player.mesh.position.copy(player.pos);

  inside=null;
  mode="outside";
}

function interact() {
  if(mode==="interior") {
    leaveBuilding();
    return;
  }

  if(player.car) {
    exitCar();
    return;
  }

  const car=nearestCar();

  if(car) {
    enterCar(car);
    return;
  }

  const b=nearestBuilding();

  if(b) {
    enterBuilding(b);
  }
}

function updateZombies(dt) {
  if(mode!=="outside") return;

  const tx=player.car
    ? player.car.group.position.x
    : player.pos.x;

  const tz=player.car
    ? player.car.group.position.z
    : player.pos.z;

  for(const z of zombies) {
    const dx=tx-z.group.position.x;
    const dz=tz-z.group.position.z;
    const d=Math.hypot(dx,dz);

    if(d>45 || d<2.8) continue;

    const vx=dx/d*z.speed*dt;
    const vz=dz/d*z.speed*dt;

    if(!collides(
      z.group.position.x+vx,
      z.group.position.z+vz,
      0.7
    )) {
      z.group.position.x+=vx;
      z.group.position.z+=vz;
    }

    z.group.rotation.y=Math.atan2(vx,vz);
  }
}

function updateCamera() {
  if(mode==="interior") {
    camera.position.lerp(
      new THREE.Vector3(0,9,13),
      0.08
    );

    camera.lookAt(0,1,0);
    return;
  }

  const target=player.pos.clone();

  const distance=11;
  const height=7;

  const desired=new THREE.Vector3(
    target.x-Math.sin(cameraYaw)*distance,
    target.y+height,
    target.z-Math.cos(cameraYaw)*distance
  );

  camera.position.lerp(desired,0.1);

  cameraTarget.set(
    target.x,
    target.y+1.5,
    target.z
  );

  camera.lookAt(cameraTarget);
}

function input() {
  let x=joy.x;
  let y=joy.y;

  if(keys.w||keys.arrowup) y-=1;
  if(keys.s||keys.arrowdown) y+=1;
  if(keys.a||keys.arrowleft) x-=1;
  if(keys.d||keys.arrowright) x+=1;

  const len=Math.hypot(x,y);

  if(len>1) {
    x/=len;
    y/=len;
  }

  return {x,y};
}

function update(dt) {
  const v=input();

  if(mode==="outside") {
    if(player.car) {
      const speed=10;
      const dx=
        Math.sin(cameraYaw)*v.y+
        Math.cos(cameraYaw)*v.x;

      const dz=
        Math.cos(cameraYaw)*v.y-
        Math.sin(cameraYaw)*v.x;

      moveCar(
        dx*speed*dt,
        dz*speed*dt
      );
    } else {
      const dx=
        Math.sin(cameraYaw)*v.y+
        Math.cos(cameraYaw)*v.x;

      const dz=
        Math.cos(cameraYaw)*v.y-
        Math.sin(cameraYaw)*v.x;

      movePlayer(
        dx*player.speed*dt,
        dz*player.speed*dt
      );
    }

    updateZombies(dt);
  }

  player.hunger=Math.max(
    0,
    player.hunger-dt*0.45
  );

  if(player.hunger<=0) {
    player.hp=Math.max(
      0,
      player.hp-dt*0.15
    );
  }

  updateCamera();
}

function updateHUD() {
  document.getElementById("hp").textContent=
    `HP ${Math.round(player.hp)}`;

  document.getElementById("hunger").textContent=
    `HUNGER ${Math.round(player.hunger)}`;

  document.getElementById("state").textContent=
    player.car
      ? "VEHICLE"
      : mode==="interior"
        ? "INDOORS"
        : "DAY 1";

  const prompt=document.getElementById("prompt");

  let text="";

  if(mode==="interior") {
    text="INTERACT • EXIT BUILDING";
  } else if(player.car) {
    text="INTERACT • EXIT VEHICLE";
  } else if(nearestCar()) {
    text="INTERACT • ENTER VEHICLE";
  } else if(nearestBuilding()) {
    text="INTERACT • ENTER BUILDING";
  }

  prompt.textContent=text;
  prompt.style.display=text?"block":"none";
}

const joystick=document.getElementById("joystick");
const stick=document.getElementById("joystick-stick");

function joystickMove(e) {
  const r=joystick.getBoundingClientRect();

  const cx=r.left+r.width/2;
  const cy=r.top+r.height/2;

  let dx=e.clientX-cx;
  let dy=e.clientY-cy;

  const max=r.width*0.32;
  const len=Math.hypot(dx,dy);

  if(len>max) {
    dx=dx/len*max;
    dy=dy/len*max;
  }

  joy.x=dx/max;
  joy.y=dy/max;

  stick.style.transform=
    `translate(${dx}px,${dy}px)`;
}

function joystickReset() {
  joy.active=false;
  joy.x=0;
  joy.y=0;
  stick.style.transform="translate(0,0)";
}

joystick.addEventListener("pointerdown",e=>{
  joy.active=true;
  joystick.setPointerCapture(e.pointerId);
  joystickMove(e);
});

joystick.addEventListener("pointermove",e=>{
  if(joy.active) joystickMove(e);
});

joystick.addEventListener("pointerup",joystickReset);
joystick.addEventListener("pointercancel",joystickReset);

document.getElementById("interact")
.addEventListener("click",interact);

document.getElementById("fullscreen")
.addEventListener("click",async()=>{
  try {
    if(!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {}
});

document.addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;

  if(e.key.toLowerCase()==="e") {
    interact();
  }
});

document.addEventListener("keyup",e=>{
  keys[e.key.toLowerCase()]=false;
});

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

buildCity();
createPlayer();

camera.position.set(
  player.pos.x,
  player.pos.y+7,
  player.pos.z+11
);

camera.lookAt(player.pos);

document.getElementById("loading").style.display="none";

function loop(now) {
  const dt=Math.min(
    0.05,
    (now-last)/1000
  );

  last=now;

  update(dt);
  updateHUD();

  renderer.render(scene,camera);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);