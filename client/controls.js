'use strict';

function applyControls(){
	// jump
    if(controls.isActive(controls.CONTROLS.JUMP) && jumpAmount > 0) {
		jumpAmount -= 1;
		player.vector.y = -CST.JUMP_POWER;
	}
    
    // right
    if(controls.isActive(controls.CONTROLS.RIGHT)) {
        player.vector.x += CST.AUTOMATIC_RUN_ACC;
    } else {
        if(player.vector.x >= CST.AUTOMATIC_RUN_ACC) 
            player.vector.x -= CST.AUTOMATIC_RUN_ACC;
    }
    
    // left
    if(controls.isActive(controls.CONTROLS.LEFT)) {
        player.vector.x -= CST.AUTOMATIC_RUN_ACC;
    } else {
        if(player.vector.x <= -CST.AUTOMATIC_RUN_ACC) 
            player.vector.x += CST.AUTOMATIC_RUN_ACC;
    }
    
    // die
    if(controls.isActive(controls.CONTROLS.DIE)) {
        onDeath();
    }
}


let controls = (function(){
    const CONTROLS = {
        JUMP: 1,
        RIGHT: 2,
        LEFT: 3,
        DIE: 4,
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
    
    function setActive(control, active) {
        if(KEY_MAPPING[control]) {
            // key exists
            activeControls[KEY_MAPPING[control]] = active;
        }
    }
    
    function isActive(control) {
        return activeControls[control];
    }
    
    return {
        setActive,
        isActive,
        CONTROLS,
    }
})();

// called from event in main
function keyPressed(e) {
    controls.setActive(e.key, true);
}

// called from event in main
function keyReleased(e) {
    controls.setActive(e.key, false);
}