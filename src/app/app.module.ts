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
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


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
    MatButtonModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [
    NoScatterComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
