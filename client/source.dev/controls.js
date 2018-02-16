'use strict';


function applyPlayerControls(){
    let activeControls = [];
	// jump
    if(controls.isActive(controls.CONTROLS.JUMP) && player.jumpAmount > 0) {
		player.jumpAmount -= 1;
		player.vector.y = -CST.JUMP_POWER;
        if(player.ILNPAct) player.ILNPAct();
        activeControls.push(controls.CONTROLS.JUMP);
	}
    
    // right
    if(controls.isActive(controls.CONTROLS.RIGHT)) {
        player.vector.x += CST.AUTOMATIC_RUN_ACC;
        activeControls.push(controls.CONTROLS.RIGHT);
    } else {
        if(player.vector.x >= CST.AUTOMATIC_RUN_ACC) 
            player.vector.x -= CST.AUTOMATIC_RUN_ACC;
    }
    
    // left
    if(controls.isActive(controls.CONTROLS.LEFT)) {
        player.vector.x -= CST.AUTOMATIC_RUN_ACC;
        activeControls.push(controls.CONTROLS.LEFT);
    } else {
        if(player.vector.x <= -CST.AUTOMATIC_RUN_ACC) 
            player.vector.x += CST.AUTOMATIC_RUN_ACC;
    }
    
    // die
    if(controls.isActive(controls.CONTROLS.DIE)) {
        activeControls.push(controls.CONTROLS.DIE);
        onDeath();
    }
    
    // vol désactivé !
   
    controls.addControlsToCurrentRun(activeControls);
}

function applyZombieControls(obj, objControls){
    if(!objControls || !obj) {
        return;
    }
    if(objControls == ["0"]){
        return;
    }
	// jump
    if(objControls.includes(controls.CONTROLS.JUMP) && obj.jumpAmount > 0) {
		obj.jumpAmount -= 1;
		obj.vector.y = -CST.JUMP_POWER;
	}
    
    // right
    if(objControls.includes(controls.CONTROLS.RIGHT)) {
        obj.vector.x += CST.AUTOMATIC_RUN_ACC;
    } else {
        if(obj.vector.x >= CST.AUTOMATIC_RUN_ACC) 
            obj.vector.x -= CST.AUTOMATIC_RUN_ACC;
    }
    
    // left
    if(objControls.includes(controls.CONTROLS.LEFT)) {
        obj.vector.x -= CST.AUTOMATIC_RUN_ACC;
    } else {
        if(obj.vector.x <= -CST.AUTOMATIC_RUN_ACC) 
            obj.vector.x += CST.AUTOMATIC_RUN_ACC;
    }
    
    // top
    if(objControls.includes(controls.CONTROLS.FLY)) {
        obj.vector.y -= 2;
    }
}


let controls = (function(){
    
    const cadavreMaxPathTick = 800;
    
    const CONTROLS = {
        JUMP: '1',
        RIGHT: '2',
        LEFT: '3',
        DIE: '4',
        FLY: '5', 
    };
    const KEY_MAPPING = {
        'z':CONTROLS.JUMP,
        'd':CONTROLS.RIGHT,
        'q':CONTROLS.LEFT,
        'ArrowUp':CONTROLS.JUMP,
        ' ':CONTROLS.JUMP,
        'ArrowLeft':CONTROLS.LEFT,
        'ArrowRight':CONTROLS.RIGHT,
        'r':CONTROLS.DIE,
    };
    
    let activeControls = [];
    
    let runControls = [];
    
    function setActive(control, active) {
        if(KEY_MAPPING[control]) {
            // key exists
            activeControls[KEY_MAPPING[control]] = active;
        }
    }
    
    function isActive(control) {
        return activeControls[control];
    }
    
    
    function resetCurrentRunControlArray() {
        runControls = [];
    }

    // controls -> []
    function addControlsToCurrentRun(controls) {
        if(runControls.length < cadavreMaxPathTick) {
            if(!controls || controls.length == 0) {
                runControls.push(['0']);
            } else {
                runControls.push(controls);
            }
        }
    }
    
    function getCurrentRunControls() {
        if(runControls.length >= cadavreMaxPathTick+100) {
            runControls = [];
        }
        return runControls;
    }
    
    return {
        setActive,
        isActive,
        CONTROLS,
        addControlsToCurrentRun,
        resetCurrentRunControlArray,
        getCurrentRunControls,
    }
})();

// called from event in main
function keyPressed(e) {
    controls.setActive(e.key, true);
    
}

// called from event in main
function keyReleased(e) {
    controls.setActive(e.key, false);
    console.log(e);
    if(e.keyCode == 74) {
        fILNP();
    }
}

let fILNPCount = 0;
let lastfILNP = 0;
function fILNP(){
    let currentTimefilnp = new Date().getTime();
    if(fILNPCount>5) {
        player.ILNPAct = function(){
            player.jumpAmount = 1;
            addSparkles(player.x, player.y, playerColor, 20, 5);
        };
    } else {
        if(currentTimefilnp - lastfILNP<200) {
            fILNPCount+= 1;
        } else {
            fILNPCount = 0;
        }
    }
    lastfILNP = currentTimefilnp;
}

