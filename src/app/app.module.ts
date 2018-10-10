import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatDialogModule, MatButtonModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppComponent } from './app.component';
import { TreasureGameComponent } from './treasure-game/treasure-game.component';
import { TreasurePendingComponent } from './treasure-game/treasure-pending/treasure-pending.component';
import { TreasureCloseComponent } from './treasure-game/treasure-close/treasure-close.component';
import { NoScatterComponent } from './no-scatter/no-scatter.component';

@NgModule({
  declarations: [
    AppComponent,
    TreasureGameComponent,
    TreasurePendingComponent,
    TreasureCloseComponent,
    NoScatterComponent
  ],
  imports: [
    BrowserModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule
  ],
  entryComponents: [
    NoScatterComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
