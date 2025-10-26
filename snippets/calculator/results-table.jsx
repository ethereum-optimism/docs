export const ResultsTable = ({ data }) => {
  if (!data) return null;

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

  const convertToMillionUnits = (value) => {
    return (value / 1000000).toFixed(6);
  };

  const calculateConstructionMessage = (
    _overallL1DataAndStateCostsMargin,
    _totalL1StateProposalCostsInETH,
    _modeledDAPlusStateRevenueOnL2
  ) => {
    const roundedE58IfNegative = Math.round(_overallL1DataAndStateCostsMargin * -1000) / 1000;
    const roundedE56 = Math.round(_totalL1StateProposalCostsInETH * 1000) / 1000;
    const roundedE58IfPositive = Math.round(_overallL1DataAndStateCostsMargin * 1000) / 1000;
    const roundedE118 = Math.round(_modeledDAPlusStateRevenueOnL2 * 1000) / 1000;

    if (_overallL1DataAndStateCostsMargin < 0) {
      return `Your chain would lose ${roundedE58IfNegative} ETH per day on L1 data costs (and ${roundedE56} ETH per day on state costs). Total daily L2 revenue from L1 data + state fees would be ${roundedE118} ETH.`;
    } else {
      return `Your chain would profit ${roundedE58IfPositive} ETH per day on L1 data costs (and ${roundedE56} ETH per day on state costs). Total daily L2 revenue from L1 data + state fees would be ${roundedE118} ETH.`;
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    border: '1px solid #ddd'
  };

  const thStyle = {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    fontWeight: 'bold'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee'
  };

  const messageStyle = {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '20px',
    fontSize: '14px',
    lineHeight: '1.5'
  };

  return (
    <div>
      <h3>Calculation Results</h3>
      
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Parameter</th>
            <th style={thStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Data Availability Type</td>
            <td style={tdStyle}>{dataAvailabilityType}</td>
          </tr>
          <tr>
            <td style={tdStyle}>L1 Blob Base Fee Scalar</td>
            <td style={tdStyle}>{convertToMillionUnits(l1BlobBaseFeeScalar)}M</td>
          </tr>
          <tr>
            <td style={tdStyle}>L1 Base Fee Scalar</td>
            <td style={tdStyle}>{convertToMillionUnits(l1BaseFeeScalar)}M</td>
          </tr>
          <tr>
            <td style={tdStyle}>Overall L1 Data & State Costs Margin</td>
            <td style={tdStyle}>{overallL1DataAndStateCostsMargin?.toFixed(4)} ETH/day</td>
          </tr>
          <tr>
            <td style={tdStyle}>Total L1 State Proposal Costs</td>
            <td style={tdStyle}>{totalL1StateProposalCostsInETH?.toFixed(6)} ETH/day</td>
          </tr>
          <tr>
            <td style={tdStyle}>Modeled DA + State Revenue on L2</td>
            <td style={tdStyle}>{modeledDAPlusStateRevenueOnL2?.toFixed(4)} ETH/day</td>
          </tr>
          <tr>
            <td style={tdStyle}>Data Availability In Use</td>
            <td style={tdStyle}>{dataAvailabilityInUse}</td>
          </tr>
          {dataAvailabilityType === "Ethereum" && (
            <>
              <tr>
                <td style={tdStyle}>Implied Data Gas Fee/Tx (Blobs)</td>
                <td style={tdStyle}>${impliedDataGasFeePerTxUsingBlobs?.toFixed(6)}</td>
              </tr>
              <tr>
                <td style={tdStyle}>Implied Data Gas Fee/Tx (Calldata)</td>
                <td style={tdStyle}>${impliedDataGasFeePerTxUsingL1Calldata?.toFixed(6)}</td>
              </tr>
            </>
          )}
          {dataAvailabilityType === "AltDA Plasma Mode" && (
            <tr>
              <td style={tdStyle}>Implied Data Gas Fee/Tx (Alt-DA)</td>
              <td style={tdStyle}>${impliedDataGasFeePerTxUsingAltDAPlasmaMode?.toFixed(6)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {assumedFeeScalarMessage && (
        <div style={messageStyle}>
          <strong>Fee Scalar Assumptions:</strong><br />
          {assumedFeeScalarMessage}
        </div>
      )}

      {impliedDataGasFeeMessage && (
        <div style={messageStyle}>
          <strong>Implied Data Gas Fee:</strong><br />
          {impliedDataGasFeeMessage}
        </div>
      )}

      <div style={messageStyle}>
        <strong>Revenue Analysis:</strong><br />
        {calculateConstructionMessage(
          overallL1DataAndStateCostsMargin,
          totalL1StateProposalCostsInETH,
          modeledDAPlusStateRevenueOnL2
        )}
      </div>
    </div>
  );
};
