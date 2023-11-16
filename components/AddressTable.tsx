import type { ReactElement } from 'react'

const explorers = {
  '1': 'https://etherscan.io',
  '5': 'https://goerli.etherscan.io',
  '10': 'https://optimistic.etherscan.io',
  '420': 'https://goerli-optimism.etherscan.io',
}

export function AddressTable({
  chain,
  explorer,
  addresses
}: {
  chain: string,
  explorer: string,
  addresses: { [contract: string]: string }
}): ReactElement {
  return (
    <table className="nx-table nx-overflow-x-scroll nextra-scrollbar nx-mt-6 nx-p-0 first:nx-mt-0 nx-w-full">
      <thead>
        <tr className="nx-m-0 nx-border-t nx-border-gray-300 nx-p-0 dark:nx-border-gray-600 even:nx-bg-gray-100 even:dark:nx-bg-gray-600/20">
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">Contract Name</th>
          <th className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 nx-font-semibold dark:nx-border-gray-600">Contract Address</th>
        </tr>
      </thead>
      <tbody>
        {
          Object.entries(addresses)
            .map(([contract, address]) => {
              return (
                <tr key={`${chain}.${address}`} className="nx-m-0 nx-border-t nx-border-gray-300 nx-p-0 dark:nx-border-gray-600 even:nx-bg-gray-100 even:dark:nx-bg-gray-600/20">
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600">
                    <code className="nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10">
                      {contract}
                    </code>
                  </td>
                  <td className="nx-m-0 nx-border nx-border-gray-300 nx-px-4 nx-py-2 dark:nx-border-gray-600 nx-text-center">
                    <a href={`${explorers[explorer]}/address/${address}`} target="_blank" rel="noreferrer" className="nx-text-primary-600 nx-underline nx-decoration-from-font [text-underline-position:from-font]">
                      <code className="nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10">
                        {address}
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
