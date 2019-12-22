import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {from, interval, of, Subscription} from 'rxjs';
import {map, shareReplay, take} from 'rxjs/operators';
import {StorageService} from '../../../services/storage.service';
import {Router} from '@angular/router';
import {IAddress} from '../../../dto';
import {ClipboardService} from '../../../services/clipboard.service';
import {wch} from '../../../constants';
import {LoadersCSS} from 'ngx-loaders-css';
import * as QRCode from 'easyqrcodejs';


@Component({
    selector: 'app-create',
    templateUrl: './create.component.html',
    styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('qrcodeShort', {static: false}) qrcodeShort : ElementRef;
    @ViewChild('qrcodeNonBouncable', {static: false}) qrcodeNonBouncable : ElementRef;
    @ViewChild('qrcodeFull', {static: false}) qrcodeFull : ElementRef;
    subOne : Subscription;
    subTwo : Subscription;
    subThree : Subscription;
    wasRendered: boolean;
    copyMessage = 'Copy to clipboard';
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';


    private_key : string;
    addresses : IAddress = {'fullAddress': '', 'shortAddress': '', 'nonBounceableAddress': ''};
    loaded : boolean;

    constructor( public storage : StorageService, private router : Router, public clipboard : ClipboardService ) {


        try {
            if (this.storage.getDataOfAccount().address.shortAddress.length > 0) {
                this.addresses.shortAddress = this.storage.getDataOfAccount().address.shortAddress;
                this.addresses.nonBounceableAddress = this.storage.getDataOfAccount().address.nonBounceableAddress;
            }
        } catch (e) {
        }

    }

    ngAfterViewInit() {
        // Options

    }

    renderQr() {
        if (!this.wasRendered) {


            const optionsqrcodeNonBouncable = {
                text: 'ton://transfer/' + this.addresses.nonBounceableAddress,
                logo: '../../../assets/icons/gram.png',
                logoWidth: 30,
                logoHeight: 30,
                width: 150,
                height: 150
            };

            const optionsqrcodeShort = {
                text: 'ton://transfer/' + this.addresses.shortAddress,
                logo: '../../../assets/icons/gram.png',
                logoWidth: 30,
                logoHeight: 30,
                width: 150,
                height: 150
            };

            const optionsqrcodeFull = {
                text: 'ton://transfer/' + this.addresses.fullAddress,
                logo: '../../../assets/icons/gram.png',
                logoWidth: 30,
                logoHeight: 30,
                width: 150,
                height: 150
            };


            // Create new QRCode Object
            new QRCode(this.qrcodeFull.nativeElement, optionsqrcodeFull);
            new QRCode(this.qrcodeShort.nativeElement, optionsqrcodeShort);
            new QRCode(this.qrcodeNonBouncable.nativeElement, optionsqrcodeNonBouncable);
            this.wasRendered = true;
        }
    }


    check() : boolean {
        try {
            if (this.storage.getDataOfAccount().address.shortAddress.length > 0 || this.storage.getDataOfAccount().address.fullAddress.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    ngOnInit() {
        let accountInit$;
        if (this.storage.checkAccountOnSite()) {
            const contract_boc = this.storage.getDataOfAccount().boc;
            let contract_address = this.storage.getDataOfAccount().address.fullAddress;
            this.addresses.fullAddress = contract_address;
            this.private_key = this.storage.getDataOfAccount().privateKey;
            wch.length === 3 ? contract_address = contract_address.substring(3, contract_address.length) :
                contract_address = contract_address.substring(2, contract_address.length);     // 2 for 0: and 3 for -1:
            accountInit$ = of({contract_address, contract_boc});
        } else {
            const keyPair = (window as any).nacl.sign.keyPair();
            const workchainId = wch.length === 3 ? '-1' : '0';
            accountInit$ = from((window as any).wallet_creation_generate_external_message(keyPair, workchainId)).pipe(
                map(( x : any[] ) => {
                    const [contract_address, contract_boc] = x;
                    this.private_key = ((window as any).bufferToHex2(keyPair.secretKey)).substring(0, 64);
                    this.addresses.fullAddress = wch + contract_address;
                    const address = this.addresses;
                    this.createAccount(this.private_key, address, contract_boc, false);
                    return {contract_address, contract_boc};
                }),
                take(1)
            );


        }


        accountInit$.subscribe(( data ) => {
            this.subTwo = interval(5000).subscribe(() => {
                this.subThree = from((window as any).parseAddress(wch + data.contract_address)).pipe(
                    map(( x : any ) => {
                        const resp = x;
                        this.addresses.nonBounceableAddress = resp.nonBounceableAddress;
                        this.addresses.shortAddress = resp.shortAddress;
                        this.renderQr();

                        this.loaded = true;
                        return resp.bounce;
                    }),
                    map(( x ) => {
                        if (x) {
                            const isInitted = true;
                            const boc = data.contract_boc;
                            const [privateKey, address] = [this.private_key, this.addresses];
                            (window as any).sendboc(data.contract_boc);
                            this.storage.updateAccount({privateKey, address, boc, isInitted});
                        }
                        return x;
                    }),
                    shareReplay(1)
                ).subscribe(( date ) => {
                    if (date) {
                        if (this.private_key.length !== 0) {
                            this.router.navigate(['/']);
                        }
                    }
                });
            });
        });

        this.subOne = accountInit$.subscribe();
    }

    createAccount( privateKey : string, address : IAddress, boc : string, isInitted : boolean ) {
        return this.storage.setDataToAccount({privateKey, address, boc, isInitted}) ? true : false;
    }

    ngOnDestroy() {
        try {
            this.subOne.unsubscribe();
            this.subTwo.unsubscribe();
            this.subThree.unsubscribe();
        }
        catch (e) {

        }
    }

    copyAddress( address : string ) {
        this.clipboard.copyToClipboard(address);
        this.copyMessage = 'Copied ✔';
    }

}
