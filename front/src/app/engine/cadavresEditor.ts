import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";
import { EditorService } from "../services/editor.service";
import { Cadavre, CadavreProcessor } from "./cadavres";
import { Map, VisibleBox } from "./map";
import { EditorMode } from "./mapEditor";

export class CadavreEditorProcessor extends CadavreProcessor {

    static cooldownCadavre = 0;
    static maxCooldownCadavre = 20; // frames;

    static updateMap(cadavres: Cadavre[], map: Map, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService) {
        if (this.cooldownCadavre > 0) this.cooldownCadavre--;

        if (!mouseStatus.clicked || mouseStatus.modifiers.rightclick || editorService.addingObject || editorService.mode != EditorMode.CADAVRES) return;

        if (mouseStatus.modifiers.shift) {
            // erase cadavre around
            // TODO
        } else if (this.cooldownCadavre <= 0) {
            // place new cadavre
            const newCadavre = {
                color: 'white',
                level: map.title,
                rot: 0,
                x: mouseStatus.position.x + visibleBox.x,
                y: mouseStatus.position.y + visibleBox.y,
            };
            cadavres.push(newCadavre);
            editorService.addCadavre(newCadavre);
            this.cooldownCadavre = this.maxCooldownCadavre;
        }
        
    }
}