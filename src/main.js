import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { input, setupInput } from "./input.js";
import { player } from "./player.js";
import { world, createWorld, getZoneState, getNearbyInteraction } from "./world.js";
import { bots, createBots, updateBots, damageBot } from "./bots.js";

const VERSION="1.8.0";
const canvas=document.getElementById("game");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x879da0); scene.fog=new THREE.Fog(0x879da0,1600,6200);
const camera=new THREE.PerspectiveCamera(60,1,.1,8000);
scene.add(new THREE.HemisphereLight(0xe1eee9,0x465047,2.4));
const sun=new THREE.DirectionalLight(0xffefc9,3.4); sun.position.set(-900,1500,700); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);

let running=false,lastTime=0,yaw=.35,pitch=.22;
const CAMERA_DISTANCE=112,CAMERA_HEIGHT=34,CAMERA_SHOULDER=17,CAMERA_SMOOTH=16;
const moveForward=new THREE.Vector3(),moveRight=new THREE.Vector3(),moveVector=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),cameraDesired=new THREE.Vector3(),cameraRight=new THREE.Vector3(),aimDirection=new THREE.Vector3();
const raycaster=new THREE.Raycaster(); let weaponGroup, muzzle, fireCooldown=0, ammo=30, reloadTimer=0, zoneClock=300;
const inventory={medkit:0,food:0,helmet:"-",vest:"-",backpack:"-",shoes:"-"};\nlet lastHp=100;

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function updatePlayer3D(dt){
  const sx=input.x,sy=input.y,m=Math.min(1,Math.hypot(sx,sy));
  moveForward.set(Math.sin(yaw),0,-Math.cos(yaw)); moveRight.set(Math.cos(yaw),0,Math.sin(yaw)); moveVector.set(0,0,0);
  moveVector.addScaledVector(moveRight,sx).addScaledVector(moveForward,sy);
  if(moveVector.lengthSq()>.0001) moveVector.normalize().multiplyScalar(m);
  let speed=player.speed; player.crouch=input.crouch;
  if(player.crouch)speed*=.52;
  if(input.run&&!player.crouch&&player.stamina>0&&m>.2){speed*=1.55;player.stamina=Math.max(0,player.stamina-30*dt);}else player.stamina=Math.min(100,player.stamina+20*dt);
  player.x+=moveVector.x*speed*dt; player.y+=moveVector.z*speed*dt;
  player.x=Math.max(35,Math.min(world.width-35,player.x)); player.y=Math.max(35,Math.min(world.height-35,player.y));
}
let playerGroup;
function createWeapon(){
  weaponGroup=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x202629,metalness:.25,roughness:.65});
  const stock=new THREE.Mesh(new THREE.BoxGeometry(9,7,38),mat);stock.position.set(13,45,-22);weaponGroup.add(stock);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(2.7,3,48,8),mat);barrel.rotation.x=Math.PI/2;barrel.position.set(13,50,-48);weaponGroup.add(barrel);
  muzzle=new THREE.Mesh(new THREE.SphereGeometry(5,8,8),new THREE.MeshBasicMaterial({color:0xffd36a}));muzzle.position.set(13,50,-73);muzzle.visible=false;weaponGroup.add(muzzle);
  scene.add(weaponGroup);
}
function createPlayer(){
  playerGroup=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(13,30,6,10),new THREE.MeshStandardMaterial({color:0x243842}));body.position.y=38;body.castShadow=true;playerGroup.add(body);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(30,23,22),new THREE.MeshStandardMaterial({color:0x4a5d61}));vest.position.y=42;vest.castShadow=true;playerGroup.add(vest);
  const backpack=new THREE.Mesh(new THREE.BoxGeometry(18,27,11),new THREE.MeshStandardMaterial({color:0x303a38}));backpack.position.set(0,43,13);backpack.castShadow=true;playerGroup.add(backpack); const head=new THREE.Mesh(new THREE.SphereGeometry(10.5,12,10),new THREE.MeshStandardMaterial({color:0xc28d73}));head.position.y=72;head.castShadow=true;playerGroup.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(13,12,6,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x20292c}));helmet.position.y=77;playerGroup.add(helmet);
  for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(4.5,20,4,7),new THREE.MeshStandardMaterial({color:0x31474d}));arm.position.set(s*17,44,-1);arm.rotation.z=s*.18;playerGroup.add(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(5,24,4,7),new THREE.MeshStandardMaterial({color:0x20292c}));leg.position.set(s*7,16,0);playerGroup.add(leg);const boot=new THREE.Mesh(new THREE.BoxGeometry(10,7,16),new THREE.MeshStandardMaterial({color:0x171c1d}));boot.position.set(s*7,4,-3);playerGroup.add(boot);} createWeapon();scene.add(playerGroup);
}
function updateCamera(dt){
  cameraTarget.set(player.x,48,player.y);const cp=Math.cos(pitch),sp=Math.sin(pitch),distance=input.aim?145:CAMERA_DISTANCE;
  const backX=-Math.sin(yaw)*cp,backZ=Math.cos(yaw)*cp;cameraRight.set(Math.cos(yaw),0,Math.sin(yaw));
  cameraDesired.set(player.x+backX*distance+cameraRight.x*CAMERA_SHOULDER,cameraTarget.y+CAMERA_HEIGHT+sp*distance*.42,player.y+backZ*distance+cameraRight.z*CAMERA_SHOULDER);
  camera.position.lerp(cameraDesired,1-Math.exp(-CAMERA_SMOOTH*dt));camera.lookAt(cameraTarget.x,cameraTarget.y+sp*distance*.12,cameraTarget.z);
  if(weaponGroup){weaponGroup.position.set(0,0,0);weaponGroup.rotation.y=0;weaponGroup.visible=!input.crouch;}
}
function showCombatMessage(t){const m=document.getElementById("message");if(!m)return;m.textContent=t;m.style.opacity="1";clearTimeout(showCombatMessage.timer);showCombatMessage.timer=setTimeout(()=>m.style.opacity="0",650);}
function fireWeapon(){
  if(reloadTimer>0||fireCooldown>0||ammo<=0)return;
  ammo--;fireCooldown=.11;if(muzzle){muzzle.visible=true;clearTimeout(fireWeapon.flash);fireWeapon.flash=setTimeout(()=>muzzle.visible=false,55);}
  aimDirection.set(Math.sin(yaw),Math.sin(pitch),-Math.cos(yaw)).normalize();raycaster.set(camera.position,aimDirection);raycaster.far=700;
  let best=null,bestDist=Infinity;
  for(const bot of bots){if(bot.dead||bot.hp<=0||!bot.mesh.visible)continue;const dx=bot.x-camera.position.x,dy=42-camera.position.y,dz=bot.z-camera.position.z,t=dx*aimDirection.x+dy*aimDirection.y+dz*aimDirection.z;if(t<0||t>700)continue;const px=camera.position.x+aimDirection.x*t,py=camera.position.y+aimDirection.y*t,pz=camera.position.z+aimDirection.z*t;const miss=Math.hypot(bot.x-px,42-py,bot.z-pz);if(miss<30&&t<bestDist){best=bot;bestDist=t;}}
  if(best){damageBot(best,input.aim?40:34);showCombatMessage(best.hp<=0?"ELIMINATED":"HIT -"+(input.aim?40:34));}
}
function pickupNearby(){
  const n=getNearbyInteraction(player.x,player.y);if(!n)return showCombatMessage("NOTHING TO PICK UP");
  if(n.type==="loot"){
    const l=n.object,slot=l.type.toLowerCase();
    if(["helmet","vest","backpack","shoes"].includes(slot)){
      if(inventory[slot]!=="-")return showCombatMessage(slot.toUpperCase()+" SLOT FULL");
      inventory[slot]="LV1"; l.taken=true;l.mesh.visible=false;showCombatMessage(slot.toUpperCase()+" EQUIPPED");
    }else{inventory[slot]=(inventory[slot]||0)+1;l.taken=true;l.mesh.visible=false;showCombatMessage(l.type+" +1");}
  }else showCombatMessage("VEHICLE READY");
}
function updateInventoryHud(){for(const k of Object.keys(inventory)){const e=document.getElementById(k);if(e)e.textContent=inventory[k];}}
function drawMinimap(){
  const c=document.getElementById("mini"),ctx=c&&c.getContext("2d");if(!ctx)return;const w=c.width=c.clientWidth*2,h=c.height=c.clientHeight*2, sx=w/world.width,sy=h/world.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#5d7555";ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#4f6f7a";ctx.fillRect(world.width*sx*.78,0,w*.22,h);
  ctx.fillStyle="#4b4f4e";for(const r of world.roads){ctx.fillRect(r.x*sx,r.z*sy,r.w*sx,r.d*sy);}
  ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(world.safeZone.x*sx,world.safeZone.y*sy,world.safeZone.radius*sx,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#d54d4d";for(const b of bots){if(!b.dead)ctx.fillRect(b.x*sx-2,b.z*sy-2,4,4);}
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(player.x*sx,player.y*sy,6,0,Math.PI*2);ctx.fill();
}
function updateHud(dt){
  const hp=document.getElementById("hpBar"),st=document.getElementById("staminaBar"),alive=document.getElementById("alive"),phase=document.getElementById("phase"),zt=document.getElementById("zoneTimer");
  if(hp)hp.style.width=Math.max(0,player.hp)+"%";if(st)st.style.width=player.stamina+"%";const hpText=document.getElementById("hpText");if(hpText)hpText.textContent=Math.ceil(player.hp)+" / 100";const armor=document.getElementById("armorBar");if(armor)armor.style.width=inventory.vest!=="-"?"50%":"0%";if(player.hp<lastHp){const f=document.getElementById("damageFlash");if(f){f.style.opacity="1";setTimeout(()=>f.style.opacity="0",90);}}lastHp=player.hp;if(alive)alive.textContent=String(bots.filter(b=>b.hp>0).length+1);
  const zone=getZoneState(player.x,player.y);if(phase)phase.textContent=zone.outside?"OUTSIDE ZONE":"SURVIVAL";if(zt){const sec=Math.max(0,Math.floor(zoneClock));zt.textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");}
  const ammoEl=document.getElementById("ammo");if(ammoEl)ammoEl.textContent=reloadTimer>0?"RELOADING":ammo+" / 30";
  const aimEl=document.getElementById("aimBtn");if(aimEl)aimEl.textContent=input.aim?"AIM ON":"AIM";
  const nearby=getNearbyInteraction(player.x,player.y),hint=document.getElementById("message");if(hint&&!hint.dataset.combat){hint.textContent=nearby?nearby.label:"";hint.style.opacity=nearby?"1":"0";}
  const compass=document.getElementById("compass");if(compass){const deg=((yaw*180/Math.PI)%360+360)%360,n=["N","NE","E","SE","S","SW","W","NW"];compass.textContent=n[Math.round(deg/45)%8]+" • "+Math.round(deg)+"°";}
  updateInventoryHud();drawMinimap();
  zoneClock=Math.max(0,zoneClock-dt);
  if(zone.outside)player.hp=Math.max(0,player.hp-4*dt);
  if(player.hp<=0){showCombatMessage("YOU ARE DOWN");input.fire=false;}
}
function update(dt){
  yaw=input.cameraYaw;pitch=input.cameraPitch;
  if(fireCooldown>0)fireCooldown=Math.max(0,fireCooldown-dt);
  if(reloadTimer>0){reloadTimer=Math.max(0,reloadTimer-dt);if(reloadTimer===0)ammo=30;}
  if(input.fire&&player.hp>0)fireWeapon();updatePlayer3D(dt);
  updateBots(dt,player);
  if(playerGroup){playerGroup.position.set(player.x,0,player.y);if(moveVector.lengthSq()>.0001)playerGroup.rotation.y=Math.atan2(moveVector.x,-moveVector.z);}
  updateCamera(dt);updateHud(dt);
}
function setupUi(){
  const bag=document.getElementById("bagBtn"),inv=document.getElementById("inventory");if(bag&&inv)bag.onclick=()=>inv.style.display=inv.style.display==="block"?"none":"block";
  const fire=document.getElementById("fireBtn");if(fire){const a=()=>{input.fire=true;fireWeapon();},b=()=>input.fire=false;fire.addEventListener("pointerdown",a);fire.addEventListener("pointerup",b);fire.addEventListener("pointercancel",b);fire.addEventListener("pointerleave",b);}
  const aim=document.getElementById("aimBtn");if(aim)aim.onclick=()=>input.aim=!input.aim;
  const reload=document.getElementById("reloadBtn");if(reload)reload.onclick=()=>{if(reloadTimer<=0&&ammo<30)reloadTimer=1.05;};
  const action=document.getElementById("actionBtn");if(action)action.onclick=pickupNearby;
  const v=document.querySelector(".version"),vs=document.querySelector(".versionStart");if(v)v.textContent="VIRELIA v"+VERSION;if(vs)vs.textContent="VERSION "+VERSION;
}
function loop(t){if(!running)return;const dt=Math.min((t-lastTime)/1000,.033);lastTime=t;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop);}
export function startGame(){
  if(running)return;input.cameraYaw=.35;input.cameraPitch=.22;input.x=0;input.y=0;input.crouch=false;input.fire=false;input.aim=false;ammo=30;reloadTimer=0;zoneClock=300;player.hp=100;player.stamina=100;
  for(const k of Object.keys(inventory))inventory[k]=["helmet","vest","backpack","shoes"].includes(k)?"-":0;
  running=true;resize();createWorld(scene);createBots(scene);createPlayer();player.x=world.spawn.x;player.y=world.spawn.y;setupInput();setupUi();lastTime=performance.now();requestAnimationFrame(loop);
}
addEventListener("resize",resize);addEventListener("orientationchange",()=>setTimeout(resize,150));