export const world = {

  width: 12000,
  height: 9000,

  buildings: [],
  roads: [],
  trees: [],
  vehicles: []
};

export function createWorld(){

  /* ROADS */

  world.roads.push(
    {
      x:0,
      y:4300,
      w:12000,
      h:150
    }
  );

  world.roads.push(
    {
      x:5600,
      y:0,
      w:150,
      h:9000
    }
  );

  world.roads.push(
    {
      x:1500,
      y:1800,
      w:8500,
      h:100
    }
  );

  /* CITY BUILDINGS */

  for(
    let y=3000;
    y<5600;
    y+=480
  ){

    for(
      let x=3800;
      x<7800;
      x+=480
    ){

      world.buildings.push({

        x,
        y,

        w:300,
        h:270
      });
    }
  }

  /* NORTH HOUSES */

  for(
    let i=0;
    i<25;
    i++
  ){

    world.buildings.push({

      x:
        700 +
        Math.random()*3000,

      y:
        800 +
        Math.random()*1800,

      w:220,
      h:190
    });
  }

  /* SOUTH COMPOUNDS */

  for(
    let i=0;
    i<18;
    i++
  ){

    world.buildings.push({

      x:
        800 +
        Math.random()*3500,

      y:
        6000 +
        Math.random()*2000,

      w:300,
      h:230
    });
  }

  /* TREES */

  for(
    let i=0;
    i<400;
    i++
  ){

    world.trees.push({

      x:
        Math.random() *
        world.width,

      y:
        Math.random() *
        world.height,

      r:
        14 +
        Math.random()*18
    });
  }

  /* VEHICLES */

  for(
    let i=0;
    i<30;
    i++
  ){

    world.vehicles.push({

      x:
        Math.random() *
        world.width,

      y:
        Math.random() *
        world.height,

      angle:
        Math.random() *
        Math.PI*2
    });
  }
}

export function isBlocked(
  x,
  y,
  radius
){

  if(
    x < radius ||
    y < radius ||
    x > world.width-radius ||
    y > world.height-radius
  ){
    return true;
  }

  for(
    const b of world.buildings
  ){

    if(
      x >
        b.x-radius &&
      x <
        b.x+b.w+radius &&
      y >
        b.y-radius &&
      y <
        b.y+b.h+radius
    ){

      return true;
    }
  }

  return false;
}