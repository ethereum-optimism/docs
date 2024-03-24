import { getWithdrawalStatusExample } from './viem/withdrawal-status.mjs'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Optimism example!</h1>
    <h3>Withdrawal Status</h3>
    <div id="withdrawal-status-result">loading...</div>
  </div>
`

const withdrawalStatusResult = document.querySelector('#withdrawal-status-result')

getWithdrawalStatusExample().then(result => {
  // insert result into div text
  withdrawalStatusResult.textContent = result
}).catch(err => {
  withdrawalStatusResult.textContent = err instanceof Error ? err.message : "There was an error getting withdrawal status"
})


