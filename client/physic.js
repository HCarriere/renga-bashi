'use strict';

let cadavreClusters = [];

const ORI = {
	BOTTOM: 1,
	RIGHT: 0,
	TOP: 3,
	LEFT: 2,
};

function applyPhysic(obj){

    // gravity
    obj.vector.x += obj.gravity.x;
    obj.vector.y += obj.gravity.y;

    
    for(let point of obj.points) {
		for(let ori of point.orientations) {
            // Check collisions with terrain
            let col = getCollisionDistanceWithTerrain(point, ori, obj);
			if(col) {
				obj.vector.x = col.x;
				obj.vector.y = col.y;
			}
            
            // Check collisions with cadavres
            for(let cad of getCurrentCadavreCluster(point, obj)) {
                col = getCollisionDistanceWithCadavre(point, ori, obj, cad);
                if(col) {
                    obj.vector.x = col.x;
				    obj.vector.y = col.y;
                }
            }
		}
    }

    // stop the "slooooow" momentum
    if(Math.abs(obj.vector.x) < CST.AUTOMATIC_RUN_ACC) {
        obj.vector.x = 0;
    }
    
    // falling ?
    if(obj.vector.y != 0) {
        obj.state = characterState.JUMPING;
    }
    
    //Check limite
	obj.vector.x = constrain(obj.vector.x, -CST.SPEEDLIMIT.X, CST.SPEEDLIMIT.X);
	obj.vector.y = constrain(obj.vector.y, -CST.SPEEDLIMIT.Y, CST.SPEEDLIMIT.Y);

    obj.x += obj.vector.x;
    obj.y += obj.vector.y;
}


/*

points:
[
    dx, // difference sur x par rapport au point de ref
    dy, //                y
]
 */
function initPhysicObject(x, y, size, vector, points) {
    let o = {
        x: x,
        y: y,
        size: size,
        vector: vector,
        points: points,
        gravity: {
            x: 0,
            y: CST.GRAVITY
        }
    };
	physicObjects.push(o);
	return o;
}

function addCadavreToCluster(cadavre) {
    let i = Math.floor(cadavre.x / 100);
    let j = Math.floor(cadavre.y / 100);
    if(!cadavreClusters[i]) {
        cadavreClusters[i] = [];
    }
    if(!cadavreClusters[i][j]) {
        cadavreClusters[i][j] = [];
    }
    cadavre.cx = i;
    cadavre.cy = j;
    cadavre.color = `rgb(${50+(i*83)%200},${50+(j*97)%200},${(i*j)%250})`;//tests purpose
    
    cadavreClusters[i][j].push(cadavre);
}

function getCurrentCadavreCluster(point, obj) {
    let ci = Math.floor((point.dx+obj.x) / 100);
    let cj = Math.floor((point.dy+obj.y) / 100);
    let bigCluster = [];
    for(let i = ci-1; i<ci+3; i++) {
        for(let j=cj-1; j<cj+3; j++) {
            if(cadavreClusters[i] && cadavreClusters[i][j]) {
                bigCluster = bigCluster.concat(cadavreClusters[i][j]);
            }
        }
    }
    return bigCluster;
}



/*
return false if no collision next tick.
return distance between collision point and point otherwise , as a vector (.x, .y)
*/
function getCollisionDistanceWithTerrain(point, orientation, obj){
	if(orientation == ORI.BOTTOM) {
        let xModifier = point.dx>0?-1:1;
		if(isCollidedWithTerrain(point.dx + obj.x + xModifier,(point.dy + obj.y)+obj.vector.y)) {
			onTouchGround(obj);
			return {
				x: obj.vector.x,
				y: Math.floor((point.dy + obj.y+obj.vector.y)/32) * 32 - (point.dy + obj.y),
			};			
		}
	} else if(orientation == ORI.RIGHT) {
        let yModifier = point.dy>0?-1:1;
		if(isCollidedWithTerrain(point.dx + obj.x+obj.vector.x,point.dy + obj.y+ yModifier)) {
			return {
				x: Math.floor((point.dx + obj.x+obj.vector.x)/32) * 32 - (point.dx + obj.x),
				y: obj.vector.y,
			};			
		}
	} else if(orientation == ORI.TOP) {
        let xModifier = point.dx>0?-1:1;
		if(isCollidedWithTerrain(point.dx + obj.x + xModifier,point.dy + obj.y+obj.vector.y)) {
			return {
				x: obj.vector.x,
				y: Math.floor((point.dy + obj.y+obj.vector.y)/32) * 32 + 32 - point.dy + obj.y,
			};			
		}
	} else if(orientation == ORI.LEFT) {
        let yModifier = point.dy>0?-1:1;
		if(isCollidedWithTerrain(point.dx + obj.x+obj.vector.x,point.dy + obj.y+yModifier)) {
			return {
				x: Math.floor((point.dx + obj.x+obj.vector.x)/32) * 32 + 32- (point.dx + obj.x),
				y: obj.vector.y,
			};			
		}
	}
	return false;
}

function isCollidedWithTerrain(x, y){
	// out of bound
	if(x<0 || y<0 || x/tilesProperties.size>map.width || y/tilesProperties.size>map.height) {
		return false;
	}
	// tiles
    if(map.coord[Math.floor(y / tilesProperties.size)][Math.floor(x / tilesProperties.size)] === 1){
        return true;
    }

    return false;
}


function getCollisionDistanceWithCadavre(point, orientation, obj, cadavre) {
    if(orientation == ORI.BOTTOM) {
        let xModifier = point.dx>0?-1:1;
		if(intersectsWithCadavre(point.dx + obj.x + xModifier,(point.dy + obj.y)+obj.vector.y, cadavre)) {
            onTouchGround(obj);
			return {
				x: obj.vector.x,
				y: (cadavre.y-characterProperties.size/2)-(obj.y+point.dy),
			};			
		}
	} else if(orientation == ORI.RIGHT) {
        let yModifier = point.dy>0?-1:1;
		if(intersectsWithCadavre(point.dx + obj.x+obj.vector.x,point.dy + obj.y+yModifier, cadavre)) {
			return {
				x: (cadavre.x-characterProperties.size/2)-(obj.x+point.dx),
				y: obj.vector.y,
			};			
		}
	} else if(orientation == ORI.TOP) {
        let xModifier = point.dx>0?-1:1;
		if(intersectsWithCadavre(point.dx + obj.x + xModifier,point.dy + obj.y+obj.vector.y, cadavre)) {
			return {
				x: obj.vector.x,
				y: (cadavre.y+characterProperties.size/2)-(obj.y+point.dy),
			};			
		}
	} else if(orientation == ORI.LEFT) {
        let yModifier = point.dy>0?-1:1;
		if(intersectsWithCadavre(point.dx + obj.x+obj.vector.x,point.dy + obj.y+yModifier, cadavre)) {
			return {
				x: (cadavre.x+characterProperties.size/2)-(obj.x+point.dx),
				y: obj.vector.y,
			};			
		}
	}
	return false;
}

function intersectsWithCadavre(x, y, cadavre) {
    // inside
    return (
        cadavre.x - characterProperties.size/2 < x && 
        cadavre.x + characterProperties.size/2 > x && 
        cadavre.y - characterProperties.size/2 < y && 
        cadavre.y + characterProperties.size/2 > y
    );
}
