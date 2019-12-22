import {Injectable} from '@angular/core';
import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap, take} from 'rxjs/operators';
import {UpdatesService} from '../services/updates.service';

export function isEmptyInputValue( value : any ) : boolean {
  // we don't check for string here so it also works with arrays
  return value === null || value === 0 || value.length === 0;
}

@Injectable({
  providedIn: 'root'
})
export class MaxbalanceValidator {
  constructor( public upd : UpdatesService ) {
  }

  maxBalanceValidator() : AsyncValidatorFn {

    return (
      control : AbstractControl
    ) : | Promise<{ [key : string] : boolean } | null> | Observable<{ [key : string] : boolean } | null> => {
      if (isEmptyInputValue(control.value)) {
        return of( {balance: false});
      } else {
        return control.valueChanges.pipe(
          distinctUntilChanged() ,
          debounceTime(1000),
          take(1),
          switchMap((_ =>
                this.upd.getBalanceByAddress$().pipe(
                  map(( bal : number ) => bal >= control.value ? {balance: true} : {balance: false})
                )
            )
          ));
      }
    };

  }
}
