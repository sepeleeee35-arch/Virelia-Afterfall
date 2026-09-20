import { input } from "./input.js";

export const player = {

  x: 6000,
  y: 5200,

  radius: 18,

  hp: 100,
  stamina: 100,

  baseSpeed: 230,

  equipment: {
    helmet: false,
    vest: false,
    backpack: false,
    shoes: false
  },

  inventory: {
    food: 0,
    medkit: 0
  }
};

export function updatePlayer(dt, world){

  let dx = input.x;
  let dy = input.y;

  const length =
    Math.hypot(dx,dy);

  if(length > 1){

    dx /= length;
    dy /= length;
  }

  const moving =
    Math.abs(dx) +
    Math.abs(dy) >
    0.05;

  let speed =
    player.baseSpeed;

  if(input.crouch)
    speed *= 0.55;

  if(
    input.run &&
    moving &&
    player.stamina > 0
  ){

    speed *= 1.55;

    player.stamina -=
      25 * dt;

  }else{

    player.stamina +=
      18 * dt;
  }

  player.stamina =
    Math.max(
      0,
      Math.min(
        100,
        player.stamina
      )
    );

  if(!moving)
    return;

  const mx =
    dx * speed * dt;

  const my =
    dy * speed * dt;

  movePlayer(
    mx,
    my,
    world
  );
}

function movePlayer(
  dx,
  dy,
  world
){

  const nx =
    player.x + dx;

  if(
    !world.isBlocked(
      nx,
      player.y,
      player.radius
    )
  ){
    player.x = nx;
  }

  const ny =
    player.y + dy;

  if(
    !world.isBlocked(
      player.x,
      ny,
      player.radius
    )
  ){
    player.y = ny;
  }
}

export function damagePlayer(amount){

  player.hp =
    Math.max(
      0,
      player.hp - amount
    );
}

export function healPlayer(amount){

  player.hp =
    Math.min(
      100,
      player.hp + amount
    );
}