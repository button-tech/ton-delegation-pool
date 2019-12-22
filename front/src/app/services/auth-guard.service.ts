import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor( public router : Router, private storage : StorageService ) {
  }

  canActivate() : boolean {
    if (this.storage.checkAccountOnSite() && this.storage.checkAccountIsInitted()) {
      return true;
    } else if (this.storage.checkAccountOnSite() && !this.storage.checkAccountIsInitted()) {
      this.router.navigate(['/create']);
      return false;
    } else {
      this.router.navigate(['/auth']);
      return false;
    }
  }
}
