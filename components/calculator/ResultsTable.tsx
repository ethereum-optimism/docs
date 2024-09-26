import type { ReactElement } from "react";
// import { useState } from "react";
// import { TextInput, SelectInput, CheckboxInput } from "./Inputs";
// type Props = {
//   isStateEnabled: boolean;
//   isFaultProofsEnabled: boolean;
//   outputRootPostFrequency: number;
//   transactionsPerDay: number;
//   maxChannelDuration: number;
//   comparableTxnType: string;
//   targetDataMargin: number;
//   dataAvailabilityType: string;
// };

// export function ResultsTable({
//   isStateEnabled,
//   isFaultProofsEnabled,
//   outputRootPostFrequency,
//   transactionsPerDay,
//   targetDataMargin, 
//   dataAvailabilityType
// }: Props): ReactElement {
export function ResultsTable(): ReactElement {
  let var1, var2, var3
  return (
    <div className="calculator-results-wrap">
      <div className="construction-info">
        <p>
          This construction is expected to have <span>+0.006</span> ETH Margin
          on Data Costs (<span>5% Margin</span>) at inputted L1 Gas Prices{" "}
        </p>
        <p>
          Implied Data Gas Fee per User Transaction: $<span>0.0006</span>{" "}
        </p>
      </div>
      <div className="results-container">
        <h2 className="calculator-heading_sub ">Results</h2>

        <div className="results-recommendations">
          <h3 className="calculator-heading_text">
            Fee Scalar Recommendations - Values to Set as Chain Inputs{" "}
          </h3>
          <p className="calculator-text">
            Recommended fee scalar configurations to achieve your target Data
            Margin, given the transaction type and volume are shown below{" "}
          </p>
          <p className="calculator-info calculator-text">
            <strong>Note: </strong>This is an estimation,{" "}
            <a
              href="https://docs.optimism.io/builders/chain-operators/management/blobs#determine-scalar-values-for-using-blobs"
              target="_blank"
            >
              see the Optimism Docs
            </a>{" "}
            for steps on modifying parameters if needed once the chain is on
            mainnet{" "}
          </p>
        </div>
        <div className="results-table-wrap">
          <table className="results-table table">
            <thead>
              <tr>
                <th colSpan={2}>DA Recommendation:</th>
                <th>Blobs (EIP-4844)</th>
              </tr>
              <tr className="sub-header">
                <th>Scalar Type</th>
                <th>Chain Input</th>
                <th>Decimal-Adjusted (6 decimals)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>l1BlobBaseBaseScalar</td>
                <td>810831</td>
                <td>0.810831</td>
              </tr>
              <tr>
                <td>l1BaseFeeScalar</td>
                <td>4244</td>
                <td>0.004244</td>
              </tr>
            </tbody>
          </table>
          <div className="results-extra-info calculator-text">
            <p>
              Using Blobs (EIP-4844), posting transaction data will be 99.7%
              cheaper than using L1 Calldata{" "}
            </p>
          </div>
          <div className="additional-info calculator-text">
            <p>
              Fees Scalars Assume:
              <span>100%</span> Blob Fullness and <span>5</span> Blobs per L1 Tx (Avg),
              Target a <span>5</span>% Margin on DA and State, <span>5</span> hour Max Submission Window.
            </p>
            <p>
              Implied Data Gas Fee Assumes:{" "}
              <span>
                0 gwei Blobgas Base Fee, 7.2 gwei L1 Base Fee, 2370 ETH/USD
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
