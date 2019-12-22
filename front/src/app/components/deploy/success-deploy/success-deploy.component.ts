import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../services/storage.service';
import {ClipboardService} from '../../../services/clipboard.service';

@Component({
  selector: 'app-success-deploy',
  templateUrl: './success-deploy.component.html',
  styleUrls: ['./success-deploy.component.scss']
})
export class SuccessDeployComponent implements OnInit {
  show : boolean;
  contractAddress : string;
  copyMessage = 'Copy to clipboard';
  constructor(private storage: StorageService,public clipboard: ClipboardService) {
    try {
      this.contractAddress = this.storage.getContractOld();
    } catch (e) {

    }

  }

  copyAddress(address: string) {
    this.clipboard.copyToClipboard(address);
    this.copyMessage = 'Copied ✔';
  }

  ngOnInit() {
  }
  receiveMessage( $event ) {
    this.show = $event;
  }

  openNewTab(addr) {
    const url = 'https://test.ton.org/testnet/account?account=' +addr;
    window.open(url, "_blank");
  }

}
