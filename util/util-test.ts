export function checkResult(result: number, expected: number, allowedErrorPercentage = 0.06) {
  expect(result).toBeLessThanOrEqual(expected + expected * allowedErrorPercentage)
  expect(result).toBeGreaterThanOrEqual(expected - expected * allowedErrorPercentage)
  // console.log(`expected ${expected}, got ${result}`)
}
