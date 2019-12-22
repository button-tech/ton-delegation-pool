#!/bin/bash

mkdir -p ../../bin
printf "\n\nEnter path to delegator's wallet. Example: ../../../wallets/2/wallet: " && read -r wallet_path
printf "\n\nEnter wallet seqno: " && read -r wallet_seqno
printf "\n\nEnter delegation_pool address: " && read -r delegation_pool_address
printf "\n\nEnter the amount provided for fee: " && read -r amount

/usr/local/bin/ton/liteclient-build/crypto/fift -I /usr/local/bin/ton/lite-client/crypto/fift/lib/ -s return-staked-amount-req.fif $wallet_path ../../bin/msg-body
sleep 1
/usr/local/bin/ton/liteclient-build/crypto/fift -I /usr/local/bin/ton/lite-client/crypto/fift/lib/ -s ../send_with_body.fif $wallet_path $delegation_pool_address $wallet_seqno $amount ../../bin/msg-body ../../bin/wallet-query
sleep 1
../../../../cli_commands/sendfile.sh ../../bin/wallet-query.boc