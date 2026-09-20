import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { input, setupInput } from "./input.js";
import { player } from "./player.js";
import { world, createWorld, getZoneState, getNearbyInteraction } from "./world.js";
import { bots, createBots, updateBots } from "./bots.js";

const VERSION="1.3.0";

const canvas=document.getElementById("game");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ba9ad);
scene.fog=new THREE.Fog(0x8ba9ad,1800,5600);

const camera=new THREE.PerspectiveCamera(58,1,0.1,8000);
camera.position.set(0,170,260);

const hemi=new THREE.HemisphereLight(0xdfe9e5,0x485044,2.2);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1cf,3.2);
sun.position.set(-900,1400,700);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-2500;
sun.shadow.camera.right=2500;
sun.shadow.camera.top=2500;
sun.shadow.camera.bottom=-2500;
scene.add(sun);

let running=false,lastTime=0;
let yaw=0.35;
let pitch=0.18;
let camDistance=310;
let camHeight=135;

function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}

function updatePlayer3D(dt){
  let x=input.x,y=input.y;
  const len=Math.hypot(x,y);
  if(len>1){x/=len;y/=len;}

  const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));
  const move=new THREE.Vector3();
  move.addScaledVector(right,x);
  move.addScaledVector(forward,-y);

  const mag=Math.min(1,move.length());
  if(mag>0) move.normalize();

  let speed=player.speed;
  player.crouch=input.crouch;
  if(player.crouch) speed*=.55;
  if(input.run&&!player.crouch&&player.stamina>0){
    speed*=1.55;
    player.stamina=Math.max(0,player.stamina-28*dt);
  }else{
    player.stamina=Math.min(100,player.stamina+18*dt);
  }

  player.x+=move.x*speed*dt;
  player.y+=move.z*speed*dt;
  player.x=Math.max(35,Math.min(world.width-35,player.x));
  player.y=Math.max(35,Math.min(world.height-35,player.y));
}

let playerGroup;

function createPlayer(){
  playerGroup=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.CapsuleGeometry(15,34,6,10),
    new THREE.MeshStandardMaterial({color:0x263b43})
  );
  body.position.y=40;
  body.castShadow=true;
  playerGroup.add(body);

  const vest=new THREE.Mesh(
    new THREE.BoxGeometry(34,25,24),
    new THREE.MeshStandardMaterial({color:0x435a60})
  );
  vest.position.y=44;
  vest.castShadow=true;
  playerGroup.add(vest);

  const head=new THREE.Mesh(
    new THREE.SphereGeometry(12,12,10),
    new THREE.MeshStandardMaterial({color:0xc28d73})
  );
  head.position.y=76;
  head.castShadow=true;
  playerGroup.add(head);

  const helmet=new THREE.Mesh(
    new THREE.SphereGeometry(13,12,6,0,Math.PI*2,0,Math.PI*.55),
    new THREE.MeshStandardMaterial({color:0x20292c})
  );
  helmet.position.y=81;
  helmet.castShadow=true;
  playerGroup.add(helmet);

  scene.add(playerGroup);
}

function updateCamera(dt){
  const target=new THREE.Vector3(player.x,48,player.y);
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const offset=new THREE.Vector3(
    Math.sin(yaw)*cp*camDistance,
    camHeight+sp*camDistance*.45,
    Math.cos(yaw)*cp*camDistance
  );
  const desired=target.clone().add(offset);
  camera.position.lerp(desired,1-Math.pow(.0005,dt));
  camera.lookAt(target.x,target.y+20,target.z);
}

function updateHud(dt){
  const hp=document.getElementById("hpBar");
  const st=document.getElementById("staminaBar");
  const alive=document.getElementById("alive");
  const phase=document.getElementById("phase");
  const msg=document.getElementById("message");
  const zoneTimer=document.getElementById("zoneTimer");
  if(hp) hp.style.width=player.hp+"%";
  if(st) st.style.width=player.stamina+"%";
  if(alive) alive.textContent=String(bots.filter(b=>b.hp>0).length+1);
  const zone=getZoneState(player.x,player.y);
  if(phase) phase.textContent=zone.outside?"MOVE TO ZONE":"SURVIVAL";
  if(zoneTimer) zoneTimer.textContent="05:00";
  const nearby=getNearbyInteraction(player.x,player.y);
  if(msg){
    msg.textContent=nearby?nearby.label:"";
    msg.style.opacity=nearby?"1":"0";
  }
  const compass=document.getElementById("compass");
  if(compass){
    const deg=((yaw*180/Math.PI)%360+360)%360;
    const names=["N","NE","E","SE","S","SW","W","NW"];
    compass.textContent=names[Math.round(deg/45)%8]+"  •  CAMERA";
  }
}

function update(dt){
  yaw=input.cameraYaw;
  pitch=input.cameraPitch;
  updatePlayer3D(dt);
  updateBots(dt);
  playerGroup.position.set(player.x,0,player.y);
  playerGroup.rotation.y=yaw+Math.PI;
  updateCamera(dt);
  updateHud(dt);
}

function setupUi(){
  const bag=document.getElementById("bagBtn");
  const inv=document.getElementById("inventory");
  if(bag&&inv) bag.onclick=()=>inv.style.display=inv.style.display==="block"?"none":"block";
  const action=document.getElementById("actionBtn");
  if(action) action.onclick=()=>{
    const n=getNearbyInteraction(player.x,player.y);
    const msg=document.getElementById("message");
    if(msg){
      msg.textContent=n?n.result:"Nothing nearby.";
      msg.style.opacity="1";
      setTimeout(()=>msg.style.opacity="0",1200);
    }
  };
  const v=document.querySelector(".version");
  const vs=document.querySelector(".versionStart");
  if(v)v.textContent="VIRELIA v"+VERSION;
  if(vs)vs.textContent="VERSION "+VERSION;
}

function loop(t){
  if(!running)return;
  const dt=Math.min((t-lastTime)/1000,.033);
  lastTime=t;
  update(dt);
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

export function startGame(){
  if(running)return;
  input.cameraYaw=0.35;
  input.cameraPitch=0.18;
  running=true;
  resize();
  createWorld(scene);
  createBots(scene);
  createPlayer();
  player.x=world.spawn.x;
  player.y=world.spawn.y;
  player.hp=100;
  player.stamina=100;
  setupInput();
  setupUi();
  lastTime=performance.now();
  requestAnimationFrame(loop);
}

window.addEventListener("resize",resize);
window.addEventListener("orientationchange",()=>setTimeout(resize,150));
