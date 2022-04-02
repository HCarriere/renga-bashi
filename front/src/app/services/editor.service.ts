import { Injectable } from '@angular/core';
import { MapData, PhysicType } from '../engine/map';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  public selectedColor: string = 'cyan';

  public selectedPhysicType: PhysicType = PhysicType.COLLISION;

  public mapColors: string[] = [];

  public enableDebug = true;

  public brushSize: boolean[][];

  public mode: 'graphic' | 'physic' = 'graphic';

  constructor() {
    this.brushSize = [];
    for (let x = 0; x<9; x++) {
      this.brushSize[x] = [];
      for (let y = 0; y<9; y++) {
        this.brushSize[x][y] = false;
      }
    }
    this.brushSize[4][4] = true;
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

  public setMode(mode: 'graphic' | 'physic') {
    this.mode = mode;
  }
}
