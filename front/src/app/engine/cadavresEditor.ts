import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";
import { EditorService } from "../services/editor.service";
import { Cadavre, CadavreChunks, CadavreProcessor } from "./cadavres";
import { MapProcessor, VisibleBox } from "./map";
import { EditorMode, Map } from "./mapEditor";

export class CadavreEditorProcessor extends CadavreProcessor {

    static cooldownCadavre = 0;
    static maxCooldownCadavre = 20; // frames;

    static drawEditor(cadavres: CadavreChunks, context : CanvasRenderingContext2D, width: number, height: number, visibleBox: VisibleBox, editorService: EditorService,  mouseStatus: MouseStatus) {
        super.draw(cadavres, context, width, height, visibleBox);

        if (!mouseStatus.modifiers.shift || editorService.mode != EditorMode.CADAVRES) return;
        
        for (const cadavre of this.getChunk(mouseStatus.position.x + visibleBox.x, mouseStatus.position.y + visibleBox.y, cadavres)) {
            context.save();
            context.translate(cadavre.x - visibleBox.x, cadavre.y - visibleBox.y);
            context.rotate(cadavre.rot || 0); 
            context.fillStyle = 'red';
            context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            context.restore();
        }
        
    }

    static updateMap(cadavres: CadavreChunks, map: Map, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService) {
        if (this.cooldownCadavre > 0) this.cooldownCadavre--;

        if (!mouseStatus.clicked || mouseStatus.modifiers.rightclick || editorService.addingObject || editorService.mode != EditorMode.CADAVRES) return;
        
        if (this.cooldownCadavre > 0) return;

        if (mouseStatus.modifiers.shift) {
            // erase cadavre around
            // get cadavre ids
            const cad = this.getChunk(mouseStatus.position.x + visibleBox.x, mouseStatus.position.y + visibleBox.y, cadavres);
            const ids = cad.map(o => o._id || '');

            // erase them
            editorService.removeSomeCadavres(map.title, ids);

            // remove localy
            this.removeChunk(mouseStatus.position.x + visibleBox.x, mouseStatus.position.y + visibleBox.y, cadavres);

            this.cooldownCadavre = this.maxCooldownCadavre;
        } else {
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


    static getChunk(x: number, y: number, chunks: CadavreChunks): Cadavre[] {
        const cx = Math.floor(x / CadavreProcessor.chunkSize);
        const cy = Math.floor(y / CadavreProcessor.chunkSize);
        
        return chunks.chunks.get(`${cx}_${cy}`) || [];
    }

    static removeChunk(x: number, y: number, chunks: CadavreChunks) {
        const cx = Math.floor(x / CadavreProcessor.chunkSize);
        const cy = Math.floor(y / CadavreProcessor.chunkSize);

        chunks.chunks.delete(`${cx}_${cy}`);
    }
}