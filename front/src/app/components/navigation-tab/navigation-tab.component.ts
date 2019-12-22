import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UpdatesService} from '../../services/updates.service';
import {of, timer} from 'rxjs';
import {delay, shareReplay, switchMap, take, tap} from 'rxjs/operators';
import {Router} from '@angular/router';

@Component({
    selector: 'app-navigation-tab',
    templateUrl: './navigation-tab.component.html',
    styleUrls: ['./navigation-tab.component.scss']
})
export class NavigationTabComponent implements OnInit {
    showReceive : boolean;
    showSend : boolean;
    updated : string = 'updated just now';
    @Output() messageEvent = new EventEmitter<boolean>();

    constructor( public upd : UpdatesService, public router : Router, ) {
        timer(0, 15000).pipe(
            switchMap(() => {
                this.update$();
                return of();
            }),
            shareReplay(1)
        ).subscribe();
    }

    ngOnInit() {
    }


    openModalSend() {
        this.messageEvent.emit(true);
    }
    openModalReceive() {
        this.messageEvent.emit(true);
    }

    // really run update: go to upd service
    update$() {
        this.upd.forceUpdate();
        return of(true).pipe(
            tap(() => this.updated = 'updating...'),
            delay(2000),
            tap(() => this.updated = 'updated just now'),
            take(1)
        ).subscribe();
    }

    receiveMessageFromReceive( $event ) {
        this.showReceive = $event;
        this.messageEvent.emit(false);
    }
    receiveMessageFromSend( $event ) {
        this.showSend = $event;
        this.messageEvent.emit(false);
    }
}
