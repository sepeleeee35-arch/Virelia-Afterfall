import {
  player,
  damagePlayer
} from "./player.js";

export const bots=[];

export function createBots(world){

  bots.length=0;

  for(
    let i=0;
    i<69;
    i++
  ){

    let x,y;

    do{

      x =
        500 +
        Math.random() *
        (world.width-1000);

      y =
        500 +
        Math.random() *
        (world.height-1000);

    }while(
      Math.hypot(
        x-player.x,
        y-player.y
      ) < 800
    );

    bots.push({

      id:i+1,

      x,
      y,

      radius:17,

      hp:100,

      speed:
        105 +
        Math.random()*45,

      target:null,

      think:
        Math.random()*2,

      attackCooldown:0,

      wanderX:x,
      wanderY:y,

      alive:true
    });
  }
}

function findTarget(bot){

  const candidates=[];

  /* BOT KE BOT */

  for(
    const other of bots
  ){

    if(
      other===bot ||
      !other.alive
    )
      continue;

    const d =
      Math.hypot(
        other.x-bot.x,
        other.y-bot.y
      );

    if(d < 650){

      candidates.push({
        entity:other,
        distance:d
      });
    }
  }

  /* PLAYER */

  const pd =
    Math.hypot(
      player.x-bot.x,
      player.y-bot.y
    );

  if(pd < 650){

    candidates.push({
      entity:player,
      distance:pd,
      player:true
    });
  }

  if(!candidates.length)
    return null;

  /*
    Tidak semua bot mengejar player.
    Bot lebih sering memilih survivor
    lain yang dekat.
  */

  const botTargets =
    candidates.filter(
      x=>!x.player
    );

  if(
    botTargets.length &&
    Math.random() < .78
  ){

    return botTargets[
      Math.floor(
        Math.random() *
        botTargets.length
      )
    ].entity;
  }

  candidates.sort(
    (a,b)=>
      a.distance-b.distance
  );

  return candidates[0].entity;
}

export function updateBots(
  dt,
  world
){

  for(
    const bot of bots
  ){

    if(!bot.alive)
      continue;

    bot.think-=dt;

    if(bot.think<=0){

      bot.think =
        .8 +
        Math.random()*2;

      bot.target =
        findTarget(bot);

      if(!bot.target){

        bot.wanderX =
          Math.max(
            100,
            Math.min(
              world.width-100,
              bot.x +
              (Math.random()-.5) *
              1000
            )
          );

        bot.wanderY =
          Math.max(
            100,
            Math.min(
              world.height-100,
              bot.y +
              (Math.random()-.5) *
              1000
            )
          );
      }
    }

    let tx =
      bot.wanderX;

    let ty =
      bot.wanderY;

    if(
      bot.target &&
      !bot.target.alive &&
      bot.target !== player
    ){

      bot.target=null;
    }

    if(
      bot.target
    ){

      tx =
        bot.target.x;

      ty =
        bot.target.y;
    }

    const dx =
      tx-bot.x;

    const dy =
      ty-bot.y;

    const distance =
      Math.hypot(dx,dy);

    if(
      bot.target &&
      distance < 55
    ){

      bot.attackCooldown-=dt;

      if(
        bot.attackCooldown<=0
      ){

        bot.attackCooldown=1.7;

        if(
          bot.target === player
        ){

          damagePlayer(5);

        }else{

          bot.target.hp -= 5;

          if(
            bot.target.hp<=0
          ){

            bot.target.hp=0;
            bot.target.alive=false;
          }
        }
      }

      continue;
    }

    const len =
      distance || 1;

    const vx =
      dx/len *
      bot.speed *
      dt;

    const vy =
      dy/len *
      bot.speed *
      dt;

    const nx =
      bot.x+vx;

    const ny =
      bot.y+vy;

    if(
      !world.isBlocked(
        nx,
        bot.y,
        bot.radius
      )
    ){
      bot.x=nx;
    }

    if(
      !world.isBlocked(
        bot.x,
        ny,
        bot.radius
      )
    ){
      bot.y=ny;
    }
  }
}