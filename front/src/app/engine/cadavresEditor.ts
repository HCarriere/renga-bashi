import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";
import { EditorService } from "../services/editor.service";
import { CadavreChunks, CadavreProcessor } from "./cadavres";
import { MapProcessor, VisibleBox } from "./map";
import { EditorMode, Map } from "./mapEditor";

export class CadavreEditorProcessor extends CadavreProcessor {

    static cooldownCadavre = 0;
    static maxCooldownCadavre = 20; // frames;

    static updateMap(cadavres: CadavreChunks, map: Map, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService) {
        if (this.cooldownCadavre > 0) this.cooldownCadavre--;

        if (!mouseStatus.clicked || mouseStatus.modifiers.rightclick || editorService.addingObject || editorService.mode != EditorMode.CADAVRES) return;

        if (mouseStatus.modifiers.shift) {
            // erase cadavre around
            
        } else if (this.cooldownCadavre <= 0) {
            // place new cadavre
            const newCadavre = {
                color: MapProcessor.getRandomColor(),
                level: map.title,
                rot: Math.random() * 3.14,
                x: mouseStatus.position.x + visibleBox.x,
                y: mouseStatus.position.y + visibleBox.y,
            };
            // cadavres.push(newCadavre);
            CadavreProcessor.addCadavreToChunk(cadavres, newCadavre);
            editorService.addCadavre(newCadavre);
            this.cooldownCadavre = this.maxCooldownCadavre;
        } 
    }
}