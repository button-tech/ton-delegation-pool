import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {StorageService} from '../../services/storage.service';

@Component({
    selector: 'app-display-message',
    templateUrl: './display-message.component.html',
    styleUrls: ['./display-message.component.scss']
})
export class DisplayMessageComponent implements OnInit {

    messageFrom : string;

    constructor( public location : Location, activatedRoute : ActivatedRoute, public storage : StorageService, public router : Router ) {
        this.messageFrom = activatedRoute.snapshot.params.messageFrom;
    }

    ngOnInit() {
    }

    back() {
        this.location.back();
    }

    execute() {
        if (this.messageFrom === 'delete') {
            this.storage.deleteAccount();
            this.router.navigate(['/auth']);
        } else if (this.messageFrom === 'private') {
            this.router.navigate(['/pk']);
        }
    }
}
