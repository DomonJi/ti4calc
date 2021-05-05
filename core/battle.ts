import { BattleInstance, ParticipantInstance } from './battleSetup'
import { Roll } from './unit'
import _times from 'lodash/times'

export function doBattle(battleInstance: BattleInstance) {
  doPds(battleInstance)
  resolveHits(battleInstance)

  // TODO remove isFirstRound
  let isFirstRound = true
  while (
    isParticipantAlive(battleInstance.attacker) &&
    isParticipantAlive(battleInstance.defender)
  ) {
    doBattleRolls(battleInstance, isFirstRound)
    resolveHits(battleInstance)
    doRepairStep(battleInstance)

    isFirstRound = false
    battleInstance.roundNumber += 1

    if (battleInstance.roundNumber === 1000) {
      // TODO handle it nicer
      throw new Error('infinite fight')
    }
  }
}

function doPds(battleInstance: BattleInstance) {
  const attackerPdsHits = getPdsHits(battleInstance.attacker)
  battleInstance.defender.hitsToAssign += attackerPdsHits
  const defenderPdsHits = getPdsHits(battleInstance.defender)
  battleInstance.attacker.hitsToAssign += defenderPdsHits
}

function getPdsHits(p: ParticipantInstance) {
  const hits = p.units.map((u) => (u.spaceCannon ? getHits(u.spaceCannon) : 0))
  return hits.reduce((a, b) => {
    return a + b
  }, 0)
}

function doBattleRolls(battleInstance: BattleInstance, isFirstRound: boolean) {
  doParticipantBattleRolls(battleInstance.attacker, battleInstance.defender, isFirstRound)
  doParticipantBattleRolls(battleInstance.defender, battleInstance.attacker, isFirstRound)
}

function doParticipantBattleRolls(
  p: ParticipantInstance,
  otherParticipant: ParticipantInstance,
  isFirstRound: boolean,
) {
  const hits = p.units
    .map((unit) => {
      if (isFirstRound) {
        p.firstRoundEffects.forEach((effect) => {
          unit = effect(unit)
        })
      }

      return unit.combat ? getHits(unit.combat) : 0
    })
    .reduce((a, b) => {
      return a + b
    }, 0)

  otherParticipant.hitsToAssign += hits
}

function resolveHits(battleInstance: BattleInstance) {
  while (battleInstance.attacker.hitsToAssign > 0 || battleInstance.defender.hitsToAssign > 0) {
    resolveParticipantHits(battleInstance, battleInstance.attacker)
    resolveParticipantHits(battleInstance, battleInstance.defender)
  }
}

function resolveParticipantHits(battleInstance: BattleInstance, p: ParticipantInstance) {
  // TODO maybe make this prettier, so we only sustain on one row
  while (p.hitsToAssign > 0) {
    const bestSustainUnit = getBestSustainUnit(p)
    if (p.riskDirectHit && bestSustainUnit) {
      bestSustainUnit.takenDamage = true
      bestSustainUnit.takenDamageRound = battleInstance.roundNumber
      p.hitsToAssign -= 1
      p.onSustainEffect.forEach((sustainEffect) =>
        sustainEffect(bestSustainUnit, p, battleInstance),
      )
    } else {
      const bestDieUnit = getBestDieUnit(p)
      if (bestDieUnit) {
        if (bestDieUnit.sustainDamage && !bestDieUnit.takenDamage) {
          bestDieUnit.takenDamage = true
          bestDieUnit.takenDamageRound = battleInstance.roundNumber
          p.hitsToAssign -= 1
          p.onSustainEffect.forEach((sustainEffect) =>
            sustainEffect(bestDieUnit, p, battleInstance),
          )
        } else {
          bestDieUnit.isDestroyed = true
          p.hitsToAssign -= 1
        }
      } else {
        // redundant hit
        p.hitsToAssign -= 1
      }
    }

    // TODO can we remove them directly and remove isDestroyed flag?
    p.units = p.units.filter((u) => !u.isDestroyed)
  }
}

function doRepairStep(battleInstance: BattleInstance) {
  doRepairStepForParticipant(battleInstance, battleInstance.attacker)
  doRepairStepForParticipant(battleInstance, battleInstance.defender)
}

function doRepairStepForParticipant(
  battleInstance: BattleInstance,
  participant: ParticipantInstance,
) {
  if (participant.onRepairEffect.length > 0) {
    participant.units.forEach((unit) => {
      participant.onRepairEffect.forEach((repairEffect) =>
        repairEffect(unit, participant, battleInstance),
      )
    })
  }
}

function getBestDieUnit(p: ParticipantInstance) {
  const units = getAliveUnits(p)
  if (units.length === 0) {
    return undefined
  } else {
    return units.reduce((a, b) => {
      if (a.diePriority === b.diePriority && a.takenDamage !== b.takenDamage) {
        return a.takenDamage ? b : a
      }
      return a.diePriority! > b.diePriority! ? a : b
    })
  }
}

export function isParticipantAlive(p: ParticipantInstance) {
  return p.units.some((u) => !u.isDestroyed)
}

function getAliveUnits(p: ParticipantInstance) {
  return p.units.filter((u) => {
    return !u.isDestroyed
  })
}

function getBestSustainUnit(p: ParticipantInstance) {
  const units = getUnitsWithSustain(p)
  if (units.length === 0) {
    return undefined
  } else {
    return units.reduce((a, b) => {
      // TODO
      return a.useSustainDamagePriority! > b.useSustainDamagePriority! ? a : b
    })
  }
}

function getUnitsWithSustain(p: ParticipantInstance) {
  return p.units.filter((u) => {
    return u.sustainDamage && !u.takenDamage && !u.isDestroyed
  })
}

export function getHits(roll: Roll): number {
  const count = roll.count + roll.countBonus
  const hit = roll.hit - roll.hitBonus

  return _times(count, () => {
    let reroll = roll.reroll - roll.rerollBonus
    let result = false
    while (!result && reroll >= 0) {
      result = Math.random() * 10 + 1 > hit
      reroll -= 1
    }
    return result
  }).filter((r) => r).length
}
