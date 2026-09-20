export function createInput(renderer){

  const state={
    moveX:0,
    moveY:0,
    sprint:false,
    crouch:false,
    jumpPressed:false,
    actionPressed:false,
    enterPressed:false,
    exitPressed:false,
    cameraDX:0,
    cameraDY:0
  };

  const joystick=
    document.getElementById("joystick");

  const stick=
    document.getElementById("stick");

  let joystickPointer=null;

  function moveJoystick(x,y){

    const rect=
      joystick.getBoundingClientRect();

    const cx=
      rect.left+rect.width/2;

    const cy=
      rect.top+rect.height/2;

    let dx=x-cx;
    let dy=y-cy;

    const max=
      rect.width*.36;

    const length=
      Math.hypot(dx,dy);

    if(length>max){

      dx=dx/length*max;
      dy=dy/length*max;
    }

    state.moveX=dx/max;
    state.moveY=dy/max;

    stick.style.transform=
      `translate(${dx}px,${dy}px)`;
  }

  function resetJoystick(){

    joystickPointer=null;

    state.moveX=0;
    state.moveY=0;

    stick.style.transform=
      "translate(0px,0px)";
  }

  joystick.addEventListener(
    "pointerdown",
    e=>{
      joystickPointer=e.pointerId;
      joystick.setPointerCapture(
        e.pointerId
      );
      moveJoystick(
        e.clientX,
        e.clientY
      );
    }
  );

  joystick.addEventListener(
    "pointermove",
    e=>{
      if(
        e.pointerId===joystickPointer
      ){
        moveJoystick(
          e.clientX,
          e.clientY
        );
      }
    }
  );

  joystick.addEventListener(
    "pointerup",
    e=>{
      if(
        e.pointerId===joystickPointer
      ){
        resetJoystick();
      }
    }
  );

  joystick.addEventListener(
    "pointercancel",
    resetJoystick
  );

  let cameraPointer=null;
  let lastX=0;
  let lastY=0;

  renderer.domElement.addEventListener(
    "pointerdown",
    e=>{

      if(
        e.clientX<
        window.innerWidth*.38
      ){
        return;
      }

      cameraPointer=e.pointerId;
      lastX=e.clientX;
      lastY=e.clientY;

      renderer.domElement.setPointerCapture(
        e.pointerId
      );
    }
  );

  renderer.domElement.addEventListener(
    "pointermove",
    e=>{

      if(
        e.pointerId!==cameraPointer
      ){
        return;
      }

      state.cameraDX+=
        e.clientX-lastX;

      state.cameraDY+=
        e.clientY-lastY;

      lastX=e.clientX;
      lastY=e.clientY;
    }
  );

  renderer.domElement.addEventListener(
    "pointerup",
    e=>{
      if(
        e.pointerId===cameraPointer
      ){
        cameraPointer=null;
      }
    }
  );

  function press(id,callback){

    document
      .getElementById(id)
      .addEventListener(
        "pointerdown",
        e=>{
          e.preventDefault();
          callback();
        }
      );
  }

  press(
    "jump",
    ()=>{
      state.jumpPressed=true;
    }
  );

  press(
    "punch",
    ()=>{
      state.actionPressed=true;
    }
  );

  press(
    "enter",
    ()=>{
      state.enterPressed=true;
    }
  );

  press(
    "exit",
    ()=>{
      state.exitPressed=true;
    }
  );

  const sprint=
    document.getElementById(
      "sprint"
    );

  sprint.addEventListener(
    "pointerdown",
    ()=>{
      state.sprint=true;
    }
  );

  sprint.addEventListener(
    "pointerup",
    ()=>{
      state.sprint=false;
    }
  );

  sprint.addEventListener(
    "pointercancel",
    ()=>{
      state.sprint=false;
    }
  );

  document
    .getElementById("crouch")
    .addEventListener(
      "pointerdown",
      ()=>{
        state.crouch=
          !state.crouch;
      }
    );

  const keys=new Set();

  window.addEventListener(
    "keydown",
    e=>{

      keys.add(
        e.key.toLowerCase()
      );

      if(e.key===" "){
        state.jumpPressed=true;
      }

      if(
        e.key.toLowerCase()==="e"
      ){
        state.enterPressed=true;
      }

      if(
        e.key.toLowerCase()==="q"
      ){
        state.exitPressed=true;
      }

      if(
        e.key.toLowerCase()==="c" &&
        !e.repeat
      ){
        state.crouch=
          !state.crouch;
      }
    }
  );

  window.addEventListener(
    "keyup",
    e=>{
      keys.delete(
        e.key.toLowerCase()
      );
    }
  );

  return{

    state,

    update(){

      if(
        joystickPointer===null
      ){

        let x=0;
        let y=0;

        if(
          keys.has("a") ||
          keys.has("arrowleft")
        ){
          x-=1;
        }

        if(
          keys.has("d") ||
          keys.has("arrowright")
        ){
          x+=1;
        }

        if(
          keys.has("w") ||
          keys.has("arrowup")
        ){
          y-=1;
        }

        if(
          keys.has("s") ||
          keys.has("arrowdown")
        ){
          y+=1;
        }

        if(x!==0 || y!==0){

          const length=
            Math.hypot(x,y);

          state.moveX=x/length;
          state.moveY=y/length;

        }else{

          state.moveX=0;
          state.moveY=0;
        }
      }

      state.sprint=
        state.sprint ||
        keys.has("shift");
    },

    consumeJump(){

      const value=
        state.jumpPressed;

      state.jumpPressed=false;

      return value;
    },

    consumeAction(){

      const value=
        state.actionPressed;

      state.actionPressed=false;

      return value;
    },

    consumeEnter(){

      const value=
        state.enterPressed;

      state.enterPressed=false;

      return value;
    },

    consumeExit(){

      const value=
        state.exitPressed;

      state.exitPressed=false;

      return value;
    },

    consumeCameraDelta(){

      const result={
        x:state.cameraDX,
        y:state.cameraDY
      };

      state.cameraDX=0;
      state.cameraDY=0;

      return result;
    }
  };
}