import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, zip } from 'rxjs';
import { Cadavre, CadavreChunks, CadavreProcessor } from '../engine/cadavres';
import { MapData, MapProcessor } from '../engine/map';
import { Md5 } from 'ts-md5/dist/md5';
import { io, Socket } from "socket.io-client";
import { Player, PlayerController } from '../engine/player';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private guid: string;

  public map!: MapData;
  public cadavres!: CadavreChunks;
  public player!: Player;
  public mapTitle = 'START';
  public startPoint!: {x:number, y:number, alias: string};
  public playerController: PlayerController;
  public socket!: Socket;

  public playerColor: string;

  constructor(
    private httpClient: HttpClient,
  ) {
    this.guid = this.getGuid();
    this.playerController = {UP: false, LEFT: false, RIGHT: false, DOWN: false, RESPAWN: false};
    this.playerColor = MapProcessor.getRandomColor();
    this.initWebSocket();
  }

  public initWebSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('connected', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('disconnected', this.socket.id); // undefined
    });

    this.socket.on('cadavres', (data:Cadavre[]) => {
      console.log('received cadavres', data);  
      for (const c of data) {
        if(c.level == this.mapTitle) {
          CadavreProcessor.addCadavreToChunk(this.cadavres, c);
        }
      }    
    });
  }

  public changeRoom(old: string, neww: string) {
    this.socket.emit('changeroom', {old, new: neww});
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

  public compareCadavresHash(cadavres: Cadavre[], title: string): Observable<boolean | Cadavre[]> {
    const chain = cadavres.map(c => c.x+'!'+c.y).sort().join('-');
    const localhash = Md5.hashStr(chain);
    return this.httpClient.get<boolean | Cadavre[]>(`/api/cadavreshash`, {params: {
      title: title,
      localhash: localhash,
    }});
  }

  public addCadavre(cadavre: Cadavre): Observable<Cadavre> {
    cadavre.guid = this.guid;
    return this.httpClient.post<Cadavre>('/api/cadavres/add', cadavre);
  }

  private getGuid(): string {
    let guid = '';
    for (let i=0; i<8; i++) {
      guid+=Math.floor(Math.random()*9);
    }
    return guid.substring(0, 8);
  }
}
