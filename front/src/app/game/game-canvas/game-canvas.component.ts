import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { CadavreChunks, CadavreProcessor } from 'src/app/engine/cadavres';
import { MapData, MapProcessor, VisibleBox } from 'src/app/engine/map';
import { ParticlesGenerator, ParticlesProcessor } from 'src/app/engine/particles';
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
    if (this.player.canCreateCadavre) {
      const gen = new ParticlesGenerator(this.player.x, this.player.y, ['red', this.player.color, this.player.color, this.player.color]);
      gen.rangeVelocity = {minx: -4+this.player.vx, maxx: 4+this.player.vx, miny: -4+this.player.vy, maxy: 4+this.player.vy};
      gen.rangeSpawn = {minx: -5, maxx: 5, miny: -5, maxy: -5};
      gen.gravity = {x: 0, y: 0.1};
      gen.rangeLife = {min: 4, max: 10};
      gen.particlePerFrame = 45 ;
      gen.life = 1;
      ParticlesProcessor.addGenerator(gen);
      const cadavre = {
        x: this.player.x,
        y: this.player.y,
        color: this.player.color,
        rot: this.player.rot,
        level: this.mapTitle,
      };
      if (!this.map.options.disablePersistentCadavres) {
        this.playerService.addCadavre(cadavre);
      }
      CadavreProcessor.addCadavreToChunk(this.cadavres, cadavre);
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
    if (event.key.toLowerCase() === 'r') {
      this.respawn();
      this.playerController.RESPAWN = false;
    }
  }
}
