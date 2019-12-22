import {Component, OnInit} from '@angular/core';
import {UpdatesService} from '../../../../services/updates.service';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {IDelegationPoolData} from '../../../../dto';
import {take, tap} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomValidator} from '../../../../validators/custom.validator';
import {WalletService} from '../../../../services/wallet.service';
import {LoadersCSS} from 'ngx-loaders-css';
import {Location} from '@angular/common';
import {StorageService} from '../../../../services/storage.service';
import {ClipboardService} from '../../../../services/clipboard.service';

@Component({
    selector: 'app-delegation-page',
    templateUrl: './delegation-page.component.html',
    styleUrls: ['./delegation-page.component.scss']
})
export class DelegationPageComponent implements OnInit {
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';
    contractAddress : string;
    estimatedGrams : BehaviorSubject<string> = new BehaviorSubject<string>('');
    data : Observable<IDelegationPoolData>;
    angForm : FormGroup;
    showLoader : boolean;
    delegatedSum : Observable<number>;
    withDrawSum : Observable<number>;
    copyMessage = 'Copy to clipboard';
    constructor( public upd : UpdatesService,
                 activatedRoute : ActivatedRoute,
                 private fb : FormBuilder,
                 private customValidator : CustomValidator,
                 public wallet : WalletService,
                 public location : Location,
                 public storage : StorageService,
                 public router : Router,
                 public clipboard: ClipboardService) {

        this.contractAddress = activatedRoute.snapshot.params.address;
        this.data = this.upd.getDelegationPoolData$(this.contractAddress);
        this.delegatedSum = this.upd.getDelegationPoolRaisedSum$(this.contractAddress, this.storage.getDataOfAccount().address.shortAddress);
        this.withDrawSum = this.upd.getWithdrawData(this.contractAddress, this.storage.getDataOfAccount().address.shortAddress);
        this.createForm();

        const isValid = this.validateAddress(this.contractAddress);
        if (!isValid) {
            this.router.navigate(['/']);
        }

    }

    openNewTab(addr) {
        const url = 'https://test.ton.org/testnet/account?account=' +addr;
        window.open(url, "_blank");
    }

    ngOnInit() {

    }

    toggleLoader() {
        this.showLoader = !this.showLoader;
    }

    back() {
        this.location.back();
    }

    copyAddress(address: string) {
        this.clipboard.copyToClipboard(address);
        this.copyMessage = 'Copied ✔';
    }

    checkCurrentDeadline( data : number[] ) {
        if (data[0] / (60 * 60 * 24) < 0) {
            if (data[1] / (60 * 60 * 24) < 1 && data[1] / (60 * 60 * 24) > 0) {
                return (data[1] / (60 * 60)).toFixed(2) + ' hours';
            } else if (data[1] > 0) {
                return (data[1] / (60 * 60 * 24)).toFixed(2) + ' days';
            } else {
                return 'finished';
            }
        } else {
            if (data[0] / (60 * 60 * 24) < 1) {
                return (data[0] / (60 * 60)).toFixed(2) + ' hours or ' + (data[1] / (60 * 60 * 24)).toFixed(2) + ' days';
            } else {
                return (data[0] / (60 * 60 * 24)).toFixed(2) + ' days or ' + (data[1] / (60 * 60 * 24)).toFixed(2) + ' days';
            }
        }


    }

    checkIfinished( data : number ) {
        if (data / (60 * 60 * 24) > 1) {
            return (data / (60 * 60 * 24)).toFixed(2) + ' days';
        } else if (data / (60 * 60 * 24) < 1 && data / (60 * 60 * 24) > 0) {
            return (data / (60 * 60)).toFixed(2) + ' hours';
        } else {
            return 'finished';
        }
    }

    createForm() {
        this.angForm = this.fb.group({
            amount: [null, {
                validators: [Validators.required],
                asyncValidators: [this.customValidator.customValidator(this.contractAddress)]
            }]
        });
    }

    calculateEstimated( amount : number ) {
        this.data.pipe(
            tap(( x ) => {
                const spr = x.estimatedApr / 100;
                if (isNaN(Number(((amount * (spr + 1)) / 12).toFixed(4)))) {
                    this.estimatedGrams.next('');
                } else {
                    this.estimatedGrams.next(((amount * (spr + 1)) / 12).toFixed(4));
                }
            }),
            take(1)
        ).subscribe();

    }

    async delegate() {
        await this.toggleLoader();
        await (window as any).send(this.storage.getDataOfAccount().privateKey, this.contractAddress, Number(this.angForm.controls['amount'].value), '-1', 'delegate');
        await this.clean();
        await this.sleep(5000);
        await this.toggleLoader();
    }

    async withdraw() {
        await this.toggleLoader();
        await (window as any).send(this.storage.getDataOfAccount().privateKey, this.contractAddress, 0.2, '-1', 'withdraw');
        await this.sleep(5000);
        await this.toggleLoader();
    }

    clean() {
        this.angForm.reset();
    }

    validateAddress( addr : string ) : boolean {
        let result;
        if (addr.length === 0) {
            return false;
        }

        if (addr.indexOf(':') !== -1) {
            const [wc, hexAddress] = addr.split(':');
            result = !((wc === '0' || wc === '-1') && hexAddress.length !== 64);
        } else {
            result =
                (addr.indexOf('k') === 0 ||
                    addr.indexOf('0') || addr.indexOf('E')
                    || addr.indexOf('P'))
                && addr.length === 48;
        }
        return result;
    }

    sleep( ms ) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    // delegate(address, amount) {
    //   this.toggleLoader();
    //
    //   of('').pipe((
    //       take(1)
    //   )).subscribe(() => {
    //     of('').pipe(
    //         map(()=> 'x'),
    //         delay(2000),
    //         take(1)
    //     ).subscribe((d) => {
    //       this.toggleLoader();
    //     });
    //   });
    //   // this.wallet.delegateFunds(address, amount);
    // }


}
