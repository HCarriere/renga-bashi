import { Component, ElementRef, HostListener, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { CadavreChunks } from 'src/app/engine/cadavres';
import { CadavreEditorProcessor } from 'src/app/engine/cadavresEditor';
import { VisibleBox } from 'src/app/engine/map';
import { Map, MapEditorProcessor } from 'src/app/engine/mapEditor';
import { ParticlesProcessor } from 'src/app/engine/particles';
import { EditorService } from 'src/app/services/editor.service';

export interface MouseStatus {
  clicked: boolean;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    rightclick: boolean;
  };
  position: {
    x: number;
    y: number;
  };
}

@Component({
  selector: 'app-editor-canvas',
  templateUrl: './editor-canvas.component.html',
  styleUrls: ['./editor-canvas.component.css']
})
export class EditorCanvasComponent implements OnInit {

  @Input()
  public map!: Map;

  @Input()
  public cadavres!: CadavreChunks;

  @ViewChild('canvas', { static: true}) 
  private canvas: ElementRef = {} as ElementRef;
  private context : CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private mouseStatus: MouseStatus = {clicked: false, position: {x:0, y:0}, modifiers: {alt:false, ctrl:false,rightclick:false,shift:false}};
  private visibleBox: VisibleBox = {x:0, y:0, zoom: 1}
  
  private mouseTickX = 0;
  private mouseTickY = 0;

  private lastTick = 0;
  private frameRate = 0;
  private deltaTime = 0;
  private currentFrame = 0;

  constructor(
    private ngZone: NgZone,
    private editorService: EditorService,
    ) {}

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;
    
    this.ngZone.runOutsideAngular(() => this.mainLoop());
    
    setTimeout(() => {
      this.resizeCanvas();
    });
  }

  private mainLoop() {
    // scroll view
    if (this.mouseStatus.clicked && this.mouseStatus.modifiers.rightclick) {
      this.visibleBox.x = this.visibleBox.x - this.mouseTickX;
      this.visibleBox.y = this.visibleBox.y - this.mouseTickY;
    }

    // editor
    MapEditorProcessor.updateMap(this.map.map, this.mouseStatus, this.visibleBox, this.editorService);
    CadavreEditorProcessor.updateMap(this.cadavres, this.map, this.mouseStatus, this.visibleBox, this.editorService);
    ParticlesProcessor.update();

    // graphics
    this.context.clearRect(0, 0, this.width, this.height);

    MapEditorProcessor.draw(this.map.map, this.context, this.width, this.height, this.visibleBox, this.currentFrame, this.editorService.enableDebug);
    MapEditorProcessor.displayBrush(this.map.map, this.context, this.mouseStatus, this.visibleBox, this.editorService);
    if (this.cadavres) CadavreEditorProcessor.draw(this.cadavres, this.context, this.width, this.height, this.visibleBox);
    ParticlesProcessor.draw(this.context, this.visibleBox);

    // tests
    this.getFPS();
    this.context.font = '10px Arial';
    this.context.textAlign = 'left';
    this.context.fillStyle = 'white';
    this.context.fillText('fps: '+Math.floor(this.frameRate), 20, 20);

    // update mouse move ticks
    this.mouseTickX = this.mouseTickY = 0;

    requestAnimationFrame(() => {
      this.mainLoop();
    });
  }

  public onMouseUp(event: MouseEvent) {
    this.mouseStatus.clicked = false;
    this.setMouseStatus(event);
  }
  public onMouseDown(event: MouseEvent) {
    this.mouseStatus.clicked = true;
    this.setMouseStatus(event);
  }
  public onMouseMove(event: MouseEvent) {
    this.setMouseStatus(event);
  }

  private setMouseStatus(event: MouseEvent) {
    this.mouseTickX = event.offsetX - this.mouseStatus.position.x;
    this.mouseTickY = event.offsetY - this.mouseStatus.position.y;

    this.mouseStatus.modifiers.ctrl = event.ctrlKey;
    this.mouseStatus.modifiers.alt = event.altKey;
    this.mouseStatus.modifiers.shift = event.shiftKey;
    this.mouseStatus.modifiers.rightclick = event.buttons == 2;
    this.mouseStatus.position = {
      x: event.offsetX,
      y: event.offsetY,
    };
  }

  private getFPS() {
    this.currentFrame ++;
    if(!this.lastTick){
      this.lastTick = performance.now();
        return;
    }
    this.deltaTime = (performance.now() - this.lastTick)/1000;
    this.lastTick = performance.now();
    if (this.currentFrame % 20 == 0) this.frameRate = 1/this.deltaTime;
  }

  @HostListener('window:resize', ['$event'])
  private resizeCanvas() {
    this.width = this.canvas.nativeElement.width = this.canvas.nativeElement.clientWidth;
    this.height = this.canvas.nativeElement.height = this.canvas.nativeElement.clientHeight;
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }

}


