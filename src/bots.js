export const bots = [];

export function createBots() {
  bots.length = 0;

  for (let i = 0; i < 69; i++) {
    bots.push({
      x: 250 + Math.random() * 4200,
      y: 250 + Math.random() * 3900,

      hp: 100,

      targetX: 0,
      targetY: 0,

      timer:
        Math.random() * 3
    });
  }
}

export function updateBots(dt) {
  for (const bot of bots) {
    bot.timer -= dt;

    if (bot.timer <= 0) {
      bot.timer =
        1.5 + Math.random() * 3;

      const angle =
        Math.random() *
        Math.PI * 2;

      const distance =
        120 + Math.random() * 450;

      bot.targetX =
        bot.x +
        Math.cos(angle) *
        distance;

      bot.targetY =
        bot.y +
        Math.sin(angle) *
        distance;
    }

    let dx =
      bot.targetX - bot.x;

    let dy =
      bot.targetY - bot.y;

    const distance =
      Math.hypot(dx, dy);

    if (distance > 5) {
      dx /= distance;
      dy /= distance;

      bot.x += dx * 75 * dt;
      bot.y += dy * 75 * dt;
    }
  }
}

export function drawBots(ctx) {
  for (const bot of bots) {
    ctx.fillStyle =
      "rgba(0,0,0,.25)";

    ctx.beginPath();

    ctx.ellipse(
      bot.x,
      bot.y + 18,
      18,
      7,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#344b55";

    ctx.fillRect(
      bot.x - 11,
      bot.y - 27,
      22,
      30
    );

    ctx.fillStyle = "#bd8971";

    ctx.beginPath();

    ctx.arc(
      bot.x,
      bot.y - 38,
      10,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#252c30";
    ctx.lineWidth = 7;

    ctx.beginPath();

    ctx.moveTo(
      bot.x - 5,
      bot.y + 2
    );

    ctx.lineTo(
      bot.x - 9,
      bot.y + 22
    );

    ctx.moveTo(
      bot.x + 5,
      bot.y + 2
    );

    ctx.lineTo(
      bot.x + 9,
      bot.y + 22
    );

    ctx.stroke();

    ctx.fillStyle = "#202524";

    ctx.fillRect(
      bot.x - 18,
      bot.y - 56,
      36,
      4
    );

    ctx.fillStyle = "#62d47a";

    ctx.fillRect(
      bot.x - 18,
      bot.y - 56,
      36,
      4
    );
  }
}