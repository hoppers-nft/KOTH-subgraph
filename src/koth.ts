import { BigInt, store } from "@graphprotocol/graph-ts"
import {
  KOTH,
  NewKing,
  UpdatedOwner,
  WinnerChanged
} from "../generated/KOTH/KOTH"
import { Competitor, CurrentCycle, CurrentAmount, Cycle } from "../generated/schema"

function getOrCreateCurrentCycle(): CurrentCycle {
  let current = CurrentCycle.load("CurrentCycle");
  if(!current){
    current = new CurrentCycle("CurrentCycle");
    current.cycle = 1;
    current.save();
  }
  return current;
}
export function handleNewKing(event: NewKing): void {
  IncrementCurrentCycle();
  store.remove('CurrentAmount','CurrentAmount'); // restart the current amount
}



export function handleWinnerChanged(event: WinnerChanged): void {
  const currentCycle = getOrCreateCurrentCycle().cycle;
  const userId = event.transaction.from.toHex() + '_' + currentCycle.toString() + event.transaction.hash.toHexString();
  let user = Competitor.load(userId);
  if(!user){
    user = new Competitor(userId);
  }
  user.fly = getCurrentAmount();
  user.cycleNumber = currentCycle;
  user.cycle = currentCycle.toString();
  user.address = event.transaction.from;
  user.save();
  let cycle = Cycle.load(currentCycle.toString());
  if(!cycle){
    cycle = new Cycle(currentCycle.toString());
    cycle.cycle = currentCycle;
  }  
    
  cycle.currentWinner = event.params.winner.adr;
  cycle.currentWinnerFly = user.fly;
  cycle.save();
}

function getCurrentAmount(): BigInt { // increments everytime its called
  let amount = CurrentAmount.load('CurrentAmount');
  if(!amount){
    amount = new CurrentAmount('CurrentAmount');
    amount.currentAmount = BigInt.fromString("100000000000000000000");
  }
  else {
    const prevAmount = amount.currentAmount;
    amount.currentAmount = amount.currentAmount.plus((prevAmount.times(BigInt.fromI32(3)).div(BigInt.fromI32(10))));
  }
  amount.save();
  return amount.currentAmount;
}

function IncrementCurrentCycle(): void {
  let current = CurrentCycle.load("CurrentCycle");
  if(current){
    current.cycle += 1;
    current.save();
  }
  else {
    current = new CurrentCycle("CurrentCycle");
    current.cycle = 1;
    current.save();
  }
}

export function handleUpdatedOwner(event: UpdatedOwner): void {}