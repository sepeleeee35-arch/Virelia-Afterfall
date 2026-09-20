export const input = {
  x: 0,
  y: 0,
  run: false,
  crouch: false,
  cameraYaw: 0.35,
  cameraPitch: 0.14,
  fire: false,
  aim: false
};

export function setupInput() {
  const joystick = document.getElementById("joystick");
  const stick = document.getElementById("stick");

  let moveActive = false;
  let movePointerId = null;

  function updateJoystick(e) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const max = Math.max(1, rect.width * 0.30);
    const length = Math.hypot(dx, dy);

    if (length > max) {
      dx = (dx / length) * max;
      dy = (dy / length) * max;
    }

    let x = dx / max;
    let y = -dy / max;

    const magnitude = Math.hypot(x, y);
    if (magnitude < 0.10) {
      x = 0;
      y = 0;
    } else {
      const normalized = Math.min(1, (magnitude - 0.10) / 0.90);
      const scale = normalized / magnitude;
      x *= scale;
      y *= scale;
    }

    input.x = x;
    input.y = y;
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function resetJoystick() {
    moveActive = false;
    movePointerId = null;
    input.x = 0;
    input.y = 0;
    stick.style.transform = "translate(0,0)";
  }

  joystick.addEventListener("pointerdown", e => {
    if (moveActive) return;
    moveActive = true;
    movePointerId = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    updateJoystick(e);
  });

  joystick.addEventListener("pointermove", e => {
    if (!moveActive || e.pointerId !== movePointerId) return;
    updateJoystick(e);
  });

  joystick.addEventListener("pointerup", e => {
    if (e.pointerId === movePointerId) resetJoystick();
  });

  joystick.addEventListener("pointercancel", e => {
    if (e.pointerId === movePointerId) resetJoystick();
  });

  const lookPad = document.getElementById("lookPad");

  if (lookPad) {
    let lookActive = false;
    let lookPointerId = null;
    let lastX = 0;
    let lastY = 0;

    lookPad.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      lookActive = true;
      lookPointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lookPad.setPointerCapture(e.pointerId);
    });

    lookPad.addEventListener("pointermove", e => {
      if (!lookActive || e.pointerId !== lookPointerId) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      input.cameraYaw += dx * 0.0105;
      input.cameraPitch = Math.max(
        -0.58,
        Math.min(0.62, input.cameraPitch - dy * 0.008)
      );
    });

    function stopLook(e) {
      if (e.pointerId === lookPointerId) {
        lookActive = false;
        lookPointerId = null;
      }
    }

    lookPad.addEventListener("pointerup", stopLook);
    lookPad.addEventListener("pointercancel", stopLook);
  }

  const run = document.getElementById("runBtn");
  if (run) {
    run.addEventListener("pointerdown", () => {
      input.run = true;
    });
    run.addEventListener("pointerup", () => {
      input.run = false;
    });
    run.addEventListener("pointercancel", () => {
      input.run = false;
    });
    run.addEventListener("pointerleave", () => {
      input.run = false;
    });
  }

  const crouch = document.getElementById("crouchBtn");
  if (crouch) {
    crouch.addEventListener("click", () => {
      input.crouch = !input.crouch;
      crouch.textContent = input.crouch ? "STAND" : "CROUCH";
    });
  }
}
