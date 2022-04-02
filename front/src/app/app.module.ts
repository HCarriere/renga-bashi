import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game/game.component';
import { EditorComponent } from './editor/editor/editor.component';
import { EditorCanvasComponent } from './editor/editor-canvas/editor-canvas.component';
import { NgxColorsModule } from 'ngx-colors';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    NgxColorsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      { path: 'game', component: GameComponent },
      { path: 'editor', component: EditorComponent },
      { path: '**', component: GameComponent },
    ])
  ],
  declarations: [
    AppComponent,
    EditorComponent,
    GameComponent,
    EditorCanvasComponent,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }