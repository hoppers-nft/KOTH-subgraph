import { BigInt, log, store } from "@graphprotocol/graph-ts"
import {
  KingHasWrittenAMessage,
  KOTH,
  NewKing,
  UpdatedOwner,
  WinnerChanged,
  WinnerHasWrittenAMessage
} from "../generated/KOTH/KOTH"
import { Competitor, CurrentCycle, CurrentAmount, Cycle, King } from "../generated/schema"

function getOrCreateCurrentCycle(): CurrentCycle {
  let current = CurrentCycle.load("CurrentCycle");
  if (!current) {
    current = new CurrentCycle("CurrentCycle");
    current.cycle = 1;
    current.save();
  }
  return current;
}
export function handleNewKing(event: NewKing): void {
  IncrementCurrentCycle();
  store.remove('CurrentAmount', 'CurrentAmount'); // restart the current amount
  let king = new King(event.params.winner.adr.toHex());
  king.address = event.params.winner.adr;
  king.cycle = event.params.cycle.toI32();
  king.message = event.params.winner.message;
  king.fly = event.params.winner.flies;
  king.save();
}



export function handleWinnerChanged(event: WinnerChanged): void {
  const currentCycle = getOrCreateCurrentCycle().cycle;
  const userId = event.transaction.from.toHex() + '_' + currentCycle.toString() + event.transaction.hash.toHexString();
  let user = Competitor.load(userId);
  if (!user) {
    user = new Competitor(userId);
  }
  user.fly = getCurrentAmount();
  user.cycleNumber = currentCycle;
  user.cycle = currentCycle.toString();
  user.address = event.transaction.from;
  if (event.params.winner.messageSent) {
    user.message = event.params.winner.message
  }
  else {
    user.message = "";
  }
  user.save();
  let cycle = Cycle.load(currentCycle.toString());
  if (!cycle) {
    cycle = new Cycle(currentCycle.toString());
    cycle.cycle = currentCycle;
   
  }
  if (event.params.winner.messageSent) {
    cycle.message = event.params.winner.message
  }
  else {
    cycle.message = "";
  }

  cycle.currentWinner = event.params.winner.adr;
  cycle.currentWinnerFly = user.fly;
  cycle.save();
}

function getCurrentAmount(): BigInt { // increments everytime its called
  let amount = CurrentAmount.load('CurrentAmount');
  if (!amount) {
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
  if (current) {
    current.cycle += 1;
    current.save();
  }
  else {
    current = new CurrentCycle("CurrentCycle");
    current.cycle = 1;
    current.save();
  }
}

export function handleKingHasWrittenAMessage(event: KingHasWrittenAMessage): void {
  let king = King.load(event.params.king.toHex());
  if (king) {
    king.message = event.params.message;
    king.save();
  }
  else {
    log.error("King not found!", [])
  }
}

export function handleWinnerHasWrittenAMessage(event: WinnerHasWrittenAMessage): void {
  const currentCycle = getOrCreateCurrentCycle().cycle;
  let cycle = Cycle.load(currentCycle.toString());
  if (cycle) {
    cycle.message = event.params.message;
    cycle.save();
  }
  else {
    log.error("Cycle not found!", [])
  }

  const userId = event.transaction.from.toHex() + '_' + currentCycle.toString() + event.transaction.hash.toHexString();
  let user = Competitor.load(userId);
  if (user) {

    user.message = event.params.message
    user.save();
  }
  else {
    log.error("User (winner) not found!", [])
  }
  
  
}
