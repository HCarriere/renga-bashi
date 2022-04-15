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
    ghostTime?: number;
    touched?: {x: number, y: number, frames: number};
}

/**
 * key : x_y
 */
export interface CadavreChunks {
    chunks: Map<string, Cadavre[]>;
}

export class CadavreProcessor {
    
  static chunkSize = 40;
  static size = 16;

  static draw(cadavres: CadavreChunks, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox) {
    for (const cadavreChunk of cadavres.chunks.values()) {
      for (const cadavre of cadavreChunk) {
        context.save();

        let tx = 0;
        let ty = 0;
        if (cadavre.touched && cadavre.touched.frames > 0) {
          tx = (-cadavre.touched.x * cadavre.touched.frames) / 15;
          ty = (-cadavre.touched.y * cadavre.touched.frames) / 35;
          cadavre.touched.frames -= 1;
        }
        context.translate(cadavre.x - visibleBox.x + tx, cadavre.y - visibleBox.y + ty);
        
        if (cadavre.ghostTime && cadavre.ghostTime > 0) {
          context.fillStyle = this.getAlphaColor(cadavre.color, 'AA');
          const tsize = cadavre.ghostTime / this.size + 2;
          context.rotate((cadavre.rot || 0) + Math.random());
          context.fillRect(-this.size / 2 + tsize/2, -this.size / 2 + tsize/2, this.size - tsize, this.size - tsize);
          cadavre.ghostTime -= 1;
        } else {
          context.fillStyle = cadavre.color;
          context.rotate(cadavre.rot || 0); 
          context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
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
    
  static addCadavreToChunk(cadavreChunks: CadavreChunks, cadavre: Cadavre, ghostTime = 0) {

    const coord =`${Math.floor(cadavre.x / CadavreProcessor.chunkSize)}_${Math.floor(cadavre.y / CadavreProcessor.chunkSize)}`;

    if (!cadavreChunks.chunks.has(coord)) {
      cadavreChunks.chunks.set(coord, []);
    }
    // add cadavre if it doesnt already exist
    if (!cadavreChunks.chunks.get(coord)?.find(o => o.x == cadavre.x && o.y == cadavre.y && o.color == cadavre.color)) {
      if (ghostTime > 0) {
        cadavre.ghostTime = ghostTime;
      }
      cadavreChunks.chunks.get(coord)?.push(cadavre);
    }
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

  static getChunksAsArray(cadavreChunks: CadavreChunks): Cadavre[] {
    let cad: Cadavre[] = [];
    for (const value of cadavreChunks.chunks.values()) {
      cad = cad.concat(value);
    }
    return cad;
  }

  static getAlphaColor(color: string, hexTransp: string): string {
    if (color.startsWith('#') && color.length == 7) {
      return color+hexTransp;
    }
    return color;
  }

}