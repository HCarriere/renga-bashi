import { MouseStatus } from "../editor/editor-canvas/editor-canvas.component";
import { EditorService } from "../services/editor.service";
import { Map, MapData, MapProcessor, ObjectType, PhysicType, VisibleBox } from "./map";

export enum EditorMode {
    GRAPHIC = 0,
    PHYSIC = 1,
}

export class MapEditorProcessor extends MapProcessor {

    static RandomWPNameList = ['Les_Copains_du_dimanche','À_pied,_à_cheval_et_en_voiture','Sois_belle_et_tais-toi','Les_Tricheurs','Un_drôle','Mademoiselle_Ange','À_double_tour','À_bout','Classe_tous_risques','Moderato_cantabile','La_Française_et_lAmour',
    'Les_Distractions','La_ciociara','La_Novice',
    'Le_Mauvais_Chemin','Léon_Morin,_prêtre','Une_femme_est_une_femme','Les_Amours_célèbres','Scandale_sur_la_Riviera','Un_nommé_La_Rocca','Le_Doulos','Cartouche','Un_singe_en_hiver',
    'Le_Jour_le_plus_court','La_Mer_à_boire','Peau','Dragées_au_poivre','LAîné_des_Ferchaux','Les_Don_Juan','LHomme','Cent_Mille_Dollars_au_soleil',
    'Échappement_libre','La_Chasse_à_lhomme','Week-end_à_Zuydcoote','Par_un_beau_matin','Pierrot_le_Fou','Les_Tribulations','Tendre_Voyou','Paris_brûle-t-il_?','Casino_Royale','Le_Voleur','Le_Démoniaque','Ho_!','Le_Cerveau','La_Sirène_du_Mississipi','Un_homme_qui_me_plaît','Borsalino','Les_Mariés','Le_Casse','Docteur_Popaul','La_Scoumoune','LHéritier','Le_Magnifique','Stavisky...','Peur_sur_la_ville','LIncorrigible','LAlpagueur','Le_Corps','LAnimal','Flic_ou_Voyou','Le_Guignolo','Le_Professionnel','LAs_des_as','Le_Marginal','Les_Morfalous','Joyeuses_Pâques','Hold-up','Le_Solitaire','Itinéraire','LInconnu_dans_la_maison','Les_Cent_et_Une_Nuits','Les_Misérables','Désiré','Une_chance_sur_deux','Peut-être','Les_Acteurs','Amazone','Un_homme_et_son_chien'];

    static updateMap(map: MapData, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService): void {
        if (!mouseStatus.clicked || mouseStatus.modifiers.rightclick) return;

        // get brush center x & y of map
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        if (editorService.addingObject) {
            MapEditorProcessor.addObjectToMap(map, editorService.addingObject, cx, cy);
            editorService.setObjectToAdd(0);
            return;
        }

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

    static addObjectToMap(map: MapData, type: ObjectType, x: number, y: number) {
        if (type == ObjectType.START) {
            map.starts.push({
                x, y, alias: `s${MapEditorProcessor.RandomWPNameList[Math.floor(Math.random() * MapEditorProcessor.RandomWPNameList.length)]}_${btoa(x +'.'+ y)}`,
            });
        } else if (type == ObjectType.END) {
            map.ends.push({
                x, y, alias: `e${MapEditorProcessor.RandomWPNameList[Math.floor(Math.random() * MapEditorProcessor.RandomWPNameList.length)]}_${btoa(x +'.'+ y)}`,
            });
        }
    }


    static displayBrush(map: MapData, context : CanvasRenderingContext2D, mouseStatus: MouseStatus, visibleBox: VisibleBox, editorService: EditorService) {
        if (mouseStatus.modifiers.rightclick) return;
        
        const cx = Math.floor((mouseStatus.position.x + visibleBox.x) / MapProcessor.tileSize);
        const cy = Math.floor((mouseStatus.position.y + visibleBox.y) / MapProcessor.tileSize);

        if (editorService.addingObject) {
            context.fillStyle = editorService.addingObject == ObjectType.END ? '#FF00FF' : '#FFFF00';
            context.fillRect(cx * MapProcessor.tileSize - visibleBox.x+1, cy * MapProcessor.tileSize - visibleBox.y+1, MapProcessor.tileSize-2, MapProcessor.tileSize-2);
            return;
        }

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
                        context.fillRect(x * MapProcessor.tileSize - visibleBox.x+3, y * MapProcessor.tileSize - visibleBox.y+3, MapProcessor.tileSize-6, MapProcessor.tileSize-6);
                    }
                }
            }
        }
    }

    static resizeMapLayers(map: MapData): void {
        // downsize x
        map.graphicLayer.splice(map.width);
        map.physicLayer.splice(map.width);
        
        for (let x = 0; x < map.width; x++) {
            if (!map.graphicLayer[x]) map.graphicLayer[x] = [];
            if (!map.physicLayer[x]) map.physicLayer[x] = [];

            // downsize y
            map.graphicLayer[x].splice(map.height);
            map.physicLayer[x].splice(map.height);
        }
    }

    static initNewMap(): Map {
        let map = {
            title: 'new map',
            map: {
                width: 100,
                height: 80,
                graphicLayer: [],
                physicLayer: [],
                starts: [],
                ends: [],
            },
            links: [],
        };
        MapEditorProcessor.resizeMapLayers(map.map);
        return map;
    }
}