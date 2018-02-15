'use strict';

let canvas;
let ctx;
let width;
let height;
let currentFrame;
let lastTick;
let frameRate;
let deltaTime;
let stopDrawLoop;

let particles;
let obsoleteParticles;

let cadavres;
let zombies;
let player;
let lastDeathUpdateDate;
const playerguid = guid();
const playerColor = getRandomColor();
let physicObjects = [];

let tilesProperties = {
    size: 32
};
let characterProperties = {
    size: 20
}
let deathCooldown = 300; // TODO real death system
let levelName;
let offset = {
    x:0,
    y:0,
};
let map;
let onTransition = false;
let canMove = false;

const CST = {
    PARTICLES: {
        GRAVITY: -0.1,
        SPEED:0.0,
        MAX_SIZE:4,
        ENTROPY: 0.05,
    },
    GRAVITY: 0.5,
    SPEEDLIMIT: {
        X:4,
        Y:8,
    },
	JUMP_POWER: 16, 
	AUTOMATIC_RUN_ACC: 1,
};


function launch() {
    if(!ctx) {
        initCanvas();
    }
    currentFrame = 0;

    particles = [];
    obsoleteParticles = [];

	cadavres = [];
    // launch
    stopDrawLoop = false;

    player = initPhysicObject(
        0, 0,
        characterProperties.size,
        {x: 0, y:0},
        [
            {
                dx: characterProperties.size / 2,
                dy: characterProperties.size / 2,
                orientations: [ORI.RIGHT, ORI.BOTTOM]
            },
            {
                dx: -characterProperties.size / 2,
                dy: characterProperties.size / 2,
                orientations: [ORI.LEFT, ORI.BOTTOM]
            },
            {
                dx: characterProperties.size / 2,
                dy: -characterProperties.size / 2,
                orientations: [ORI.RIGHT, ORI.TOP]
            },
            {
                dx: -characterProperties.size / 2,
                dy: -characterProperties.size / 2,
                orientations: [ORI.LEFT, ORI.TOP]
            },
        ]);
    player.idDead = false;
    player.jumpAmount = 0;
    beginLevel(null, ()=>{
        getNewDeaths();
    });
    

    mainLoop();
}

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // window events
    window.addEventListener('keypress', keyPressed);
    window.addEventListener('keyup', keyReleased);
    window.onresize = resizeCanvas;

    // canvas size
    width = canvas.width = (window.innerWidth);
    height = canvas.height = (window.innerHeight);
    resizeCanvas();
}


// MAIN LOOP //

function mainLoop() {
	// fps
    currentFrame++;
    getFPS();
	
	if(map && player) {
		gameFrame();
	}
    ctx.clearRect(0, 0, width, height);

    // graphics
    if(map) {
        drawMap();
        for(let end of map.objects.ends) {
            drawEnd(end);
        }
        
        drawCharacter(player);
        
        //zombies
        if(zombies) {
            for(let z of zombies) {
                drawZombie(z);
            }
        }
    }
    if(cadavres) {
        for(let c of cadavres) {
            drawCadavre(c);
        }
    }

    drawParticles();

    //// debug
    ctx.fillStyle = 'white';
    ctx.fillText(
        'fps: '+Math.floor(frameRate)
        , 50, 25);
    ctx.fillText(
        'zone cadavres: '+cadavres.length
        , 50, 50);
    
    if(!stopDrawLoop) {
        requestAnimationFrame(mainLoop);
    }
}

// GAME MECHANICS //
function gameFrame() {
    // controls
    if(!player.isDead && canMove) {
	   applyPlayerControls();
    }
	
    // end collision
    checkCollisionWithEnds(player);
	
    if(zombies) {
        for(let z of zombies) {
            if(z.currentAnimationFrame >= z.path.length-1) {
                // end of zombie
                addSparkles(z.x, z.y, z.color, 30, 4);
            } else {
                applyZombieControls(z, z.path[z.currentAnimationFrame]);
                z.currentAnimationFrame++;
            }
        }
        // remove zombies
        for(let i = 0; i<zombies.length; i++) {
            if(zombies[i].currentAnimationFrame >= zombies[i].path.length-1) {
                zombies.splice(i, 1);
            }
        }
    }
    
	// physics
    for(let o of physicObjects) {
        applyPhysic(o);
    }
	
	// camera
	setCameraOffset(player);
    
    deathCooldown--;
}

function onTouchGround(obj) {
    if(obj.isDead && deathCooldown<=0) { 
        // die
         deathCooldown = 3000;
        // zone rouge
        if(isCollidedWithTerrain(player.x, player.y, PHYSIC_BLOC_TYPES.NO_DEATH)) {
            reinitPlayer();
            return;
        }
        $.ajax({
            type:'POST',
            url:server+'/api/cadavres/add', 
            data:{
                x: player.x,
                y: player.y,
                path: controls.getCurrentRunControls(),
                level: levelName,
                rot:player.rot,
                guid: playerguid,
                color: playerColor,
            }, 
            success: data => {
                // death date
                lastDeathUpdateDate = data;
                console.log('lastDeathUpdateDate:'+lastDeathUpdateDate);
                reinitPlayer();
            },
            error: (msg) => {
                console.log('error:'+JSON.stringify(msg));
            }, 
            dataType:'json'
        });
    } else {
        obj.jumpAmount = 1; // reset jumps
        obj.state = characterState.DEFAULT;
    }
}

function onDeath() {
    if(deathCooldown>0) {
        return; // can't die now
    }
    
    player.isDead = true; // will realy die when the ground is touched
}

function beginLevel(level, callback) {
    if(onTransition) {
        return;
    }
    onTransition = true;
    cleanCadavres();
    controls.resetCurrentRunControlArray();
    getMap(function(data){
        map = data.map;
        map.coord = getMapCoordArray(map);
        map.objects = getMapObjects(map);
        player.x = map.objects.begin.x+map.objects.begin.width/2;
        player.y = map.objects.begin.y+map.objects.begin.height/2;
        offset.x = player.x - width/2;
        offset.y = player.y - height/2;
        levelName = data.title;
        editCss(map);
        delete map.layers;
        delete map.tilesets;
        callback();
        onTransition = false;
    }, level);
    
}

function reinitPlayer() {
    zombies = [];
    getNewDeaths(lastDeathUpdateDate);
    deathCooldown = 300;
    player.isDead = false;
    player.x = map.objects.begin.x+map.objects.begin.width/2;
    player.y = map.objects.begin.y+map.objects.begin.height/2;
    offset.x = player.x - width/2;
    offset.y = player.y - height/2;
}

function getNewDeaths(date) {
    if(!date) {
        canMove = false;
    }
    getDeaths(date, levelName, data=>{
        for(let c of data){
            // validate position
            if(!isCollidedWithTerrain(c.x, c.y, PHYSIC_BLOC_TYPES.NO_DEATH)) {
                // try to create zombie
                createZombie(c);

                cadavres.push(c);
                // add to cluster
                addCadavreToCluster(c);
            }
        }
        canMove = true;
        //lastDeathUpdateDate = new Date();
    });
}


function cleanCadavres() {
    cadavres = [];
    cadavreClusters = [];
    zombies = [];
}

function createZombie(cadavre) {
    if(!zombies) {
        zombies = [];
    }
    if(zombies.length>10){ // limit
        return;
    }
    if(!cadavre.path || cadavre.path.length<=0){
        return;
    }
    let path = cadavre.path;
    let col = cadavre.color;
    cadavre = initPhysicObject(
        map.objects.begin.x+map.objects.begin.width/2, 
        map.objects.begin.y+map.objects.begin.height/2,
        characterProperties.size,
        {x: 0, y:0},
        [
            {
                dx: characterProperties.size / 2,
                dy: characterProperties.size / 2,
                orientations: [ORI.RIGHT, ORI.BOTTOM]
            },
            {
                dx: -characterProperties.size / 2,
                dy: characterProperties.size / 2,
                orientations: [ORI.LEFT, ORI.BOTTOM]
            },
            {
                dx: characterProperties.size / 2,
                dy: -characterProperties.size / 2,
                orientations: [ORI.RIGHT, ORI.TOP]
            },
            {
                dx: -characterProperties.size / 2,
                dy: -characterProperties.size / 2,
                orientations: [ORI.LEFT, ORI.TOP]
            },
        ]);
    cadavre.color = col;
    cadavre.jumpAmount = 0;
    cadavre.path = path;
    cadavre.currentAnimationFrame = 0;
    zombies.push(cadavre);
}

function setCameraOffset(obj) {
    // general following
	if(obj.x-offset.x>width*0.7) offset.x+=max(Math.abs(obj.vector.x), 1);
	if(obj.x-offset.x<width*0.3) offset.x-=max(Math.abs(obj.vector.x), 1);
	if(obj.y-offset.y<height*0.3) offset.y-=max(Math.abs(obj.vector.y),1);
	if(obj.y-offset.y>height*0.7) offset.y+=max(Math.abs(obj.vector.y),1);
    
    // right limit
    offset.x = min(offset.x, map.width*tilesProperties.size-width);
    
    // left limit
    offset.x = max(offset.x, 0);
    
    // top limit
    offset.y = max(offset.y, 0);
    
    // bottom limit
    offset.y = min(offset.y, map.height*tilesProperties.size-height);
    
}

function checkCollisionWithEnds(obj) {
    for(let end of map.objects.ends) {
        if(obj.x > end.x && obj.x < end.x+end.width &&
          obj.y > end.y && obj.y < end.y+end.height) {
            // collision
            beginLevel(end.properties.nextLevel, ()=> {
                getNewDeaths();
            });
        }
    }
}

// UTILS //
function resizeCanvas() {
    width = canvas.width = (window.innerWidth);
    setTimeout(function() {
        height = canvas.height = (window.innerHeight);
    }, 0);
};


function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function min(a1, a2) {
    if(a1<=a2) return a1;
    return a2;
}

function max(a1, a2) {
    if(a1>=a2) return a1;
    return a2;
}

function constrain(a, min, max) {
	if(a<min) return min;
	if(a>max) return max;
	return a;
}

function inbound(x1, y1, x2, y2, size) {
    if(x1 > x2-size/2 && x1 < x2+size/2 &&
        y1 > y2 -size/2 && y1 < y2+size/2) {
        return true;
    }
    return false;
}


function outbound(x,y) {
    if(x<0 || x>width || y<0 || y>height) {
        return true;
    }
    return false;
}


function randomInt(min, max) {
    return Math.floor(Math.random()*max + min);
}


function getFPS() {
    if(!lastTick){
        lastTick = performance.now();
        return;
    }
    deltaTime = (performance.now() - lastTick)/1000;
    lastTick = performance.now();
    frameRate = 1/deltaTime;
}

// PARTICLES //
// public
function drawParticles() {
    for(let i = 0; i<particles.length; i++) {
        // move
        particles[i].diry += CST.PARTICLES.GRAVITY;
        particles[i].x += particles[i].dirx;
        particles[i].y += particles[i].diry;
        particles[i].size -= CST.PARTICLES.ENTROPY;
        // outbound
        if(particles[i].size <= 0 ||
            outbound(particles[i].x-offset.x, particles[i].y-offset.y)) {
            obsoleteParticles.push(i);
        }
        // draw
        ctx.beginPath();
        ctx.fillStyle = particles[i].color;
        ctx.fillRect(particles[i].x-offset.x, particles[i].y-offset.y,
            particles[i].size, particles[i].size);
        ctx.fill();
    }
    removeParticles();
}

function addSparkles(x, y, color, size, power) {
    for(let i =0; i<size; i++) {
        addParticle(x, y, color, power);
    }
}

// privates
function removeParticles() {
    for(let i of obsoleteParticles) {
        particles.splice(i, 1);
    }
    obsoleteParticles = [];
}

function addParticle(x, y, color, power) {
    let vector = getRandomVector(CST.PARTICLES.SPEED+power);
    particles.push({
        x: x,
        y: y,
        dirx: vector.x,
        diry: vector.y,
        color: color,
        size: Math.random()*CST.PARTICLES.MAX_SIZE+1,
    });
}

function getRandomVector(magMax) {
    let angle = Math.random() * Math.PI * 2;
    let mag = Math.random() * magMax - magMax;
    return {
        x: Math.cos(angle) * mag,
        y: Math.sin(angle) * mag,
    }
}

function getMapCoordArray(jsonMap) {

    let coordArray = {
        physic: [],
        background: [],
    };
    
    let tilesetMapping = {
        0:0
    };
    
    // tilesets
    for(let tileset of jsonMap.tilesets) {
        if(tileset.source.endsWith('tile_physic.tsx')) {
            // physic zone
            tilesetMapping[tileset.firstgid] = PHYSIC_BLOC_TYPES.PHYSIC;
        } else if(tileset.source.endsWith('tile_zone.tsx')) {
            // no dead zone
            tilesetMapping[tileset.firstgid] = PHYSIC_BLOC_TYPES.NO_DEATH;
        } else {
            // hexa color
            tilesetMapping[tileset.firstgid] = '#'+
                tileset.source.substring(
                tileset.source.lastIndexOf('/')+1
            ).replace('.tsx','');
        }
    }
    
    //const jsonLayers = jsonMap.layers[0].data;
    for(let layer of jsonMap.layers) {
        if(layer.name=='physic') {
            for (let i = 0; i < layer.data.length; i++){
                if(i%layer.width==0) {
                    coordArray.physic[i/layer.width] = [];
                }
                coordArray.physic[(i - i % layer.width) / layer.width][i % layer.width] = tilesetMapping[layer.data[i]];
            }
        }
        if(layer.name=='graphic') {
            for (let i = 0; i < layer.data.length; i++){
                if(i%layer.width==0) {
                    coordArray.background[i/layer.width] = [];
                }
                coordArray.background[(i - i % layer.width) / layer.width][i % layer.width] = tilesetMapping[layer.data[i]];
            }
        }
    }

    return coordArray;
}

function getMapObjects(jsonMap) {
    let objects = {};
    objects.ends = [];
    // get objects layers
    for(let layer of jsonMap.layers){
        if(layer.type=='objectgroup') {
            for(let obj of layer.objects) {
                if(obj.type == 'end') {
                    if(obj.properties && obj.properties.nextLevel) {
                        objects.ends.push(obj);
                    }
                } else {
                    objects[obj.type] = obj;
                }
            }
        }
    }
    return objects;
}

function editCss(jsonMap) {
    if(jsonMap.properties && jsonMap.properties.css) {
        $('body').css('background', jsonMap.properties.css);
    }
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}