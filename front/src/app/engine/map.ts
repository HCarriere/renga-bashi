export interface Map {
    title: string;
    map: MapData;
    links: Link[];
}

export interface MapData {
    width: number;
    height: number;
    physicLayer: PhysicType[][];
    graphicLayer: string[][];
    starts: {x:number, y:number, alias: string}[];
    ends: {x:number, y:number, alias: string}[];
    backgroundColor: string;
}

export interface Link {
    endAlias: string;
    destinationMap: string;
    destinationAlias: string;
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

export class MapProcessor {

    static tileSize = 16; // px on default zoom

    static draw(map: MapData, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, debug = false): void {
        const startTileX = Math.max(0, Math.floor(visibleBox.x/MapProcessor.tileSize));
	    const startTileY = Math.max(0, Math.floor(visibleBox.y/MapProcessor.tileSize));

        for (let x = startTileX; x < Math.min(Math.floor(startTileX + width/MapProcessor.tileSize)+2, map.width); x++) {
            for (let y = startTileY; y < Math.min(Math.floor(startTileY + height/MapProcessor.tileSize)+2, map.height); y++) {
                
                // debug map size
                if (debug) {
                    context.fillStyle = '#11111150';
                    context.fillRect(x * MapProcessor.tileSize - visibleBox.x+1, y * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
                }

                if (map.graphicLayer[x] && map.graphicLayer[x][y]) {
                    context.fillStyle = map.graphicLayer[x][y];
                    context.fillRect(x * MapProcessor.tileSize - visibleBox.x, y * MapProcessor.tileSize - visibleBox.y, MapProcessor.tileSize, MapProcessor.tileSize);
                }

                // debug map collisions
                if (debug) {
                    if (map.physicLayer[x] && map.physicLayer[x][y]) {
                        if (map.physicLayer[x][y] == PhysicType.COLLISION) context.fillStyle = '#00500090';
                        if (map.physicLayer[x][y] == PhysicType.DEATH) context.fillStyle = '#50000090';
                        if (map.physicLayer[x][y] == PhysicType.NO_DEATH) context.fillStyle = '#50500090';
                        context.fillRect(x * MapProcessor.tileSize - visibleBox.x+1, y * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
                    }
                }
            }
        }

        // debug waypoints
        if (debug) {
            for (let start of map.starts) {
                context.fillStyle = '#FFFF00';
                context.fillRect(start.x * MapProcessor.tileSize - visibleBox.x+4, start.y * MapProcessor.tileSize - visibleBox.y+4, MapProcessor.tileSize-8, MapProcessor.tileSize-8);
                context.fillText(start.alias, start.x * MapProcessor.tileSize - visibleBox.x+2, start.y * MapProcessor.tileSize - visibleBox.y-2);
            }
            for (let end of map.ends) {
                context.fillStyle = '#FF00FF';
                context.fillRect(end.x * MapProcessor.tileSize - visibleBox.x+4, end.y * MapProcessor.tileSize - visibleBox.y+4, MapProcessor.tileSize-8, MapProcessor.tileSize-8);
                context.fillText(end.alias, end.x * MapProcessor.tileSize - visibleBox.x+2, end.y * MapProcessor.tileSize - visibleBox.y-2);
            }
        }
    }

    
}