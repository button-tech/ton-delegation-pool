import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {DelegationPageComponent} from './components/delegation-info/delagations/delegation-page/delegation-page.component';
import {NavigationTabComponent} from './components/navigation-tab/navigation-tab.component';
import {AuthComponent} from './components/auth/auth.component';
import {CreateComponent} from './components/auth/create/create.component';
import {ImportComponent} from './components/auth/import/import.component';
import {NgbButtonsModule} from '@ng-bootstrap/ng-bootstrap';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SatPopoverModule} from '@ncstate/sat-popover';
import {DelagationsComponent} from './components/delegation-info/delagations/delagations.component';
import {DisplayMessageComponent} from './components/display-message/display-message.component';
import {DisplayDataComponent} from './components/display-message/display-data/display-data.component';
import {NgxLoadersCssModule} from 'ngx-loaders-css';
import {UpdatesService} from './services/updates.service';
import {SendComponent} from './components/send/send.component';
import {ReceiveComponent} from './components/receive/receive.component';
import {ProductsComponent} from './components/products/products.component';
import {DefiComponent} from './components/defi/defi.component';
import {DelegationInfoComponent} from './components/delegation-info/delegation-info.component';
import {AddComponent} from './components/deploy/add_step_1/add.component';
import {DeployComponent} from './components/deploy/add_step_2/deploy.component';
import {SuccessDeployComponent} from './components/deploy/success-deploy/success-deploy.component';

@NgModule({
    declarations: [
        AppComponent,
        DelegationPageComponent,
        NavigationTabComponent,
        AuthComponent,
        CreateComponent,
        ImportComponent,
        DelagationsComponent,
        DisplayMessageComponent,
        DisplayDataComponent,
        SendComponent,
        ReceiveComponent,
        ProductsComponent,
        DefiComponent,
        DelegationInfoComponent,
        AddComponent,
        DeployComponent,
        SuccessDeployComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        NgbButtonsModule,
        ReactiveFormsModule,
        MatIconModule,
        BrowserAnimationsModule,
        SatPopoverModule,
        NgxLoadersCssModule
    ],
    providers: [UpdatesService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
