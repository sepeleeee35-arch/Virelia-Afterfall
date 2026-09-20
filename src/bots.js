export const bots=[];

const SPEED=82;

export function createBots(){
  bots.length=0;

  for(let i=0;i<69;i++){
    const angle=Math.random()*Math.PI*2;
    const distance=550+Math.random()*1600;

    bots.push({
      x:3000+Math.cos(angle)*distance,
      y:2250+Math.sin(angle)*distance,
      hp:100,
      targetX:0,
      targetY:0,
      timer:Math.random()*2,
      state:"roam",
      color:i%3
    });
  }
}

function chooseTarget(bot){
  const candidates=bots.filter(other=>other!==bot && other.hp>0);

  if(candidates.length && Math.random()<0.38){
    const other=candidates[Math.floor(Math.random()*candidates.length)];
    const d=Math.hypot(other.x-bot.x,other.y-bot.y);

    if(d<650){
      bot.state="duel";
      bot.targetX=other.x;
      bot.targetY=other.y;
      return;
    }
  }

  bot.state="roam";

  const a=Math.random()*Math.PI*2;
  const d=150+Math.random()*500;

  bot.targetX=bot.x+Math.cos(a)*d;
  bot.targetY=bot.y+Math.sin(a)*d;
}

export function updateBots(dt){
  for(const bot of bots){
    if(bot.hp<=0) continue;

    bot.timer-=dt;

    if(bot.timer<=0){
      bot.timer=1.2+Math.random()*2.8;
      chooseTarget(bot);
    }

    let dx=bot.targetX-bot.x;
    let dy=bot.targetY-bot.y;
    const d=Math.hypot(dx,dy);

    if(d>6){
      dx/=d;
      dy/=d;

      const speed=bot.state==="duel"?SPEED*1.18:SPEED;
      bot.x+=dx*speed*dt;
      bot.y+=dy*speed*dt;
    }

    bot.x=Math.max(80,Math.min(5920,bot.x));
    bot.y=Math.max(80,Math.min(4420,bot.y));
  }
}

export function drawBots(ctx){
  for(const bot of bots){
    if(bot.hp<=0) continue;

    ctx.fillStyle="rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(bot.x,bot.y+18,18,7,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle=bot.color===0?"#344b55":bot.color===1?"#574c43":"#455e4c";
    ctx.fillRect(bot.x-11,bot.y-27,22,30);

    ctx.fillStyle="#bd8971";
    ctx.beginPath();
    ctx.arc(bot.x,bot.y-38,10,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#252a2c";
    ctx.beginPath();
    ctx.arc(bot.x,bot.y-42,10,Math.PI,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="#252c30";
    ctx.lineWidth=7;
    ctx.beginPath();
    ctx.moveTo(bot.x-5,bot.y+2);
    ctx.lineTo(bot.x-9,bot.y+22);
    ctx.moveTo(bot.x+5,bot.y+2);
    ctx.lineTo(bot.x+9,bot.y+22);
    ctx.stroke();

    ctx.fillStyle="#202524";
    ctx.fillRect(bot.x-18,bot.y-56,36,4);
    ctx.fillStyle=bot.state==="duel"?"#e4b85b":"#62d47a";
    ctx.fillRect(bot.x-18,bot.y-56,36*(bot.hp/100),4);
  }
}
