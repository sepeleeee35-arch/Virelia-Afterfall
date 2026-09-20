import {
  input,
  setupInput,
  consumeAction,
  consumeBag
} from "./input.js";

import {
  player,
  updatePlayer
} from "./player.js";

import {
  createBots,
  bots,
  updateBots
} from "./bots.js";

import {
  createLoot,
  loot,
  pickupNearest
} from "./loot.js";

import {
  zone,
  updateZone
} from "./zone.js";

import {
  world,
  createWorld
} from "./world.js";

import {
  updateUI,
  showMessage
} from "./ui.js";

const canvas =
  document.getElementById(
    "game"
  );

const ctx =
  canvas.getContext("2d");

const mini =
  document.getElementById(
    "mini"
  );

const mctx =
  mini.getContext("2d");

let W=innerWidth;
let H=innerHeight;

const camera={
  x:0,
  y:0
};

let started=false;
let lastTime=0;

export function startGame(){

  if(started)
    return;

  started=true;

  resize();

  createWorld();

  createBots(world);

  createLoot(world);

  setupInput();

  document.getElementById(
    "start"
  ).style.display="none";

  camera.x=player.x;
  camera.y=player.y;

  lastTime=
    performance.now();

  requestAnimationFrame(loop);
}

function resize(){

  W=innerWidth;
  H=innerHeight;

  canvas.width=W;
  canvas.height=H;

  mini.width =
    mini.clientWidth *
    devicePixelRatio;

  mini.height =
    mini.clientHeight *
    devicePixelRatio;
}

addEventListener(
  "resize",
  resize
);

function update(dt){

  updatePlayer(
    dt,
    world
  );

  updateBots(
    dt,
    world
  );

  updateZone(dt);

  if(
    consumeAction()
  ){

    const result =
      pickupNearest();

    showMessage(result);
  }

  if(
    consumeBag()
  ){

    const inv =
      document.getElementById(
        "inventory"
      );

    inv.style.display =
      inv.style.display === "block"
      ? "none"
      : "block";
  }

  camera.x +=
    (
      player.x-camera.x
    )*.12;

  camera.y +=
    (
      player.y-camera.y
    )*.12;

  updateUI(dt);
}

function loop(time){

  const dt =
    Math.min(
      .033,
      (time-lastTime)/1000
    );

  lastTime=time;

  update(dt);

  render();

  requestAnimationFrame(
    loop
  );
}

/* =========================================================
   DRAW
   ========================================================= */

function screenPosition(
  x,
  y
){

  return {

    x:
      W/2+
      (x-camera.x),

    y:
      H/2+
      (y-camera.y)
  };
}

function render(){

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  ctx.fillStyle="#728b5d";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  drawRoads();
  drawBuildings();
  drawTrees();
  drawVehicles();
  drawLoot();
  drawBots();
  drawZone();
  drawPlayer();

  drawMiniMap();
}

function drawRoads(){

  for(
    const r of world.roads
  ){

    const p =
      screenPosition(
        r.x,
        r.y
      );

    ctx.fillStyle="#4e5552";

    ctx.fillRect(
      p.x,
      p.y,
      r.w,
      r.h
    );

    ctx.strokeStyle="#d5c96c";
    ctx.lineWidth=3;

    ctx.setLineDash([
      22,
      18
    ]);

    if(r.w>r.h){

      ctx.beginPath();

      ctx.moveTo(
        p.x,
        p.y+r.h/2
      );

      ctx.lineTo(
        p.x+r.w,
        p.y+r.h/2
      );

      ctx.stroke();

    }else{

      ctx.beginPath();

      ctx.moveTo(
        p.x+r.w/2,
        p.y
      );

      ctx.lineTo(
        p.x+r.w/2,
        p.y+r.h
      );

      ctx.stroke();
    }

    ctx.setLineDash([]);
  }
}

function drawBuildings(){

  for(
    const b of world.buildings
  ){

    const p =
      screenPosition(
        b.x,
        b.y
      );

    ctx.fillStyle=
      "rgba(0,0,0,.2)";

    ctx.fillRect(
      p.x+8,
      p.y+8,
      b.w,
      b.h
    );

    ctx.fillStyle="#a49b87";

    ctx.fillRect(
      p.x,
      p.y,
      b.w,
      b.h
    );

    ctx.fillStyle="#55524c";

    ctx.fillRect(
      p.x,
      p.y,
      b.w,
      35
    );

    ctx.fillStyle="#29414a";

    for(
      let x=p.x+40;
      x<p.x+b.w-20;
      x+=75
    ){

      ctx.fillRect(
        x,
        p.y+60,
        18,
        15
      );
    }
  }
}

function drawTrees(){

  for(
    const t of world.trees
  ){

    const p =
      screenPosition(
        t.x,
        t.y
      );

    if(
      p.x<-60 ||
      p.x>W+60 ||
      p.y<-60 ||
      p.y>H+60
    )
      continue;

    ctx.fillStyle="#5d4936";

    ctx.fillRect(
      p.x-4,
      p.y,
      8,
      20
    );

    ctx.fillStyle="#3f6942";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      t.r,
      0,
      Math.PI*2
    );

    ctx.fill();
  }
}

function drawVehicles(){

  for(
    const v of world.vehicles
  ){

    const p =
      screenPosition(
        v.x,
        v.y
      );

    ctx.save();

    ctx.translate(
      p.x,
      p.y
    );

    ctx.rotate(
      v.angle
    );

    ctx.fillStyle="#293438";

    ctx.fillRect(
      -25,
      -13,
      50,
      26
    );

    ctx.fillStyle="#667777";

    ctx.fillRect(
      -15,
      -9,
      30,
      18
    );

    ctx.restore();
  }
}

function drawLoot(){

  for(
    const item of loot
  ){

    if(item.taken)
      continue;

    const p =
      screenPosition(
        item.x,
        item.y
      );

    let color="#ddd";

    if(
      item.type==="helmet"
    )
      color="#d3ad50";

    if(
      item.type==="vest"
    )
      color="#54a079";

    if(
      item.type==="backpack"
    )
      color="#8069ae";

    if(
      item.type==="shoes"
    )
      color="#bb735d";

    if(
      item.type==="food"
    )
      color="#d4c15d";

    if(
      item.type==="medkit"
    )
      color="#d86c6c";

    ctx.fillStyle=color;

    ctx.fillRect(
      p.x-7,
      p.y-7,
      14,
      14
    );
  }
}

function drawBots(){

  for(
    const bot of bots
  ){

    if(!bot.alive)
      continue;

    const p =
      screenPosition(
        bot.x,
        bot.y
      );

    /* shadow */

    ctx.fillStyle=
      "rgba(0,0,0,.25)";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y+18,
      17,
      7,
      0,
      0,
      Math.PI*2
    );

    ctx.fill();

    /* body */

    ctx.fillStyle="#344b55";

    ctx.fillRect(
      p.x-11,
      p.y-28,
      22,
      32
    );

    /* head */

    ctx.fillStyle="#c08d72";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y-39,
      10,
      0,
      Math.PI*2
    );

    ctx.fill();

    /* legs */

    ctx.strokeStyle="#252d31";

    ctx.lineWidth=7;

    ctx.beginPath();

    ctx.moveTo(
      p.x-6,
      p.y+3
    );

    ctx.lineTo(
      p.x-9,
      p.y+23
    );

    ctx.moveTo(
      p.x+6,
      p.y+3
    );

    ctx.lineTo(
      p.x+9,
      p.y+23
    );

    ctx.stroke();

    /* HP */

    ctx.fillStyle="#222";

    ctx.fillRect(
      p.x-18,
      p.y-57,
      36,
      4
    );

    ctx.fillStyle="#5fd476";

    ctx.fillRect(
      p.x-18,
      p.y-57,
      36*(bot.hp/100),
      4
    );
  }
}

function drawPlayer(){

  const x=W/2;
  const y=H/2;

  /* shadow */

  ctx.fillStyle=
    "rgba(0,0,0,.32)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y+25,
    25,
    10,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  /* backpack */

  if(
    player.equipment.backpack
  ){

    ctx.fillStyle="#735d9a";

    ctx.fillRect(
      x-21,
      y-38,
      13,
      35
    );
  }

  /* body */

  ctx.fillStyle=
    player.equipment.vest
    ? "#477e6b"
    : "#394c55";

  ctx.fillRect(
    x-15,
    y-40,
    30,
    42
  );

  /* head */

  ctx.fillStyle="#bd896e";

  ctx.beginPath();

  ctx.arc(
    x,
    y-55,
    12,
    0,
    Math.PI*2
  );

  ctx.fill();

  /* helmet */

  if(
    player.equipment.helmet
  ){

    ctx.fillStyle="#343f43";

    ctx.beginPath();

    ctx.arc(
      x,
      y-58,
      13,
      Math.PI,
      Math.PI*2
    );

    ctx.fill();
  }

  /* legs */

  ctx.strokeStyle="#262e32";

  ctx.lineWidth=9;

  ctx.beginPath();

  ctx.moveTo(
    x-7,
    y+2
  );

  ctx.lineTo(
    x-10,
    y+28
  );

  ctx.moveTo(
    x+7,
    y+2
  );

  ctx.lineTo(
    x+10,
    y+28
  );

  ctx.stroke();
}

function drawZone(){

  const p =
    screenPosition(
      zone.x,
      zone.y
    );

  ctx.strokeStyle=
    "rgba(210,230,105,.75)";

  ctx.lineWidth=4;

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y,
    zone.radius,
    0,
    Math.PI*2
  );

  ctx.stroke();
}

function drawMiniMap(){

  const w=mini.width;
  const h=mini.height;

  mctx.clearRect(
    0,
    0,
    w,
    h
  );

  mctx.fillStyle="#71865c";

  mctx.fillRect(
    0,
    0,
    w,
    h
  );

  const sx =
    w/world.width;

  const sy =
    h/world.height;

  /* roads */

  mctx.strokeStyle="#4d5551";

  for(
    const r of world.roads
  ){

    mctx.lineWidth =
      Math.max(
        2,
        r.w*sx
      );

    mctx.beginPath();

    if(r.w>r.h){

      mctx.moveTo(
        r.x*sx,
        (r.y+r.h/2)*sy
      );

      mctx.lineTo(
        (r.x+r.w)*sx,
        (r.y+r.h/2)*sy
      );

    }else{

      mctx.moveTo(
        (r.x+r.w/2)*sx,
        r.y*sy
      );

      mctx.lineTo(
        (r.x+r.w/2)*sx,
        (r.y+r.h)*sy
      );
    }

    mctx.stroke();
  }

  /* buildings */

  mctx.fillStyle="#777";

  for(
    const b of world.buildings
  ){

    mctx.fillRect(
      b.x*sx,
      b.y*sy,
      Math.max(
        1,
        b.w*sx
      ),
      Math.max(
        1,
        b.h*sy
      )
    );
  }

  /* zone */

  mctx.strokeStyle="#d4df73";
  mctx.lineWidth=3;

  mctx.beginPath();

  mctx.arc(
    zone.x*sx,
    zone.y*sy,
    zone.radius*sx,
    0,
    Math.PI*2
  );

  mctx.stroke();

  /* bots */

  for(
    const bot of bots
  ){

    if(!bot.alive)
      continue;

    mctx.fillStyle="#d36565";

    mctx.fillRect(
      bot.x*sx-2,
      bot.y*sy-2,
      4,
      4
    );
  }

  /* player */

  mctx.fillStyle="#fff";

  mctx.beginPath();

  mctx.arc(
    player.x*sx,
    player.y*sy,
    5,
    0,
    Math.PI*2
  );

  mctx.fill();
}