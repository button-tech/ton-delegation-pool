import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {LoadersCSS} from 'ngx-loaders-css';
import {Location} from '@angular/common';
import {StorageService} from '../../../services/storage.service';
import {map, take} from 'rxjs/operators';
import {IContractPoolResponse} from '../../../dto';
import {UpdatesService} from '../../../services/updates.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-add',
    templateUrl: './add.component.html',
    styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnInit {
    show : boolean;
    angForm : FormGroup;
    showLoader : boolean;
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';
    invalid: boolean;

    constructor( private fb : FormBuilder,
                 public location : Location,
                 private storage : StorageService,
                 private upd : UpdatesService,
                 private router: Router) {

        const isContractCreated = this.storage.checkContract();
        if (isContractCreated) {
            this.router.navigate(['/add/send'])
        }

        this.createForm();
    }

    createForm() {
        this.angForm = this.fb.group({
            address: ['', Validators.required, this.AgeValidator],
            minimalStake: [null, [Validators.required, Validators.min(1)]],
            raisingAmount:  [null, [Validators.required, Validators.min(10001)]],
            delegationDeadlineDelta: [null, [Validators.required, Validators.min(1)]],
        });
    }

    ngOnInit() {
    }

    receiveMessage( $event ) {
        this.show = $event;
    }


    AgeValidator( control : AbstractControl ) : Observable<{ [key : string] : boolean }> | null {
        if (control.value === 0 || control.value === null) {
            return of({'age': true});
        }
        let result = false;
        if (control.value.length > 0 && control.value[0] === 'x') {
            control.value.length === 48 ? result = true : result = false;
        }
        // must be rewrite with all restrictions later
        return of({'age': result});
    }

    createContract( minimalStake, raisingAmount, validatorPubKey, delegationDeadlineDelta ) {
        this.upd.checkOriginalPub(validatorPubKey).pipe(
            map((resp) => {
                this.invalid = resp;
                if(!resp) {
                    this.deployContract( minimalStake, raisingAmount, validatorPubKey, delegationDeadlineDelta)
                }
            }),
            take(1)
        ).subscribe()
    }


    deployContract(minimalStake, raisingAmount, validatorPubKey, delegationDeadlineDelta) {
        let boc = '';
        let contractAddress = '';
        this.upd.deployNewContract({ validatorPubKey, delegationDeadlineDelta}).pipe(
            map(( response : IContractPoolResponse ) => {
                contractAddress = response.contractAddress;
                boc = response.hexBoc;
                this.storage.createContract({minimalStake, raisingAmount, validatorPubKey, delegationDeadlineDelta, boc, contractAddress});
            }), take(1)
        ).subscribe(() => {
            this.router.navigate(['/add/send'])
        });
    }

}
