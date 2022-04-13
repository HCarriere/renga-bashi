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
import { MapSelectorComponent } from './editor/map-selector/map-selector.component'; 
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './editor/login/login.component';
import { AuthGuard } from './editor/auth.guard';
import { JwtModule } from '@auth0/angular-jwt';
import { interceptorProviders } from './interceptors';
import { EditorSectionComponent } from './editor/editor/editor-section/editor-section.component';
import { GameCanvasComponent } from './game/game-canvas/game-canvas.component';

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    NgxColorsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter
      },
    }),
    RouterModule.forRoot([
      { path: '', component: GameComponent },
      { path: 'editor', component: EditorComponent, canActivate: [AuthGuard] },
      { path: 'login', component: LoginComponent},
      { path: '**', component: GameComponent },
    ])
  ],
  declarations: [
    AppComponent,
    EditorComponent,
    GameComponent,
    EditorCanvasComponent,
    MapSelectorComponent,
    LoginComponent,
    EditorSectionComponent,
    GameCanvasComponent,
  ],
  providers: [
    interceptorProviders,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }

export function tokenGetter() {
  return localStorage.getItem('token');
}