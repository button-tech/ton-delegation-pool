### Install

```
npm i
```

### Running 

We need https://github.com/button-tech/ton-delegation-pool/api to be working together with it.

By default it is url = http://127.0.0.1:3000 at folders:

https://github.com/button-tech/ton-delegation-pool/tree/master/front/src/environments

And

https://github.com/button-tech/ton-delegation-pool/blob/master/front/src/assets/ton/index.js

##### You will need to change it to your link if you are running it without docker-compose

### Third party

We use third party libriary that allows as to sign and generate boc on frontend. 

We add some features to it:

1. Masterchain support and default 
2. Our smart contract deploy
3. Using delegate and withdraw functions on it 

We are really thankful to https://github.com/EmelyanenkoK with project 
https://github.com/EmelyanenkoK/ValeriTon that saved time for us and allow to build not primitive frontend from scratch in several days.

