import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  name: string;
  login: string;
}

@Component({
  selector: 'app-no-scatter',
  templateUrl: './no-scatter.component.html',
  styleUrls: ['./no-scatter.component.scss']
})
export class NoScatterComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<NoScatterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
