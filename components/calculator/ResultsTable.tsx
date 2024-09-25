import type { ReactElement } from "react";
// import { useState } from "react";
// import { TextInput, SelectInput, CheckboxInput } from "./Inputs";

export function ResultsTable(): ReactElement {
 
  return (
    <div>
      <div className="construction-info">
        <p>
          This construction is expected to have +0.006 ETH Margin on Data Costs
          (5% Margin) at inputted L1 Gas Prices{" "}
        </p>
        <p>Implied Data Gas Fee per User Transaction: $0.0006</p>
      </div>
      <div className="results-container">
        <h1>Results:</h1>

        <div>
          <h2>Fee Scalar Recommendations - Values to Set as Chain Inputs </h2>
          <p>
            Recommended fee scalar configurations to achieve your target Data
            Margin, given the transaction type and volume are shown below{" "}
          </p>
          <p>
            Note: This is an estimation, see the Optimism Docs for steps on
            modifying parameters if needed once the chain is on mainnet{" "}
          </p>
        </div>
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-gray-200 mt-6">
            <thead>
              <tr>
                <th className="text-start py-3 px-2 text-sm sm:text-xl md:py-7 tracking-wider ">
                  DA Recommendation:
                </th>
                <th className="text-start py-3 px-2 text-sm sm:text-xl md:py-7 font-medium  tracking-wider">
                  Blobs (EIP-4844)
                </th>
              </tr>
              <tr className="">
                <th className="text-start py-3 px-2 text-sm sm:text-xl md:py-7 tracking-wider ">
                  Scalar Type
                </th>
                <th className="text-start py-3 px-2 text-sm sm:text-xl md:py-7 font-medium  tracking-wider">
                  Chain Input
                </th>
                <th className="text-start py-3 px-2 text-sm sm:text-xl md:py-7 font-medium  tracking-wider">
                  Decimal-Adjusted (6 decimals)
                </th>
              </tr>
            </thead>
            <tbody className="">
              <tr className="">
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  l1BlobBaseBaseScalar
                </td>
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  810831
                </td>
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  0.810831
                </td>
              </tr>
              <tr className="">
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  l1BaseFeeScalar
                </td>
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  4244
                </td>
                <td className=" whitespace-nowrap py-3 px-2 text-sm sm:text-base md:py-7">
                  0.004244
                </td>
              </tr>
            </tbody>
          </table>
          <div className="result-extra-info">
            <p>
              Using Blobs (EIP-4844), posting transaction data will be 99.7%
              cheaper than using L1 Calldata{" "}
            </p>
          </div>
          <div className="additional-info">
            <p>Fees Scalars Assume: <span>100% Blob Fullness and 5 Blobs per  L1 Tx (Avg), Target a 5% Margin on DA and State, 5 hour Max Submission Window.</span></p>
            <p>Implied Data Gas Fee Assumes: <span>0 gwei Blobgas Base Fee, 7.2 gwei L1 Base Fee, 2370 ETH/USD</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
