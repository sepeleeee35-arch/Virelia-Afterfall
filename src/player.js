import { input } from "./input.js";
import { world } from "./world.js";

export const player={x:0,y:0,speed:250,hp:100,stamina:100,crouch:false};

export function updatePlayer(dt){
  let x=input.x,y=input.y;
  const len=Math.hypot(x,y);
  if(len>1){x/=len;y/=len;}
  const cos=Math.cos(input.cameraYaw),sin=Math.sin(input.cameraYaw);
  const worldX=-x*sin-y*cos;
  const worldY=x*cos-y*sin;
  player.x+=worldX*player.speed*dt;
  player.y+=worldY*player.speed*dt;
  player.x=Math.max(35,Math.min(world.width-35,player.x));
  player.y=Math.max(35,Math.min(world.height-35,player.y));
}
