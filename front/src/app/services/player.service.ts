import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, zip } from 'rxjs';
import { Cadavre, CadavreChunks, CadavreProcessor } from '../engine/cadavres';
import { MapData } from '../engine/map';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private guid: string;

  constructor(
    private httpClient: HttpClient,
  ) {
    this.guid = this.getGuid();
  }

  /**
   * get mapdata + cadavres
   * @param title map title
   * @returns 
   */
  public getMapAndCadavres(title: string): Observable<{map: MapData, cadavres: CadavreChunks}> {
    return zip(this.getMap(title), this.getMapCadavres(title)).pipe(
      map(([mapData, cadavres]) => ({map: mapData, cadavres: CadavreProcessor.getCadavreAsChunks(cadavres)}))
    );
  }

  public getNextMapAndCadavres(title: string, endAlias: string): Observable<{map: MapData, title: string, alias: string, cadavres: CadavreChunks}> {
    /*return zip(this.getNextMap(title, endAlias), this.getMapCadavres(title)).pipe(
      map(([map, cadavres]) => ({
        map: map.map, 
        title:map.title, 
        alias:map.alias, 
        cadavres: CadavreProcessor.getCadavreAsChunks(cadavres),
      }))
    );*/
    return this.getNextMap(title, endAlias).pipe(
      mergeMap(m => {
        return this.getMapCadavres(m.title).pipe(map(cadavres => {
          return {
            map: m.map, 
            title:m.title, 
            alias:m.alias, 
            cadavres: CadavreProcessor.getCadavreAsChunks(cadavres),
          }
        }))
      }),
    )
  }

  public getMap(title: string): Observable<MapData> {
    return this.httpClient.get<MapData>(`/api/map/${title}`);
  }

  public getNextMap(title: string, endAlias: string): Observable<{map: MapData, title: string, alias: string}> {
    return this.httpClient.get<{map: MapData, title: string, alias: string}>(`/api/nextmap`, {params: {title, endAlias}});
  }

  public getMapCadavres(title: string): Observable<Array<Cadavre>> {
    return this.httpClient.get<Array<Cadavre>>(`/api/cadavres`, {params: {
      title: title,
    }});
  }

  public addCadavre(cadavre: Cadavre) {
    cadavre.guid = this.guid;
    this.httpClient.post('/api/cadavres/add', cadavre).subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }

  private getGuid(): string {
    let guid = '';
    for (let i=0; i<36; i++) {
      guid+=Math.floor(Math.random()*9);
    }
    return guid.substring(0, 36);
  }
}
