import {
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
  document.getElementById("game");

const ctx =
  canvas.getContext("2d");


const mini =
  document.getElementById("mini");

const mctx =
  mini.getContext("2d");


let W = 1;
let H = 1;

let started = false;

let lastTime = 0;


/*
  KAMERA

  Kamera tidak lagi bebas.
  Kamera selalu mengikuti player.
*/

const camera = {

  x: 0,
  y: 0,

  smooth: 0.12
};


/* =========================================
   START
========================================= */

export function startGame(){

  if(started)
    return;

  started = true;

  resizeCanvas();

  createWorld();

  /*
    Pastikan player berada di area
    yang valid.
  */

  player.x = 6000;
  player.y = 5200;

  createBots(world);

  createLoot(world);

  setupInput();

  document
    .getElementById("start")
    .style.display = "none";

  camera.x = player.x;
  camera.y = player.y;

  lastTime =
    performance.now();

  requestAnimationFrame(loop);
}


/* =========================================
   RESIZE
========================================= */

function resizeCanvas(){

  const ratio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  W = Math.max(
    1,
    window.innerWidth
  );

  H = Math.max(
    1,
    window.innerHeight
  );

  canvas.width =
    Math.floor(W * ratio);

  canvas.height =
    Math.floor(H * ratio);

  canvas.style.width =
    W + "px";

  canvas.style.height =
    H + "px";

  /*
    Semua drawing menggunakan
    ukuran CSS pixel.
  */

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );


  const mw =
    Math.max(
      1,
      mini.clientWidth
    );

  const mh =
    Math.max(
      1,
      mini.clientHeight
    );

  mini.width =
    Math.floor(mw * ratio);

  mini.height =
    Math.floor(mh * ratio);

  mctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );
}


window.addEventListener(
  "resize",
  () => {

    resizeCanvas();

  }
);


window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(
      resizeCanvas,
      150
    );

  }
);


/* =========================================
   UPDATE
========================================= */

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


  /*
    CAMERA FOLLOW

    Posisi kamera ditarik ke player.
  */

  camera.x +=
    (
      player.x -
      camera.x
    ) *
    camera.smooth;

  camera.y +=
    (
      player.y -
      camera.y
    ) *
    camera.smooth;


  /*
    Jangan biarkan kamera keluar
    terlalu jauh dari map.
  */

  const halfW =
    W / 2;

  const halfH =
    H / 2;


  camera.x =
    Math.max(
      halfW,
      Math.min(
        world.width-halfW,
        camera.x
      )
    );


  camera.y =
    Math.max(
      halfH,
      Math.min(
        world.height-halfH,
        camera.y
      )
    );


  updateUI(dt);
}


/* =========================================
   LOOP
========================================= */

function loop(time){

  if(!started)
    return;


  let dt =
    (time-lastTime) /
    1000;

  lastTime = time;


  /*
    Anti lag besar.
  */

  dt =
    Math.max(
      0,
      Math.min(
        dt,
        0.033
      )
    );


  update(dt);

  render();


  requestAnimationFrame(
    loop
  );
}


/* =========================================
   SCREEN POSITION
========================================= */

function screenPosition(
  x,
  y
){

  return {

    x:
      W/2 +
      (x-camera.x),

    y:
      H/2 +
      (y-camera.y)

  };
}


/* =========================================
   RENDER
========================================= */

function render(){

  /*
    Bersihkan frame
  */

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  /*
    BASE TERRAIN
  */

  ctx.fillStyle =
    "#728b5d";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
    WORLD
  */

  drawRoads();

  drawBuildings();

  drawTrees();

  drawVehicles();

  drawLoot();

  drawBots();

  drawZone();


  /*
    PLAYER TERAKHIR
    supaya selalu berada di atas.
  */

  drawPlayer();


  /*
    MINIMAP
  */

  drawMiniMap();
}


/* =========================================
   ROADS
========================================= */

function drawRoads(){

  for(
    const r of world.roads
  ){

    const p =
      screenPosition(
        r.x,
        r.y
      );


    ctx.fillStyle =
      "#505754";


    ctx.fillRect(
      p.x,
      p.y,
      r.w,
      r.h
    );


    /*
      Road marking
    */

    ctx.strokeStyle =
      "#d7cc70";

    ctx.lineWidth = 3;

    ctx.setLineDash([
      24,
      20
    ]);


    if(r.w >= r.h){

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


/* =========================================
   BUILDINGS
========================================= */

function drawBuildings(){

  for(
    const b of world.buildings
  ){

    const p =
      screenPosition(
        b.x,
        b.y
      );


    /*
      Culling
      supaya HP mobile tidak menggambar
      seluruh map.
    */

    if(
      p.x > W+500 ||
      p.y > H+500 ||
      p.x+b.w < -500 ||
      p.y+b.h < -500
    )
      continue;


    /*
      Shadow
    */

    ctx.fillStyle =
      "rgba(0,0,0,.20)";

    ctx.fillRect(
      p.x+8,
      p.y+8,
      b.w,
      b.h
    );


    /*
      Building
    */

    ctx.fillStyle =
      "#a69c87";

    ctx.fillRect(
      p.x,
      p.y,
      b.w,
      b.h
    );


    /*
      Roof
    */

    ctx.fillStyle =
      "#55514b";

    ctx.fillRect(
      p.x,
      p.y,
      b.w,
      34
    );


    /*
      Windows
    */

    ctx.fillStyle =
      "#29424a";


    for(
      let x =
        p.x+38;

      x <
        p.x+b.w-20;

      x += 72
    ){

      ctx.fillRect(
        x,
        p.y+62,
        18,
        15
      );
    }
  }
}


/* =========================================
   TREES
========================================= */

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
      p.x < -60 ||
      p.x > W+60 ||
      p.y < -60 ||
      p.y > H+60
    )
      continue;


    /*
      trunk
    */

    ctx.fillStyle =
      "#5d4936";

    ctx.fillRect(
      p.x-4,
      p.y,
      8,
      20
    );


    /*
      crown
    */

    ctx.fillStyle =
      "#416b44";

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


/* =========================================
   VEHICLES
========================================= */

function drawVehicles(){

  for(
    const v of world.vehicles
  ){

    const p =
      screenPosition(
        v.x,
        v.y
      );


    if(
      p.x < -80 ||
      p.x > W+80 ||
      p.y < -80 ||
      p.y > H+80
    )
      continue;


    ctx.save();

    ctx.translate(
      p.x,
      p.y
    );

    ctx.rotate(
      v.angle
    );


    ctx.fillStyle =
      "#293538";

    ctx.fillRect(
      -25,
      -13,
      50,
      26
    );


    ctx.fillStyle =
      "#667778";

    ctx.fillRect(
      -15,
      -9,
      30,
      18
    );


    ctx.restore();
  }
}


/* =========================================
   LOOT
========================================= */

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


    if(
      p.x < -30 ||
      p.x > W+30 ||
      p.y < -30 ||
      p.y > H+30
    )
      continue;


    let color =
      "#ddd";


    if(
      item.type === "helmet"
    )
      color="#d4ad51";


    if(
      item.type === "vest"
    )
      color="#54a079";


    if(
      item.type === "backpack"
    )
      color="#8069ae";


    if(
      item.type === "shoes"
    )
      color="#bb735d";


    if(
      item.type === "food"
    )
      color="#d4c15d";


    if(
      item.type === "medkit"
    )
      color="#d86c6c";


    ctx.fillStyle =
      color;

    ctx.fillRect(
      p.x-7,
      p.y-7,
      14,
      14
    );
  }
}


/* =========================================
   BOTS
========================================= */

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


    if(
      p.x < -70 ||
      p.x > W+70 ||
      p.y < -80 ||
      p.y > H+80
    )
      continue;


    /*
      shadow
    */

    ctx.fillStyle =
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


    /*
      body
    */

    ctx.fillStyle =
      "#344b55";

    ctx.fillRect(
      p.x-11,
      p.y-28,
      22,
      32
    );


    /*
      head
    */

    ctx.fillStyle =
      "#c08d72";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y-39,
      10,
      0,
      Math.PI*2
    );

    ctx.fill();


    /*
      legs
    */

    ctx.strokeStyle =
      "#252d31";

    ctx.lineWidth = 7;

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


    /*
      HP
    */

    ctx.fillStyle =
      "#222";

    ctx.fillRect(
      p.x-18,
      p.y-57,
      36,
      4
    );


    ctx.fillStyle =
      "#5fd476";

    ctx.fillRect(
      p.x-18,
      p.y-57,
      36 *
      Math.max(
        0,
        bot.hp/100
      ),
      4
    );
  }
}


/* =========================================
   PLAYER
========================================= */

function drawPlayer(){

  /*
    PLAYER SELALU DI TENGAH.

    Ini penting:
    kamera bergerak mengikuti player,
    bukan player yang "lari" dari layar.
  */

  const x =
    W/2;

  const y =
    H/2;


  /*
    shadow
  */

  ctx.fillStyle =
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


  /*
    backpack
  */

  if(
    player.equipment.backpack
  ){

    ctx.fillStyle =
      "#735d9a";

    ctx.fillRect(
      x-21,
      y-38,
      13,
      35
    );
  }


  /*
    body
  */

  ctx.fillStyle =
    player.equipment.vest
    ? "#477e6b"
    : "#394c55";

  ctx.fillRect(
    x-15,
    y-40,
    30,
    42
  );


  /*
    head
  */

  ctx.fillStyle =
    "#bd896e";

  ctx.beginPath();

  ctx.arc(
    x,
    y-55,
    12,
    0,
    Math.PI*2
  );

  ctx.fill();


  /*
    helmet
  */

  if(
    player.equipment.helmet
  ){

    ctx.fillStyle =
      "#343f43";

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


  /*
    legs
  */

  ctx.strokeStyle =
    "#262e32";

  ctx.lineWidth = 9;

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


/* =========================================
   SAFE ZONE
========================================= */

function drawZone(){

  const p =
    screenPosition(
      zone.x,
      zone.y
    );


  /*
    Jangan menggambar circle
    kalau terlalu jauh dari layar.
  */

  ctx.strokeStyle =
    "rgba(210,230,105,.72)";

  ctx.lineWidth = 4;

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


/* =========================================
   MINIMAP
========================================= */

function drawMiniMap(){

  const w =
    mini.clientWidth;

  const h =
    mini.clientHeight;


  mctx.clearRect(
    0,
    0,
    w,
    h
  );


  /*
    background
  */

  mctx.fillStyle =
    "#71865c";

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


  /*
    roads
  */

  mctx.strokeStyle =
    "#4d5551";


  for(
    const r of world.roads
  ){

    mctx.lineWidth =
      Math.max(
        2,
        Math.min(
          8,
          r.w*sx
        )
      );


    mctx.beginPath();


    if(
      r.w >= r.h
    ){

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


  /*
    buildings
  */

  mctx.fillStyle =
    "#777";


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


  /*
    safe zone
  */

  mctx.strokeStyle =
    "#d4df73";

  mctx.lineWidth = 2;

  mctx.beginPath();

  mctx.arc(
    zone.x*sx,
    zone.y*sy,
    zone.radius*sx,
    0,
    Math.PI*2
  );

  mctx.stroke();


  /*
    bots
  */

  for(
    const bot of bots
  ){

    if(!bot.alive)
      continue;


    mctx.fillStyle =
      "#d36565";

    mctx.fillRect(
      bot.x*sx-2,
      bot.y*sy-2,
      4,
      4
    );
  }


  /*
    player
  */

  mctx.fillStyle =
    "#ffffff";

  mctx.beginPath();

  mctx.arc(
    player.x*sx,
    player.y*sy,
    4,
    0,
    Math.PI*2
  );

  mctx.fill();
}