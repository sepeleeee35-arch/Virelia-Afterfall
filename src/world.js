export const world = {
  width: 6000,
  height: 4500,
  roads: [],
  buildings: [],
  trees: [],
  hills: [],
  vehicles: [],
  loot: [],
  safeZone: { x: 3000, y: 2250, radius: 1850 },
  spawn: { x: 3000, y: 2250 }
};

function addBuilding(x,y,w,h,type,label=""){
  world.buildings.push({x,y,w,h,type,label});
}

export function createWorld(){
  world.roads=[];
  world.buildings=[];
  world.trees=[];
  world.hills=[];
  world.vehicles=[];
  world.loot=[];

  world.safeZone={x:3000,y:2250,radius:1850};
  world.spawn={x:3000,y:2250};

  world.roads.push(
    {x:0,y:2050,w:6000,h:180,type:"main"},
    {x:2910,y:0,w:180,h:4500,type:"main"},
    {x:350,y:650,w:2300,h:120,type:"local"},
    {x:3650,y:650,w:1900,h:120,type:"local"},
    {x:450,y:3550,w:2000,h:120,type:"local"},
    {x:3500,y:3550,w:2050,h:120,type:"local"}
  );

  world.hills.push(
    {x:180,y:120,w:1250,h:720,level:1},
    {x:1450,y:180,w:1100,h:760,level:2},
    {x:330,y:2720,w:1450,h:700,level:1},
    {x:3300,y:2680,w:1350,h:780,level:2},
    {x:4550,y:250,w:850,h:1050,level:1}
  );

  addBuilding(2320,1180,760,560,"landmark","CENTRAL FORT");
  addBuilding(2600,1850,380,260,"market","MARKET");
  addBuilding(3350,1350,520,300,"warehouse","WAREHOUSE");
  addBuilding(4050,900,460,300,"warehouse","DEPOT");
  addBuilding(950,2500,520,340,"compound","WEST COMPOUND");
  addBuilding(3500,2550,560,350,"compound","EAST COMPOUND");
  addBuilding(1500,3550,650,300,"compound","SOUTH ESTATE");

  for(let row=0;row<4;row++){
    for(let col=0;col<3;col++){
      addBuilding(
        380+col*300,
        850+row*250+(col%2)*25,
        205,
        145,
        "house",
        "HOMESTEAD"
      );
    }
  }

  for(let row=0;row<4;row++){
    for(let col=0;col<3;col++){
      addBuilding(
        3900+col*300,
        700+row*260+(col%2)*30,
        215,
        150,
        "house",
        "COASTAL HOMESTEAD"
      );
    }
  }

  for(let i=0;i<8;i++){
    addBuilding(650+i*300,3200,230,160,"compound","SOUTH BLOCK");
  }

  for(let i=0;i<7;i++){
    addBuilding(3300+i*290,3250,220,155,"compound","EAST BLOCK");
  }

  for(let i=0;i<220;i++){
    const x=80+Math.random()*4300;
    const y=80+Math.random()*4200;
    if(x>4400) continue;
    world.trees.push({x,y,r:13+Math.random()*14});
  }

  for(let i=0;i<28;i++){
    world.vehicles.push({
      x:250+Math.random()*4050,
      y:280+Math.random()*3800,
      angle:Math.random()*Math.PI*2,
      used:false
    });
  }

  const lootTypes=["HELMET","VEST","BACKPACK","SHOES","MEDKIT","FOOD"];
  for(let i=0;i<90;i++){
    const type=lootTypes[i%lootTypes.length];
    world.loot.push({
      x:300+Math.random()*4050,
      y:250+Math.random()*3900,
      type,
      taken:false
    });
  }
}

export function getZoneState(x,y){
  const d=Math.hypot(x-world.safeZone.x,y-world.safeZone.y);
  return {distance:d,inside:d<=world.safeZone.radius,outside:d>world.safeZone.radius};
}

export function getNearbyInteraction(x,y){
  let nearest=null;
  let best=95;

  for(const v of world.vehicles){
    const d=Math.hypot(x-v.x,y-v.y);
    if(d<best){
      best=d;
      nearest={label:"VEHICLE • tap INTERACT",result:"Vehicle ready for the next system.",type:"vehicle",object:v};
    }
  }

  for(const loot of world.loot){
    if(loot.taken) continue;
    const d=Math.hypot(x-loot.x,y-loot.y);
    if(d<best){
      best=d;
      nearest={label:`LOOT • ${loot.type}`,result:`Found ${loot.type}.`,type:"loot",object:loot};
    }
  }

  for(const b of world.buildings){
    const cx=b.x+b.w/2,cy=b.y+b.h/2;
    const d=Math.hypot(x-cx,y-cy);
    if(d<best+30){
      best=d;
      nearest={label:`${b.label||b.type.toUpperCase()} • INTERACT`,result:"Building interaction point.",type:"building",object:b};
    }
  }

  return nearest;
}

export function drawWorld(ctx){
  ctx.fillStyle="#789260";
  ctx.fillRect(0,0,world.width,world.height);

  drawCoast(ctx);
  drawHills(ctx);
  drawRoads(ctx);
  drawBridge(ctx);
  drawBuildings(ctx);
  drawLoot(ctx);
  drawTrees(ctx);
  drawVehicles(ctx);

  ctx.strokeStyle="rgba(255,255,255,.55)";
  ctx.lineWidth=8;
  ctx.setLineDash([28,20]);
  ctx.beginPath();
  ctx.arc(world.safeZone.x,world.safeZone.y,world.safeZone.radius,0,Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCoast(ctx){
  ctx.fillStyle="#4b7e8d";
  ctx.fillRect(4700,0,1300,4500);

  ctx.fillStyle="#d1bb79";
  ctx.fillRect(4480,0,220,4500);

  ctx.fillStyle="rgba(255,255,255,.22)";
  for(let y=80;y<4400;y+=180){
    ctx.fillRect(4740,y,900,5);
  }
}

function drawHills(ctx){
  for(const hill of world.hills){
    ctx.fillStyle=hill.level===2?"#526e49":"#607b52";

    ctx.beginPath();
    ctx.ellipse(
      hill.x+hill.w/2,
      hill.y+hill.h/2,
      hill.w/2,
      hill.h/2,
      0,
      0,
      Math.PI*2
    );
    ctx.fill();

    if(hill.level===2){
      ctx.fillStyle="rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.ellipse(
        hill.x+hill.w*.52,
        hill.y+hill.h*.40,
        hill.w*.25,
        hill.h*.16,
        0,
        0,
        Math.PI*2
      );
      ctx.fill();
    }
  }
}

function drawRoads(ctx){
  for(const road of world.roads){
    ctx.fillStyle=road.type==="main"?"#4b5553":"#58615e";
    ctx.fillRect(road.x,road.y,road.w,road.h);

    ctx.strokeStyle="#303735";
    ctx.lineWidth=5;
    ctx.strokeRect(road.x,road.y,road.w,road.h);

    ctx.strokeStyle=road.type==="main"?"#e0d36f":"#aaa75e";
    ctx.lineWidth=3;
    ctx.setLineDash([28,22]);

    ctx.beginPath();
    if(road.w>road.h){
      ctx.moveTo(road.x,road.y+road.h/2);
      ctx.lineTo(road.x+road.w,road.y+road.h/2);
    }else{
      ctx.moveTo(road.x+road.w/2,road.y);
      ctx.lineTo(road.x+road.w/2,road.y+road.h);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBridge(ctx){
  ctx.fillStyle="#55595a";
  ctx.fillRect(4300,2020,600,240);
  ctx.strokeStyle="#d8cb69";
  ctx.lineWidth=4;
  ctx.setLineDash([28,20]);
  ctx.beginPath();
  ctx.moveTo(4300,2140);
  ctx.lineTo(4900,2140);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBuildings(ctx){
  for(const b of world.buildings){
    const landmark=b.type==="landmark";
    const compound=b.type==="compound";

    ctx.fillStyle=landmark?"#646663":compound?"#817b6d":"#938b79";
    ctx.fillRect(b.x,b.y,b.w,b.h);

    ctx.fillStyle=landmark?"#303535":compound?"#514d46":"#625c51";
    ctx.fillRect(b.x,b.y,b.w,34);

    ctx.fillStyle="#304952";
    const cols=Math.max(1,Math.floor(b.w/75));
    for(let i=0;i<cols;i++){
      ctx.fillRect(b.x+25+i*70,b.y+62,22,18);
    }

    ctx.fillStyle="#463b33";
    ctx.fillRect(b.x+b.w/2-13,b.y+b.h-38,26,38);

    if(landmark){
      ctx.strokeStyle="#bdb8a1";
      ctx.lineWidth=8;
      ctx.strokeRect(b.x+14,b.y+14,b.w-28,b.h-28);
      ctx.fillStyle="#eee1a1";
      ctx.font="bold 24px Arial";
      ctx.textAlign="center";
      ctx.fillText("CENTRAL FORT",b.x+b.w/2,b.y-18);
    }
  }
}

function drawLoot(ctx){
  for(const loot of world.loot){
    if(loot.taken) continue;

    ctx.fillStyle="#f0d86d";
    ctx.fillRect(loot.x-5,loot.y-5,10,10);

    ctx.strokeStyle="rgba(0,0,0,.35)";
    ctx.strokeRect(loot.x-5,loot.y-5,10,10);
  }
}

function drawTrees(ctx){
  for(const tree of world.trees){
    ctx.fillStyle="#5a4635";
    ctx.fillRect(tree.x-4,tree.y,8,22);

    ctx.fillStyle="#3e6743";
    ctx.beginPath();
    ctx.arc(tree.x,tree.y-6,tree.r,0,Math.PI*2);
    ctx.fill();
  }
}

function drawVehicles(ctx){
  for(const v of world.vehicles){
    ctx.save();
    ctx.translate(v.x,v.y);
    ctx.rotate(v.angle);

    ctx.fillStyle="#27363a";
    ctx.fillRect(-30,-15,60,30);

    ctx.fillStyle="#71878a";
    ctx.fillRect(-18,-10,36,20);

    ctx.fillStyle="#151b1d";
    ctx.fillRect(-23,-18,12,5);
    ctx.fillRect(11,-18,12,5);
    ctx.fillRect(-23,13,12,5);
    ctx.fillRect(11,13,12,5);

    ctx.restore();
  }
}
