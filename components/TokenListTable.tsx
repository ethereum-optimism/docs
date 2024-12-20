import type { ReactElement } from 'react'
import tokenlist from '@eth-optimism/tokenlist'

const explorers = {
  '1': 'https://etherscan.io',
  '5': 'https://goerli.etherscan.io',
  '10': 'https://optimistic.etherscan.io',
  '420': 'https://goerli-optimism.etherscan.io',
  '11155111': 'https://sepolia.etherscan.io/',
  '11155420': 'https://sepolia-optimism.etherscan.io/',
}

export function TokenListTable({
  l1,
  l2,
}: {
  l1: string,
  l2: string
}): ReactElement {
  return (
    <table className="nx-block nx-overflow-x-scroll nextra-scrollbar nx-mt-6 nx-p-0 first:nx-mt-0">
      <thead>
        <tr className="nx-m-0 nx-border-t nx-border-gray-300 nx-p-0 dark:nx-border-gray-600 even:nx-bg-gray-100 even:dark:nx-bg-gray-600/20">
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">Name</th>
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">Symbol</th>
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">L1 Token</th>
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">L2 Token</th>
        </tr>
      </thead>
      <tbody>
        {
          tokenlist.tokens
            .filter((token) => {
              // Find all of the L1 tokens
              return token.chainId === parseInt(l1)
            })
            .sort((a, b) => {
              // Sort alphabetically by symbol
              return a.symbol.localeCompare(b.symbol)
            })
            .reduce((acc, token) => {
              // Remove duplicate L1 tokens by address
              if (acc.some((other) => {
                return other.address === token.address
              })) {
                return acc
              } else {
                return acc.concat(token)
              }
            }, [])
            .map((token) => {
              // Find the corresponding L2 token
              return {
                token,
                pair: tokenlist.tokens
                .find((other) => {
                  return (
                    other.chainId === parseInt(l2) &&
                    other.symbol === token.symbol
                  )
                })
              }
            })
            .filter(({ pair }) => {
              // Make sure the L2 token exists (it may not)
              return pair !== undefined
            })
            .map(({ token, pair }) => {
              return (
                <tr key={`${l1}.${l2}.${token.address}`} className="nx-m-0 nx-border-t nx-border-gray-300 nx-p-0 dark:nx-border-gray-600 even:nx-bg-gray-100 even:dark:nx-bg-gray-600/20">
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600">
                    {token.name}
                  </td>
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600">
                    {token.symbol}
                  </td>
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600">
                    <a href={`${explorers[l1]}/address/${token.address}`} target="_blank" rel="noreferrer" className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]">
                      <code className="nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10">
                        {token.address}
                      </code>
                      <span className="nx-sr-only nx-select-none"> (opens in a new tab)</span>
                    </a>
                  </td>
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600">
                    <a href={`${explorers[l2]}/address/${pair.address}`} target="_blank" rel="noreferrer" className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]">
                      <code className="nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10">
                        {pair.address}
                      </code>
                      <span className="nx-sr-only nx-select-none"> (opens in a new tab)</span>
                    </a>
                  </td>
                </tr>
              )
            })
        }
      </tbody>
    </table>
  )
}
