import { Component, HostListener, OnInit } from '@angular/core';
import { Cadavre } from 'src/app/engine/cadavres';
import { Map } from 'src/app/engine/map';
import { MapEditorProcessor } from 'src/app/engine/mapEditor';
import { EditorService } from 'src/app/services/editor.service';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  public map: Map;
  public cadavres: Cadavre[] = [];

  public detailsEdit = false;

  public mapSelectorDisplay = false;
  public endAlias!: string;

  constructor(
    public editorService: EditorService,
    private playerService: PlayerService,
  ) {
    this.map = MapEditorProcessor.initNewMap();
  }

  ngOnInit(): void {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'a') {}
  }

  public selectMap(map: Map) {
    this.map = map;
    this.updateCadavres();
    this.mapSelectorDisplay = false;
  }

  public updateCadavres() {
    this.playerService.getMapCadavres(this.map.title).subscribe({
      next: cad => this.cadavres = cad,
    });
  }

  public promptAddLinkToEnd(alias: string) {
    this.endAlias = alias;
    this.mapSelectorDisplay = true;
  }

  public addLinkToEnd(event: {mapTitle: string, startAlias: string, endAlias: string}) {
    this.editorService.addLinkToMap(this.map, event.mapTitle, event.startAlias, event.endAlias);
    this.endAlias = '';
    this.mapSelectorDisplay = false;
  }

  public saveMap() {
    this.editorService.titleExists(this.map.title).subscribe(
      exists => {
        if (exists) {
           if (confirm(`[${this.map.title}] already exists ! Save anyway ?`)) {
            this.editorService.saveMap(this.map).subscribe({
              next: result => console.log(result),
              error: error => console.log(error),
            });
           }
        } else {
          this.editorService.saveMap(this.map).subscribe({
            next: result => console.log(result),
            error: error => console.log(error),
          });
        }
      }
    );
  }

  
}
