import { Cadavre, CadavreChunks } from "./cadavres";
import { MapData, MapProcessor, VisibleBox } from "./map";
import { ParticlesGenerator, ParticlesProcessor } from "./particles";
import { Physic } from "./physic";

export interface PlayerController {
    UP: boolean,
    DOWN: boolean,
    RIGHT: boolean,
    LEFT: boolean,
    RESPAWN: boolean,
}

export class Player extends Physic {

    rot = 10;

    color = 'white';

    endTouchedAlias: string = '';

    private particles: ParticlesGenerator;

    private jumpAudio: HTMLAudioElement;
    private deathAudio: HTMLAudioElement;

    static cadavreCooldown = 100; // frames
    static currentCadavreCooldown = 0;

    constructor(x: number, y: number, color: string) {
        super();

        this.x = x * MapProcessor.tileSize - MapProcessor.tileSize/2;
        this.y = y * MapProcessor.tileSize - MapProcessor.tileSize/2;
        this.color = color;
        this.jumpAudio = new Audio();
        this.jumpAudio.src = '../assets/sounds/jump.wav';
        this.jumpAudio.volume = 0.3;
        this.jumpAudio.load();
        this.deathAudio = new Audio();
        this.deathAudio.src = '../assets/sounds/death.wav';
        this.deathAudio.load();
        // particles
        this.particles = new ParticlesGenerator(x, y, ['red']);
        this.particles.rangeVelocity = {minx: 0, maxx: 0, miny: 0, maxy: 0};
        this.particles.rangeSpawn = {minx: -2, maxx: 0, miny: -2, maxy: 0};
        this.particles.gravity = {x: 0, y: -0.1};
        this.particles.rangeLife = {min: 2, max: 10};
        this.particles.rangeSize = {min: 1, max: 2};
        this.particles.particlePerFrame = 2;
        this.particles.life = -1;
    }

    public draw(context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, map:MapData) {
        this.updateCamera(visibleBox, width, height, map);

        let mody = 0;
        let modw = 0;
        let modh = 0;
        if (!this.groundTouched) {
            this.rot = this.rot + this.vx / 20;
        } else if (this.vx != 0){
            this.rot = this.rot + this.vx / 20;
            mody = (this.x % 30)/10;
        } else {
            this.rot = 0;
        }
        if (Math.abs(this.vx) < Math.abs(this.vy)/2) {modh=3;modw=-3;}

        context.save();
        context.translate(this.x - visibleBox.x, this.y - visibleBox.y - mody);
        context.rotate(this.rot); 
        context.fillStyle = this.color;
        context.fillRect(-this.size/2-modw/2, -this.size/2-modh/2, this.size+modw, this.size+modh);
        context.fillStyle = 'red';
        context.fillRect(-1, -1, 2, 2);
        context.restore();

        this.particles.draw(context, visibleBox);
    }

    public override update(map: MapData, cadavres: CadavreChunks, playerController: PlayerController) {
        if (this.isDead || this.endTouchedAlias) return;

        super.update(map, cadavres, playerController);

        // end
        this.processEnds(map);

        // particles
        this.particles.updatePosition(this.x, this.y);
        this.particles.update();

        // cooldown
        if (Player.currentCadavreCooldown > 0) Player.currentCadavreCooldown -= 1;
    }

    private processEnds(map: MapData) {
        for (const end of map.ends) {
            if (this.x > end.x * MapProcessor.tileSize && this.x < end.x * MapProcessor.tileSize + MapProcessor.tileSize &&
                this.y > end.y * MapProcessor.tileSize && this.y < end.y * MapProcessor.tileSize + MapProcessor.tileSize) {
                this.endTouchedAlias = end.alias;
            }
        }
    }

    public override onTouchGround() {
        const gen = new ParticlesGenerator(this.x, this.y, [this.color]);
        gen.life = 1;
        gen.particlePerFrame = 4;
        gen.rangeVelocity = {minx:-3,maxx:3,miny:-0.5,maxy:0};
        gen.gravity = {x:0, y:0};
        gen.rangeLife = {min:4, max: 5};
        gen.rangeSpawn = {minx: -5,maxx: 5,miny: 2,maxy: 4};
        ParticlesProcessor.addGenerator(gen);
    }

    public override onJump() {
        this.jumpAudio.currentTime = 0;
        this.jumpAudio.play();
        const gen = new ParticlesGenerator(this.x, this.y, [this.color]);
        gen.life = 1;
        gen.particlePerFrame = 4;
        gen.rangeVelocity = {minx:-3,maxx:3,miny:-0.5,maxy:0};
        gen.gravity = {x:0, y:0};
        gen.rangeLife = {min:4, max: 5};
        gen.rangeSpawn = {minx: -5,maxx: 5,miny: 2,maxy: 4};
        ParticlesProcessor.addGenerator(gen);
    }

    public override onDeath() {
        this.deathAudio.currentTime = 0;
        this.deathAudio.play();
        const gen = new ParticlesGenerator(this.x, this.y, ['red', this.color, this.color, this.color]);
        ParticlesProcessor.addGenerator(gen);
    }

    public override onCadavreTouched(cadavre: Cadavre, x: number, y: number): void {
        cadavre.touched = {x: x, y: y, frames: 10};
    }

    private updateCamera(visibleBox: VisibleBox, screenWidth: number, screenHeight: number, map: MapData) {
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
        if (visibleBox.x + screenWidth > map.width * MapProcessor.tileSize) visibleBox.x = map.width * MapProcessor.tileSize - screenWidth;
        if (visibleBox.y + screenHeight > map.height * MapProcessor.tileSize) visibleBox.y = map.height * MapProcessor.tileSize - screenHeight;
        if (visibleBox.x < 0) visibleBox.x = 0;
        if (visibleBox.y < 0) visibleBox.y = 0;
        visibleBox.x = Math.round(visibleBox.x);
        visibleBox.y = Math.round(visibleBox.y);
    }

    public spawnRespawnParticles() {
        const gen = new ParticlesGenerator(this.x, this.y, ['red', this.color, this.color, this.color]);
        gen.rangeVelocity = {minx: -4+this.vx, maxx: 4+this.vx, miny: -4+this.vy, maxy: 4+this.vy};
        gen.rangeSpawn = {minx: -5, maxx: 5, miny: -5, maxy: -5};
        gen.gravity = {x: 0, y: 0.1};
        gen.rangeLife = {min: 4, max: 10};
        gen.particlePerFrame = 45 ;
        gen.life = 1;
        ParticlesProcessor.addGenerator(gen);
    }

    public onKeyDown(key: string, playerController: PlayerController) {
        if (key === 'ArrowUp' || key === ' ' || key.toLowerCase() === 'z' || key.toLowerCase() === 'w') playerController.UP = true;
        if (key === 'ArrowRight' || key.toLowerCase() === 'd') playerController.RIGHT = true;
        // if (key === 'ArrowDown') this.playerController.DOWN = true;
        if (key === 'ArrowLeft' || key.toLowerCase() === 'q'  || key.toLowerCase() === 'a') playerController.LEFT = true;
        if (key.toLowerCase() === 'r') playerController.RESPAWN = true;
    }

    public onKeyUp(key: string, playerController: PlayerController) {
        if (key === 'ArrowUp' || key === ' ' || key.toLowerCase() === 'z' || key.toLowerCase() === 'w') playerController.UP = false;
        if (key === 'ArrowRight' || key.toLowerCase() === 'd') playerController.RIGHT = false;
        if (key === 'ArrowDown') playerController.DOWN = false;
        if (key === 'ArrowLeft' || key.toLowerCase() === 'q'  || key.toLowerCase() === 'a') playerController.LEFT = false;
        if (key.toLowerCase() === 'r' && Player.currentCadavreCooldown == 0) {
            Player.currentCadavreCooldown = Player.cadavreCooldown;
            this.isDead = true;
            playerController.RESPAWN = false;
        }
    }
}