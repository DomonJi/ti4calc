import { BattleReport } from '../core'

export const getRandomBattleResult = (report?: BattleReport) => {
  if (!report) {
    return
  }
  const {
    attackerSurvivers,
    defenderSurvivers,
    draw,
    unknownSurvivers,
    attacker,
    defender,
    unknown,
  } = report
  const total = draw + attacker + defender + unknown
  const random = Math.random() * total

  let sum = 0
  for (const [s, winner] of [
    [attackerSurvivers, 'attacker'],
    [defenderSurvivers, 'defender'],
    [unknownSurvivers, 'unknown'],
  ] as const) {
    for (const [surviverString, count = 0] of Object.entries(s)) {
      sum += count
      if (random <= sum) {
        return `${winner}:${surviverString}`
      }
    }
  }
  return 'draw'
}
