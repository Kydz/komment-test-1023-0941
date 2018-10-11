import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private endpoint = environment.apiEndpoint;

  constructor(private http: HttpClient) {
  }

  addGameRecord(account: string, eos: string, txHash: string): Observable<any> {
    const data = {
      account_name: account,
      eos_count: eos,
      game_name: 'treasure',
      tx_hash: txHash
    };
    return this.http.post(this.endpoint + 'game', data);
  }

  getGameRecord(account: string): Observable<any> {
    const params = {
      account_name: account,
      game_name: 'treasure'
    };
    return this.http.get(this.endpoint + 'game', {params: params});
  }

  getReward(account: string): Observable<any> {
    const data = {
      account_name: account
    };
    return this.http.post(this.endpoint + 'rewards', data);
  }

  getWinners(): Observable<any> {
    const data = {
      game_name: 'treasure'
    };
    return this.http.post(this.endpoint + 'game/winner', data);
  }
}
