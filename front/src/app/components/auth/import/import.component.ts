import {Component, OnDestroy, OnInit} from '@angular/core';
import {StorageService} from '../../../services/storage.service';
import {IAddress} from '../../../dto';
import {Router} from '@angular/router';
import {from, Subscription} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {wch} from '../../../constants';

@Component({
    selector: 'app-import',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss']
})
export class ImportComponent implements OnInit, OnDestroy {

    private_key : string;
    addresses : IAddress = {'fullAddress': '', 'shortAddress': '', 'nonBounceableAddress': ''};
    subOne : Subscription;
    subThree : Subscription;
    importGroup : FormGroup;

    constructor( private storage : StorageService, public router : Router, private fb : FormBuilder ) {
        this.createForm();
    }

    ngOnInit() {
    }

    createForm() {
        this.importGroup = this.fb.group({
            private_key: ['', Validators.required],
        });
    }

    tryImport( privateKey : string ) {
        try {
            const keyPair = (window as any).nacl.sign.keyPair.fromSeed((window as any).hexToBuffer(privateKey));
            const workchainId = wch.length === 3 ? '-1' : '0';
            this.subOne = from((window as any).wallet_creation_generate_external_message(keyPair, workchainId)).pipe(
                map(( x : any[] ) => {
                    const [contract_address, contract_boc] = x;
                    this.private_key = ((window as any).bufferToHex2(keyPair.secretKey)).substring(0, 64);
                    this.addresses.fullAddress = wch + contract_address;
                    const address = this.addresses;
                    this.createAccount(this.private_key, address, false);
                    return {contract_address, contract_boc};
                }),
                take(1)
            ).subscribe(( data ) => {
                this.subThree = (from((window as any).parseAddress(wch + data.contract_address))).pipe(
                    map(( x : any ) => {
                        const resp = x;
                        this.addresses.nonBounceableAddress = resp.nonBounceableAddress;
                        this.addresses.shortAddress = resp.shortAddress;
                        const [privateKey, address] = [this.private_key, this.addresses];
                        const boc = '';
                        const isInitted = resp.bounce;
                        this.storage.updateAccount({privateKey, address, boc, isInitted});
                        resp.bounce ? this.router.navigate(['/']) : this.router.navigate(['/create']);
                        return resp.bounce;
                    })).subscribe();
            });
        } catch (e) {
        }
    }

    createAccount( privateKey : string, address : IAddress, isInitted : boolean ) : boolean {
        const boc = '';
        return this.storage.setDataToAccount({privateKey, address, boc, isInitted}) ? true : false;
    }

    ngOnDestroy() {
        try {
            this.subOne.unsubscribe();
            this.subThree.unsubscribe();
        } catch (e) {

        }

    }

}
