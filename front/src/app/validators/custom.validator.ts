import {Injectable} from '@angular/core';
import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {combineLatest, Observable, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap, take} from 'rxjs/operators';
import {UpdatesService} from '../services/updates.service';

export function isEmptyInputValue( value : any ) : boolean {
  // we don't check for string here so it also works with arrays
  return value === null || value === 0 || value.length === 0;
}

@Injectable({
  providedIn: 'root'
})
export class CustomValidator {
  constructor( private upd : UpdatesService ) {
  }

  customValidator( contractAddress : string ) : AsyncValidatorFn {

    return (
      control : AbstractControl
    ) : | Promise<{ [key : string] : boolean } | null> | Observable<{ [key : string] : boolean } | null> => {
      if (isEmptyInputValue(control.value)) {
        return of({balance: false});
      } else {
        return control.valueChanges.pipe(
          distinctUntilChanged(),
          debounceTime(1000),
          take(1),
          switchMap(( _ ) => {
            // todo: custom validators update
            // this.upd.getDelegationPoolData$(contractAddress)
            // check for min and max sums
            // does not work right now :(((
            //
            return combineLatest([this.upd.getBalanceByAddress$()]).pipe(
              switchMap(( x : any[] ) => {
                const [bal, data] = x;
                return [{'balance': bal, 'contract': data}];
              }),
              map(( x : any ) => {
                if (x.balance >= control.value) {
                  return {balance: true};
                } else {
                  return {balance: false};
                }
              })
            );
          })
        );
      }
    };

  }
}
