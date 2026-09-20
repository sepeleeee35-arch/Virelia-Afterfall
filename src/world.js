export const world = {
  width: 6000,
  height: 4500,

  roads: [],
  buildings: [],
  trees: [],
  hills: [],
  vehicles: []
};

export function createWorld() {
  world.roads = [];
  world.buildings = [];
  world.trees = [];
  world.hills = [];
  world.vehicles = [];

  world.roads.push(
    {
      x: 0,
      y: 2050,
      w: 6000,
      h: 180
    },
    {
      x: 2910,
      y: 0,
      w: 180,
      h: 4500
    },
    {
      x: 500,
      y: 700,
      w: 4000,
      h: 130
    },
    {
      x: 500,
      y: 3550,
      w: 4000,
      h: 130
    }
  );

  world.hills.push(
    {
      x: 250,
      y: 180,
      w: 1100,
      h: 650
    },
    {
      x: 1450,
      y: 250,
      w: 1000,
      h: 700
    },
    {
      x: 400,
      y: 2700,
      w: 1300,
      h: 750
    },
    {
      x: 3300,
      y: 2750,
      w: 1100,
      h: 650
    }
  );

  world.buildings.push({
    x: 2380,
    y: 1200,
    w: 700,
    h: 520,
    type: "landmark"
  });

  for (
    let y = 900;
    y < 1850;
    y += 270
  ) {
    world.buildings.push({
      x: 350,
      y,
      w: 210,
      h: 160,
      type: "house"
    });

    world.buildings.push({
      x: 650,
      y: y + 35,
      w: 190,
      h: 145,
      type: "house"
    });
  }

  for (
    let y = 850;
    y < 1900;
    y += 270
  ) {
    world.buildings.push({
      x: 3350,
      y,
      w: 220,
      h: 165,
      type: "house"
    });

    world.buildings.push({
      x: 3650,
      y: y + 35,
      w: 200,
      h: 150,
      type: "house"
    });
  }

  for (
    let x = 600;
    x < 2400;
    x += 330
  ) {
    world.buildings.push({
      x,
      y: 3250,
      w: 230,
      h: 170,
      type: "compound"
    });
  }

  for (
    let x = 3250;
    x < 4500;
    x += 300
  ) {
    world.buildings.push({
      x,
      y: 3400,
      w: 220,
      h: 160,
      type: "compound"
    });
  }

  for (let i = 0; i < 180; i++) {
    const x =
      100 + Math.random() * 4350;

    const y =
      100 + Math.random() * 4200;

    world.trees.push({
      x,
      y,
      r: 15 + Math.random() * 13
    });
  }

  for (let i = 0; i < 20; i++) {
    world.vehicles.push({
      x: 300 + Math.random() * 4100,
      y: 300 + Math.random() * 3800,
      angle: Math.random() * Math.PI * 2
    });
  }
}

export function drawWorld(ctx) {
  ctx.fillStyle = "#789260";

  ctx.fillRect(
    0,
    0,
    world.width,
    world.height
  );

  drawCoast(ctx);
  drawHills(ctx);
  drawRoads(ctx);
  drawBuildings(ctx);
  drawTrees(ctx);
  drawVehicles(ctx);
}

function drawCoast(ctx) {
  ctx.fillStyle = "#4b7e8d";

  ctx.fillRect(
    4700,
    0,
    1300,
    4500
  );

  ctx.fillStyle = "#c5b376";

  ctx.fillRect(
    4500,
    0,
    200,
    4500
  );
}

function drawHills(ctx) {
  for (const hill of world.hills) {
    ctx.fillStyle = "#607b52";

    ctx.beginPath();

    ctx.ellipse(
      hill.x + hill.w / 2,
      hill.y + hill.h / 2,
      hill.w / 2,
      hill.h / 2,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

function drawRoads(ctx) {
  for (const road of world.roads) {
    ctx.fillStyle = "#4e5754";

    ctx.fillRect(
      road.x,
      road.y,
      road.w,
      road.h
    );

    ctx.strokeStyle = "#2f3533";
    ctx.lineWidth = 6;

    ctx.strokeRect(
      road.x,
      road.y,
      road.w,
      road.h
    );

    ctx.strokeStyle = "#d8cb69";
    ctx.lineWidth = 4;

    ctx.setLineDash([
      30,
      24
    ]);

    ctx.beginPath();

    if (road.w > road.h) {
      ctx.moveTo(
        road.x,
        road.y + road.h / 2
      );

      ctx.lineTo(
        road.x + road.w,
        road.y + road.h / 2
      );
    } else {
      ctx.moveTo(
        road.x + road.w / 2,
        road.y
      );

      ctx.lineTo(
        road.x + road.w / 2,
        road.y + road.h
      );
    }

    ctx.stroke();

    ctx.setLineDash([]);
  }
}

function drawBuildings(ctx) {
  for (const b of world.buildings) {
    ctx.fillStyle =
      b.type === "landmark"
        ? "#666763"
        : "#958d7b";

    ctx.fillRect(
      b.x,
      b.y,
      b.w,
      b.h
    );

    ctx.fillStyle =
      b.type === "landmark"
        ? "#363a39"
        : "#56534c";

    ctx.fillRect(
      b.x,
      b.y,
      b.w,
      34
    );

    ctx.fillStyle = "#304952";

    for (
      let x = b.x + 35;
      x < b.x + b.w - 20;
      x += 70
    ) {
      ctx.fillRect(
        x,
        b.y + 60,
        20,
        17
      );
    }

    ctx.fillStyle = "#493d34";

    ctx.fillRect(
      b.x + b.w / 2 - 12,
      b.y + b.h - 35,
      24,
      35
    );

    if (b.type === "landmark") {
      ctx.fillStyle = "#eee1a1";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";

      ctx.fillText(
        "CENTRAL FORT",
        b.x + b.w / 2,
        b.y - 18
      );
    }
  }
}

function drawTrees(ctx) {
  for (const tree of world.trees) {
    ctx.fillStyle = "#5a4635";

    ctx.fillRect(
      tree.x - 4,
      tree.y,
      8,
      22
    );

    ctx.fillStyle = "#3e6743";

    ctx.beginPath();

    ctx.arc(
      tree.x,
      tree.y - 6,
      tree.r,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
}

function drawVehicles(ctx) {
  for (const v of world.vehicles) {
    ctx.save();

    ctx.translate(
      v.x,
      v.y
    );

    ctx.rotate(
      v.angle
    );

    ctx.fillStyle = "#29383b";

    ctx.fillRect(
      -28,
      -14,
      56,
      28
    );

    ctx.fillStyle = "#657b7e";

    ctx.fillRect(
      -17,
      -9,
      34,
      18
    );

    ctx.restore();
  }
}