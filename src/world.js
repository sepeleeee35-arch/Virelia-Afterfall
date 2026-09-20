export const world = {
  width: 6000,
  height: 4500,

  roads: [],
  buildings: [],
  trees: [],
  hills: [],
  water: [],
  bridges: [],
  landmarks: [],
  vehicles: []
};

function road(x, y, w, h){
  world.roads.push({x,y,w,h});
}

function building(x, y, w, h, type="house"){
  world.buildings.push({x,y,w,h,type});
}

function tree(x,y,r=22){
  world.trees.push({x,y,r});
}

export function createWorld(){

  world.roads.length = 0;
  world.buildings.length = 0;
  world.trees.length = 0;
  world.hills.length = 0;
  world.water.length = 0;
  world.bridges.length = 0;
  world.landmarks.length = 0;
  world.vehicles.length = 0;

  /* =========================
     MAIN ROADS
  ========================= */

  road(0,2050,6000,180);
  road(2850,0,180,4500);

  road(700,700,4200,120);
  road(700,3600,4200,120);

  road(700,700,120,3000);

  /* =========================
     COAST
  ========================= */

  world.water.push({
    x:4700,
    y:0,
    w:1300,
    h:4500
  });

  /* =========================
     BRIDGE
  ========================= */

  world.bridges.push({
    x:4200,
    y:1950,
    w:1000,
    h:380
  });

  /* =========================
     NORTH COMPOUND
  ========================= */

  const north = [
    [1050,850,230,160],
    [1350,850,180,150],
    [1050,1100,160,130],
    [1320,1080,240,170],
    [1650,900,190,150]
  ];

  north.forEach(
    b => building(...b,"compound")
  );

  /* =========================
     WEST TOWN
  ========================= */

  for(let y=900;y<1800;y+=260){

    building(
      350,
      y,
      190,
      150,
      "house"
    );

    building(
      620,
      y+40,
      190,
      150,
      "house"
    );

  }

  /* =========================
     EAST TOWN
  ========================= */

  for(let y=850;y<1800;y+=270){

    building(
      3350,
      y,
      220,
      160,
      "house"
    );

    building(
      3650,
      y+30,
      190,
      140,
      "house"
    );

    building(
      3920,
      y,
      220,
      170,
      "warehouse"
    );

  }

  /* =========================
     SOUTH COMPOUNDS
  ========================= */

  for(let x=650;x<2300;x+=330){

    building(
      x,
      3250,
      230,
      170,
      "compound"
    );

  }

  for(let x=3200;x<4450;x+=300){

    building(
      x,
      3400,
      210,
      160,
      "compound"
    );

  }

  /* =========================
     LARGE LANDMARK
  ========================= */

  world.landmarks.push({
    x:2400,
    y:1200,
    w:650,
    h:520,
    name:"CENTRAL FORT"
  });

  building(
    2450,
    1250,
    550,
    420,
    "landmark"
  );

  /* =========================
     COASTAL BUILDINGS
  ========================= */

  building(
    4200,
    700,
    350,
    230,
    "harbor"
  );

  building(
    4250,
    1050,
    260,
    180,
    "harbor"
  );

  /* =========================
     HILLS
  ========================= */

  world.hills.push(
    {
      x:500,
      y:300,
      w:1000,
      h:550,
      level:1
    },
    {
      x:1550,
      y:250,
      w:900,
      h:600,
      level:2
    },
    {
      x:900,
      y:2700,
      w:1200,
      h:700,
      level:2
    },
    {
      x:3000,
      y:2700,
      w:1000,
      h:600,
      level:1
    }
  );

  /* =========================
     TREES
  ========================= */

  for(let i=0;i<190;i++){

    const x =
      120 +
      Math.random()*4300;

    const y =
      120 +
      Math.random()*4200;

    /*
      jangan taruh di laut
    */

    if(x>4700)
      continue;

    tree(
      x,
      y,
      16+Math.random()*12
    );
  }

  /* =========================
     VEHICLES
  ========================= */

  for(let i=0;i<25;i++){

    world.vehicles.push({

      x:
        400+
        Math.random()*4000,

      y:
        500+
        Math.random()*3500,

      angle:
        Math.random()*Math.PI*2

    });

  }

  return world;
}