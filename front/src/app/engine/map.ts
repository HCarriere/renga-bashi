import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";

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
    start: {x:number, y:number};
    ends: {x:number, y:number, alias: string}[];
}

export interface Link {
    alias: string;
    destinationMap: string;
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
}

export class MapProcessor {

    static tileSize = 16; // px on default zoom

    static draw(map: MapData, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, debug = false): void {
        const startTileX = Math.max(0, Math.floor(visibleBox.x/MapProcessor.tileSize));
	    const startTileY = Math.max(0, Math.floor(visibleBox.y/MapProcessor.tileSize));

        for (let x = startTileX; x < Math.min(Math.floor(startTileX + width/MapProcessor.tileSize)+2, map.width); x++) {
            for (let y = startTileY; y < Math.min(Math.floor(startTileY + height/MapProcessor.tileSize)+2, map.height); y++) {
                if (map.graphicLayer[x] && map.graphicLayer[x][y]) {
                    context.fillStyle = map.graphicLayer[x][y];
                    context.fillRect(x * MapProcessor.tileSize - visibleBox.x, y * MapProcessor.tileSize - visibleBox.y, MapProcessor.tileSize, MapProcessor.tileSize);
                }

                if (debug) {
                    // debug map size
                    context.fillStyle = '#11111150';
                    context.fillRect(x * MapProcessor.tileSize - visibleBox.x+1, y * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
                    // debug map collisions
                    if (map.physicLayer[x] && map.physicLayer[x][y]) {
                        if (map.physicLayer[x][y] == PhysicType.COLLISION) context.fillStyle = '#00500090';
                        if (map.physicLayer[x][y] == PhysicType.DEATH) context.fillStyle = '#50000090';
                        if (map.physicLayer[x][y] == PhysicType.NO_DEATH) context.fillStyle = '#50500090';
                        context.fillRect(x * MapProcessor.tileSize - visibleBox.x+1, y * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
                    }
                }
            }
        }
    }

    static updateMap(map: MapData, mouseStatus: MouseStatus, visibleBox: VisibleBox, color: string, physicType: PhysicType, brushSize: boolean[][], mode: 'graphic' | 'physic'): void {
        if (!mouseStatus.clicked) return;

        // get brush center x & y of map
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        for (let i = 0; i < brushSize.length; i++) {
            for (let j = 0; j < brushSize[i].length; j++) {
                if (brushSize[i][j]) {
                    const x = cx + (j - Math.floor(brushSize.length / 2));
                    const y = cy + (i - Math.floor(brushSize.length / 2));
                    if (x < map.width && y < map.height && x >= 0 && y >= 0) {
                        if (mouseStatus.modifiers.shift) {
                            // erase
                            if (mode == 'graphic') {map.graphicLayer[x][y] = '';}
                            else map.physicLayer[x][y] = PhysicType.VOID;
                        } else {
                            // paint
                            if (mode == 'graphic') {map.graphicLayer[x][y] = color;}
                            else map.physicLayer[x][y] = physicType;
                        }
                    }
                }
            }
        }

    }

    static displayBrush(map: MapData, context : CanvasRenderingContext2D,mouseStatus: MouseStatus, visibleBox: VisibleBox, color: string, brushSize: boolean[][]) {
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        for (let i = 0; i < brushSize.length; i++) {
            for (let j = 0; j < brushSize[i].length; j++) {
                if (brushSize[i][j]) {
                    const x = cx + (j - Math.floor(brushSize.length / 2));
                    const y = cy + (i - Math.floor(brushSize.length / 2));
                    if (x < map.width && y < map.height && x >= 0 && y >= 0) {
                        context.fillStyle = color;
                        context.fillRect(x * MapProcessor.tileSize - visibleBox.x+1, y * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
                    }
                }
            }
        }
    }

    static resizeMapLayers(map: MapData, newWidth: number, newHeight: number): void {
        for (let x = 0; x < newWidth; x++) {
            if (!map.graphicLayer[x]) map.graphicLayer[x] = [];
            if (!map.physicLayer[x]) map.physicLayer[x] = [];

            for (let y = 0; y < newHeight; y++) {
                if (!map.graphicLayer[x][y]) map.graphicLayer[x][y] = '';
                if (!map.physicLayer[x][y]) map.physicLayer[x][y] = 0;
            }
        }
    }

    static initNewMap(): Map {
        let map = {
            title: 'new map',
            map: {
                width: 100,
                height: 50,
                graphicLayer: [],
                physicLayer: [],
                start: {x: 5, y: 44},
                ends: [],
            },
            links: [],
        };
        MapProcessor.resizeMapLayers(map.map, map.map.width, map.map.height);
        return map;
    }
}