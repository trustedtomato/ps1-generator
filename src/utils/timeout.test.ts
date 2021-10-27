import { timeout } from './timeout'

test('timeout waits for the given amount of time', async () => {
  expect.assertions(1)
  
  const start = process.hrtime.bigint()
  await timeout(1000)
  expect(
    Number(
      (process.hrtime.bigint() - start) /
      BigInt(10)**BigInt(9)
    )
  ).toBeCloseTo(1, 2)
});