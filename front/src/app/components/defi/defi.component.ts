import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';

@Component({
    selector: 'app-defi',
    templateUrl: './defi.component.html',
    styleUrls: ['./defi.component.scss']
})
export class DefiComponent implements OnInit {
    show : boolean;

    constructor(public location: Location) {
    }

    ngOnInit() {
    }

    receiveMessage( $event ) {
        this.show = $event;
    }

    back() {}
}
