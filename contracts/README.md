# Delegation Pool Contract

Here you can find two versions of delegation pool contract
`v3` - basic delegation_pool
`v4` - delegation_pool with callbacks that allows to create sub-delegations pools and handle callbacks

## Installation

We use shortcuts:
**Fift**

```bash
liteclient-build/crypto/fift -I /usr/local/bin/ton/lite-client/crypto/fift/lib/
```

**Func**

```bash
liteclient-build/crypto/func -o outputFileWithFiftAsm.fif lite-client/crypto/smartcont/stdlib.fc
```

Create a new validator key pair in `validator-engine-console` following this steps: <https://test.ton.org/Validator-HOWTO.txt>

```bash
> newkey
created new key 663DC5289A26B5E5C5184B223421666BBB4D0A91FF60D436A3FE95CDF5833F06
> exportpub 663DC5289A26B5E5C5184B223421666BBB4D0A91FF60D436A3FE95CDF5833F06
got public key: xrQTSFcIKv6kmV2cu2aFgo4SYW8nqPS0g16Ox+xie07EeFfR
```

## Deploy contract

Catalog: `v3`
Run `mkdir -p bin` here to create a tmp folder for `.boc` files

1.Compile contract

```bash
func delegation_pool_v3.fc
```

2.Create `.boc`

```bash
fift -s delegation_pool.fif <validator-base64-public-key> <delegation-deadline-delta> [<savefile>]

example: fift -s delegation_pool.fif xrQTSFcIKv6kmV2cu2aFgo4SYW8nqPS0g16Ox+xie07EeFfR 3600 delegation-pool
(3600 seconds)
```

3.Send ~0.5 Grams to contract address and `.boc`

```bash
sendfile delegation-pool-query.boc
```

## Delegate

Catalog: `v3/delegators/delegate`

1.Build body message  

```bash
fift -s delegate-req.fif <path-to-wallet.pk> [<savefile>]

example: fift -s delegate-req.fif ../../../wallets/delegator1/wallet ../../bin/msg-body
```

2.Send external message with body to own wallet to redirect it to delegation pool

```bash
fift -s ../send_with_body.fif <wallet-path> <delegation-pool-address> <wallet-seqno> <amount> <message-path> <savefile>

example: fift -s ../send_with_body.fif ../../../wallets/delegator1/wallet kf-sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 108 .5  ../../bin/msg-body ../../bin/send-query
```

3.Send `.boc` to the network

```bash
sendfile ../../bin/send-query.boc
```

## Stake to elector contract on active alection id

0.Don't forget to `addtempkey`, `addvalidatoraddr`, `addpermkey`
(you can also see it on <https://test.ton.org/Validator-HOWTO.txt>)

Catalog: `v3/validator/stake-to-elect`

1.Compile message to sign by validator

```bash
fift -s validator-elect-req.fif <wallet-addr> <elect-utime> <max-factor> [adnl-addr]

example: fift -s validator-elect-req.fif kf-sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 1576995446 2.7 E54FD72A5DA0052E9CA4E7CCC5AF265BDF3B59FE4D18CD0A17C3E40646DE6751
```

2.Go to `validator-engine-console` and sign the message

```bash
sign <validator-private-key> <signing-message>

example: sign 663DC5289A26B5E5C5184B223421666BBB4D0A91FF60D436A3FE95CDF5833F06 654C50740160D4B300020000D4997143CFF04FCDF6EAF1EC09351A07D47ED76DA9C4EB7A66AEDC2E670456B2B0608226E96001BBBC08E352FD08EF83207D56AD46963A1968A0289C6F82F963
```

3.Build external message to own wallet to redirect it to delegation pool

```bash
fift -s validator-elect-signed.fif <wallet-addr> <elect-utime> <max-factor> <adnl-addr> <validator-pubkey> <validator-signature> [<savefile>]

example: fift -s validator-elect-signed.fif kf_sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 1576995446 2.7 E54FD72A5DA0052E9CA4E7CCC5AF265BDF3B59FE4D18CD0A17C3E40646DE6751 xrQTSFcIKv6kmV2cu2aFgo4SYW8nqPS0g16Ox+xie07EeFfR GUZr/gjNqXTBV0ZlDTwYC5F6pD9lcWZJfgBPXG4MjBXZzr5fWMo0QRodLGcz0i+feljEa7VSw0w4SAh/Kb/mDg== ../../bin/msg-body
```

4.Send external message with body to own wallet to redirect it to delegation pool

```bash
fift -s ../send_with_body.fif <wallet-path> <delegation-pool-address> <wallet-seqno> <amount> <message-path> <savefile>

example: fift -s ../send_with_body.fif ../../../wallets/validator/wallet kf-sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 30 1  ../../bin/msg-body ../../bin/send-query
```

5.Send `.boc` to the network

```bash
sendfile ../../bin/send-query.boc
```

## Withdraw Grams from elector contract to delegation pool

Catalog: `v3/validator/get-money-from-elect`

1.Build body message

```bash
fift -s refund-req.fif [<savefile>]

example: fift -s refund-req.fif ../../bin/msg-body
```

2.Send external message with body to own wallet to redirect it to delegation pool

```bash
fift -s ../send_with_body.fif <wallet-path> <delegation-pool-address> <wallet-seqno> <amount> <message-path> <savefile>

example: fift -s ../send_with_body.fif ../../../wallets/validator/wallet kf-sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 31 4  ../../bin/msg-body ../../bin/send-query
```

3.Send `.boc` to the network

```bash
sendfile ../../bin/send-query.boc
```

## Withdraw Grams from delegaion pool contract to delegator wallet

Catalog: `v3/delegators/withdraw`

1.Build body message

```bash
fift -s withdraw-req.fif [<savefile>]

example: fift -s withdraw-req.fif ../../bin/msg-body
```

2.Send external message with body to own wallet to redirect it to delegation pool

```bash
fift -s ../send_with_body.fif <wallet-path> <delegation-pool-address> <wallet-seqno> <amount> <message-path> <savefile>

example: fift -s ../send_with_body.fif ../../../wallets/delegator1/wallet kf-sKrxw_RzV_9Ia3NmpbGVl_HIx5OeKjO3Ok0_m7aVD9Tg8 110 1  ../../bin/msg-body ../../bin/send-query
```

3.Send `.boc` to the network

```bash
sendfile ../../bin/send-query.boc
```

Also you can look at `return-staked-amount` in case of validator didn't stake on time and `last-status` in case of validator can withdraw remaining funds after withdraw period
