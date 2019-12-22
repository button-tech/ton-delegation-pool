import { Component, OnInit } from '@angular/core';
import {StorageService} from '../../../services/storage.service';
import {ClipboardService} from '../../../services/clipboard.service';

@Component({
  selector: 'app-display-data',
  templateUrl: './display-data.component.html',
  styleUrls: ['./display-data.component.scss']
})
export class DisplayDataComponent implements OnInit {

  copyMessage = 'Copy to clipboard';

  constructor(public storage: StorageService, public clipboard: ClipboardService) { }

  ngOnInit() {
  }

  copyAddress(address: string) {
    this.clipboard.copyToClipboard(address);
    this.copyMessage = 'Copied ✔';
  }

}
