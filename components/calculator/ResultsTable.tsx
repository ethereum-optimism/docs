import { convertToMillionUnits } from "@/utils/calculator-helpers";
import type { ReactElement } from "react";

export type ResultsParams = {
  data: {
    dataAvailabilityType: string; // e16
    l1BlobBaseFeeScalar: number; // e37
    l1BaseFeeScalar: number; // e38
    overallL1DataAndStateCostsMargin: number; // e58
    totalL1StateProposalCostsInETH: number; // e56
    modeledDAPlusStateRevenueOnL2: number; // e118
    dataAvailabilityInUse: string; // f35
    impliedDataGasFeePerTxUsingBlobs: number; // e64
    impliedDataGasFeePerTxUsingL1Calldata: number; // e67
    impliedDataGasFeePerTxUsingAltDAPlasmaMode: number; // e66,
    assumedFeeScalarMessage: string;
    impliedDataGasFeeMessage: string;
  };
};

export function ResultsTable({
  data
}: ResultsParams): ReactElement {

  const {
    dataAvailabilityType,
    l1BlobBaseFeeScalar,
    l1BaseFeeScalar,
    overallL1DataAndStateCostsMargin,
    totalL1StateProposalCostsInETH,
    modeledDAPlusStateRevenueOnL2,
    dataAvailabilityInUse,
    impliedDataGasFeePerTxUsingBlobs,
    impliedDataGasFeePerTxUsingAltDAPlasmaMode,
    impliedDataGasFeePerTxUsingL1Calldata,
    assumedFeeScalarMessage,
    impliedDataGasFeeMessage,
  } = data;

  function calculateConstructionMessage(
    _overallL1DataAndStateCostsMargin: number, // Corresponds to E58
    _totalL1StateProposalCostsInETH: number, // Corresponds to E56
    _modeledDAPlusStateRevenueOnL2: number // Corresponds to E118
  ): string {
    const roundedE58IfNegative =
      Math.round(_overallL1DataAndStateCostsMargin * -1000) / 1000;
    const roundedE56 =
      Math.round(_totalL1StateProposalCostsInETH * 1000) / 1000;
    const roundedE58IfPositive =
      Math.round(_overallL1DataAndStateCostsMargin * 1000) / 1000; 
    const marginPercentage =
      Math.round(100 * (_overallL1DataAndStateCostsMargin / _modeledDAPlusStateRevenueOnL2) * 10) / 10;
    const messageIfE58Negative = `This construction has <span>${roundedE58IfNegative}</span> ETH / day of estimated State Output root costs, not covered by Data Margin (${roundedE56} ETH Total Output Root Cost / Day) at inputted Blob/L1 Gas Prices.`;
    const messageIfE58Positive = `This construction is expected to have +${roundedE58IfPositive} ETH Margin on Data Costs (${marginPercentage}% Margin) at inputted L1 Gas Prices.`;
    return _overallL1DataAndStateCostsMargin < 0 ? messageIfE58Negative : messageIfE58Positive
  }

  function calculateDataGasFee(
    _dataAvailabilityType: string, // Corresponds to E16
    _dataAvailabilityInUse: string, // Corresponds to F35
    _impliedDataGasFeePerTxUsingAltDAPlasmaMode: number, // Corresponds to E66
    _impliedDataGasFeePerTxUsingBlobs: number, // Corresponds to E64
    _impliedDataGasFeePerTxUsingL1Calldata: number // Corresponds to E67
  ): string {
    let gasFee: number;
    _dataAvailabilityType === "AltDA Plasma Mode"
      ? (gasFee = _impliedDataGasFeePerTxUsingAltDAPlasmaMode)
      : _dataAvailabilityInUse === "EIP-4844"
      ? (gasFee = _impliedDataGasFeePerTxUsingBlobs)
      : (gasFee = _impliedDataGasFeePerTxUsingL1Calldata);

    // Round the gas fee to 4 decimal places
    const roundedGasFee = Math.round(gasFee * 10000) / 10000;
    return `Implied Data Gas Fee per User Transaction: $${roundedGasFee}`;
  }

  return (
    <div className="calculator-results-wrap">
      <div className="construction-info">
        <p>
          {calculateConstructionMessage(
            overallL1DataAndStateCostsMargin,
            totalL1StateProposalCostsInETH,
            modeledDAPlusStateRevenueOnL2
          )}
        </p>
        <p>
          {calculateDataGasFee(
            dataAvailabilityType,
            dataAvailabilityInUse,
            impliedDataGasFeePerTxUsingAltDAPlasmaMode,
            impliedDataGasFeePerTxUsingBlobs,
            impliedDataGasFeePerTxUsingL1Calldata
          )}
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
              href="/operators/chain-operators/management/blobs#determine-scalar-values-for-using-blobs"
              target="_blank"
            >
              read how to determine scalar values using blobs
            </a>
          </p>
        </div>
        <div className="results-table-wrap">
          <table className="results-table table">
            <thead>
              <tr>
                <th colSpan={2}>DA Recommendation:</th>
                <th>{`${
                  dataAvailabilityInUse === "EIP-4844"
                    ? `Blobs (EIP-4844)`
                    : dataAvailabilityInUse
                }`}</th>
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
                <td>{l1BlobBaseFeeScalar}</td>
                <td>{convertToMillionUnits(l1BlobBaseFeeScalar)}</td>
              </tr>
              <tr>
                <td>l1BaseFeeScalar</td>
                <td>{l1BaseFeeScalar}</td>
                <td>{convertToMillionUnits(l1BaseFeeScalar)}</td>
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
              {assumedFeeScalarMessage}
            </p>
            <p>
              {impliedDataGasFeeMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
