import {Injectable} from '@angular/core';
import {combineLatest, Observable, of, Subject, Subscription, timer} from 'rxjs';
import {IBalance, IContractPoolResponse, IDelegationPoolData, IFinalRequest} from '../dto';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {StorageService} from './storage.service';
import {environment} from '../../environments/environment';

const default_PoolRaisedSum = {'amount': 0};

@Injectable({
    providedIn: 'root'
})
export class UpdatesService {
    subjectForForcingBalanceUpdate$ = new Subject<any>();
    balanceOfWallet$ : Observable<number>;
    subscriptionToBalance : Subscription;
    url : string;

    constructor( private http : HttpClient, private storage : StorageService ) {
        this.url = environment.url;
        const timerTwoSeconds$ = timer(0, 2000);

        this.balanceOfWallet$ = combineLatest([timerTwoSeconds$, this.subjectForForcingBalanceUpdate$]).pipe(
            switchMap(() => this.getBalanceByAddress$()),
            shareReplay(1)
        );
        this.subscriptionToBalance = this.balanceOfWallet$.subscribe();
    }

    forceUpdate() {
        this.subjectForForcingBalanceUpdate$.next('');
    }

    getBalanceByAddress$() : Observable<number> {
        const url = this.url + '/getBalance/';
        let myAddress;
        try {
            myAddress = this.storage.getDataOfAccount().address.nonBounceableAddress;
        } catch (e) {
            myAddress = '';
        }
        return !myAddress ? of(0) : this.http.get(url + myAddress).pipe(
            map(( x : IBalance ) => {
                return x.balance / 1000000000;
            }),
            shareReplay(1)
        );

    }

    getDelegationPoolData$( address : string ) : Observable<IDelegationPoolData> {
        const url = this.url + '/contractInfo/' + address;

        return timer(0, 25000).pipe(
            switchMap(() => {
                return this.http.get(url).pipe(
                    map(( x : any ) => {
                        if (x.result.length === 0) {
                            //  minimalStake: number;         //
                            //   maximumStake: number;         //
                            //   lockTime: number;
                            //   raisingDeadlineTime: number;   //
                            //   estimatedApr: number;         //
                            //   raisedAmount: number;
                            //   raisingAmount: number;       //
                            //   validatorFee: number;         //
                            //   contractStatus: string
                            //   contractAddress: string       //
                            return [{
                                'minimalStake': 0,
                                'maximumStake': 0,
                                'lockTime': 0,
                                'raisingDeadlineTime': 0,
                                'estimatedApr': 0,
                                'raisedAmount': 0,
                                'raisingAmount': 0,
                                'validatorFee': 0,
                                'contractStatus': 'Unknown',
                                'contractAddress': ''
                            }];
                        }
                        return x.result;
                    }));
            }),
            // @ts-ignore
            catchError(( x ) => {
                if (x.status !== 200) {
                    return [{
                        'minimalStake': 0,
                        'maximumStake': 0,
                        'lockTime': 0,
                        'raisingDeadlineTime': 0,
                        'estimatedApr': 0,
                        'raisedAmount': 0,
                        'raisingAmount': 0,
                        'validatorFee': 0,
                        'contractStatus': 'Unknown',
                        'contractAddress': ''
                    }];
                }
            }),
            shareReplay(1)
        );
    }

    getDelegationPoolList$() : Observable<IDelegationPoolData[]> {
        const url = this.url + '/contractsList';
        return timer(0, 10000).pipe(
            switchMap(( x : any ) => {
                return this.http.get(url).pipe(
                    switchMap(( x : any ) => {
                        return [x];
                    }),
                    map(( x : any ) => {
                        if (!x.result) {
                            return [{
                                'minimalStake': 0,
                                'maximumStake': 0,
                                'lockTime': [0, 0],
                                'raisingDeadlineTime': 0,
                                'estimatedApr': 0,
                                'raisedAmount': 0,
                                'raisingAmount': 0,
                                'validatorFee': 0,
                                'contractStatus': 'Unknown',
                                'contractAddress': 'Unknown'
                            }];
                        }
                        if (x.result.length === 0) {
                            return [{
                                'minimalStake': 0,
                                'maximumStake': 0,
                                'lockTime': [0, 0],
                                'raisingDeadlineTime': 0,
                                'estimatedApr': 0,
                                'raisedAmount': 0,
                                'raisingAmount': 0,
                                'validatorFee': 0,
                                'contractStatus': 'Unknown',
                                'contractAddress': 'Unknown'
                            }];
                        }
                        return x.result;
                    }),
                    catchError(( e ) => {
                        return ([{
                            'minimalStake': 0,
                            'maximumStake': 0,
                            'lockTime': [0, 0],
                            'raisingDeadlineTime': 0,
                            'estimatedApr': 0,
                            'raisedAmount': 0,
                            'raisingAmount': 0,
                            'validatorFee': 0,
                            'contractStatus': 'Unknown',
                            'contractAddress': 'Unknown'
                        }]);
                    }));
            })
        );
    }

    getDelegationPoolRaisedSum$( addrTo, addrFrom ) : Observable<number> {
        const url = this.url + '/depositInfo/' + addrTo + '/' + addrFrom;
        return timer(0, 10000).pipe(
            switchMap(() => {
                return this.http.get(url).pipe(
                    map(( x : any ) => {
                        return x.sended / 1000000000;
                    })
                );
            }),
            shareReplay(1)
        );
    }

    getWithdrawData( addrTo, addrFrom ) : Observable<number> {
        const url = this.url + '/withdrawal/' + addrTo + '/' + addrFrom;
        return timer(0, 10000).pipe(
            switchMap(() => {
                return this.http.get(url).pipe(
                    map(( x : any ) => {
                        return x.amount / 1000000000;
                    })
                );
            }),
            shareReplay(1)
        );
    }

    checkOriginalPub( pubKey ) : Observable<boolean> {
        const url = this.url + '/contractCheck';
        const body = {
          'value': pubKey
        };
        return this.http.post(url, body).pipe(
            map(( x : any ) => {
                return x.result;
            })
        );


    }


    deployNewContract( contract : any ) : Observable<IContractPoolResponse> {
        const url = this.url + '/createDelegationPool';
        return this.http.post(url, contract).pipe(
            map(( response : IContractPoolResponse ) => response)
        );
    }

    checkInitted( address : string ) : Observable<boolean> {
        const url = this.url + '/activateCheck/' + address;
        return this.http.get(url).pipe(
            map(( resp : any ) => {
                if (resp && resp.result) {
                    return resp.result;
                } else {
                    return false;
                }
            })
        );
    }

    successDeployementPing( body : IFinalRequest ) : Observable<boolean> {
        const url = this.url + '/addDelegationPool';
        return this.http.post(url, JSON.stringify(body)).pipe(
            map(( resp : any ) => {
                if (resp && resp.result) {
                    return resp.result;
                } else {
                    return false;
                }
            })
        );
    }

}
