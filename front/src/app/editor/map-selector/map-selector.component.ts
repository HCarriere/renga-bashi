import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { EditorService } from 'src/app/services/editor.service';
import { Map } from 'src/app/engine/map';

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.css']
})
export class MapSelectorComponent implements OnInit {

  public maps: Map[] = [];

  @Output()
  public mapSelected = new EventEmitter<Map>();

  @Output()
  public closed = new EventEmitter();

  @ViewChild('panel', { static: true}) 
  private panel: ElementRef = {} as ElementRef;


  constructor(
    private editorService: EditorService,
  ) { }

  ngOnInit(): void {
    this.editorService.getMaps().subscribe({
      next: result => {this.maps = result;},
      error: error => console.log(error),
    });
  }

  selectMap(map: Map) {
    this.mapSelected.emit(map);
  }

  @HostListener('click', ['$event'])
  click(event: MouseEvent) {
    if(event.target !== this.panel.nativeElement){
      this.closed.emit();
    }
  }
}
