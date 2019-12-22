export interface IBalance {
  balance: number;
}

export interface IDelegationPoolData {
  minimalStake: number;         //
  maximumStake: number;         //
  lockTime: number[];
  raisingDeadlineTime: number;   //
  estimatedApr: number;         //
  raisedAmount: number;
  raisingAmount: number;       //
  validatorFee: number;         //
  contractStatus: string;
  contractAddress: string;       //
}

export interface IDelegationPoolRaisedSum {
  amount: number;
}

export interface IAddress {
  nonBounceableAddress: string;
  shortAddress: string;
  fullAddress: string;
}

export interface IAccount {
  privateKey: string;
  address: IAddress;
  boc: string;
  isInitted: boolean;
}

export interface IDelegationContract {
  minimalStake: number;
  raisingAmount: number;
  validatorPubKey: string;
  delegationDeadlineDelta: number;
  boc: string;
  contractAddress: string;
}


export interface IContractPoolResponse {
  contractAddress: string;
  hexBoc: string;
}

export interface IFinalRequest {
  minimalStake: number;
  raisingAmount: number;
  validatorPubKey: string;
  delegationDeadlineDelta: number;
  contractAddress: string;
}
