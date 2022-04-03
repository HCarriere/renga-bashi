import { Component, HostListener, OnInit } from '@angular/core';
import { Map } from 'src/app/engine/map';
import { MapEditorProcessor } from 'src/app/engine/mapEditor';
import { EditorService } from 'src/app/services/editor.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  public map: Map;

  constructor(
    public editorService: EditorService,
  ) {
    this.map = MapEditorProcessor.initNewMap();
  }

  ngOnInit(): void {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'a') {}
  }
}
