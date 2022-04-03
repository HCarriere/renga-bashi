import { Injectable } from '@angular/core';
import { EditorMode, MapData, PhysicType } from '../engine/map';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  public selectedColor: string = 'cyan';

  public selectedPhysicType: PhysicType = PhysicType.COLLISION;

  public mapColors: string[] = [];

  public enableDebug = true;

  public brushSize: boolean[][];

  public mode: EditorMode = EditorMode.GRAPHIC;


  constructor() {
    this.brushSize = [];
    this.setBrushSizeStandard();
  }

  /**
   * Check in graphic layer each colors used
   * @param map 
   */
  public computeMapColors(map: MapData) {
    this.mapColors = [];
    for (const row of map.graphicLayer) {
      for (const color of row) {
        if (color && !this.mapColors.includes(color)) this.mapColors.push(color);
      }
    }
  }

  public setColor(color: string) {
    this.selectedColor = color;
  }

  public setPhysicType(type: PhysicType) {
    this.selectedPhysicType = type;
  }

  public toggleDebug() {
    this.enableDebug = !this.enableDebug;
  }

  public toggleBrushSizePixel(x: number, y: number) {
    this.brushSize[x][y] = !this.brushSize[x][y];
  }

  /**
   * Set brush to nxn
   * @param n 
   */
  public setBrushSizeStandard(n = 1) {
    for (let x = 0; x<9; x++) {
      this.brushSize[x] = [];
      for (let y = 0; y<9; y++) {
        this.brushSize[x][y] = false;
      }
    }
    if (n <= 1) {
      this.brushSize[4][4] = true;
    } else {
      for (let x = 4 - Math.floor(n/2); x <= 4 + Math.floor(n/2); x++) {
        for (let y = 4 - Math.floor(n/2); y <= 4 + Math.floor(n/2); y++) {
          this.brushSize[x][y] = true;
        }
      }
    }
  }

  public setMode(mode: EditorMode) {
    this.mode = mode;
  }
}
