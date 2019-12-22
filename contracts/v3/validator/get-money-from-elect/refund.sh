#!/bin/bash

mkdir -p ../../bin
printf "\n\nEnter path to delegator's wallet. Example: ../../../wallets/2/wallet: " && read -r wallet_path
printf "\n\nEnter wallet seqno: " && read -r wallet_seqno
printf "\n\nEnter delegation_pool address: " && read -r delegation_pool_address
printf "\n\nEnter the amount provided for fee: " && read -r amount

fift -s refund-req.fif ../../bin/msg-body
sleep 1
fift -s ../send_with_body.fif $wallet_path $delegation_pool_address $wallet_seqno $amount ../../bin/msg-body ../../bin/wallet-query
sleep 1
sendfile ../../bin/wallet-query.boc

