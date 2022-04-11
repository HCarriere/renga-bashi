import { VisibleBox } from "./map";

export interface Particle {
    x: number,
    y: number,
    size: number,
    vx: number,
    vy: number,
    color: string,
    life: number,
}

export class ParticlesGenerator {
    public x: number;
    public y: number;
    public colors: string[];

    /**
     * -1 : infinite;
     * otherwise in frames
     */
    public life = 30;
    public particlePerFrame = 8;
    public gravity = {
        x: 0,
        y: 0.2};
    public rangeSpawn = {
        minx: -2,
        maxx: 2,
        miny: -10,
        maxy: -2};
    public rangeVelocity = {
        minx: -2,
        maxx: 2,
        miny: -10,
        maxy: -2};
    public rangeLife = {
        min: 4,
        max: 20};
    public rangeSize = {
        min: 1,
        max: 4};
    public shrinking = true;

    private particles: Particle[] = [];

    constructor(x: number, y: number, colors: string[]) {
        this.x = x;
        this.y = y;
        this.colors = colors;
    }

    draw(context : CanvasRenderingContext2D, visibleBox: VisibleBox) {
        for (let p of this.particles) {
            context.fillStyle = p.color;
            if (this.shrinking) {
                const s = Math.min(p.size, p.size / (this.rangeSize.max / Math.max(p.life, 1)));
                context.fillRect(p.x - visibleBox.x, p.y - visibleBox.y, s, s);
            } else {
                context.fillRect(p.x - visibleBox.x, p.y - visibleBox.y, p.size, p.size);
            }
        }
    }

    update() {
        // spawn particles
        if (this.life != 0) {
            for (let i=0; i<this.particlePerFrame; i++) {
                this.particles.push({
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    x: this.x + this.rangeSpawn.minx + Math.random() * (this.rangeSpawn.maxx + Math.abs(this.rangeSpawn.minx)),
                    y: this.y + this.rangeSpawn.miny + Math.random() * (this.rangeSpawn.maxy + Math.abs(this.rangeSpawn.miny)),
                    vx: this.rangeVelocity.minx + Math.random() * (this.rangeVelocity.maxx + Math.abs(this.rangeVelocity.minx)),
                    vy: this.rangeVelocity.miny + Math.random() * (this.rangeVelocity.maxy + Math.abs(this.rangeVelocity.miny)),
                    life: this.rangeLife.min + Math.random() * (this.rangeLife.max + Math.abs(this.rangeLife.min)),
                    size: this.rangeSize.min + Math.random() * (this.rangeSize.max + Math.abs(this.rangeSize.min)),
                });
            }
        }
        // move particles
        const toDelete: number[] = [];
        for (let i=0; i<this.particles.length; i++) {
            this.particles[i].vx += this.gravity.x;
            this.particles[i].vy += this.gravity.y;
            this.particles[i].x += this.particles[i].vx;
            this.particles[i].y += this.particles[i].vy;
            this.particles[i].life -= 1;
            if (this.particles[i].life <= 0) {
                toDelete.push(i);
            }
        }
        // delete particles
        for (const i of toDelete) {
            this.particles.splice(i, 1);
        }
        if (this.life > 0) this.life -= 1;
    }

    public updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get canBeDeleted(): boolean {
        return this.life == 0 && this.particles.length == 0;
    }
}

export class ParticlesProcessor {
    
    static generators: ParticlesGenerator[] = [];

    static draw(context : CanvasRenderingContext2D, visibleBox: VisibleBox) {
        for (const g of ParticlesProcessor.generators) {
            g.draw(context, visibleBox);
        }
    }

    static update() {
        const toDelete: number[] = [];
        for (let i=0; i<ParticlesProcessor.generators.length; i++) {
            ParticlesProcessor.generators[i].update();
            if (ParticlesProcessor.generators[i].canBeDeleted) {
                toDelete.push(i);
            }
        }
        for (const i of toDelete) {
            ParticlesProcessor.generators.splice(i, 1);
        }
    }

    static addGenerator(generator: ParticlesGenerator) {
        this.generators.push(generator);
    }
}