import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { EditorService } from '../services/editor.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private editorService: EditorService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    if (!this.editorService.isLoggedIn()) {
      this.router.navigateByUrl('/login');
    }
    return this.editorService.isLoggedIn();
  }
  
}
