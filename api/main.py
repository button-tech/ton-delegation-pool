#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
import subprocess
from pydantic import BaseModel
import uvicorn
import uuid
from starlette.middleware.cors import CORSMiddleware
import asyncio
import os
import motor
import nest_asyncio

nest_asyncio.apply()

fift = "./liteclient-build/crypto/fift -I ./ton/crypto/fift/lib/"
lite_client = "./liteclient-build/lite-client/lite-client"

def mongo_connection(action):
    async def connect(*args, **kwargs):
        client = motor.MotorClient(os.environ["DB_URI"])
        db = client["admin"]
        collection = db["contest"]
        s = await client.start_session()
        result = await action(collection, *args, **kwargs)
        await s.end_session()
        return result
    return connect

# todo: add statuses for:
#  1. validator can withdraw the remaining amount
#  2. someone should withdraw grams from elector contract to delegation pool contract
#  3. elections failed and should withdraw staked amount

statusWordList = {
    0: "🔘 Setup",
    1: "✳️ Raising",
    2: "🕔 Waiting",
    3: "🕔 Waiting",
    4: "🔴 Fail",
    5: "🕔 Waiting",
    6: "🕔 Waiting",
    7: "💸 Withdraw",
    8: "💸 Withdraw",
    14: "💸 Withdraw"
}

class Boc(BaseModel):
    hexData: str

class RunMethod(BaseModel):
    value: str

class DataForCreate(BaseModel):
    delegationDeadlineDelta: int
    validatorPubKey: str

class DataForAdd(BaseModel):
    minimalStake: int
    raisingAmount: int
    validatorPubKey: str
    delegationDeadlineDelta: int
    contractAddress: str

class ValidatorPubKey(BaseModel):
    value: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/sendBoc")
async def send_boc(boc: Boc):
    result = await create_and_send_boc(boc.hexData)
    if result == "error":
        raise HTTPException(status_code=500, detail="err")
    return result

@app.get("/seqno/{address}")
async def get_seqno(address: str):
    stdout = await cli_call("getaccount " + address)

    begin = stdout.find("data:")
    if begin == -1:
        raise HTTPException(status_code=500, detail="err")

    begin += 70

    seqno = stdout[begin:begin + 8]

    return {"seqno": seqno}

@app.get("/getBalance/{address}")
async def get_balance(address: str):
    stdout = await cli_call("getaccount " + address)

    balance = parse_stdout(stdout, "account balance is")

    if balance == "error":
        raise HTTPException(status_code=500, detail="err")

    balance = replace_multiple(balance, ["ng", " ", "\n"], "")

    return {"balance": int(balance)}

@app.get("/getAccount/{address}")
async def get_account(address: str):
    if len(address) != 48 and len(address) != 67 and len(address) != 66:
      raise HTTPException(status_code=500, detail="bad address")

    result = await get_address_info(address)
    if result == "error":
      raise HTTPException(status_code=500, detail="err")

    return result

@app.get("/activeElectionId")
async def active_electionId():
    stdout = await run_cli_method("-1:3333333333333333333333333333333333333333333333333333333333333333 active_election_id")

    if stdout == "error":
        raise HTTPException(status_code=500, detail="error")

    return {"result": stdout}

@app.post("/runmethod")
async def runmethod(m: RunMethod):
    stdout = await run_cli_method(m.value)

    if stdout == "error":
        raise HTTPException(status_code=500, detail="bad params")

    return {"result": stdout}

@app.get("/delegationPoolRaisedSum/{address}")
async def delegation_pool_raised_sum(address: str):
    result = await run_cli_method(address + " total_stake")
    if result == "error":
        raise HTTPException(status_code=500, detail="err")

    return {"amount": int(result[0])}

@app.get("/delegationPoolData/{contract_address}")
async def delegation_pool_data(contract_address: str):
    lock_time = asyncio.create_task(get_lock_time(contract_address))
    max_stake = asyncio.create_task(get_max_stake(contract_address))
    deadline = asyncio.create_task(get_deadline(contract_address))
    contract_info = asyncio.create_task(get_single_contracts_info({"contractAddress": contract_address}))

    await max_stake
    await lock_time
    await deadline
    await contract_info

    return {"minimalStake": contract_info.result()["minimalStake"], "maximumStake": max_stake.result(), "lockTime": lock_time.result(), "raisingDeadlineTime": deadline.result()[2]}

@app.get("/withdrawal/{contract_address}/{address}")
async def withdrawal(contract_address: str, address: str):
    timeToWithdraw = asyncio.create_task(get_lock_time(contract_address))
    credits_list_extended = asyncio.create_task(run_cli_method(contract_address + " credits_list_extended"))
    address_info = asyncio.create_task(get_address_info(address))

    await timeToWithdraw
    await address_info
    await credits_list_extended

    if address_info.result() == "error":
         raise HTTPException(status_code=500, detail="bad address")

    addressInt = int(address_info.result()["fullAddress"], 16)
    time = int(timeToWithdraw.result()[1])
    credits = credits_list_extended.result()

    if time != 0:
         return {"timeToWithdraw": time, "amount": 0}

    for i in range(len(credits)):
       if credits[i] == str(addressInt):
         return {"timeToWithdraw": 0, "amount": int(credits[i + 1])}

    return {"timeToWithdraw": 0, "amount": 0}


@app.get("/lastTx/{address}")
async def last_tx(address: str):
    result = await get_last_tx(address)
    if result == "error":
        raise HTTPException(status_code=500, detail="bad exec")
    return result

@app.get("/contractsList")
async def contracts_list():
    all_contracts = await get_all_contracts()

    if len(all_contracts) == 0:
        return {"result": []}

    loop = asyncio.get_event_loop()
    tasks = []
    result = []

    for contract_data in all_contracts:
        tasks.append(get_delegators_pool_info(contract_data))

    done, pending = loop.run_until_complete(asyncio.wait(tasks))
    for future in done:
        value = future.result()
        if value == "error":
            # raise HTTPException(status_code=500, detail="error")
            continue
        result.append(value)

    return {"result": result}

@app.get("/contractInfo/{contract_address}")
async def contract_info(contract_address: str):
    result = await get_single_contracts_info({"contractAddress": contract_address})
    if result == None:
        raise HTTPException(status_code=500, detail="error")

    info = await get_delegators_pool_info(result)

    return {"result": info}

@app.get("/depositInfo/{contract_addr}/{delegator_addr}")
async def deposit_info(contract_addr: str, delegator_addr: str):
    delegator_address_info = asyncio.create_task(get_address_info(delegator_addr))
    delegators_list_extended = asyncio.create_task(run_cli_method(contract_addr + " delegators_list_extended"))
    credits_list_extended = asyncio.create_task(run_cli_method(contract_addr + " credits_list_extended"))
    deadline = asyncio.create_task(get_deadline(contract_addr))

    await delegator_address_info
    await delegators_list_extended
    await credits_list_extended
    await deadline

    result = 0

    try:
        contract_status = deadline.result()[0]
        address = str(int(delegator_address_info.result()["fullAddress"], 16))
        delegators = delegators_list_extended.result()
        credits = credits_list_extended.result()
        for i in range(len(delegators)):
            if delegators[i] == address:
                # < 7
                if contract_status < 5:
                          result = int(delegators[i-1])
                          break
                for j in range(len(credits)):
                     if credits[j] == address:
                          result = int(delegators[i-1])
                          break
    except:
        raise HTTPException(status_code=500, detail="error")

    return {"sended": result}

@app.post("/createDelegationPool")
async def create_delegations_pool(data: DataForCreate):
     result = subprocess.getoutput(f'{fift} -s ./fift-scripts/delegation_pool.fif {data.validatorPubKey} {data.delegationDeadlineDelta}')

     result = parse_stdout(result, "Bounceable address (for later access): ").split("\n\n")

     if len(result) != 2:
         raise HTTPException(status_code=500, detail="error")

     info = {"contractAddress" :result[0], "hexBoc": result[1] }

     _ = await asyncio.create_task(create_and_send_boc(info["hexBoc"]))

     return {"contractAddress": result[0], "hexBoc": result[1]}

@app.get("/activateCheck/{address}")
async def activate_check(address:str):
    result = await check_contract_code(address)
    return {"result": result}


@app.post("/addDelegationPool")
async def add_gelegation_pool(data: DataForAdd):

    is_activated = await check_contract_code(data.contractAddress)
    if not is_activated:
       raise HTTPException(status_code=500, detail="not activated")

    delegation_pool_data = {"contractAddress": data.contractAddress, "raisingAmount": data.raisingAmount,
                            "validatorPubKey":data.validatorPubKey, "minimalStake":data.minimalStake,
                            "delegationDeadlineDelta":data.delegationDeadlineDelta}

    await add_contract_info(delegation_pool_data)

    return {"result": "ok"}

@app.post("/contractCheck")
async def data_pool_check(validator_pub_key: ValidatorPubKey):
    is_in_db = await get_single_contracts_info({"validatorPubKey": validator_pub_key.value})
    if is_in_db:
        return {"result": True}
    return {"result": False}


async def check_contract_code(address: str)->bool:
    stdout = await cli_call("getaccount " + address)

    if stdout.find("code:") == -1:
        return False

    return True

async def get_address_info(address: str) -> dict:
    stdout = await cli_call("getaccount " + address)

    result = parse_stdout(stdout, "got account state for ", "with respect to blocks")
    if result == "error":
        return "error"

    result = result.replace(" ", "").split(":")
    if len(result) != 2:
        return "error"

    bounce = True
    if stdout.find("balance:") == -1:
        bounce = False

    addresses = subprocess.getoutput(f'{fift} -s ./fift-scripts/addresses.fif {result[0]} 0x{result[1]}').split("\n")

    if len(addresses) != 3:
        return "error"

    return {"workchainId": result[0], "bounce": bounce, "fullAddress": result[1], "nonBounceableAddress": addresses[1], "shortAddress": addresses[2]}


async def get_delegators_pool_info(result):
    max_stake = asyncio.create_task(get_max_stake(result["contractAddress"]))
    status = asyncio.create_task(get_deadline(result["contractAddress"]))
    raisedAmount = asyncio.create_task(run_cli_method(result["contractAddress"] + " total_stake"))
    lock_time = asyncio.create_task(get_lock_time(result["contractAddress"]))

    await status
    await raisedAmount
    await max_stake
    await lock_time

    time_to_deadline = status.result()[2]
    contract_status = status.result()[0]

    result["contractStatus"] = statusWordList[contract_status]
    result["lockTime"] = lock_time.result()
    result["maximumStake"] = max_stake.result() - int(raisedAmount.result()[0])
    result["raisedAmount"] = int(raisedAmount.result()[0])
    result["raisingDeadline"] = time_to_deadline
    result["validatorFee"] = 0
    result["estimatedApr"] = 6.6

    return result

async def run_cli_method(params: str) -> list:
    stdout = await cli_call("runmethod " + params)

    result = parse_stdout(stdout, "result:  [ ")

    if result == "error":
       return "error"

    result = replace_multiple(result, ["[", "]", "(", ")"], "")

    return result.split()

async def cli_call(cmd):
    proc = await asyncio.create_subprocess_exec(
        lite_client, f'-c {cmd}',
        stderr=asyncio.subprocess.PIPE)

    data = await proc.stderr.read()

    data = data.decode('ascii').rstrip()

    await proc.wait()

    return data

async def get_last_tx(address: str) -> dict:
    stdout = await cli_call("getaccount " + address)

    result = parse_stdout(stdout, "last transaction ", "account balance is")
    if result == "error":
        raise HTTPException(status_code=500, detail="bad exec")

    result = result.replace("=", "").replace("lt", "").replace("hash", "").split()

    if len(result) != 2:
        return "error"
    if len(result[1]) != 64:
        return "error"

    return {"lt": result[0], "hash": result[1]}

def replace_multiple(mainString, toBeReplaces, newString):
    for elem in toBeReplaces:
        if elem in mainString:
            mainString = mainString.replace(elem, newString)

    return mainString

async def get_deadline(contract_address: str) -> list:
  remaining_time_to_deadline = asyncio.create_task(run_cli_method(contract_address + " remaining_time_to_deadline"))
  recorded_status = asyncio.create_task(run_cli_method(contract_address + " recorded_status"))
  get_config_15 = asyncio.create_task(cli_call("getconfig 15"))
  get_config_34 = asyncio.create_task(cli_call("getconfig 34"))
  get_config_32 = asyncio.create_task(cli_call("getconfig 32"))
  get_validator_pub_key = asyncio.tasks(run_cli_method(contract_address + " validator_public_key"))


  await remaining_time_to_deadline
  await recorded_status
  await get_config_15
  await get_config_32
  await get_config_34
  await get_validator_pub_key

  validator_pub_key = hex(get_validator_pub_key.result()[0])[1:]

  print(validator_pub_key)

  validators_elected_for = int(parse_stdout(get_config_15.result(), "validators_elected_for:", " elections_start_before"))
  stake_held_for = parse_stdout(get_config_15.result(), "stake_held_for:", "x{")
  stake_held_for = int(replace_multiple(stake_held_for, ["\n", " ", ")"], ""))

  deadline = int(recorded_status.result()[1])
  contract_status = int(recorded_status.result()[0])

  time_to_deadline = int(remaining_time_to_deadline.result()[0])
  expired = False if int(remaining_time_to_deadline.result()[1]) == -1 else True

  if not expired:
    return [contract_status, deadline, time_to_deadline, validators_elected_for, stake_held_for]
  contract_status *= 2
  if contract_status == 2:
    deadline += validators_elected_for * 5
    if abs(time_to_deadline) > validators_elected_for * 5:
      contract_status *= 2

  if contract_status == 4:
    deadline += 3600 * 24 * 30 * 2
    if abs(time_to_deadline) > 3600 * 24 * 30 * 2:
      contract_status += contract_status

  if contract_status == 6:
      if abs(time_to_deadline) < validators_elected_for:
          curr_vset_34 = get_config_34.result()
          result = curr_vset_34.find(validator_pub_key)
          if result == -1:
              contract_status = 5
          return [contract_status, deadline, time_to_deadline, validators_elected_for, stake_held_for]

      elif abs(time_to_deadline) < validators_elected_for * 2:
          prev_vset_32 = get_config_32.result()
          result = prev_vset_32.find(validator_pub_key)
          if result == -1:
              contract_status = 5
          if abs(time_to_deadline) >= validators_elected_for + stake_held_for:
              contract_status = 5
          return [contract_status, deadline, time_to_deadline, validators_elected_for, stake_held_for]

      else:
          contract_status = 5

  if contract_status == 8 or contract_status == 14:
    deadline = int("0xFFFFFFFF", 16)

  return [contract_status, deadline, time_to_deadline, validators_elected_for, stake_held_for]

def parse_stdout(stdout: str, start_phrase: str, end_phrase: str="")-> str:
    begin = stdout.find(start_phrase)
    if begin == -1:
        return "error"
    if end_phrase == "":
        result = stdout[begin + len(start_phrase):]
    else:
        end = stdout.find(end_phrase)
        result = stdout[begin + len(start_phrase):end]

    return result

async def get_lock_time(contract_address: str) -> list:
  status = await get_deadline(contract_address)

  contract_status, deadline, remaining_time_to_deadline, validators_elected_for, stake_held_for = status

  min = 0
  max = 0

  if contract_status == 1:
      min = remaining_time_to_deadline + (validators_elected_for * 1) + 0 + 0
      max = (validators_elected_for * 5) + remaining_time_to_deadline + validators_elected_for + stake_held_for + 0
  elif contract_status == 2:
      min = (validators_elected_for * 1) + remaining_time_to_deadline + 0 + 0
      max = (validators_elected_for * 5) + remaining_time_to_deadline + validators_elected_for + stake_held_for + 0
  elif contract_status == 3:
      max = remaining_time_to_deadline + validators_elected_for + stake_held_for + 0
      min = remaining_time_to_deadline
  elif contract_status == 6:
      max = validators_elected_for + remaining_time_to_deadline + stake_held_for + 0
  elif contract_status == 4 or contract_status == 5 or contract_status >= 7:
      pass

  return [min, max]

async def get_max_stake(contract_address: str) -> int:
  elector_max_stake = asyncio.create_task(cli_call("getconfig 17"))
  contract_max_stake = asyncio.create_task(run_cli_method(contract_address + " total_stake"))

  await elector_max_stake
  await contract_max_stake

  elector_max_stake_result = parse_stdout(elector_max_stake.result(), "max_stake:(nanograms", "min_total_stake:")
  elector_max_stake_result = parse_stdout(elector_max_stake_result, "value:", "))")

  return int(elector_max_stake_result) - int(contract_max_stake.result()[0])

async def create_and_send_boc(hexData):
    fileName = str(uuid.uuid4().hex)

    text = '''
     B{''' + hexData + '''}
     "''' + fileName + '''.boc"

     tuck

     B>file
     ."(Saved to file " type .")" cr
     '''

    try:
        with open(f'{fileName}.fif', "w") as f:
            f.write(text)
    except:
        return "err"

    os.system(f'{fift} {fileName}.fif')
    await cli_call("sendfile " + fileName + ".boc")
    os.remove(f'./{fileName}.boc')
    os.remove(f'./{fileName}.fif')

    return {"result": "ok"}


@mongo_connection
async def add_contract_info(collection, data: dict):
     await collection.insert_one(data)

@mongo_connection
async def get_all_contracts(collection):
    values = []
    async for value in collection.find():
        del value["_id"]
        values.append(value)
    return values

@mongo_connection
async def get_single_contracts_info(collection, data: dict):
    result = await collection.find_one(data)
    if result:
        del result["_id"]
    return result

if __name__ == "__main__":
   uvicorn.run("main:app", host="0.0.0.0", port=3000, workers=8, loop="asyncio")
