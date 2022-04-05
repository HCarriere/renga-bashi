import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-editor-section',
  templateUrl: './editor-section.component.html',
  styleUrls: ['./editor-section.component.css']
})
export class EditorSectionComponent implements OnInit {

  public collapsed = false;
  
  @Input()
  public title = 'Section';

  constructor() { }

  ngOnInit(): void {
    if ('true' == localStorage.getItem('collapse_'+this.title)) this.collapsed = true;
  }

  public toggleCollapse() {
    this.collapsed = !this.collapsed;
    localStorage.setItem('collapse_'+this.title, ''+this.collapsed);
  }
}
