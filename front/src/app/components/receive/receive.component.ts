import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {IAddress} from '../../dto';
import {StorageService} from '../../services/storage.service';
import {ClipboardService} from '../../services/clipboard.service';
import * as QRCode from 'easyqrcodejs';


@Component({
    selector: 'app-receive',
    templateUrl: './receive.component.html',
    styleUrls: ['./receive.component.scss']
})
export class ReceiveComponent implements OnInit, OnDestroy, AfterViewInit {
    address : IAddress;
    copyMessage = 'Copy to clipboard';
    close: boolean;
    @Output() messageEvent = new EventEmitter<boolean>();
    
    @ViewChild('qrcode', {static: false}) qrcode : ElementRef;

    constructor( public storage : StorageService,
                 public clipboard : ClipboardService ) {
    }

    closeModal() {
        this.messageEvent.emit(this.close)
    }

    ngAfterViewInit() {
        // Options
        const options = {
            text: 'ton://transfer/' + this.storage.getDataOfAccount().address.shortAddress,
            logo: '../../../assets/icons/gram.png',
            logoWidth: 50,
            logoHeight: 50,
            width: 200,
            height: 200
        };

        // Create new QRCode Object
        new QRCode(this.qrcode.nativeElement, options);
    }


    ngOnInit() {
    }

    copyAddress( address : string ) {
        this.clipboard.copyToClipboard(address);
        this.copyMessage = 'Copied ✔';
    }


    ngOnDestroy() {

    }


}
