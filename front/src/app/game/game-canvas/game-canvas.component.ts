import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { CadavreProcessor } from 'src/app/engine/cadavres';
import { MapProcessor, VisibleBox } from 'src/app/engine/map';
import { ParticlesProcessor } from 'src/app/engine/particles';
import { Player } from 'src/app/engine/player';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.css']
})
export class GameCanvasComponent implements OnInit {


  @ViewChild('canvas', { static: true}) 
  private canvas: ElementRef = {} as ElementRef;
  private context : CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private visibleBox: VisibleBox = {x:0, y:0, zoom: 1}

  private respawnInitiated = false;
  private teleportInitiated = false;

  private lastTick = 0;
  private frameRate = 0;
  private deltaTime = 0;
  private currentFrame = 0;

  private music!: HTMLAudioElement;

  constructor(
    private ngZone: NgZone,
    public playerService: PlayerService,
  ) {}

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;
    
    // get first map
    this.playerService.getMapAndCadavres(this.playerService.mapTitle).subscribe({
      next: ({map, cadavres}) => {
        this.playerService.cadavres = cadavres;
        this.playerService.map = map;
        // get first point
        this.playerService.startPoint = this.playerService.map.starts[0];
        this.playerService.player = new Player(this.playerService.startPoint.x || 2, this.playerService.startPoint.y || 2, this.playerService.playerColor);
      }
    });
    this.ngZone.runOutsideAngular(() => this.mainLoop());

    setTimeout(() => {
      this.resizeCanvas();
    });

    this.music = new Audio();
    this.music.src = '../assets/sounds/musique.wav';
    this.music.loop = true;
    this.music.load();
    // this.music.play(); // TODO enable this
  }

  private mainLoop() {
    if (this.playerService.map && this.playerService.cadavres && this.playerService.player) {

      // physic
      this.playerService.player.update(this.playerService.map, this.playerService.cadavres, this.playerService.playerController);
      ParticlesProcessor.update();
      
      // graphics
      this.context.clearRect(0, 0, this.width, this.height);

      MapProcessor.draw(this.playerService.map, this.context, this.width, this.height, this.visibleBox, this.currentFrame);
      CadavreProcessor.draw(this.playerService.cadavres, this.context, this.width, this.height, this.visibleBox);
      ParticlesProcessor.draw(this.context, this.visibleBox);
      this.playerService.player.draw(this.context, this.width, this.height, this.visibleBox, this.playerService.map);

      if (this.playerService.player.isDead && !this.respawnInitiated) this.respawn();
      if (this.playerService.player.endTouchedAlias && !this.teleportInitiated) this.endTouched(this.playerService.player.endTouchedAlias);
    }
    
    // tests
    this.getFPS();
    this.context.font = '10px Arial';
    this.context.textAlign = 'left';
    this.context.fillStyle = 'white';
    this.context.fillText('fps: '+Math.floor(this.frameRate), 20, 20);

    requestAnimationFrame(() => {
      this.mainLoop();
    });
  }

  private respawn() {
    this.respawnInitiated = true;
    this.playerService.player.isDead = true;
    this.playerService.player.spawnRespawnParticles();
    
    // create cadavre (if can)
    if (this.playerService.player.canCreateCadavre) {
      const cadavre = {
        x: this.playerService.player.x,
        y: this.playerService.player.y,
        color: this.playerService.player.color,
        rot: this.playerService.player.rot,
        level: this.playerService.mapTitle,
      };
      CadavreProcessor.addCadavreToChunk(this.playerService.cadavres, cadavre);

      if (!this.playerService.map.options.disablePersistentCadavres) {  
        this.playerService.addCadavre(cadavre).subscribe({
          next: newCad => {}
        });
      }
      
    } else {
      this.playerService.compareCadavresHash(CadavreProcessor.getChunksAsArray(this.playerService.cadavres), this.playerService.mapTitle).subscribe({
        next: res => {
          if (res !== true && Array.isArray(res)) {
            this.playerService.cadavres = CadavreProcessor.getCadavreAsChunks(res);
          }
          // CadavreProcessor.addCadavreToChunk(this.cadavres, newCad);
        }
      });
    }

    this.playerService.player = new Player(this.playerService.startPoint.x, this.playerService.startPoint.y, this.playerService.playerColor);
    this.respawnInitiated = false;
  }

  private endTouched(alias: string) {
    this.teleportInitiated = true;
    const currentMap = this.playerService.mapTitle;
    this.playerService.getNextMapAndCadavres(this.playerService.mapTitle, alias).subscribe({
      next: ({map, title, alias, cadavres}) => {
        this.playerService.changeRoom(currentMap, title);
        this.playerService.cadavres = cadavres;
        this.playerService.map = map;
        this.playerService.mapTitle = title;
        this.playerService.startPoint = map.starts.find(o => o.alias == alias) || {x:0,y:0,alias:''}; 

        if (currentMap == title) {
          // same map
          this.playerService.player.x = this.playerService.startPoint.x * MapProcessor.tileSize;
          this.playerService.player.y = this.playerService.startPoint.y * MapProcessor.tileSize;
          this.playerService.player.endTouchedAlias = '';
        } else {
          // new map
          this.playerService.player = new Player(this.playerService.startPoint.x || 2, this.playerService.startPoint.y || 2, this.playerService.playerColor);
        }
        this.teleportInitiated = false;
        
      },
      error: (err) => {
        this.playerService.player.x = this.playerService.startPoint.x * MapProcessor.tileSize;
        this.playerService.player.y = this.playerService.startPoint.y * MapProcessor.tileSize;
        this.playerService.player.endTouchedAlias = '';
        this.teleportInitiated = false;
      }
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
    this.playerService.player.onKeyDown(event.key, this.playerService.playerController);
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    this.playerService.player.onKeyUp(event.key, this.playerService.playerController);
  }
  


  public touchStart(event: TouchEvent) {
    event.preventDefault();
    this.playerService.player.handleTouch(event.targetTouches, this.width, this.height, this.playerService.playerController);
  }

  public touchEnd(event: TouchEvent) {
    event.preventDefault();
    this.playerService.player.handleTouch(event.targetTouches, this.width, this.height, this.playerService.playerController);
  }

  public touchMoving(event: TouchEvent) {
    event.preventDefault();
    this.playerService.player.handleTouch(event.targetTouches, this.width, this.height, this.playerService.playerController);
  }
}
