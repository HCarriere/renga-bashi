import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";
import { EditorService } from "../services/editor.service";
import { EditorMode, Map, MapData, MapProcessor, PhysicType, VisibleBox } from "./map";

export class MapEditorProcessor extends MapProcessor {

    static updateMap(map: MapData, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService): void {
        if (!mouseStatus.clicked || mouseStatus.modifiers.rightclick) return;

        // get brush center x & y of map
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        for (let i = 0; i < editorService.brushSize.length; i++) {
            for (let j = 0; j < editorService.brushSize[i].length; j++) {
                if (editorService.brushSize[i][j]) {
                    const x = cx + (j - Math.floor(editorService.brushSize.length / 2));
                    const y = cy + (i - Math.floor(editorService.brushSize.length / 2));
                    if (x < map.width && y < map.height && x >= 0 && y >= 0) {
                        if (mouseStatus.modifiers.shift) {
                            // erase
                            if (editorService.mode == EditorMode.GRAPHIC) {map.graphicLayer[x][y] = '';}
                            else map.physicLayer[x][y] = PhysicType.VOID;
                        } else {
                            // paint
                            if (editorService.mode == EditorMode.GRAPHIC) {map.graphicLayer[x][y] = editorService.selectedColor;}
                            else map.physicLayer[x][y] = editorService.selectedPhysicType;
                        }
                    }
                }
            }
        }

    }


    static displayBrush(map: MapData, context : CanvasRenderingContext2D, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService) {
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        for (let i = 0; i < editorService.brushSize.length; i++) {
            for (let j = 0; j < editorService.brushSize[i].length; j++) {
                if (editorService.brushSize[i][j]) {
                    const x = cx + (j - Math.floor(editorService.brushSize.length / 2));
                    const y = cy + (i - Math.floor(editorService.brushSize.length / 2));
                    if (x < map.width && y < map.height && x >= 0 && y >= 0) {
                        if (editorService.mode == EditorMode.GRAPHIC) context.fillStyle = editorService.selectedColor;
                        else {
                            if (editorService.selectedPhysicType == PhysicType.COLLISION) context.fillStyle = '#00500090';
                            if (editorService.selectedPhysicType == PhysicType.DEATH) context.fillStyle = '#50000090';
                            if (editorService.selectedPhysicType == PhysicType.NO_DEATH) context.fillStyle = '#50500090';
                        }
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
                starts: [],
                ends: [],
            },
            links: [],
        };
        MapEditorProcessor.resizeMapLayers(map.map, map.map.width, map.map.height);
        return map;
    }
}