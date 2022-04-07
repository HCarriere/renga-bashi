import { VisibleBox } from "./map";

export interface Cadavre {
    x: number;
    y: number;
    level: string;
    color: string;
    rot?: Number;
    date?: Date;
    path?: string[][];
}

export class CadavreProcessor {
    
    static draw(cadavres: Cadavre[], context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, debug = false) {
        for (const cadavre of cadavres) {
            context.fillStyle = cadavre.color;
            context.fillRect(cadavre.x - visibleBox.x, cadavre.y - visibleBox.y, 5, 5);
        }
    }
}