import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
export const world={width:6000,height:4500,safeZone:{x:3000,y:2250,radius:1850},safeZoneRing:null,spawn:{x:3000,y:2250},scene:null,loot:[],vehicles:[],buildings:[],trees:[],roads:[]};
const mats={};function material(color,roughness=1){return new THREE.MeshStandardMaterial({color,roughness});}
function box(scene,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
export function createWorld(scene){
 world.scene=scene;world.loot=[];world.vehicles=[];world.buildings=[];world.trees=[];world.roads=[];
 Object.assign(mats,{ground:material(0x6f865f),road:material(0x414847),roadLine:material(0xd6c969),water:material(0x3e7787),sand:material(0xc6b276),house:material(0x918978),roof:material(0x55514a),glass:material(0x526d75),tree:material(0x3e6544),trunk:material(0x614b38),car:material(0x27363a),carGlass:material(0x70878b),loot:material(0xe5cf63),hill:material(0x5d7650)});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(world.width,world.height),mats.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 box(scene,5350,0,2250,1300,.5,4500,mats.water);box(scene,4700,.04,2250,180,.08,4500,mats.sand);
 const roads=[[0,2050,6000,180],[2910,0,180,4500],[350,650,2300,120],[3650,650,1900,120],[450,3550,2000,120],[3500,3550,2050,120],[4300,2020,600,240],[1000,2050,140,1900],[4550,950,850,120]];
 for(const r of roads)addRoad(scene,...r);
  addBridge(scene,4300,2020,600,240);
 const landmarks=[[2150,1050,900,620,"CENTRAL FORT",1],[2550,1830,420,280,"MARKET",0],[3350,1250,600,340,"WAREHOUSE",0],[4020,800,500,330,"DEPOT",0],[900,2450,600,390,"WEST COMPOUND",0],[3500,2500,650,390,"EAST COMPOUND",0],[1450,3450,760,350,"SOUTH ESTATE",1],[4450,1550,420,330,"COAST BASE",1]];
 for(const b of landmarks)addBuilding(scene,...b);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){addBuilding(scene,350+col*300,820+row*250+(col%2)*25,205,145,"HOMESTEAD");addBuilding(scene,3900+col*300,650+row*260+(col%2)*30,215,150,"COASTAL HOME");}
 for(let i=0;i<8;i++)addBuilding(scene,650+i*300,3200,230,160,"SOUTH BLOCK");
 for(let i=0;i<7;i++)addBuilding(scene,3300+i*290,3250,220,155,"EAST BLOCK");
 const hills=[[180,120,1250,720],[1450,180,1100,760],[330,2720,1450,700],[3300,2680,1350,780],[4550,250,850,1050],[500,1750,700,420],[4100,2250,620,520]];
 for(const [x,z,w,d] of hills){const h=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w,d)*.2,Math.min(w,d)*.5,125,32),mats.hill);h.scale.set(w/Math.min(w,d),1,d/Math.min(w,d));h.position.set(x+w/2,62,z+d/2);h.castShadow=true;scene.add(h);}
 for(let i=0;i<175;i++){const x=120+Math.random()*4300,z=100+Math.random()*4200;if(isNearRoad(x,z,100)||isNearBuilding(x,z,110))continue;addTree(scene,x,z,.8+Math.random()*.8);}
 for(let i=0;i<30;i++){const x=300+Math.random()*4050,z=300+Math.random()*3800;if(!isNearBuilding(x,z,80))addVehicle(scene,x,z,Math.random()*Math.PI*2);}
 const types=["HELMET","VEST","BACKPACK","SHOES","MEDKIT","FOOD"];for(let i=0;i<120;i++){const x=350+Math.random()*4050,z=250+Math.random()*3900,type=types[i%types.length],mesh=new THREE.Mesh(new THREE.BoxGeometry(14,8,14),mats.loot);mesh.position.set(x,8,z);scene.add(mesh);world.loot.push({x,z,type,taken:false,mesh});}
 const ring=new THREE.Mesh(new THREE.RingGeometry(world.safeZone.radius-9,world.safeZone.radius,96),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.75}));ring.rotation.x=-Math.PI/2;ring.position.set(world.safeZone.x,1,world.safeZone.y);scene.add(ring);world.safeZoneRing=ring;
}
function addRoad(scene,x,z,w,d){world.roads.push({x,z,w,d});box(scene,x+w/2,1,z+d/2,w,2,d,mats.road);const horizontal=w>d,count=Math.floor((horizontal?w:d)/85);for(let i=0;i<count;i++)box(scene,horizontal?x+i*85+20:x+w/2,2.2,horizontal?z+d/2:z+i*85+20,horizontal?38:4,.4,horizontal?4:38,mats.roadLine);}
function addBridge(scene,x,z,w,d){
 const deck=box(scene,x+w/2,8,z+d/2,w,10,d,mats.road);
 box(scene,x+w/2,22,z+12,w,5,8,mats.roof); box(scene,x+w/2,22,z+d-12,w,5,8,mats.roof);
 for(let i=0;i<Math.floor(w/70);i++){const px=x+35+i*70;box(scene,px,18,z+12,5,28,5,mats.roof);box(scene,px,18,z+d-12,5,28,5,mats.roof);}
}
function addBuilding(scene,x,z,w,d,label,landmark=false){const base=box(scene,x+w/2,45,z+d/2,w,90,d,landmark?material(0x666863):mats.house);box(scene,x+w/2,92,z+d/2,w+12,8,d+12,mats.roof);const cols=Math.max(1,Math.floor(w/75));for(let i=0;i<cols;i++){box(scene,x+25+i*70,55,z-1,22,18,3,mats.glass);box(scene,x+25+i*70,55,z+d+1,22,18,3,mats.glass);}box(scene,x+w/2,30,z+d+2,28,55,4,mats.roof);world.buildings.push({x,z,w,d,label,base});}
function addTree(scene,x,z,s){const t=new THREE.Mesh(new THREE.CylinderGeometry(5*s,7*s,34*s,8),mats.trunk);t.position.set(x,17*s,z);scene.add(t);const c=new THREE.Mesh(new THREE.SphereGeometry(24*s,10,8),mats.tree);c.position.set(x,45*s,z);scene.add(c);world.trees.push({x,z});}
function addVehicle(scene,x,z,angle){const g=new THREE.Group();g.position.set(x,18,z);g.rotation.y=angle;g.add(new THREE.Mesh(new THREE.BoxGeometry(70,24,38),mats.car));const glass=new THREE.Mesh(new THREE.BoxGeometry(38,16,32),mats.carGlass);glass.position.y=16;g.add(glass);scene.add(g);world.vehicles.push({x,z,angle,mesh:g,used:false});}
function isNearRoad(x,z,r){return world.roads.some(a=>x>a.x-r&&x<a.x+a.w+r&&z>a.z-r&&z<a.z+a.d+r);}
function isNearBuilding(x,z,r){return world.buildings.some(b=>x>b.x-r&&x<b.x+b.w+r&&z>b.z-r&&z<b.z+b.d+r);}
export function canMoveTo(x,z,radius=24){
  if(x<radius||z<radius||x>world.width-radius||z>world.height-radius)return false;
  for(const b of world.buildings){
    if(x>b.x-radius&&x<b.x+b.w+radius&&z>b.z-radius&&z<b.z+b.d+radius)return false;
  }
  for(const t of world.trees){
    if(Math.hypot(x-t.x,z-t.z)<radius+24)return false;
  }
  for(const v of world.vehicles){
    if(Math.hypot(x-v.x,z-v.z)<radius+38)return false;
  }
  return true;
}
export function getZoneState(x,z){const d=Math.hypot(x-world.safeZone.x,z-world.safeZone.y);return{distance:d,inside:d<=world.safeZone.radius,outside:d>world.safeZone.radius};}
export function getNearbyInteraction(x,z){let nearest=null,best=95;for(const v of world.vehicles){const d=Math.hypot(x-v.x,z-v.z);if(d<best){best=d;nearest={label:"VEHICLE • INTERACT",result:"Vehicle ready",type:"vehicle",object:v};}}for(const l of world.loot){if(l.taken)continue;const d=Math.hypot(x-l.x,z-l.z);if(d<best){best=d;nearest={label:"LOOT • "+l.type,result:"Pick up "+l.type,type:"loot",object:l};}}return nearest;}