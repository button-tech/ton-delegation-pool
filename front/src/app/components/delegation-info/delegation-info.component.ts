import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Location} from '@angular/common';

@Component({
    selector: 'app-delegation-info',
    templateUrl: './delegation-info.component.html',
    styleUrls: ['./delegation-info.component.scss']
})
export class DelegationInfoComponent implements OnInit {
    show : boolean;
    showAllPool: boolean;
    @Output() messageEvent = new EventEmitter<boolean>();
    constructor(public location: Location) {
    }

    ngOnInit() {
    }

    receiveMessage( $event ) {
        this.show = $event;
    }

    showAllPools() {
        this.show = true;
        this.showAllPool = true;
    }

    receiveMessageFromAllLists($event) {
        this.show = $event;
        this.showAllPool = false;
        this.messageEvent.emit(false);
    }

}
