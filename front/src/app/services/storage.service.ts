import {Injectable} from '@angular/core';
import {IAccount, IDelegationContract} from '../dto';

const default_storage = {'privateKey': '', 'address': '', 'isInitted': false};

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor() {
    }

    checkAccountOnSite() : boolean {
        try {
            const data : IAccount = JSON.parse(localStorage.getItem('data'));
            if (data.privateKey.length > 0) {
                return true;
            }

        } catch (e) {
            return false;
        }
    }

    checkAccountIsInitted() : boolean {
        try {
            const data : IAccount = JSON.parse(localStorage.getItem('data'));
            return data.isInitted;
        } catch (e) {
            return false;
        }
    }

    getDataOfAccount() : IAccount {
        return JSON.parse(localStorage.getItem('data'));
    }

    setDataToAccount( data : IAccount ) : boolean {
        if (!this.checkAccountOnSite()) {
            localStorage.setItem('data', JSON.stringify(data));
            return true;
        }
        return false;
    }

    updateAccount( data : IAccount ) : boolean {
        try {
            localStorage.setItem('data', JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    }

    deleteAccount() : boolean {
        localStorage.removeItem('data');
        return true;
    }

    catch( e ) {
        return false;
    }

    checkContract() : boolean {
        let contract;
        try {
            contract = JSON.parse(localStorage.getItem('contract'));
            if (contract.boc.length > 0) {
                return true;
            }
        } catch (e) {
            return false;
        }
    }

    createContract( contract : IDelegationContract ) : boolean {
        if (this.checkContract) {
            try {
                localStorage.setItem('contract', JSON.stringify(contract));
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }

    getContract() : IDelegationContract {
        if (this.checkContract) {
            return JSON.parse(localStorage.getItem('contract'));
        } else {
            return {
                'minimalStake': 0,
                'raisingAmount': 0,
                'validatorPubKey': '',
                'delegationDeadlineDelta': 0,
                'boc': '',
                'contractAddress': ''
            };
        }
    }

    clearContractLogs() {
        localStorage.removeItem('contract');
    }

    setSended(val: boolean) {
        const obj = {'sended': val};
        localStorage.setItem('wasSended', JSON.stringify(obj));
    }

    getSended(): boolean {
        try {
            const obj = localStorage.getItem('wasSended');
            return JSON.parse(obj).sended;
        }   catch (e) {
            return false
        }
    }
    clearSended() {
        localStorage.removeItem('wasSended');
    }

    setContractOld(contract: string) {
       localStorage.setItem('created_contract', contract);
    }

    getContractOld(): string {
        return localStorage.getItem('created_contract');
    }

}
