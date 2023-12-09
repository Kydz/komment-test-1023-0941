import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-helper-guide',
  templateUrl: './helper-guide.component.html',
  styleUrls: ['./helper-guide.component.css']
})
export class HelperGuideComponent implements OnInit {

  constructor() {
    console.log('some changes!');
  }

  ngOnInit() {
  }

}

