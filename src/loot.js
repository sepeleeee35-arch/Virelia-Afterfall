import { player } from "./player.js";

export const loot = [];

const equipment=[
  "helmet",
  "vest",
  "backpack",
  "shoes"
];

export function createLoot(world){

  loot.length=0;

  for(
    let i=0;
    i<180;
    i++
  ){

    const b =
      world.buildings[
        Math.floor(
          Math.random() *
          world.buildings.length
        )
      ];

    let type;

    const r =
      Math.random();

    if(r < .20){

      type =
        equipment[
          Math.floor(
            Math.random() *
            equipment.length
          )
        ];

    }else if(r < .60){

      type="food";

    }else{

      type="medkit";
    }

    loot.push({

      x:
        b.x +
        30 +
        Math.random() *
        Math.max(
          20,
          b.w-60
        ),

      y:
        b.y +
        30 +
        Math.random() *
        Math.max(
          20,
          b.h-60
        ),

      type,

      taken:false
    });
  }
}

export function pickupNearest(){

  let selected=null;
  let distance=75;

  for(
    const item of loot
  ){

    if(item.taken)
      continue;

    const d =
      Math.hypot(
        item.x-player.x,
        item.y-player.y
      );

    if(d < distance){

      distance=d;
      selected=item;
    }
  }

  if(!selected)
    return "Tidak ada item di dekatmu.";

  /*
    EQUIPMENT:
    langsung dipasang.
    Kalau slot sudah terisi,
    item TIDAK diambil.
  */

  if(
    equipment.includes(
      selected.type
    )
  ){

    if(
      player.equipment[
        selected.type
      ]
    ){

      return "Slot equipment sudah terisi.";
    }

    player.equipment[
      selected.type
    ] = true;

    selected.taken=true;

    return (
      selected.type.toUpperCase() +
      " otomatis dipasang."
    );
  }

  selected.taken=true;

  if(
    selected.type === "food"
  ){

    player.inventory.food++;

    return "Food masuk inventory.";
  }

  if(
    selected.type === "medkit"
  ){

    player.inventory.medkit++;

    return "Medkit masuk inventory.";
  }

  return "Item diambil.";
}