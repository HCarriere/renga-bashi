import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, zip } from 'rxjs';
import { Cadavre } from '../engine/cadavres';
import { MapData } from '../engine/map';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  /**
   * get mapdata + cadavres
   * @param title map title
   * @returns 
   */
  public getMapAndCadavres(title: string): Observable<{map: MapData, cadavres: Cadavre[]}> {
    return zip(this.getMap(title), this.getMapCadavres(title)).pipe(
      map(([mapData, cadavres]) => ({map: mapData, cadavres: cadavres}))
    );
  }

  public getNextMapAndCadavres(title: string, endAlias: string): Observable<{map: MapData, alias: string, cadavres: Cadavre[]}> {
    return zip(this.getNextMap(title, endAlias), this.getMapCadavres(title)).pipe(
      map(([map, cadavres]) => ({map: map.map, alias:map.alias, cadavres: cadavres}))
    );
  }

  public getMap(title: string): Observable<MapData> {
    return this.httpClient.get<MapData>(`/api/map/${title}`);
  }

  public getNextMap(title: string, endAlias: string): Observable<{map: MapData, alias: string}> {
    return this.httpClient.get<{map: MapData, alias: string}>(`/api/map/next`, {params: {title, endAlias}});
  }

  public getMapCadavres(title: string): Observable<Array<Cadavre>> {
    return this.httpClient.get<Array<Cadavre>>(`/api/cadavres`, {params: {
      title: title,
    }});
  }

  public addCadavre(cadavre: Cadavre) {
    this.httpClient.post('/api/cadavres/add', cadavre).subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }
}
