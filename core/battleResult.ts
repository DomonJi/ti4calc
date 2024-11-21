import { ParticipantInstance } from './battle-types'
import { getUnitMap } from './battleSetup'
import { UnitInstance, UnitType } from './unit'

export function getBattleResultUnitString(p: ParticipantInstance) {
  return p.units
    .filter((u) => u.type !== UnitType.other)
    .sort((a, b) => {
      if (a.type === b.type) {
        if (a.takenDamage) {
          return 1
        } else {
          return -1
        }
      }
      return (a.diePriority ?? 50) - (b.diePriority ?? 50)
    })
    .map((u) => {
      if (u.takenDamage) {
        return `${getChar(u)}-`
      } else {
        return getChar(u)
      }
    })
    .join('')
}

export function getUnitFromUnitString(unitString: string) {
  const units = getUnitMap()
  const damagedUnits = getUnitMap()
  let lastUnit: UnitType = UnitType.other
  for (const char of unitString || '') {
    if (char === '-') {
      damagedUnits[lastUnit] += 1
      continue
    }
    const unitType = getUnit(char)
    lastUnit = unitType
    units[unitType] += 1
  }

  return {
    units,
    damagedUnits,
  }
}

function getChar(u: UnitInstance): string {
  switch (u.type) {
    case UnitType.flagship:
      return 'F'
    case UnitType.warsun:
      return 'W'
    case UnitType.dreadnought:
      return 'D'
    case UnitType.carrier:
      return 'C'
    case UnitType.cruiser:
      return 'c'
    case UnitType.destroyer:
      return 'd'
    case UnitType.fighter:
      return 'f'
    case UnitType.mech:
      return 'M'
    case UnitType.infantry:
      return 'i'
    case UnitType.pds:
      return 'p'
    case UnitType.other:
      return 'o' // should never happen
  }
}

function getUnit(char: string): UnitType {
  switch (char) {
    case 'F':
      return UnitType.flagship
    case 'W':
      return UnitType.warsun
    case 'D':
      return UnitType.dreadnought
    case 'C':
      return UnitType.carrier
    case 'c':
      return UnitType.cruiser
    case 'd':
      return UnitType.destroyer
    case 'f':
      return UnitType.fighter
    case 'M':
      return UnitType.mech
    case 'i':
      return UnitType.infantry
    case 'p':
      return UnitType.pds
    default:
      return UnitType.other
  }
}
