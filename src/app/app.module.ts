import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppComponent } from './app.component';
import { TreasureGameComponent } from './treasure-game/treasure-game.component';
import { TreasurePendingComponent } from './treasure-game/treasure-pending/treasure-pending.component';
import { TreasureCloseComponent } from './treasure-game/treasure-close/treasure-close.component';

@NgModule({
  declarations: [
    AppComponent,
    TreasureGameComponent,
    TreasurePendingComponent,
    TreasureCloseComponent
  ],
  imports: [
    BrowserModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSnackBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
