import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EditorService } from 'src/app/services/editor.service';
import { Map } from 'src/app/engine/map';

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.css']
})
export class MapSelectorComponent implements OnInit {

  public maps: Map[] = [];

  @Input()
  public endAlias!: string;

  @Output()
  public mapSelected = new EventEmitter<Map>();

  @Output()
  public endAliasSelected = new EventEmitter<{mapTitle: string, startAlias: string, endAlias: string}>();

  @Output()
  public closed = new EventEmitter();

  constructor(
    private editorService: EditorService,
  ) { }

  ngOnInit(): void {
    this.editorService.getMaps().subscribe({
      next: result => {
        this.maps = result;
      },
      error: error => console.log(error),
    });
  }

  selectMap(map: Map) {
    if (!this.endAlias) this.mapSelected.emit(map);
  }

  deleteMap(map: Map) {
    if (confirm('Are you sure you wish to DELETE PERMANENTLY this map ?')) {
      this.editorService.deleteMap(map.title).subscribe({
        next: data => {
          if (data == 'ok') {
            const i = this.maps.findIndex(o => o.title == map.title);
            if (i >= 0) this.maps.splice(i, 1);
          }
        }
      });
    }
  }

  selectStartAlias(mapTitle: string, alias: string) {
    this.endAliasSelected.emit({mapTitle, startAlias:alias, endAlias:this.endAlias});
  }

  exit() {
    this.closed.emit();
  }

}
