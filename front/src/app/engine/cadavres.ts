import { VisibleBox } from "./map";

export interface Cadavre {
    x: number;
    y: number;
    level: string;
    color: string;
    rot?: number;
    date?: Date;
    path?: string[][];
    guid?: string;
    _id?: string;
}

/**
 * key : x_y
 */
export interface CadavreChunks {
    chunks: Map<string, Cadavre[]>;
}

export class CadavreProcessor {
    
    static chunkSize = 32;
    static size = 16;

    static draw(cadavres: CadavreChunks, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox) {
      for (const cadavreChunk of cadavres.chunks.values()) {
        for (const cadavre of cadavreChunk) {
          context.save();
          context.translate(cadavre.x - visibleBox.x, cadavre.y - visibleBox.y);
          context.rotate(cadavre.rot || 0); 
          context.fillStyle = cadavre.color;
          context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
          context.restore();
        }
      }
    }

    /**
   * create chunks filled with cadavres
   * @param cadavres 
   */
    static getCadavreAsChunks(cadavres: Cadavre[]): CadavreChunks {
    const chunks = {chunks: new Map<string, Cadavre[]>()};
    
    for (const cadavre of cadavres) {
      this.addCadavreToChunk(chunks, cadavre);
    }

    return chunks;
  }
    
  static addCadavreToChunk(cadavreChunks: CadavreChunks, cadavre: Cadavre) {

    const coord =`${Math.floor(cadavre.x / CadavreProcessor.chunkSize)}_${Math.floor(cadavre.y / CadavreProcessor.chunkSize)}`;

    if (!cadavreChunks.chunks.has(coord)) {
      cadavreChunks.chunks.set(coord, []);
    }
    cadavreChunks.chunks.get(coord)?.push(cadavre);
  }

  static getNearCadavres(x: number, y: number, cadavreChunks: CadavreChunks): Cadavre[] {
    const cx = Math.floor(x / CadavreProcessor.chunkSize);
    const cy = Math.floor(y / CadavreProcessor.chunkSize);
    let cad: Cadavre[] = [];
    // get 3 x 3 square with cx,cy in center
    for (let i = cx-1;i<=cx+1; i++) {
      for (let j = cy-1; j<=cy+1; j++) {
        cad = cad.concat(cadavreChunks.chunks.get(`${i}_${j}`) || []);
      }
    }
    return cad;
  }
}