import { Cadavre, CadavreChunks, CadavreProcessor } from "./cadavres";
import { MapData, MapProcessor, PhysicType, VisibleBox } from "./map";

export interface PlayerController {
    UP: boolean,
    DOWN: boolean,
    RIGHT: boolean,
    LEFT: boolean,
    RESPAWN: boolean,
}

export class Player {

    x: number = 10;
    y: number = 10;
    vx: number = 0;
    vy: number = 0;
    rot: number = 0;
    color: string = 'white';
    size: number = 12;

    maxJumpFrames = 10;
    jumpFrames = 0;
    groundTouched = false;
    endTouchedAlias: string = '';

    public isDead = false;
    public canCreateCadavre = false;

    constructor(x: number, y: number, color: string) {
        this.x = x * MapProcessor.tileSize - MapProcessor.tileSize/2;
        this.y = y * MapProcessor.tileSize - MapProcessor.tileSize/2;
        this.color = color;
    }

    public draw(context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox) {
        this.updateCamera(visibleBox, width, height);

        let mody = 0;
        if (!this.groundTouched) {
            this.rot = this.rot + this.vx / 20;
        } else if (Math.abs(this.vx)>0){
            this.rot = this.rot + this.vx / 20;
            mody = (this.x % 30)/10;
        } else {
            this.rot = 0;
        }

        context.save();
        context.translate(this.x - visibleBox.x, this.y - visibleBox.y - mody);
        context.rotate(this.rot); 
        context.fillStyle = this.color;
        context.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        context.fillStyle = 'red';
        context.fillRect(-1, -1, 2, 2);
        context.restore();
    }

    public update(map: MapData, cadavres: CadavreChunks, playerController: PlayerController) {
        if (this.isDead || this.endTouchedAlias) return;

        // gravity
        this.vy += 0.6;

        if (playerController.UP) {
            if (this.jumpFrames < this.maxJumpFrames) {
                this.jumpFrames ++;
                this.vy -= 4;
                this.groundTouched = false;
            }
        } else if (!this.groundTouched) {
            this.jumpFrames = this.maxJumpFrames;
        }

        if (playerController.RIGHT) {
            this.vx += 0.5;
        } else {
            if (this.vx > 0) 
                if (this.groundTouched) this.vx = this.vx > 1 ? this.vx - 1 : 0;
                else this.vx -= 0.1;
        }
        if (playerController.LEFT) {
            this.vx -= 0.5;
        } else {
            if (this.vx < 0)
                if (this.groundTouched) this.vx = this.vx < 1 ? this.vx + 1 : 0;
                else this.vx += 0.1;
        }
        
        // collisions
        this.applyCollision(map, cadavres);

        // stop slow momentum
        if (Math.abs(this.vx) < 0.5) this.vx = 0;

        // limit velocity
        this.vx = this.vx > 4 ? this.vx = 4 : this.vx < -4 ? -4 : this.vx;
        this.vy = this.vy > 8 ? this.vy = 8 : this.vy < -8 ? -8 : this.vy;
        
        // apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // end
        this.processEnds(map);
    }

    private applyCollision(map: MapData, cadavres: CadavreChunks) {
        // terrain
        const collisions = this.getPhysicTypeCollision(map);
        const cadavreCollisions = this.getCadavreCollision(cadavres);

        if (collisions.down == PhysicType.NO_DEATH ||
            collisions.right == PhysicType.NO_DEATH || 
            collisions.left == PhysicType.NO_DEATH || 
            collisions.up == PhysicType.NO_DEATH) {
            // ded
            this.canCreateCadavre = false;
        } else this.canCreateCadavre = true;

        if (collisions.down == PhysicType.DEATH ||
            collisions.right == PhysicType.DEATH || 
            collisions.left == PhysicType.DEATH || 
            collisions.up == PhysicType.DEATH) {
            // ded
            this.isDead = true;
            this.canCreateCadavre = false;
        }

        if (!cadavreCollisions.down) {
            if (collisions.down == PhysicType.COLLISION) {
                if (!this.groundTouched) {
                    this.groundTouched = true;
                    this.jumpFrames = 0;
                    this.onTouchGround();
                }
                this.y = (Math.floor((this.y + this.size / 2 + this.vy) / MapProcessor.tileSize) * MapProcessor.tileSize) - this.size/2 ; 
                this.vy = 0;
            } else {
                this.groundTouched = false;
            }
        }
        if (collisions.right == PhysicType.COLLISION) {
            this.vx = 0;
        }
        if (collisions.left == PhysicType.COLLISION) {
            this.vx = 0;
        }
        if (collisions.up == PhysicType.COLLISION) {
            this.vy = 0;
        }

        // cadavres
        if (!collisions.down) {
            if (cadavreCollisions.down) {
                if (!this.groundTouched) {
                    this.groundTouched = true;
                    this.jumpFrames = 0;
                } 
                this.vy = 0;
            } else {
                this.groundTouched = false;
            }
        }
        if (cadavreCollisions.right) {
            this.vx = 0;
        }
        if (cadavreCollisions.left) {
            this.vx = 0;
        }
        if (cadavreCollisions.up) {
            this.vy = 0;
        }
    }

    private getCadavreCollision(cadavres: CadavreChunks): {up: boolean, right: boolean, down: boolean, left: boolean} {
        const collisions = {up: false, right: false, down: false, left: false};
        for (let cadavre of CadavreProcessor.getNearCadavres(this.x, this.y, cadavres)) {
            collisions.down = collisions.down || 
                this.pointIntersectCadavre(this.x - this.size / 2 + 1, this.y + this.vy + this.size / 2, cadavre) || 
                this.pointIntersectCadavre(this.x + this.size / 2 - 1, this.y + this.vy + this.size / 2, cadavre);
            collisions.right = collisions.right || 
                this.pointIntersectCadavre(this.x + this.vx + this.size / 2, this.y + this.size / 2 - 1, cadavre) || 
                this.pointIntersectCadavre(this.x + this.vx + this.size / 2, this.y - this.size / 2 + 1, cadavre);
            collisions.left = collisions.left || 
                this.pointIntersectCadavre(this.x + this.vx - this.size / 2, this.y + this.size / 2 - 1, cadavre) ||
                this.pointIntersectCadavre(this.x + this.vx - this.size / 2, this.y - this.size / 2 + 1, cadavre);
            collisions.up = collisions.up || 
                this.pointIntersectCadavre(this.x - this.size / 2 + 1, this.y + this.vy - this.size / 2, cadavre) || 
                this.pointIntersectCadavre(this.x + this.size / 2 - 1, this.y + this.vy - this.size / 2, cadavre);
        }
        return collisions;
    }

    private getPhysicTypeCollision(map: MapData): {up: PhysicType, right: PhysicType, down: PhysicType, left: PhysicType} {
        const collisions = {up: 0, right: 0, down: 0, left: 0};
        // down
        collisions.down = 
            this.getPhysicGridAtPosition(map, this.x + this.size / 2-1, this.y + this.vy + this.size / 2) || 
            this.getPhysicGridAtPosition(map, this.x - this.size / 2+1, this.y + this.vy + this.size / 2);
        
        // right
        collisions.right = 
            this.getPhysicGridAtPosition(map, this.x + this.vx + this.size / 2 - 1, this.y+this.size / 2-1) || 
            this.getPhysicGridAtPosition(map, this.x + this.vx + this.size / 2 - 1, this.y-this.size / 2+1);

        // left
        collisions.left =
            this.getPhysicGridAtPosition(map, this.x + this.vx - this.size / 2, this.y+this.size / 2-1) ||
            this.getPhysicGridAtPosition(map, this.x + this.vx - this.size / 2, this.y-this.size / 2+1);

        // up
        collisions.up = 
            //this.getPhysicGridAtPosition(map, this.x, this.y + this.vy - this.size / 2);
            this.getPhysicGridAtPosition(map, this.x + this.size / 2-1, this.y + this.vy - this.size / 2) || 
            this.getPhysicGridAtPosition(map, this.x - this.size / 2+1, this.y + this.vy - this.size / 2);
        return collisions;
    }

    private pointIntersectCadavre(x: number, y: number, cadavre: Cadavre): boolean {
        if (x > cadavre.x - CadavreProcessor.size / 2 && x < cadavre.x + CadavreProcessor.size / 2 &&
            y > cadavre.y - CadavreProcessor.size / 2 && y < cadavre.y + CadavreProcessor.size / 2) {
            return true;
        }
        return false;
    }

    private getPhysicGridAtPosition(map: MapData, x: number, y: number): PhysicType {
        const px = Math.floor(x / MapProcessor.tileSize);
        const py = Math.floor(y / MapProcessor.tileSize);
        if (px < 0 || py < 0 || px >= map.width || py >= map.height) return PhysicType.COLLISION;
        return map.physicLayer[px][py];
    }

    private processEnds(map: MapData) {
        for (const end of map.ends) {
            if (this.x > end.x * MapProcessor.tileSize && this.x < end.x * MapProcessor.tileSize + MapProcessor.tileSize &&
                this.y > end.y * MapProcessor.tileSize && this.y < end.y * MapProcessor.tileSize + MapProcessor.tileSize) {
                this.endTouchedAlias = end.alias;
            }
        }
    }

    private onTouchGround() {
        
        console.log('ground')
    }

    private updateCamera(visibleBox: VisibleBox, screenWidth: number, screenHeight: number) {
        if (this.vx > 0 && this.x - visibleBox.x > 6 * screenWidth / 9) {
            // right
            visibleBox.x += this.vx;
        }
        if (this.vx < 0 && this.x - visibleBox.x < 4 * screenWidth / 9) {
            // left
            visibleBox.x += this.vx;
        }
        if (this.vy > 0 && this.y - visibleBox.y > 6 * screenHeight / 9) {
            // bottom
            visibleBox.y += this.vy;
        }
        if (this.vy < 0 && this.y - visibleBox.y < 4 * screenHeight / 9) {
            // top
            visibleBox.y += this.vy;
        }

        // catch up to player
        if (visibleBox.x + screenWidth / 5 > this.x) {
            visibleBox.x -= 20;
        }
        if (visibleBox.x + screenWidth < this.x + screenWidth / 5) {
            visibleBox.x += 20;
        }
        if (visibleBox.y + screenHeight / 5 > this.y) {
            visibleBox.y -= 20;
        }
        if (visibleBox.y + screenHeight < this.y + screenHeight /5) {
            visibleBox.y += 20;
        }


        // limits
        if (visibleBox.x < 0) visibleBox.x = 0;
        if (visibleBox.y < 0) visibleBox.y = 0;
        visibleBox.x = Math.round(visibleBox.x);
        visibleBox.y = Math.round(visibleBox.y);
    }
}