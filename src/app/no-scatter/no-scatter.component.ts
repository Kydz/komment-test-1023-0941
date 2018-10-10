import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-no-scatter',
  templateUrl: './no-scatter.component.html',
  styleUrls: ['./no-scatter.component.css']
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
