import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { Cadavre, CadavreProcessor } from 'src/app/engine/cadavres';
import { MapData, MapProcessor, VisibleBox } from 'src/app/engine/map';
import { Player, PlayerController } from 'src/app/engine/player';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.css']
})
export class GameCanvasComponent implements OnInit {

  public map!: MapData;
  public cadavres: Cadavre[] = [];
  public player!: Player;
  public mapTitle = 'START';

  @ViewChild('canvas', { static: true}) 
  private canvas: ElementRef = {} as ElementRef;
  private context : CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private visibleBox: VisibleBox = {x:0, y:0, zoom: 1}

  private playerController: PlayerController = {UP: false, LEFT: false, RIGHT: false, DOWN: false, RESPAWN: false};

  private lastTick = 0;
  private frameRate = 0;
  private deltaTime = 0;
  private currentFrame = 0;

  constructor(
    private ngZone: NgZone,
    private playerService: PlayerService,
  ) { }

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;
    
    this.playerService.getMapAndCadavres(this.mapTitle).subscribe({
      next: ({map, cadavres}) => {
        this.cadavres = cadavres;
        this.map = map;
        this.player = new Player();
      }
    });
    /*this.playerService.getMapCadavres(this.mapTitle).subscribe({
      next: cad => this.cadavres = cad
    }); */

    this.ngZone.runOutsideAngular(() => this.mainLoop());

    setTimeout(() => {
      this.resizeCanvas();
    });
  }

  private mainLoop() {
    if (this.map && this.cadavres && this.player) {
      // graphics
      this.context.clearRect(0, 0, this.width, this.height);

      MapProcessor.draw(this.map, this.context, this.width, this.height, this.visibleBox);
      CadavreProcessor.draw(this.cadavres, this.context, this.width, this.height, this.visibleBox);
      this.player.draw(this.context, this.width, this.height, this.visibleBox)

      // physic
      this.player.update(this.map, this.cadavres, this.playerController);
    }
    
    // tests
    this.getFPS();
    this.context.font = '10px Arial';
    this.context.textAlign = 'left';
    this.context.fillStyle = 'white';
    this.context.fillText('fps: '+Math.floor(this.frameRate), 20, 20);
    this.context.fillText('map: '+(this.map ? this.map.backgroundColor : ''), 20, 40);

    requestAnimationFrame(() => {
      this.mainLoop();
    });
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

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') this.playerController.UP = true;
    if (event.key === 'ArrowRight') this.playerController.RIGHT = true;
    if (event.key === 'ArrowDown') this.playerController.DOWN = true;
    if (event.key === 'ArrowLeft') this.playerController.LEFT = true;
    if (event.key.toLowerCase() === 'r') this.playerController.RESPAWN = true;
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') this.playerController.UP = false;
    if (event.key === 'ArrowRight') this.playerController.RIGHT = false;
    if (event.key === 'ArrowDown') this.playerController.DOWN = false;
    if (event.key === 'ArrowLeft') this.playerController.LEFT = false;
    if (event.key.toLowerCase() === 'r') this.playerController.RESPAWN = false;
  }
}
