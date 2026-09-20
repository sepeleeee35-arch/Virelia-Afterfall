import { input } from "./input.js";
import { world } from "./world.js";

export const player={
  x:0,
  y:0,
  speed:250,
  hp:100,
  stamina:100,
  crouch:false
};

export function updatePlayer(dt){
  let x=input.x;
  let y=input.y;

  const length=Math.hypot(x,y);
  if(length>1){
    x/=length;
    y/=length;
  }

  let speed=player.speed;
  player.crouch=input.crouch;

  if(player.crouch){
    speed*=0.55;
  }

  if(input.run && !player.crouch && player.stamina>0){
    speed*=1.55;
    player.stamina=Math.max(0,player.stamina-28*dt);
  }else{
    player.stamina=Math.min(100,player.stamina+18*dt);
  }

  player.x+=x*speed*dt;
  player.y+=y*speed*dt;

  player.x=Math.max(35,Math.min(world.width-35,player.x));
  player.y=Math.max(35,Math.min(world.height-35,player.y));
}
