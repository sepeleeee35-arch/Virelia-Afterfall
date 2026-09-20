import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export const world = {
  width: 6000,
  height: 4500,
  safeZone: { x: 3000, y: 2250, radius: 1850 },
  spawn: { x: 3000, y: 2250 },
  scene: null,
  loot: [],
  vehicles: [],
  buildings: [],
  trees: [],
  bots: []
};

const mats = {};

function material(color, roughness=1){
  return new THREE.MeshStandardMaterial({color,roughness});
}

function box(scene,x,y,z,w,h,d,mat){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  scene.add(mesh);
  return mesh;
}

export function createWorld(scene){
  world.scene=scene;
  world.loot=[];
  world.vehicles=[];
  world.buildings=[];
  world.trees=[];

  mats.ground=material(0x6f865f);
  mats.road=material(0x444b4a);
  mats.roadLine=material(0xd8cb69);
  mats.water=material(0x3e7787);
  mats.sand=material(0xc6b276);
  mats.house=material(0x918978);
  mats.roof=material(0x55514a);
  mats.glass=material(0x526d75);
  mats.tree=material(0x3e6544);
  mats.trunk=material(0x614b38);
  mats.car=material(0x27363a);
  mats.carGlass=material(0x70878b);
  mats.loot=material(0xe5cf63);
  mats.hill=material(0x5d7650);

  const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(world.width,world.height),
    mats.ground
  );
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  scene.add(ground);

  const coast=box(scene,5350,0,2250,1300,0.5,4500,mats.water);
  coast.receiveShadow=false;
  box(scene,4700,0.04,2250,180,0.08,4500,mats.sand);

  addRoad(scene,0,2050,6000,180);
  addRoad(scene,2910,0,180,4500);
  addRoad(scene,350,650,2300,120);
  addRoad(scene,3650,650,1900,120);
  addRoad(scene,450,3550,2000,120);
  addRoad(scene,3500,3550,2050,120);
  addRoad(scene,4300,2020,600,240);

  addBuilding(scene,2320,1180,760,560,"CENTRAL FORT",true);
  addBuilding(scene,2600,1850,380,260,"MARKET");
  addBuilding(scene,3350,1350,520,300,"WAREHOUSE");
  addBuilding(scene,4050,900,460,300,"DEPOT");
  addBuilding(scene,950,2500,520,340,"WEST COMPOUND");
  addBuilding(scene,3500,2550,560,350,"EAST COMPOUND");
  addBuilding(scene,1500,3550,650,300,"SOUTH ESTATE");

  for(let row=0;row<4;row++){
    for(let col=0;col<3;col++){
      addBuilding(scene,380+col*300,850+row*250+(col%2)*25,205,145,"HOMESTEAD");
      addBuilding(scene,3900+col*300,700+row*260+(col%2)*30,215,150,"COASTAL HOME");
    }
  }

  for(let i=0;i<8;i++) addBuilding(scene,650+i*300,3200,230,160,"SOUTH BLOCK");
  for(let i=0;i<7;i++) addBuilding(scene,3300+i*290,3250,220,155,"EAST BLOCK");

  const hillData=[
    [180,120,1250,720],[1450,180,1100,760],[330,2720,1450,700],
    [3300,2680,1350,780],[4550,250,850,1050]
  ];
  for(const [x,z,w,d] of hillData){
    const h=new THREE.Mesh(
      new THREE.CylinderGeometry(Math.min(w,d)*0.22,Math.min(w,d)*0.52,110,32),
      mats.hill
    );
    h.scale.set(w/Math.min(w,d),1,d/Math.min(w,d));
    h.position.set(x+w/2,55,z+d/2);
    h.castShadow=true;
    h.receiveShadow=true;
    scene.add(h);
  }

  for(let i=0;i<150;i++){
    const x=120+Math.random()*4250;
    const z=100+Math.random()*4200;
    if(isNearRoad(x,z,90) || isNearBuilding(x,z,100)) continue;
    addTree(scene,x,z,0.8+Math.random()*0.8);
  }

  for(let i=0;i<24;i++){
    const x=300+Math.random()*4050;
    const z=300+Math.random()*3800;
    if(isNearBuilding(x,z,80)) continue;
    addVehicle(scene,x,z,Math.random()*Math.PI*2);
  }

  const types=["HELMET","VEST","BACKPACK","SHOES","MEDKIT","FOOD"];
  for(let i=0;i<90;i++){
    const x=350+Math.random()*4050;
    const z=250+Math.random()*3900;
    const type=types[i%types.length];
    const mesh=new THREE.Mesh(
      new THREE.BoxGeometry(14,8,14),
      mats.loot
    );
    mesh.position.set(x,8,z);
    mesh.castShadow=true;
    scene.add(mesh);
    world.loot.push({x,y:z,z,type,taken:false,mesh});
  }

  const ring=new THREE.Mesh(
    new THREE.RingGeometry(world.safeZone.radius-8,world.safeZone.radius,96),
    new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.75})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.set(world.safeZone.x,1,world.safeZone.y);
  scene.add(ring);

  const centerMarker=box(scene,3000,4,2250,160,8,160,mats.roof);
  centerMarker.material=material(0x65615a);
}

function addRoad(scene,x,z,w,d){
  box(scene,x+w/2,1,z+d/2,w,2,d,mats.road);
  const horizontal=w>d;
  const count=Math.floor((horizontal?w:d)/85);
  for(let i=0;i<count;i++){
    const line=box(
      scene,
      horizontal ? x+i*85+20 : x+w/2,
      2.2,
      horizontal ? z+d/2 : z+i*85+20,
      horizontal ? 38 : 4,
      .4,
      horizontal ? 4 : 38,
      mats.roadLine
    );
    line.receiveShadow=false;
  }
}

function addBuilding(scene,x,z,w,d,label,landmark=false){
  const base=box(scene,x+w/2,45,z+d/2,w,90,d,landmark?material(0x666863):mats.house);
  const roof=box(scene,x+w/2,92,z+d/2,w+12,8,d+12,mats.roof);
  const cols=Math.max(1,Math.floor(w/75));
  for(let i=0;i<cols;i++){
    box(scene,x+25+i*70,55,z-1,22,18,3,mats.glass);
    box(scene,x+25+i*70,55,z+d+1,22,18,3,mats.glass);
  }
  box(scene,x+w/2,30,z+d+2,28,55,4,mats.roof);
  world.buildings.push({x,z,w,d,label,base,roof});
}

function addTree(scene,x,z,s){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(5*s,7*s,34*s,8),mats.trunk);
  trunk.position.set(x,17*s,z);
  trunk.castShadow=true;
  scene.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(24*s,10,8),mats.tree);
  crown.position.set(x,45*s,z);
  crown.castShadow=true;
  crown.receiveShadow=true;
  scene.add(crown);
  world.trees.push({x,z});
}

function addVehicle(scene,x,z,angle){
  const group=new THREE.Group();
  group.position.set(x,18,z);
  group.rotation.y=angle;
  const body=new THREE.Mesh(new THREE.BoxGeometry(70,24,38),mats.car);
  body.castShadow=true;
  group.add(body);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(38,16,32),mats.carGlass);
  glass.position.y=16;
  glass.castShadow=true;
  group.add(glass);
  for(const sx of [-1,1]){
    for(const sz of [-1,1]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(8,8,6,12),mats.roof);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(sx*25,-13,sz*17);
      group.add(wheel);
    }
  }
  scene.add(group);
  world.vehicles.push({x,z,angle,mesh:group,used:false});
}

function isNearRoad(x,z,r){
  return world.roadsSome ? false : false;
}

function isNearBuilding(x,z,r){
  return world.buildings.some(b=>x>b.x-r&&x<b.x+b.w+r&&z>b.z-r&&z<b.z+b.d+r);
}

export function getZoneState(x,z){
  const d=Math.hypot(x-world.safeZone.x,z-world.safeZone.y);
  return {distance:d,inside:d<=world.safeZone.radius,outside:d>world.safeZone.radius};
}

export function getNearbyInteraction(x,z){
  let nearest=null,best=95;
  for(const v of world.vehicles){
    const d=Math.hypot(x-v.x,z-v.z);
    if(d<best){best=d;nearest={label:"VEHICLE • tap INTERACT",result:"Vehicle interaction ready.",type:"vehicle",object:v};}
  }
  for(const loot of world.loot){
    if(loot.taken) continue;
    const d=Math.hypot(x-loot.x,z-loot.z);
    if(d<best){best=d;nearest={label:"LOOT • "+loot.type,result:"Found "+loot.type+".",type:"loot",object:loot};}
  }
  return nearest;
}
