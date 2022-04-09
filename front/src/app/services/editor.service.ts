import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable } from 'rxjs';
import { Map, MapData, ObjectType, PhysicType } from '../engine/map';
import { EditorMode, MapEditorProcessor } from '../engine/mapEditor';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Cadavre } from '../engine/cadavres';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  public selectedColor: string = '#607d8b';
  public selectedPhysicType: PhysicType = PhysicType.COLLISION;
  public mapColors: string[] = [];
  public enableDebug = true;
  public brushSize: boolean[][] = [];
  public mode: EditorMode = EditorMode.GRAPHIC;
  public addingObject!: ObjectType;

  public isAuthentified = false;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService,
  ) {
    this.setBrushSizeStandard();
  }

  public getMaps(): Observable<Array<Map>> {
    return this.httpClient.get<Array<Map>>('/api/maps');
  }

  public saveMap(map: Map): Observable<Map> {
    return this.httpClient.post<Map>('/api/map', map);
  }

  public deleteMap(title: string): Observable<string> {
    return this.httpClient.delete<string>(`/api/map/${title}`);
  }

  public titleExists(title: string): Observable<boolean> {
    return this.httpClient.get<boolean>(`/api/map/titleexists/${title}`);
  }

  public addCadavre(cadavre: Cadavre) {
    this.httpClient.post('/api/cadavres/adminadd', cadavre).subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }

  public removeAllCadavres(title: string) {
    this.httpClient.post('/api/cadavres/remove', {title}).subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }

  public login(password: string): Observable<any> {
    return this.httpClient.post<any>('/api/auth', {password}).pipe(
      map(data => {
        this.setSession(data.accessToken);
        return data;
      }),
      catchError((err, caught) => {
        this.router.navigateByUrl('/login');
        throw err;
      })
    );
  }

  public isLoggedIn(): boolean {
    const token = localStorage.getItem('token') || '';
    return !this.jwtHelper.isTokenExpired(token);
  }

  private setSession(token: string) {
    localStorage.setItem('token', token);
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

  public setObjectToAdd(type: ObjectType) {
    this.addingObject = type;
  }

  public removeObjectFromMap(map: MapData, alias: string, type: ObjectType) {
    if (type == ObjectType.START) {
      const i = map.starts.findIndex(o => o.alias == alias);
      if (i>=0) map.starts.splice(i, 1);
    }
    if (type == ObjectType.END) {
      const i = map.ends.findIndex(o => o.alias == alias);
      if (i>=0) map.ends.splice(i, 1);
    }
  }

  public editMapInfos(map:Map, title: string, width: number, height: number) {
    // title
    if (title) {
      const newTitle = title.trim();
      map.title = newTitle;
    }

    // size
    if (width && Number.isInteger(width)) {
      map.map.width = width;
    }
    if (height && Number.isInteger(height)) {
      map.map.height = height;
    }
    MapEditorProcessor.resizeMapLayers(map.map);
  }


  public addLinkToMap(map: Map, destMapTitle: string, startAlias: string, endAlias: string) {
    const index = map.links.findIndex(o => o.endAlias == endAlias);
    if (index >= 0) {
      // delete it
      map.links.splice(index, 1);
    }
    // add link
    map.links.push({
      endAlias: endAlias,
      destinationMap: destMapTitle,
      destinationAlias: startAlias,
    });
  }

  public removeLinkFromMap(map: Map, index: number) {
    map.links.splice(index, 1);
  }
}
