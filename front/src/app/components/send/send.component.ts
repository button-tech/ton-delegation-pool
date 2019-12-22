import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {LoadersCSS} from 'ngx-loaders-css';
import {IAddress} from '../../dto';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WalletService} from '../../services/wallet.service';
import {UpdatesService} from '../../services/updates.service';
import {HttpClient} from '@angular/common/http';
import {MaxbalanceValidator} from '../../validators/maxbalance.validator';
import {StorageService} from '../../services/storage.service';
import {from, Observable, of} from 'rxjs';
import {map, take} from 'rxjs/operators';

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {

    close : boolean;
    @Output() messageEvent = new EventEmitter<boolean>();
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';
    privateKey : string;
    address : IAddress;
    publicKey : string;
    angForm : FormGroup;
    showLoader : boolean;

    constructor( private wallet : WalletService,
                 public upd : UpdatesService,
                 private http : HttpClient,
                 private fb : FormBuilder,
                 private maxBalanceValidator : MaxbalanceValidator,
                 public storage : StorageService ) {
        this.createForm();
    }

    closeModal() {
        this.messageEvent.emit(this.close);
    }

    createForm() {
        this.angForm = this.fb.group({
            address: ['', Validators.required, this.AgeValidator],
            amount: [null, {validators: [Validators.required], asyncValidators: [this.maxBalanceValidator.maxBalanceValidator()]}],
            comment: ['']
        });
    }

    ngOnInit() {
    }


    toggleLoader() {
        this.showLoader = !this.showLoader;
    }

    clean() {
        this.angForm.reset();
    }

    async sendTransaction( addr, amount ) {
        this.toggleLoader();
        of('').pipe((
            take(1)
        )).subscribe(() => {
            from(this.wallet.sendTransaction(addr, amount)).pipe(
                map(() => {
                    this.clean();
                }),
                take(1)
            ).subscribe(() => {
                this.toggleLoader();
                this.closeModal()
            });
        });


    }

    AgeValidator( control : AbstractControl ) : Observable<{ [key : string] : boolean }> | null {
        if (control.value === 0 || control.value === null) {
            return of({'age': true});
        }
        if (control.value.length > 0) {
            let result;
            if (control.value.indexOf(':') !== -1) {
                const [wc, hexAddress] = control.value.split(':');
                result = !((wc === '0' || wc === '-1') && hexAddress.length !== 64);
            } else {
                result =
                    (control.value.indexOf('k') === 0 ||
                        control.value.indexOf('0') || control.value.indexOf('E')
                        || control.value.indexOf('P'))
                    && control.value.length === 48;
            }
            // must be rewrite with all restrictions later
            return of({'age': result});
        }
        return null;
    }
}
