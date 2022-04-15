import { Cadavre, CadavreChunks, CadavreProcessor } from "./cadavres";
import { MapData, MapProcessor, PhysicType } from "./map";
import { PlayerController } from "./player";


export class Physic {
    x = 10;
    y = 10;
    vx = 0;
    vy = 0;
    size = 14;

    maxJumpFrames = 10;
    jumpFrames = 0;
    groundTouched = false;

    public isDead = false;
    public canCreateCadavre = false;

    static physicSettings = {
        gravity: 0.6,
        jumpSpeed: 4,
        runSpeed: 0.5,
        airControl: 0.3,
        frictionGround: 1, 
        frictionAir: 0.1,
        limit: {
            x: 4,
            y: 8,
        }
    }

    public update(map: MapData, cadavres: CadavreChunks, playerController: PlayerController) {
        // gravity
        this.vy += Physic.physicSettings.gravity;

        if (playerController.UP) {
            if (this.groundTouched) {
                this.onJump();
            }
            if (this.jumpFrames < this.maxJumpFrames) {
                this.jumpFrames ++;
                this.vy -= Physic.physicSettings.jumpSpeed;
                this.groundTouched = false;
            }
        } else if (!this.groundTouched) {
            this.jumpFrames = this.maxJumpFrames;
        }

        if (playerController.RIGHT) {
            if (this.groundTouched) this.vx += Physic.physicSettings.runSpeed;
            else this.vx += Physic.physicSettings.airControl;
        } else {
            if (this.vx > 0) 
                if (this.groundTouched) this.vx = this.vx > Physic.physicSettings.frictionGround ? this.vx - Physic.physicSettings.frictionGround : 0;
                else this.vx -= Physic.physicSettings.frictionAir;
        }
        if (playerController.LEFT) {
            if (this.groundTouched) this.vx -= Physic.physicSettings.runSpeed;
            else this.vx -= Physic.physicSettings.airControl;
        } else {
            if (this.vx < 0)
                if (this.groundTouched) this.vx = this.vx < Physic.physicSettings.frictionGround ? this.vx + Physic.physicSettings.frictionGround : 0;
                else this.vx += Physic.physicSettings.frictionAir;
        }
        
        // collisions
        this.applyCollision(map, cadavres);

        // stop slow momentum
        if (Math.abs(this.vx) < Physic.physicSettings.airControl) this.vx = 0;
        if (Math.abs(this.vy) < Physic.physicSettings.airControl) this.vy = 0;

        // limit velocity
        this.vx = this.vx > Physic.physicSettings.limit.x ? this.vx = 
            Physic.physicSettings.limit.x : this.vx < -Physic.physicSettings.limit.x ? -Physic.physicSettings.limit.x : this.vx;
        this.vy = this.vy > Physic.physicSettings.limit.y ? this.vy = 
            Physic.physicSettings.limit.y : this.vy < -Physic.physicSettings.limit.y ? -Physic.physicSettings.limit.y : this.vy;
        
        // apply velocity
        this.x += this.vx;
        this.y += this.vy;

    }

    private applyCollision(map: MapData, cadavres: CadavreChunks) {
        // terrain
        const collisions = this.getPhysicTypeCollision(map);
        const cadavreCollisions = this.getCadavreCollision(cadavres);

        if (collisions.down == PhysicType.NO_DEATH ||
            collisions.right == PhysicType.NO_DEATH || 
            collisions.left == PhysicType.NO_DEATH || 
            collisions.up == PhysicType.NO_DEATH) {
            // not ded
            this.canCreateCadavre = false;
        } else this.canCreateCadavre = true;

        if (collisions.down == PhysicType.DEATH ||
            collisions.right == PhysicType.DEATH || 
            collisions.left == PhysicType.DEATH || 
            collisions.up == PhysicType.DEATH) {
            // ded
            this.isDead = true;
            this.canCreateCadavre = false;
            this.onDeath();
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
                this.vy = -this.vy/4;
                this.onCadavreTouched(cadavreCollisions.down, this.vx, this.vy);
            } else {
                this.groundTouched = false;
            }
        }
        if (cadavreCollisions.right) {
            this.vx = -this.vx/3;
            this.onCadavreTouched(cadavreCollisions.right, this.vx, this.vy);
        }
        if (cadavreCollisions.left) {
            this.vx = -this.vx/3;
            this.onCadavreTouched(cadavreCollisions.left, this.vx, this.vy);
        }
        if (cadavreCollisions.up) {
            this.vy = -this.vy/3;
            this.onCadavreTouched(cadavreCollisions.up, this.vx, this.vy);
        }
    }

    private getCadavreCollision(cadavres: CadavreChunks): {up: Cadavre, right: Cadavre, down: Cadavre, left: Cadavre} {
        const collisions: any = {up: false, right: false, down: false, left: false};
        for (let cadavre of CadavreProcessor.getNearCadavres(this.x, this.y, cadavres)) {
            if (cadavre.ghostTime && cadavre.ghostTime > 0) continue;

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

    private pointIntersectCadavre(x: number, y: number, cadavre: Cadavre): Cadavre | boolean {
        if (x > cadavre.x - CadavreProcessor.size / 2 && x < cadavre.x + CadavreProcessor.size / 2 &&
            y > cadavre.y - CadavreProcessor.size / 2 && y < cadavre.y + CadavreProcessor.size / 2) {
            return cadavre;
        }
        return false;
    }

    private getPhysicGridAtPosition(map: MapData, x: number, y: number): PhysicType {
        const px = Math.floor(x / MapProcessor.tileSize);
        const py = Math.floor(y / MapProcessor.tileSize);
        if (px < 0 || py < 0 || px >= map.width || py >= map.height) return PhysicType.COLLISION;
        return map.physicLayer[px][py];
    }

    public onTouchGround() {

    }

    public onJump() {
        
    }

    public onDeath() {
        
    }

    public onCadavreTouched(cadavre: Cadavre, x: number, y: number): void {}

}