const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

function draw() {
  ctx.fillStyle = "#263b2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  ctx.fillText("VIRELIA: AFTERFALL", 60, 100);

  ctx.font = "bold 28px Arial";
  ctx.fillText("GAME ENGINE OK", 60, 150);

  requestAnimationFrame(draw);
}

draw();