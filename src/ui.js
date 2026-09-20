import { player } from "./player.js";
import { bots } from "./bots.js";
import { zone } from "./zone.js";

let messageTimer=0;

export function showMessage(
  text
){

  const el =
    document.getElementById(
      "message"
    );

  el.textContent=text;
  el.style.opacity="1";

  messageTimer=2;
}

export function updateUI(dt){

  document.getElementById(
    "hpBar"
  ).style.width =
    player.hp+"%";

  document.getElementById(
    "staminaBar"
  ).style.width =
    player.stamina+"%";

  let alive =
    player.hp>0 ? 1 : 0;

  for(
    const bot of bots
  ){

    if(bot.alive)
      alive++;
  }

  document.getElementById(
    "alive"
  ).textContent=alive;

  const min =
    Math.floor(
      Math.max(
        0,
        zone.timer
      ) / 60
    );

  const sec =
    Math.floor(
      Math.max(
        0,
        zone.timer
      ) % 60
    );

  document.getElementById(
    "zoneTimer"
  ).textContent =
    String(min).padStart(2,"0")+
    ":"+
    String(sec).padStart(2,"0");

  document.getElementById(
    "helmet"
  ).textContent =
    player.equipment.helmet
    ?"EQUIPPED":"-";

  document.getElementById(
    "vest"
  ).textContent =
    player.equipment.vest
    ?"EQUIPPED":"-";

  document.getElementById(
    "backpack"
  ).textContent =
    player.equipment.backpack
    ?"EQUIPPED":"-";

  document.getElementById(
    "shoes"
  ).textContent =
    player.equipment.shoes
    ?"EQUIPPED":"-";

  document.getElementById(
    "food"
  ).textContent =
    player.inventory.food;

  document.getElementById(
    "medkit"
  ).textContent =
    player.inventory.medkit;

  if(messageTimer>0){

    messageTimer-=dt;

    if(messageTimer<=0){

      document.getElementById(
        "message"
      ).style.opacity="0";
    }
  }
}