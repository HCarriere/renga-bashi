import { VisibleBox } from "./map";

export interface Cadavre {
    x: number;
    y: number;
    level: string;
    color: string;
    rot?: number;
    date?: Date;
    path?: string[][];
}

export interface CadavreChunks {
    chunkSize: number;
    // chunks[x][y] = Cadavre[]
    chunks: Cadavre[][][];
}

export class CadavreProcessor {
    
    static size = 14;

    static draw(cadavres: Cadavre[], context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox) {
        for (const cadavre of cadavres) {
            context.save();
            context.translate(cadavre.x - visibleBox.x, cadavre.y - visibleBox.y);
            context.rotate(cadavre.rot || 0); 
            context.fillStyle = cadavre.color;
            context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            context.restore();
        }
    }
}