export function createInput(renderer){

  const state = {
    moveX:0,
    moveY:0,
    sprint:false,
    crouch:false,
    jumpPressed:false,
    actionPressed:false,
    cameraDX:0,
    cameraDY:0
  };

  const joystick = document.getElementById("joystick");
  const stick = document.getElementById("stick");

  let joystickPointer = null;

  function updateJoystick(x,y){
    const rect = joystick.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = x - cx;
    let dy = y - cy;

    const max = rect.width * .36;
    const length = Math.hypot(dx,dy);

    if(length > max){
      dx = dx / length * max;
      dy = dy / length * max;
    }

    state.moveX = dx / max;
    state.moveY = dy / max;

    stick.style.transform =
      `translate(${dx}px,${dy}px)`;
  }

  function resetJoystick(){
    joystickPointer = null;
    state.moveX = 0;
    state.moveY = 0;
    stick.style.transform = "translate(0px,0px)";
  }

  joystick.addEventListener("pointerdown",e=>{
    joystickPointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX,e.clientY);
  });

  joystick.addEventListener("pointermove",e=>{
    if(e.pointerId === joystickPointer){
      updateJoystick(e.clientX,e.clientY);
    }
  });

  joystick.addEventListener("pointerup",e=>{
    if(e.pointerId === joystickPointer){
      resetJoystick();
    }
  });

  joystick.addEventListener("pointercancel",resetJoystick);

  let cameraPointer = null;
  let lastCameraX = 0;
  let lastCameraY = 0;

  renderer.domElement.addEventListener("pointerdown",e=>{
    if(e.clientX < window.innerWidth * .38) return;

    cameraPointer = e.pointerId;
    lastCameraX = e.clientX;
    lastCameraY = e.clientY;

    renderer.domElement.setPointerCapture(e.pointerId);
  });

  renderer.domElement.addEventListener("pointermove",e=>{
    if(e.pointerId !== cameraPointer) return;

    const dx = e.clientX - lastCameraX;
    const dy = e.clientY - lastCameraY;

    lastCameraX = e.clientX;
    lastCameraY = e.clientY;

    state.cameraDX += dx;
    state.cameraDY += dy;
  });

  renderer.domElement.addEventListener("pointerup",e=>{
    if(e.pointerId === cameraPointer){
      cameraPointer = null;
    }
  });

  renderer.domElement.addEventListener("pointercancel",e=>{
    if(e.pointerId === cameraPointer){
      cameraPointer = null;
    }
  });

  const jumpButton = document.getElementById("jump");
  const sprintButton = document.getElementById("sprint");
  const crouchButton = document.getElementById("crouch");
  const actionButton = document.getElementById("action");

  jumpButton.addEventListener("pointerdown",()=>{
    state.jumpPressed = true;
  });

  function sprintStart(e){
    e.preventDefault();
    state.sprint = true;
  }

  function sprintEnd(){
    state.sprint = false;
  }

  sprintButton.addEventListener("pointerdown",sprintStart);
  sprintButton.addEventListener("pointerup",sprintEnd);
  sprintButton.addEventListener("pointercancel",sprintEnd);
  sprintButton.addEventListener("pointerleave",sprintEnd);

  crouchButton.addEventListener("pointerdown",()=>{
    state.crouch = !state.crouch;
  });

  actionButton.addEventListener("pointerdown",()=>{
    state.actionPressed = true;
  });

  const keys = new Set();

  window.addEventListener("keydown",e=>{
    if([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "Shift"
    ].includes(e.key)){
      e.preventDefault();
    }

    if(e.repeat && (e.key === " " || e.key.toLowerCase() === "e")){
      return;
    }

    keys.add(e.key.toLowerCase());

    if(e.key === " "){
      state.jumpPressed = true;
    }

    if(e.key.toLowerCase() === "e"){
      state.actionPressed = true;
    }

    if(e.key.toLowerCase() === "c"){
      state.crouch = !state.crouch;
    }
  });

  window.addEventListener("keyup",e=>{
    keys.delete(e.key.toLowerCase());
  });

  function updateKeyboard(){

    let x = 0;
    let y = 0;

    if(keys.has("a") || keys.has("arrowleft")) x -= 1;
    if(keys.has("d") || keys.has("arrowright")) x += 1;
    if(keys.has("w") || keys.has("arrowup")) y -= 1;
    if(keys.has("s") || keys.has("arrowdown")) y += 1;

    if(x !== 0 || y !== 0){
      const length = Math.hypot(x,y);

      state.moveX = x / length;
      state.moveY = y / length;
    }

    if(keys.has("shift")){
      state.sprint = true;
    }
  }

  return {

    state,

    update(){
      updateKeyboard();
    },

    consumeJump(){
      const value = state.jumpPressed;
      state.jumpPressed = false;
      return value;
    },

    consumeAction(){
      const value = state.actionPressed;
      state.actionPressed = false;
      return value;
    },

    consumeCameraDelta(){
      const value = {
        x:state.cameraDX,
        y:state.cameraDY
      };

      state.cameraDX = 0;
      state.cameraDY = 0;

      return value;
    }
  };
}