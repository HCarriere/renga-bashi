import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EditorService } from 'src/app/services/editor.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private editorService: EditorService,
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  login(password: string) {
    this.editorService.login(password).subscribe({
      next: res => {this.router.navigateByUrl('/editor')},
      error: error => {console.log(error);}
      }
    )
  }
}
