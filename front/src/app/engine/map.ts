

export interface MapData {
    width: number;
    height: number;
    physicLayer: PhysicType[][];
    graphicLayer: string[][];
    starts: {x:number, y:number, alias: string}[];
    ends: {x:number, y:number, alias: string}[];
    backgroundColor: string;
    options: MapOptions;
}

export interface MapOptions {
    disablePersistentCadavres?: boolean;
}

export interface VisibleBox {
    x: number;
    y: number;
    zoom: number;
}

export enum PhysicType {
    VOID = 0,
    COLLISION = 1,
    DEATH = 2,
    NO_DEATH = 3,
    ZOOM_IN_X_2 = 4,
    ZOOM_OUT_X_2 = 5,
    ZOOM_IN_X_3 = 6,
    ZOOM_OUT_X_3 = 7,
    ZOOM_IN_X_4 = 8,
    ZOOM_OUT_X_4 = 9,
}

export enum ObjectType {
    START = 1,
    END = 2,
}

export enum TileEffect {
    NONE = '',
    GLOW = 'g',
    LAVA = 'l',
}

export class MapProcessor {

    static tileSize = 20; // px on default zoom

    static draw(map: MapData, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, frame:number, debug = false): void {
        const startTileX = Math.max(0, Math.floor(visibleBox.x/MapProcessor.tileSize));
	    const startTileY = Math.max(0, Math.floor(visibleBox.y/MapProcessor.tileSize));

        for (let x = startTileX; x < Math.min(Math.floor(startTileX + width/MapProcessor.tileSize)+2, map.width); x++) {
            for (let y = startTileY; y < Math.min(Math.floor(startTileY + height/MapProcessor.tileSize)+2, map.height); y++) {
                this.drawTile(map, context, x, y, visibleBox, frame, debug);
            }
        }
    }

    static drawTile(map: MapData, context : CanvasRenderingContext2D, x: number, y: number, visibleBox: VisibleBox, frame:number, debug = false) {
        if (map.graphicLayer[x] && map.graphicLayer[x][y]) {
            if (map.graphicLayer[x][y].charAt(0) == TileEffect.LAVA) {
                context.fillStyle = this.getLavaColor(y, x, frame*1.5, map.graphicLayer[x][y].substring(1));
                context.fillRect(x * MapProcessor.tileSize - visibleBox.x+2, y * MapProcessor.tileSize - visibleBox.y+2, MapProcessor.tileSize-4, MapProcessor.tileSize-4);
                context.fillStyle = this.getLavaColor(x, y, frame, map.graphicLayer[x][y].substring(1));
            } else if (map.graphicLayer[x][y].charAt(0) == TileEffect.GLOW) {
                context.shadowBlur = 15;
                context.fillStyle = map.graphicLayer[x][y].substring(1);
                context.shadowColor = context.fillStyle;
            } else {
                context.fillStyle = map.graphicLayer[x][y];
            }
            context.fillRect(x * MapProcessor.tileSize - visibleBox.x, y * MapProcessor.tileSize - visibleBox.y, MapProcessor.tileSize, MapProcessor.tileSize);
            context.shadowBlur = 0;
        }
    }

    static getLavaColor(x:number, y: number, frame: number, baseColor: string) {
        return baseColor.substring(0, 7) + Math.floor(Math.cos((x+20*y)/10+frame/40)*70+180).toString(16).padStart(2, '0');
    }

    static getRandomColor() {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}