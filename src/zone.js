import {
  player,
  damagePlayer
} from "./player.js";

export const zone={

  x:6000,
  y:4500,

  radius:5000,

  targetRadius:5000,

  timer:300
};

export function updateZone(dt){

  zone.timer-=dt;

  if(zone.timer<=0){

    zone.timer=75;

    zone.targetRadius =
      Math.max(
        900,
        zone.targetRadius-650
      );
  }

  zone.radius +=
    (
      zone.targetRadius -
      zone.radius
    ) *
    dt *
    .025;

  const distance =
    Math.hypot(
      player.x-zone.x,
      player.y-zone.y
    );

  if(
    distance >
    zone.radius
  ){

    damagePlayer(
      3*dt
    );
  }
}