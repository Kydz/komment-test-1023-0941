import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subscription, throwError } from 'rxjs';
import Eos from 'eosjs';
import { MatDialog, MatSnackBar } from '@angular/material';

import { NoScatterComponent } from '../no-scatter/no-scatter.component';
import { environment } from '../../environments/environment';
import BigNumber from 'bignumber.js';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScatterService {
  private scatterStatusSub$ = new BehaviorSubject<string>('open');
  private dataRefreshSub$ = new BehaviorSubject<{ players, lastGame, previousGames, lastPurchase, lockPeriodTime }>(
    null
  );
  private identitySub$ = new BehaviorSubject({
    name: null
  });
  private scatter: any;
  private contract: any;
  private account: any;
  private eos: any = null;
  private gameIndex = 1;
  private eosNetwork = environment.eosNet;
  private pollingSub$: Subscription;

/**
* @description This constructor function initializes an object with several properties
* and listsens for scatterLoaded event on the document to load data when the application
* starts.
* 
* @param { MatSnackBar } snackBar - The `snackBar` input parameter is used to create
* and show a snackbar (a material design-based toast message) with the provided text.
* 
* @param { MatDialog } dialog - The `dialog` input parameter is used to create a
* MatDialog for displaying a message to the user.
*/
  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {
    const eosOptions = {
      httpEndpoint: `${this.eosNetwork.protocol}://${this.eosNetwork.host}:${this.eosNetwork.port}`
    };

    this.eos = this.eos = Eos(eosOptions);

    if (!this.pollingSub$) {
      this.getData();
    }
    if (window['scatter']) {
      this.scatter = window['scatter'];
      this.initScatter();
    } else {
/**
* @description This function adds an event listener to the `document` object to
* listen for the `scatterLoaded` event.
*/
      document.addEventListener('scatterLoaded', () => {
        this.scatter = window['scatter'];
        this.initScatter();
      });
    }
  }

/**
* @description This function is undefined because it has not been defined yet.
* 
* @returns { object } The output returned by the function `getIdentitySub` is `this.identitySub$.`.
* 
* In simpler terms: the function does not return anything because it has a return
* statement of `this.identitySub$`, which is undefined.
*/
  getIdentitySub() {
    console.log('try komment AI');
    console.log('try komment AI 2');
    return this.identitySub$;
  }

/**
* @description This function returns the `scatterStatusSub$` property of the current
* object.
* 
* @returns {  } The function `scatterStatus()` returns an observible object called
* `this.scatterStatusSub$`.
*/
  scatterStatus() {
    return this.scatterStatusSub$;
  }

/**
* @description This function `refreshData()` returns an observable (in this case
* `this.dataRefreshSub$`) that contains the latest data.
* 
* @returns { Promise } The output returned by the `refreshData()` function is `this.dataRefreshSub$`.
*/
  refreshData() {
    return this.dataRefreshSub$;
  }

/**
* @description This function opens a dialog box with two options: "scatter" and
* "contract". If the user selects "scatter", it will display the "NoScatterComponent"
* component.
* 
* @returns { void } The `openDialog` function takes no arguments and returns nothing
* (the return type is `void`). It opens a dialog box with two possible options:
* "scatter" and "contract". If the user selects "scatter", the function closes the
* dialog box and does nothing further. If the user selects "contract", it calls the
* `login()` function.
*/
  openDialog(): void {
    if (!this.isScatterLoaded()) {
      this.dialog.open(NoScatterComponent, {
        width: '250px',
        data: {name: 'scatter'}
      });
    } else if (!this.isContractLoaded()) {
      const dialogRef = this.dialog.open(NoScatterComponent, {
        width: '250px',
        data: {name: 'contract', login: ''}
      });

/**
* @description This function sets up an asynchronous call to the `login` method once
* the `dialogRef.afterClosed()` observable emits a result of `'contract'`.
* 
* @param { string } result - The `result` input parameter is a parameter passed to
* the callback function inside the `.afterClosed()` method of the `DialogRef`. It
* receives the result of the dialog closure event. In the example given - 'contract'
* when the user clicks okay/apply etc and the dialog is closed - `result` will have
* this value.
*/
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'contract') {
          this.login();
        }
      });
    }
  }

/**
* @description The function `isScatterLoaded()` checks whether the `scatter` object
* is defined or not.
* 
* @returns { boolean } The output returned by the `isScatterLoaded()` function is a
* Boolean value of `true` if the `scatter` property is not undefined and has a value
* other than null or an empty object.
*/
  isScatterLoaded() {
    return !!this.scatter;
  }

/**
* @description This function checks if a contract object is defined (i.e., not
* undefined) and returns a boolean indicating whether the contract is loaded (true)
* or not (false).
* 
* @returns { boolean } The output returned by the `isContractLoaded()` function is
* a boolean value indicating whether the `contract` object is defined (i.e., not
* `undefined`). In other words.
*/
  isContractLoaded() {
    return !!this.contract;
  }

/**
* @description This function `gameStart()` starts a smart contract called `game`
* with the specified authorization.
* 
* @returns {  } The `gameStart()` function returns a Stream that yields a value when
* the `start()` method of the contract is called with the specified options. The
* stream is wrapped with `fromPromise()` and `pipe()`, and an error handler is added
* using `catchError()`.
*/
  gameStart() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.start(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

/**
* @description This function calls the EOS blockchain's `transfer` action with a
* given `amount`, and returns an Observable that emits the result of the transaction.
* 
* @param { string } amounts - The `amounts` parameter is a string that represents
* the amount of EOS to be transferred.
* 
* @returns { Observable } The function `transferEos` returns an `Observable<any>`
* that resolves to the result of the EOS transaction (a boolean value indicating
* whether the transaction was successful). The function takes a string `amounts`
* representing the amount of EOS to be transferred and uses BigNumber.js to convert
* it to a BigNumber instance. It then calculates the rounded amount with four decimal
* places and constructs an EOS transaction object with the `transfer` method of the
* `eos` property of the current account.
*/
  transferEos(amounts: string): Observable<any> {
    const transfer = new BigNumber(amounts);
    const amount = `${transfer.toFixed(4)} EOS`;
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ],
      broadcast: true,
      sign: true
    };

    return fromPromise(this.eos.transfer(this.account.name, 'treasuregame', amount, 'memo', options)).pipe(
      catchError(this.handleError)
    );
  }

/**
* @description This function `draw()` returns an `Observable<any>` that resolves to
* the result of calling the `draw()` method on a web3 contract with the specified
* name and options.
* 
* @returns { Observable } The `draw()` function returns an Observable<any> that emits
* the result of calling the `draw()` method on the `contract` object with the specified
* `options`. The `fromPromise` operator takes a promise and returns an Observable
* that emits the value of the promise.
*/
  draw(): Observable<any> {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.draw(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

/**
* @description This function stops the contract associated with the account and
* returns an Observable that emits any error caught during the stop process.
* 
* @returns { Observable } The function `stop()` returns an `Observable<any>` object
* that emits a value of type `any`.
*/
  stop(): Observable<any> {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.stop(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

/**
* @description This function returns the name of the account associated with the
* object (if one is provided), otherwise it returns '--'.
* 
* @returns { string } The function returns a string '--' if the account property is
* undefined or null and returns the value of the account.name property otherwise.
*/
  getAccountName(): string {
    if (this.account) {
      return this.account.name;
    } else {
      return '--';
    }
  }

/**
* @description This function returns an observable that provides information about
* the specified account using the `eos` method and pipes any errors to a handle error
* function.
* 
* @returns { Observable } The `getAccountInfo()` function returns an Observable<any>,
* which means it returns a stream of values that may be observed multiple times. The
* underlying promise that is being observed is returned from the `fromPromise()`
* method and wrapped inside an Observable.
* 
* In other words," any" is returned because there's no return statement explicitly
* specified for this function. And whatever is received as input or error from
* 'fromPromise() will be passed down to its observe- able stream via pipes() .
*/
  getAccountInfo(): Observable<any> {
    return fromPromise(this.eos.getAccount(this.account.name)).pipe(
      catchError(this.handleError)
    );
  }

/**
* @description The `changeScatter()` function resets the scatter plot's identity and
* initializes a new scatter plot with the `initScatter()` method.
* 
* @returns { object } The function `changeScatter()` forgets the identity of the
* scatter plot and then returns the initialized scatter plot.
*/
  changeScatter() {
    this.scatter.forgetIdentity();
    return this.initScatter();
  }

/**
* @description This function retrieves the user's Scatter identity and sets up the
* EOS account for the treasure game. It logs the Scatter Identity to the console and
* stores it locally using window.localStorage. It also displays a snackbar with the
* message "載入完成".
*/
  login() {
/**
* @description This function fetches the Scatter identity for the current account
* and then uses that identity to load a Smart Contract on the EOS blockchain.
* 
* @param { object } identity - In the given function snippet:
* 
* The `identity` input parameter is passed to the `.then()` method callback function
* which is a promise resolved with an object containing the `accounts` property with
* an array of identities. The code is expecting one identity object with a `blockchain`
* property equal to 'eos'.
*/
    this.scatter.getIdentity({accounts: [this.eosNetwork]}).then(identity => {
/**
* @description This function uses the `find()` method of the `identity.accounts`
* collection to find all accounts where the `blockchain` field is equal to 'eos'.
* 
* @param { object } acc - In this context,"acc" is a local variable used to represent
* each account object found during the iteration of the array of accounts."accounts.find"
* takes a callback function as an argument(in this case,(acc=> acc.blockchain==='eos'))
* which is executed for each account and the"acc"variable within the callback refers
* to that particular account object.So ,the input parameter "acc" refers to each
* individual account being iterated over .
*/
      this.account = identity.accounts.find(acc => acc.blockchain === 'eos');
      this.identitySub$.next(this.account);
      console.log('以獲取 Scatter Identity');
/**
* @description This function deploys the `treasuregame` contract and sets the
* `contract` property of the current object to the deployed contract.
/**
* @description This function gets the Scatter identity for the currently authenticated
* user and sets up the EOS account and contract information for the TreasureGame dApp.
* 
* @param { object } e - In the given function`, `e` is the error object that is
* passed as an argument to the function's catch block.
*/
* 
* @param { object } contract - The `contract` input parameter is used to pass the
* constructed EOS contract object to the `then()` method of a Promise.
*/
      this.eos.contract('treasuregame').then(contract => {
        this.contract = contract;
        window.localStorage.setItem('account_name', this.account.name);
        this.snackBar.open('載入完成', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar'
        });
      });
    }).catch(e => {
      console.log('獲取 Scatter Identity 失敗:');
      console.warn(e);
      if (e.type && e.type === 'locked') {
        this.snackBar.open('請先解鎖 Scatter', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar'
        });
      }
    });
  }

/**
* @description The `logout()` function clears the local storage for the web app and
* sets all relevant variables to null (account and contract), forgets the identity
* using Scatter.
*/
  logout() {
    window.localStorage.clear();
    this.account = null;
    this.contract = null;
    this.scatter.forgetIdentity();
  }

/**
* @description This function called `isLogin()` checks whether the user is logged-in
* or not.
*/
  isLogin() {
    if (this.account) {
      return true;
    } else {
      const accountName = window.localStorage.getItem('account_name');
      if (accountName) {
        if (this.scatter) {
          this.login();
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

/**
* @description This function takes a string `type` as input and returns a human-readable
* error message corresponding to that type.
* 
* @param { string } type - The `type` input parameter determines which error message
* to return based on its string value.
* 
* @returns { string } This function takes a `type` string parameter and returns a
* descriptive error message based on that type.
*/
  getScatterErrorByType(type: string): string {
    if (type === 'signature_rejected') {
      return '您取消了操作';
    }
    if (type === 'tx_cpu_usage_exceeded') {
      return '您的CPU不夠';
    }
    if (type === 'tx_ram_usage_exceeded') {
      return '您的RAM不够';
    }
    if (type === 'eosio_assert_message_exception') {
      return '智能合約異常';
    }
    return '出錯了!';
  }

/**
* @description This function calculates the winner's EOS amount by taking into account
* the start fee and draw fee and then subtracting those fees from the total rewards
* received by the player for each row.
* 
* @param { object } game - The `game` input parameter provides information about the
* EOS game such as start fee and current count.
* 
* @returns { string } This function takes a `game` object as input and returns a
* string representing the winner's EOS amount. The function first calculates the
* const fee and platform fee modifier then calculates the row reward using the game
* price and current count.
*/
  getWinnerEosAmount(game): string {
    const constFee = new BigNumber(game.start_fee).plus(game.draw_fee);
    const platformFeeModifier = new BigNumber(game.fee_percent).div(100);
    const rowReward = new BigNumber(game.price).times(game.current_count);
    const result = rowReward.times(new BigNumber(1).minus(platformFeeModifier)).minus(constFee);
    if (result.lt(0)) {
      return '0';
    } else {
      return result.div(10000).toFixed();
    }
  }

/**
* @description This function retrieves game data and refreshes the game data every
* 1500 milliseconds (1.5 seconds).
*/
  private getData() {
/**
* @description This function retrieves game information and updates the local data
* store with the latest data. It does this by making two API calls to retrieve the
* current game and the previous games played by the user.
* 
* @param { object } state - The `state` input parameter retrieves data from the
* game's state information.
*/
    this.pollingSub$ = this.getGameInfo('state', 0, 20).subscribe(
      state => {
        let index;
        this.gameIndex = index = state.rows[1].value;
        const lockPeriodTime = state.rows[10].value;
        if (this.gameIndex > 5) {
          index = this.gameIndex - 5;
        }
/**
* @description This function subscribes to two HTTP requests (`forkJoin`) and merges
* their responses. It then extracts relevant data from the responses and creates an
* object containing that data.
* 
* @param { object } response - The `response` input parameter is an observable
* returned from the `forkJoin` operator that resolves to an array of objects containing
* game information.
*/
        forkJoin(
          this.getGameInfo('gameplayer', 0, 200),
          this.getGameInfo('game', index)
        ).subscribe(response => {
          const data = {
            players: this.getCurrentGamePlayers(response[0]['rows']),
            lastGame: {},
            previousGames: [],
            lastPurchase: {},
            lockPeriodTime: 3600
          };
          data.lastGame = response[1]['rows'][response[1]['rows'].length - 1];
          response[1]['rows'].pop();
          data.previousGames = response[1]['rows'];
          data.lastPurchase = response[0]['rows'][response[0]['rows'].length - 1];
          data.lockPeriodTime = lockPeriodTime;
          this.dataRefreshSub$.next(data);
/**
* @description This function calls the `getData()` function after a 1500 millisecond
* delay using `setTimeout()`.
*/
          setTimeout(() => {
            this.getData();
          }, 1500);
        });
      }
    );
  }

/**
* @description This function returns an Observable that retrieves information about
* a specific game (defined by the `name` parameter) from the Treasure Game database.
* 
* @param { string } name - The `name` input parameter is the name of the table that
* we want to retrieve information about.
* 
* @param { number } [lowerBound=0] - The `lowerBound` input parameter specifies the
* minimum row number to includein the result set when querying a Couchbase table
* using the EOS API. In this function implementation of getGameInfo() lowerBound
* sets as 0.
* 
* @param { number } [limit=10] - The `limit` input parameter determines the maximum
* number of rows to retrieve from the database table specified by `name`.
* 
* @returns { Observable } Based on the code provided:
* 
* The `getGameInfo` function is a private method that takes three parameters:
* 
* 	- `name`: a string representing the name of the game info to retrieve
* 	- `lowerBound`: an optional number representing the lower bound of the rows to
* be retrieved (default is 0)
* 	- `limit`: an optional number representing the limit of the rows to be retrieved
* (default is 10)
* 
* The function returns an Observable<any> object that contains the game info data.
* 
* In simpler terms: this function fetches data from a table based on the given name
* and other specified criteria (lower bound and limit), and then returns the data
* as an observable object that can be consumed by subscribers.
*/
  private getGameInfo(name: string, lowerBound: number = 0, limit: number = 10): Observable<any> {
    const tableQuery = {
      'json': true,
      'scope': 'treasuregame',
      'code': 'treasuregame',
      'table': name,
      'lower_bound': lowerBound.toString(),
      'limit': limit
    };

    return fromPromise(this.eos.getTableRows(tableQuery));
  }

/**
* @description This function initializes the EOS scatter interface and sets up a
* connection to the EOS network with the specified chain ID.
*/
  private initScatter() {
    const eosOptions = {
      broadcast: true,
      chainId: this.eosNetwork.chainId
    };

    this.eos = this.scatter.eos(this.eosNetwork, Eos, eosOptions, 'http');
  }

/**
* @description This function takes an array of players and returns a new array of
* players that have a game ID matching the current game ID (this.gameIndex).
* 
* @param { any[] } players - The `players` input parameter is an array of objects
* that represents the list of players who are participating/logged-in to the game.
* 
* @returns { any[] } The output returned by this function is an array of players
* that are currently playing the game with the specified `gameIndex`. The function
* uses `filter()` method to extract only the players who have the same `game_id` as
* the `gameIndex`.
*/
  private getCurrentGamePlayers(players: any[]): any[] {
/**
* @description This function filters the `players` array and returns a new array
* containing only the elements where the `game_id` property matches the value of `this.gameIndex`.
* 
* @param { object } item - In the context of the code snippet you provided:
* 
* 	- `item` is a single object element from the `players` array.
* 
* @param { number } index - The `index` parameter is the position of the current
* item within the array.
* 
* @param { array } origArray - The `origArray` parameter is optional and provides
* the original array that the callback function was called on.
* 
* @returns { object } The function takes an array of objects as input and returns a
* new array with only the objects that have a `game_id` property equal to the
* `this.gameIndex` variable. In other words , it filters out all the elements that
* don't match the expected game ID.
* 
* The output is a new array containing only the objects that passed the filtering
* test .
*/
    return players.filter((item, index, origArray) => {
      return item.game_id === this.gameIndex;
    });
  }

/**
* @description This function handles errors by taking an `error` parameter and
* converting it to a JSON object if it's a string. It then sets the `name` property
* of a new `Error` object based on the error code and type of error.
* 
* @param { object } error - The `error` input parameter is a JSON-parseable error
* message string that can contain an error code and additional metadata such as an
* error type.
* 
* @returns {  } The function `handleError` takes an `error` parameter and returns a
* new Error object with the `name` property set to a string indicating the type of
* error (e.g., "general_error", " authentication_error", etc.).
*/
  private handleError(error) {
    if (typeof(error) === 'string') {
      error = JSON.parse(error);
    }
    let name = 'general_error';
    if (error['code']) {
      const errorCode = error['code'];
      if (errorCode === 402 && error['type']) {
        name = error['type'];
      }
      if (errorCode === 500) {
        if (error['error'] && error['error']['name']) {
          name = error['error']['name'];
        }
      }
    }
    const scatterError = new Error('請求 Scatter 出錯');
    scatterError.name = name;
    return throwError(scatterError);
  }
}
