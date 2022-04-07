import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cadavre } from '../engine/cadavres';
import { MapData } from '../engine/map';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public getMap(title: string): Observable<MapData> {
    return this.httpClient.get<MapData>(`/api/map/${title}`);
  }

  public getMapCadavres(title: string): Observable<Array<Cadavre>> {
    return this.httpClient.get<Array<Cadavre>>(`/api/cadavres`, {params: {
      title: title,
      date: new Date().toDateString(),
    }});
  }

  public addCadavre(cadavre: Cadavre) {
    this.httpClient.post('/api/cadavres/add', cadavre).subscribe({
      next: data => console.log(data),
      error: err => console.log(err)
    });
  }
}
