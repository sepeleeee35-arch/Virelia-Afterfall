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

const VERSION = "0.5.0";

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
}

function update(dt){
  updatePlayer(dt);
  updateBots(dt);

  camera.x += (player.x-camera.x)*0.16;
  camera.y += (player.y-camera.y)*0.16;

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
}

function render(){
  ctx.clearRect(0,0,width,height);

  ctx.fillStyle="#6f875e";
  ctx.fillRect(0,0,width,height);

  ctx.save();
  ctx.translate(width/2-camera.x,height/2-camera.y);

  drawWorld(ctx);
  drawBots(ctx);
  drawPlayer(ctx);

  ctx.restore();

  drawMinimap();
}

function drawPlayer(ctx){
  const x=player.x,y=player.y;

  ctx.fillStyle="rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(x,y+25,22,8,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#293b43";
  ctx.fillRect(x-14,y-39,28,42);

  ctx.fillStyle="#50656b";
  ctx.fillRect(x-19,y-31,38,10);

  ctx.fillStyle="#c18d72";
  ctx.beginPath();
  ctx.arc(x,y-52,11,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#242729";
  ctx.beginPath();
  ctx.arc(x,y-57,12,Math.PI,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="#20282c";
  ctx.lineWidth=8;
  ctx.beginPath();
  ctx.moveTo(x-7,y+3);
  ctx.lineTo(x-10,y+27);
  ctx.moveTo(x+7,y+3);
  ctx.lineTo(x+10,y+27);
  ctx.stroke();

  ctx.fillStyle="#e8d76a";
  ctx.fillRect(x-4,y-2,8,5);
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

  camera.x=player.x;
  camera.y=player.y;
  lastTime=performance.now();

  requestAnimationFrame(loop);
}

window.addEventListener("resize",resize);
window.addEventListener("orientationchange",()=>setTimeout(resize,150));
