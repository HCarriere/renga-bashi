import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { Cadavre, CadavreChunks, CadavreProcessor } from 'src/app/engine/cadavres';
import { MapData, MapProcessor, VisibleBox } from 'src/app/engine/map';
import { ParticlesProcessor } from 'src/app/engine/particles';
import { Player, PlayerController } from 'src/app/engine/player';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrls: ['./game-canvas.component.css']
})
export class GameCanvasComponent implements OnInit {

  public map!: MapData;
  public cadavres!: CadavreChunks;
  public player!: Player;
  public mapTitle = 'START';
  private startPoint!: {x:number, y:number, alias: string};

  private playerColor: string;

  @ViewChild('canvas', { static: true}) 
  private canvas: ElementRef = {} as ElementRef;
  private context : CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  private width = 0;
  private height = 0;
  private visibleBox: VisibleBox = {x:0, y:0, zoom: 1}

  private playerController: PlayerController = {UP: false, LEFT: false, RIGHT: false, DOWN: false, RESPAWN: false};
  private respawnInitiated = false;
  private teleportInitiated = false;

  private lastTick = 0;
  private frameRate = 0;
  private deltaTime = 0;
  private currentFrame = 0;

  private music!: HTMLAudioElement;

  constructor(
    private ngZone: NgZone,
    private playerService: PlayerService,
  ) {
    this.playerColor = MapProcessor.getRandomColor();
  }

  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;
    
    // get first map
    this.playerService.getMapAndCadavres(this.mapTitle).subscribe({
      next: ({map, cadavres}) => {
        this.cadavres = cadavres;
        this.map = map;
        // get first point
        this.startPoint = this.map.starts[0];
        this.player = new Player(this.startPoint.x || 2, this.startPoint.y || 2, this.playerColor);
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

    CadavreProcessor.initCadavreWebSocket((data: Cadavre[]) => {
      for (const c of data) {
        CadavreProcessor.addCadavreToChunk(this.cadavres, c);
      }
    });
  }

  private mainLoop() {
    if (this.map && this.cadavres && this.player) {

      // physic
      this.player.update(this.map, this.cadavres, this.playerController);
      ParticlesProcessor.update();
      
      // graphics
      this.context.clearRect(0, 0, this.width, this.height);

      MapProcessor.draw(this.map, this.context, this.width, this.height, this.visibleBox, this.currentFrame);
      CadavreProcessor.draw(this.cadavres, this.context, this.width, this.height, this.visibleBox);
      ParticlesProcessor.draw(this.context, this.visibleBox);
      this.player.draw(this.context, this.width, this.height, this.visibleBox, this.map);

      if (this.player.isDead && !this.respawnInitiated) this.respawn();
      if (this.player.endTouchedAlias && !this.teleportInitiated) this.endTouched(this.player.endTouchedAlias);
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
    this.player.isDead = true;
    // create cadavre (if can)
    this.player.spawnRespawnParticles();
    
    if (this.player.canCreateCadavre) {
      const cadavre = {
        x: this.player.x,
        y: this.player.y,
        color: this.player.color,
        rot: this.player.rot,
        level: this.mapTitle,
      };
      if (!this.map.options.disablePersistentCadavres) {
        this.playerService.addCadavre(cadavre).subscribe({
          next: newCad => {
            /*CadavreProcessor.addCadavreToChunk(this.cadavres, newCad);
            // refresh cadavres
            this.playerService.compareCadavresHash(CadavreProcessor.getChunksAsArray(this.cadavres), this.mapTitle).subscribe({
              next: res => {
                if (res !== true && Array.isArray(res)) {
                  this.cadavres = CadavreProcessor.getCadavreAsChunks(res);
                }
                // CadavreProcessor.addCadavreToChunk(this.cadavres, newCad);
              }
            });*/

          }
        });
      } else {
        CadavreProcessor.addCadavreToChunk(this.cadavres, cadavre);
      }
      
    } else {
      this.playerService.compareCadavresHash(CadavreProcessor.getChunksAsArray(this.cadavres), this.mapTitle).subscribe({
        next: res => {
          if (res !== true && Array.isArray(res)) {
            this.cadavres = CadavreProcessor.getCadavreAsChunks(res);
          }
          // CadavreProcessor.addCadavreToChunk(this.cadavres, newCad);
        }
      });
    }

    this.player = new Player(this.startPoint.x, this.startPoint.y, this.playerColor);
    this.respawnInitiated = false;
  }

  private endTouched(alias: string) {
    this.teleportInitiated = true;
    const currentMap = this.mapTitle;
    this.playerService.getNextMapAndCadavres(this.mapTitle, alias).subscribe({
      next: ({map, title, alias, cadavres}) => {
        this.cadavres = cadavres;
        this.map = map;
        this.mapTitle = title;
        this.startPoint = map.starts.find(o => o.alias == alias) || {x:0,y:0,alias:''}; 

        if (currentMap == title) {
          // same map
          this.player.x = this.startPoint.x * MapProcessor.tileSize;
          this.player.y = this.startPoint.y * MapProcessor.tileSize;
          this.player.endTouchedAlias = '';
        } else {
          // new map
          this.player = new Player(this.startPoint.x || 2, this.startPoint.y || 2, this.playerColor);
        }
        this.teleportInitiated = false;
        
      },
      error: (err) => {
        this.player.x = this.startPoint.x * MapProcessor.tileSize;
        this.player.y = this.startPoint.y * MapProcessor.tileSize;
        this.player.endTouchedAlias = '';
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
    this.player.onKeyDown(event.key, this.playerController);
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    this.player.onKeyUp(event.key, this.playerController);
  }
}
