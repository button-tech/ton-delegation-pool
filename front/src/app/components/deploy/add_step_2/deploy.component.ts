import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoadersCSS} from 'ngx-loaders-css';
import {StorageService} from '../../../services/storage.service';
import {UpdatesService} from '../../../services/updates.service';
import {Router} from '@angular/router';
import {from, interval, Subscription} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {IDelegationContract} from '../../../dto';
import {WalletService} from '../../../services/wallet.service';

@Component({
    selector: 'app-deploy',
    templateUrl: './deploy.component.html',
    styleUrls: ['./deploy.component.scss']
})
export class DeployComponent implements OnInit, OnDestroy {
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';
    show : boolean;
    contractInfo : IDelegationContract;
    erroBal : boolean;
    wasSent : boolean;

    subOne : Subscription;
    subTwo : Subscription;
    subThree : Subscription;
    subFour : Subscription;

    constructor( private storage : StorageService,
                 private upd : UpdatesService,
                 private router : Router,
                 private wallet : WalletService ) {
        const isContractCreated = this.storage.checkContract();
        const transactionWasSent = this.storage.getSended();
        if (!isContractCreated) {
            this.router.navigate(['/add']);
        }
        this.contractInfo = this.storage.getContract();

        if (transactionWasSent) {
            this.wasSent = transactionWasSent;
            this.listen();
        }

        this.subOne = this.upd.balanceOfWallet$.pipe(
            map(( bal ) => {
                if (bal >= 1.05) {
                    this.erroBal = true;
                }
            })
        ).subscribe();
    }

    ngOnInit() {
    }

    receiveMessage( $event ) {
        this.show = $event;
    }


    listen() {
        this.subTwo = interval(5000).subscribe(() => {
            from((window as any).sendboc(this.contractInfo.boc)).pipe(take(1)).subscribe();
        });
        this.subThree = interval(5000).subscribe(() => {
            this.subFour = this.upd.checkInitted(this.contractInfo.contractAddress).pipe(
                map(( resp : boolean ) => {
                    if (resp) {
                        const contractAddress = this.contractInfo.contractAddress;
                        const minimalStake = this.contractInfo.minimalStake;
                        const raisingAmount = this.contractInfo.raisingAmount;
                        const validatorPubKey = this.contractInfo.validatorPubKey;
                        const delegationDeadlineDelta = this.contractInfo.delegationDeadlineDelta;
                        this.upd.successDeployementPing({
                            contractAddress,
                            minimalStake,
                            raisingAmount,
                            validatorPubKey,
                            delegationDeadlineDelta
                        }).pipe(
                            map(( resp : boolean ) => resp),
                            take(1)
                        ).subscribe(( result ) => {
                            if (result) {
                                this.storage.setContractOld(contractAddress);
                                this.storage.clearContractLogs();
                                this.storage.clearSended();
                                this.router.navigate(['/success']);
                            }
                        });
                    }
                })
            ).subscribe();
        });
    }

    send() {
        from(this.wallet.sendTransaction(this.contractInfo.contractAddress, 1)).subscribe(() => {
            this.wasSent = true;
            this.storage.setSended(true);
            this.listen();
        });
    }

    ngOnDestroy() {
        this.subOne.unsubscribe();

        try {
            this.subTwo.unsubscribe();
            this.subThree.unsubscribe();
            this.subFour.unsubscribe();
        } catch (e) {

        }
    }
}
