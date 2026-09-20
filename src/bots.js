import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export const bots=[];
const SPEED=82;
const colors=[0x344b55,0x574c43,0x455e4c,0x66524a];

export function createBots(scene){
  for(const bot of bots) if(bot.mesh) scene.remove(bot.mesh);
  bots.length=0;

  for(let i=0;i<69;i++){
    const a=Math.random()*Math.PI*2;
    const d=550+Math.random()*1600;
    const x=3000+Math.cos(a)*d;
    const z=2250+Math.sin(a)*d;
    const group=new THREE.Group();
    group.position.set(x,0,z);

    const body=new THREE.Mesh(
      new THREE.CapsuleGeometry(13,28,5,8),
      new THREE.MeshStandardMaterial({color:colors[i%colors.length]})
    );
    body.position.y=35;
    body.castShadow=true;
    group.add(body);

    const head=new THREE.Mesh(
      new THREE.SphereGeometry(10,10,8),
      new THREE.MeshStandardMaterial({color:0xc08a72})
    );
    head.position.y=68;
    head.castShadow=true;
    group.add(head);

    const shadow=new THREE.Mesh(
      new THREE.CircleGeometry(18,20),
      new THREE.MeshBasicMaterial({color:0x101515,transparent:true,opacity:.28})
    );
    shadow.rotation.x=-Math.PI/2;
    shadow.position.y=.5;
    group.add(shadow);

    scene.add(group);

    bots.push({
      x,z,hp:100,targetX:x,targetZ:z,timer:Math.random()*2,
      state:"roam",mesh:group
    });
  }
}

function chooseTarget(bot){
  const candidates=bots.filter(other=>other!==bot&&other.hp>0);
  if(candidates.length&&Math.random()<.38){
    const other=candidates[Math.floor(Math.random()*candidates.length)];
    const d=Math.hypot(other.x-bot.x,other.z-bot.z);
    if(d<650){
      bot.state="duel";
      bot.targetX=other.x;
      bot.targetZ=other.z;
      return;
    }
  }
  bot.state="roam";
  const a=Math.random()*Math.PI*2;
  const d=150+Math.random()*500;
  bot.targetX=bot.x+Math.cos(a)*d;
  bot.targetZ=bot.z+Math.sin(a)*d;
}

export function updateBots(dt){
  for(const bot of bots){
    if(bot.hp<=0) continue;
    bot.timer-=dt;
    if(bot.timer<=0){
      bot.timer=1.2+Math.random()*2.8;
      chooseTarget(bot);
    }
    let dx=bot.targetX-bot.x, dz=bot.targetZ-bot.z;
    const d=Math.hypot(dx,dz);
    if(d>6){
      dx/=d; dz/=d;
      const speed=bot.state==="duel"?SPEED*1.18:SPEED;
      bot.x+=dx*speed*dt;
      bot.z+=dz*speed*dt;
      bot.mesh.position.set(bot.x,0,bot.z);
      bot.mesh.rotation.y=Math.atan2(dx,dz);
    }
  }
}
