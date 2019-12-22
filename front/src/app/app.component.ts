import {Component} from '@angular/core';
import {AuthGuardService} from './services/auth-guard.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public auth: AuthGuardService) {

  }
}
