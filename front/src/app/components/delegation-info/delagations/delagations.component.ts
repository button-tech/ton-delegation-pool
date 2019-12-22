import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {UpdatesService} from '../../../services/updates.service';
import {Observable, Subscription} from 'rxjs';
import {IDelegationPoolData} from '../../../dto';
import {Router} from '@angular/router';
import {Location} from '@angular/common';
import {LoadersCSS} from 'ngx-loaders-css';
import {map} from 'rxjs/operators';

@Component({
    selector: 'app-delagations',
    templateUrl: './delagations.component.html',
    styleUrls: ['./delagations.component.scss']
})
export class DelagationsComponent implements OnInit {
    show : boolean;
    data : Observable<IDelegationPoolData[]>;
    close : boolean;
    @Output() messageEvent = new EventEmitter<boolean>();
    loader : LoadersCSS = 'ball-pulse';
    bgColor = 'white';
    color = 'rgba(85,174,227,1)';

    subOne: Subscription;

    constructor(public upd : UpdatesService, public router : Router, public location : Location, ) {
        this.data = this.upd.getDelegationPoolList$().pipe(
            map((list: IDelegationPoolData[])=> {
                try {
                    console.log(list);
                    if(list && list.length > 0 && list[0].contractStatus !== '')
                        return list;
                    else {
                        return  [{
                            'minimalStake': 0,
                            'maximumStake': 0,
                            'lockTime': [0, 0],
                            'raisingDeadlineTime': 0,
                            'estimatedApr': 0,
                            'raisedAmount': 0,
                            'raisingAmount': 0,
                            'validatorFee': 0,
                            'contractStatus': 'Unknown',
                            'contractAddress': ''
                        }]
                    }
                }
                catch (e) {
                      return [{
                          'minimalStake': 0,
                          'maximumStake': 0,
                          'lockTime': [0, 0],
                          'raisingDeadlineTime': 0,
                          'estimatedApr': 0,
                          'raisedAmount': 0,
                          'raisingAmount': 0,
                          'validatorFee': 0,
                          'contractStatus': 'Unknown',
                          'contractAddress': ''
                      }]
                }
            }),
            map((list: IDelegationPoolData[]) => {
                return list.map((pool: IDelegationPoolData) => {
                    return pool;
                }).sort((a, b) => {
                    const timeDiff = b.raisingDeadlineTime - a.raisingDeadlineTime;
                    if (timeDiff !== 0) {
                        return timeDiff;
                    }

                    const raisingDiff = Number(b.raisingAmount) - Number(a.raisingAmount);
                    return raisingDiff !== 0
                        ? raisingDiff
                        : a.contractStatus > b.contractStatus ? 1 : -1;
                })
            }),
            
            
        );


    }


    ngOnInit() {

    }

    receiveMessage( $event ) {
        this.show = $event;
    }

    navigateTo( address : string ) {
        this.router.navigate(['/delegate/' + address]);
    }

    closeModal() {
        this.messageEvent.emit(this.close);
    }
}
