export const input = {

  x: 0,
  y: 0,

  run: false,
  crouch: false,

  actionPressed: false,
  bagPressed: false
};

let joystick;
let stick;

export function setupInput(){

  joystick =
    document.getElementById("joystick");

  stick =
    document.getElementById("stick");

  setupJoystick();

  document
    .getElementById("runBtn")
    .addEventListener(
      "pointerdown",
      () => {
        input.run = true;
      }
    );

  document
    .getElementById("runBtn")
    .addEventListener(
      "pointerup",
      () => {
        input.run = false;
      }
    );

  document
    .getElementById("runBtn")
    .addEventListener(
      "pointercancel",
      () => {
        input.run = false;
      }
    );

  document
    .getElementById("crouchBtn")
    .addEventListener(
      "click",
      () => {
        input.crouch =
          !input.crouch;
      }
    );

  document
    .getElementById("actionBtn")
    .addEventListener(
      "click",
      () => {
        input.actionPressed = true;
      }
    );

  document
    .getElementById("bagBtn")
    .addEventListener(
      "click",
      () => {
        input.bagPressed = true;
      }
    );

  window.addEventListener(
    "keydown",
    e => {

      const k =
        e.key.toLowerCase();

      if(k === "w")
        input.y = -1;

      if(k === "s")
        input.y = 1;

      if(k === "a")
        input.x = -1;

      if(k === "d")
        input.x = 1;

      if(k === "shift")
        input.run = true;

      if(k === "e")
        input.actionPressed = true;

      if(k === "c")
        input.crouch =
          !input.crouch;
    }
  );

  window.addEventListener(
    "keyup",
    e => {

      const k =
        e.key.toLowerCase();

      if(k === "w" && input.y < 0)
        input.y = 0;

      if(k === "s" && input.y > 0)
        input.y = 0;

      if(k === "a" && input.x < 0)
        input.x = 0;

      if(k === "d" && input.x > 0)
        input.x = 0;

      if(k === "shift")
        input.run = false;
    }
  );
}

function setupJoystick(){

  let active = false;

  function move(e){

    const rect =
      joystick.getBoundingClientRect();

    const cx =
      rect.left +
      rect.width / 2;

    const cy =
      rect.top +
      rect.height / 2;

    let dx =
      e.clientX - cx;

    let dy =
      e.clientY - cy;

    const max = 47;

    const distance =
      Math.hypot(dx,dy);

    if(distance > max){

      dx =
        dx / distance * max;

      dy =
        dy / distance * max;
    }

    input.x = dx / max;
    input.y = dy / max;

    stick.style.transform =
      `translate(${dx}px,${dy}px)`;
  }

  function reset(){

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

      if(active)
        move(e);
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
}

export function consumeAction(){

  const value =
    input.actionPressed;

  input.actionPressed = false;

  return value;
}

export function consumeBag(){

  const value =
    input.bagPressed;

  input.bagPressed = false;

  return value;
}