import { BigInt, log, store } from "@graphprotocol/graph-ts"
import {
  NewKing,
  UpdatedOwner,
  WinnerChanged,
} from "../generated/KOTH/KOTH"
import { Competitor, CurrentCycle, Cycle, King } from "../generated/schema"

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
  let king = new King(event.params.king.adr.toHex() + '-' + event.params.king.cycle.toHex());
  king.address = event.params.king.adr;
  king.cycle = event.params.king.cycle.toI32();
  king.message = event.params.king.message;
  king.fly = event.params.king.flies;
  king.save();
}


export function handleWinnerChanged(event: WinnerChanged): void {
  const currentCycle = getOrCreateCurrentCycle().cycle;
  const userId = event.transaction.from.toHex() + '_' + currentCycle.toString() + event.transaction.hash.toHexString();
  let user = Competitor.load(userId);
  if (!user) {
    user = new Competitor(userId);
  }
  
  user.fly = event.params.winner.flies;
  user.cycleNumber = currentCycle;
  user.cycle = currentCycle.toString();
  user.address = event.transaction.from;
  user.message = event.params.winner.message;
  user.save();
  let cycle = Cycle.load(currentCycle.toString());
  if (!cycle) {
    cycle = new Cycle(currentCycle.toString());
    cycle.cycle = currentCycle;
    

  }
  cycle.message = event.params.winner.message
  cycle.currentWinner = event.params.winner.adr;
  cycle.currentWinnerFly = user.fly;
  cycle.save();
}


function IncrementCurrentCycle(): void {
  let current = CurrentCycle.load("CurrentCycle");
  if (current) {
    current.cycle += 1;
    current.save();
  }
  else {
    log.error("Current cycle not found!", []);
  }
}
