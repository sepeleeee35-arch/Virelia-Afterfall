export const input = {
  x: 0,
  y: 0,
  run: false,
  crouch: false
};

export function setupInput() {
  const joystick =
    document.getElementById("joystick");

  const stick =
    document.getElementById("stick");

  let active = false;

  function move(e) {
    const rect =
      joystick.getBoundingClientRect();

    const centerX =
      rect.left + rect.width / 2;

    const centerY =
      rect.top + rect.height / 2;

    let dx =
      e.clientX - centerX;

    let dy =
      e.clientY - centerY;

    const max =
      rect.width * 0.30;

    const length =
      Math.hypot(dx, dy);

    if (length > max) {
      dx = dx / length * max;
      dy = dy / length * max;
    }

    input.x = dx / max;
    input.y = dy / max;

    stick.style.transform =
      `translate(${dx}px, ${dy}px)`;
  }

  function reset() {
    active = false;

    input.x = 0;
    input.y = 0;

    stick.style.transform =
      "translate(0,0)";
  }

  joystick.addEventListener(
    "pointerdown",
    e => {
      active = true;

      joystick.setPointerCapture(
        e.pointerId
      );

      move(e);
    }
  );

  joystick.addEventListener(
    "pointermove",
    e => {
      if (active) move(e);
    }
  );

  joystick.addEventListener(
    "pointerup",
    reset
  );

  joystick.addEventListener(
    "pointercancel",
    reset
  );

  const run =
    document.getElementById("runBtn");

  run.addEventListener(
    "pointerdown",
    () => {
      input.run = true;
    }
  );

  run.addEventListener(
    "pointerup",
    () => {
      input.run = false;
    }
  );

  run.addEventListener(
    "pointercancel",
    () => {
      input.run = false;
    }
  );

  const crouch =
    document.getElementById("crouchBtn");

  crouch.addEventListener(
    "click",
    () => {
      input.crouch =
        !input.crouch;

      crouch.textContent =
        input.crouch
          ? "STAND"
          : "CROUCH";
    }
  );
}