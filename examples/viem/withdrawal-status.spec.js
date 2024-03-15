// Might be a good idea to write tests for the examples to make them more maintainable and verify correctness
import { describe, it, expect } from 'vitest'
import { getWithdrawalStatusExample } from './withdrawal-status.mjs'


describe(getWithdrawalStatusExample.name, () => {
  it('should work', async () => {
    expect(await getWithdrawalStatusExample()).toBe('ready-to-prove')
  })
})
