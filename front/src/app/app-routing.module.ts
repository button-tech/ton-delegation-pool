import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DelegationPageComponent} from './components/delegation-info/delagations/delegation-page/delegation-page.component';
import {AuthComponent} from './components/auth/auth.component';
import {CreateComponent} from './components/auth/create/create.component';
import {AuthGuardService as AuthGuard} from './services/auth-guard.service';
import {ImportComponent} from './components/auth/import/import.component';
import {DisplayMessageComponent} from './components/display-message/display-message.component';
import {DisplayDataComponent} from './components/display-message/display-data/display-data.component';
import {ProductsComponent} from './components/products/products.component';
import {DefiComponent} from './components/defi/defi.component';
import {DelegationInfoComponent} from './components/delegation-info/delegation-info.component';
import {DelagationsComponent} from './components/delegation-info/delagations/delagations.component';
import {AddComponent} from './components/deploy/add_step_1/add.component';
import {DeployComponent} from './components/deploy/add_step_2/deploy.component';
import {SuccessDeployComponent} from './components/deploy/success-deploy/success-deploy.component';

const routes : Routes = [
    {
        path: '',
        redirectTo: '/main',
        pathMatch: 'full',
    }, {
        path: 'delegate/:address',
        component: DelegationPageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'pk',
        component: DisplayDataComponent
    },
    {
        path: 'message/:messageFrom',
        component: DisplayMessageComponent
    },
    {
        path: 'message/:messageFrom',
        component: DisplayMessageComponent
    },
    {
        path: 'add',
        component: AddComponent ,
        canActivate: [AuthGuard]
    },
    {
        path: 'add/send',
        component: DeployComponent,
        canActivate: [AuthGuard]
    },

    {
        path: 'auth',
        component: AuthComponent
    },
    {
        path: 'create',
        component: CreateComponent
    },
    {
        path: 'import',
        component: ImportComponent
    },
    {
        path: 'main',
        component: ProductsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'delegation',
        component: DelegationInfoComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'success',
        component: SuccessDeployComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'pools',
        component: DelagationsComponent,
        canActivate: [AuthGuard]
    },

    {
        path: 'defi',
        component: DefiComponent,
        canActivate: [AuthGuard]
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
