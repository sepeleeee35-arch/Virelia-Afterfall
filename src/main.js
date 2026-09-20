import { input, setupInput } from "./input.js";
import { player, updatePlayer } from "./player.js";
import {
  world,
  createWorld,
  drawWorld,
  getZoneState,
  getNearbyInteraction
} from "./world.js";
import {
  bots,
  createBots,
  updateBots,
  drawBots
} from "./bots.js";

const VERSION = "1.0.0";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const miniCanvas = document.getElementById("mini");
const miniCtx = miniCanvas ? miniCanvas.getContext("2d") : null;

let width = 1;
let height = 1;
let running = false;
let lastTime = 0;
let inventoryOpen = false;
let zoneTime = 300;
let feedTimer = 0;

const camera = { x: 0, y: 0 };

function resize(){
  width = window.innerWidth;
  height = window.innerHeight;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr,0,0,dpr,0,0);

  if(miniCanvas && miniCtx){
    const mdpr = Math.min(window.devicePixelRatio || 1, 2);
    miniCanvas.width = 118 * mdpr;
    miniCanvas.height = 118 * mdpr;
    miniCtx.setTransform(mdpr,0,0,mdpr,0,0);
  }
}

function formatTime(value){
  const total = Math.max(0,Math.floor(value));
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function updateHud(dt){
  const hpBar = document.getElementById("hpBar");
  const staminaBar = document.getElementById("staminaBar");
  const alive = document.getElementById("alive");
  const zoneTimer = document.getElementById("zoneTimer");
  const phase = document.getElementById("phase");
  const message = document.getElementById("message");

  if(hpBar) hpBar.style.width = `${Math.max(0,Math.min(100,player.hp))}%`;
  if(staminaBar) staminaBar.style.width = `${Math.max(0,Math.min(100,player.stamina))}%`;
  if(alive) alive.textContent = String(bots.filter(b => b.hp > 0).length + 1);

  zoneTime = Math.max(0,zoneTime - dt);
  if(zoneTimer) zoneTimer.textContent = formatTime(zoneTime);

  const zone = getZoneState(player.x,player.y);
  if(phase) phase.textContent = zone.outside ? "MOVE TO ZONE" : "SURVIVAL";

  const nearby = getNearbyInteraction(player.x,player.y);
  if(message){
    if(nearby){
      message.textContent = nearby.label;
      message.style.opacity = "1";
    }else{
      message.style.opacity = "0";
    }
  }

  feedTimer = Math.max(0,feedTimer-dt);
  if(feedTimer === 0){
    const feed = document.getElementById("statusFeed");
    if(feed && nearby){
      feed.innerHTML = `<div>• ${nearby.label}</div>`;
      feedTimer = 2;
    }
  }

  const compass = document.getElementById("compass");
  if(compass){
    const deg = ((input.cameraYaw * 180 / Math.PI) % 360 + 360) % 360;
    const names = ["E","SE","S","SW","W","NW","N","NE"];
    const index = Math.round(deg / 45) % 8;
    compass.textContent = `CAM ${names[index]}  •  SWIPE RIGHT TO LOOK`;
  }
}

function update(dt){
  updatePlayer(dt);
  updateBots(dt);

  const forwardX = Math.cos(input.cameraYaw);
  const forwardY = Math.sin(input.cameraYaw);

  const targetX = player.x + forwardX * 250;
  const targetY = player.y + forwardY * 250;

  camera.x += (targetX-camera.x)*0.13;
  camera.y += (targetY-camera.y)*0.13;

  camera.x = Math.max(width/2,Math.min(world.width-width/2,camera.x));
  camera.y = Math.max(height/2,Math.min(world.height-height/2,camera.y));

  updateHud(dt);
}

function drawMinimap(){
  if(!miniCtx) return;

  const w=118,h=118;
  miniCtx.clearRect(0,0,w,h);
  miniCtx.fillStyle="#71875f";
  miniCtx.fillRect(0,0,w,h);

  const sx=w/world.width, sy=h/world.height;

  miniCtx.fillStyle="#4c5856";
  for(const road of world.roads){
    miniCtx.fillRect(road.x*sx,road.y*sy,road.w*sx,road.h*sy);
  }

  miniCtx.fillStyle="#8f8878";
  for(const b of world.buildings){
    miniCtx.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);
  }

  miniCtx.fillStyle="#4b7e8d";
  miniCtx.fillRect(4700*sx,0,1300*sx,h);

  miniCtx.strokeStyle="rgba(255,255,255,.8)";
  miniCtx.lineWidth=1.5;
  miniCtx.beginPath();
  miniCtx.arc(
    world.safeZone.x*sx,
    world.safeZone.y*sy,
    world.safeZone.radius*Math.min(sx,sy),
    0,
    Math.PI*2
  );
  miniCtx.stroke();

  miniCtx.fillStyle="#e9d987";
  for(const loot of world.loot){
    if(!loot.taken){
      miniCtx.fillRect(loot.x*sx-1,loot.y*sy-1,2,2);
    }
  }

  miniCtx.fillStyle="#e8edf0";
  for(const bot of bots){
    if(bot.hp>0){
      miniCtx.fillRect(bot.x*sx-1,bot.y*sy-1,2,2);
    }
  }

  miniCtx.fillStyle="#fff";
  miniCtx.beginPath();
  miniCtx.arc(player.x*sx,player.y*sy,3,0,Math.PI*2);
  miniCtx.fill();

  const dirX = Math.cos(input.cameraYaw);
  const dirY = Math.sin(input.cameraYaw);
  miniCtx.strokeStyle="#fff";
  miniCtx.lineWidth=2;
  miniCtx.beginPath();
  miniCtx.moveTo(player.x*sx,player.y*sy);
  miniCtx.lineTo((player.x+dirX*180)*sx,(player.y+dirY*180)*sy);
  miniCtx.stroke();
}

function render(){
  ctx.clearRect(0,0,width,height);

  ctx.fillStyle="#86a7b0";
  ctx.fillRect(0,0,width,height*0.34);

  ctx.save();

  const zoom = player.crouch ? 1.18 : input.run ? 1.10 : 1.24;

  ctx.translate(width/2,height*0.64);
  ctx.rotate(-input.cameraYaw - Math.PI/2);
  ctx.scale(zoom,zoom*0.62);
  ctx.translate(-camera.x,-camera.y);

  drawWorld(ctx);
  drawBots(ctx);

  ctx.restore();

  drawThirdPersonPlayer();
  drawMinimap();
}

function drawThirdPersonPlayer(){
  const x=width/2;
  const y=height*0.73;
  const scale=player.crouch ? 0.82 : 1;

  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);

  ctx.fillStyle="rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(0,31,30,9,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#172329";
  ctx.fillRect(-15,-4,30,37);

  ctx.fillStyle="#405963";
  ctx.fillRect(-22,0,44,12);

  ctx.fillStyle="#c58f73";
  ctx.beginPath();
  ctx.arc(0,-21,13,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#20272a";
  ctx.beginPath();
  ctx.arc(0,-26,14,Math.PI,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#26363c";
  ctx.fillRect(-24,5,8,28);
  ctx.fillRect(16,5,8,28);

  ctx.fillStyle="#101719";
  ctx.fillRect(-13,31,10,10);
  ctx.fillRect(3,31,10,10);

  ctx.fillStyle="#6f858b";
  ctx.fillRect(-26,8,8,20);
  ctx.fillRect(18,8,8,20);

  ctx.fillStyle="#e2d56b";
  ctx.fillRect(-5,4,10,5);

  ctx.strokeStyle="rgba(255,255,255,.75)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-7,-4);
  ctx.lineTo(-11,5);
  ctx.moveTo(7,-4);
  ctx.lineTo(11,5);
  ctx.stroke();

  ctx.restore();
}

function setupUi(){
  const bag=document.getElementById("bagBtn");
  const inventory=document.getElementById("inventory");

  if(bag && inventory){
    bag.addEventListener("click",()=>{
      inventoryOpen=!inventoryOpen;
      inventory.style.display=inventoryOpen?"block":"none";
    });
  }

  const action=document.getElementById("actionBtn");
  if(action){
    action.addEventListener("click",()=>{
      const interaction=getNearbyInteraction(player.x,player.y);
      const message=document.getElementById("message");
      if(message){
        message.textContent=interaction ? interaction.result : "Tidak ada yang bisa digunakan di sini.";
        message.style.opacity="1";
        setTimeout(()=>{
          if(message) message.style.opacity="0";
        },1200);
      }
    });
  }

  const version=document.querySelector(".version");
  const startVersion=document.querySelector(".versionStart");
  if(version) version.textContent=`VIRELIA v${VERSION}`;
  if(startVersion) startVersion.textContent=`VERSION ${VERSION}`;
}

function loop(time){
  if(!running) return;

  const dt=Math.min((time-lastTime)/1000,0.033);
  lastTime=time;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

export function startGame(){
  if(running) return;

  running=true;
  resize();
  createWorld();

  player.x=world.spawn.x;
  player.y=world.spawn.y;
  player.hp=100;
  player.stamina=100;

  createBots();
  setupInput();
  setupUi();

  camera.x=player.x + Math.cos(input.cameraYaw)*250;
  camera.y=player.y + Math.sin(input.cameraYaw)*250;
  lastTime=performance.now();

  requestAnimationFrame(loop);
}

window.addEventListener("resize",resize);
window.addEventListener("orientationchange",()=>setTimeout(resize,150));
