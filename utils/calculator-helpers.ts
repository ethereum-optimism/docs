import { transactionTypes } from "./transaction-types";

const L1GasBaseFee =
  "https://static.optimism.io/op-analytics/reference_data/market_data/outputs/suggest_base_fee.txt"; // E76
const ethToUsdRate =
  "https://static.optimism.io/op-analytics/reference_data/market_data/outputs/ethusd.txt"; // E77
const blobBaseFee =
  "https://static.optimism.io/op-analytics/reference_data/market_data/outputs/blob_base_fee.txt"; // E78

function calculateConstructionState(
  stateOutputRootCostPerDay: number, // E58: number,
  totalOutputRootCost: number, // E56: number,
  totalExpectedMargin: number // E118: number
): string {
  if (stateOutputRootCostPerDay < 0) {
    return `This construction has ${
      Math.round(stateOutputRootCostPerDay * -1 * 1000) / 1000
    } ETH / day of estimated State Output root costs, not covered by Data Margin (${
      Math.round(totalOutputRootCost * 1000) / 1000
    } ETH Total Output Root Cost / Day) at inputted Blob/L1 Gas Prices`;
  } else {
    return `This construction is expected to have +${
      Math.round(stateOutputRootCostPerDay * 1000) / 1000
    } ETH Margin on Data Costs (${
      Math.round(100 * (stateOutputRootCostPerDay / totalExpectedMargin) * 10) /
      10
    }% Margin) at inputted L1 Gas Prices`;
  }
} // output = C27

function calculateImpliedDataGasFee(
  dataAvailabilityType: string, // E16: string
  altDAPlasmaModeFee: number, // E66: number
  blobDataFee: number, // E64: number
  l1CalldataFee: number // E67: number
): string {
  const fee =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? altDAPlasmaModeFee
      : blobDataFee > l1CalldataFee
      ? blobDataFee
      : l1CalldataFee;
  return `Implied Data Gas Fee per User Transaction: $${
    Math.round(fee * 10000) / 10000
  }`;
} // output = C28

function determineTransactionType(
  dataAvailabilityType: string, // E16: string,
  impliedDataGasFeePerTxUsingBlobs: number, // E64: number,
  impliedDataGasFeePerTxUsingL1Calldata: number // E67: number
): string {
  if (dataAvailabilityType === "AltDA Plasma Mode") {
    return "AltDA Plasma Mode";
  } else {
    return impliedDataGasFeePerTxUsingBlobs >
      impliedDataGasFeePerTxUsingL1Calldata
      ? "L1 Calldata"
      : "EIP-4844";
  }
} // output = F35

function calculateBlobTransactionCost(
  dataAvailabilityType: string, // E16: string
  altDATransactionCost: number, // E98: number
  blobDataFee: number, // E64: number
  l1CalldataFee: number, // E67: number
  l1CalldataCost: number, // E96: number
  blobCost: number // E94: number
): number {
  return dataAvailabilityType === "AltDA Plasma Mode"
    ? altDATransactionCost
    : blobDataFee > l1CalldataFee
    ? l1CalldataCost
    : blobCost;
} // output = E37

function summarizeFeeScalars(
  dataAvailabilityType: string, // E16: string
  blobFullnessPercentage: number, // N25: number
  blobsPerL1Transaction: number, // N26: number
  targetDataMargin: number, // E18: number
  isStateEnabled: string, // E24: string
  maxChannelDuration: number // E22: number
): string {
  const mode =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? "AltDA Plasma Mode, "
      : `${Math.round(blobFullnessPercentage * 100)}% Blob Fullness and ${
          Math.round(blobsPerL1Transaction * 10) / 10
        } Blobs per L1 Tx (Avg), `;
  const state = isStateEnabled === "Yes" ? " & State" : "";
  return `Fee Scalars Assume: ${mode}Target a ${Math.round(
    targetDataMargin * 100
  )}% Margin on DA${state}, ${
    Math.round(maxChannelDuration * 100000) / 100000
  } hour Max Submission Window.`;
} // output = G41

function calculateAltDAOrL1TransactionCost(
  dataAvailabilityType: string, //E16
  altDAPlasmaModeCost: number, // F98
  blobDataFee: number, // E64
  l1CalldataFee: number, // E67
  l1CalldataAltCost: number, // F96
  blobAltCost: number // F94
): number {
  if (dataAvailabilityType === "AltDA Plasma Mode") {
    return altDAPlasmaModeCost;
  } else {
    return blobDataFee > l1CalldataFee ? l1CalldataAltCost : blobAltCost;
  }
} // output = E38

function resultsRowOneScalars(
  dataAvailabilityType: string, // E16
  blobFullnessPercentage: number, // Advanced Inputs - N25
  blobsPerL1Transaction: number, // Advanced Inputs - N26
  targetDataMargin: number, // E18
  isStateEnabled: string, // E24
  maxChannelDuration: number // E22
): string {
  const mode =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? "AltDA Plasma Mode, "
      : `${Math.round(blobFullnessPercentage * 100)}% Blob Fullness and ${
          Math.round(blobsPerL1Transaction * 10) / 10
        } Blobs per L1 Tx (Avg), `;
  const state = isStateEnabled === "Yes" ? " & State" : "";
  return `Fee Scalars Assume: ${mode}Target a ${Math.round(
    targetDataMargin * 100
  )}% Margin on DA${state}, ${
    Math.round(maxChannelDuration * 100000) / 100000
  } hour Max Submission Window.`;
} // output = G41

function impliedDataGasFee(
  dataAvailabilityType: string, // E16
  blobgasBaseFee: number, // E78
  l1BaseFee: number, // E76
  ethToUsdRate: number // E77
): string {
  const mode =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? "AltDA Plasma Mode, "
      : `${Math.round(blobgasBaseFee * 100) / 100} gwei Blobgas Base Fee, `;
  return `Implied Data Gas Fee Assumes: ${mode}${
    Math.round(l1BaseFee * 10) / 10
  } gwei L1 Base Fee, ${Math.round(ethToUsdRate)} ETH/USD`;
} // output = G42

function convertToMillionUnits(value: number): number {
  return value / 1000000;
}

export async function getEthToUsdRate(): Promise<number> {
  const response = await fetch(ethToUsdRate);
  const rate = await response.text();
  return parseFloat(rate);
}

// transactionsPerDay === E14: number
// comparableTxnType === E15: string
// dataAvailabilityType === E16: string
// isFaultProofsEnabled === E17: boolean
// targetDataMargin === E18: number
// maxChannelDuration === E22: number
// outputRootPostFrequency === E23: number
// isStateEnabled: string, === E24: string

/**
 * Advanced Input -
 *
 * C8 | AvgEstimatedSizePerTx
 * check which comparableTxnType user selects
 * get AvgEstimatedSizePerTx for choice from constants or api
 * return AvgEstimatedSizePerTx value for C8
 *
 * C10 | impliedCTSL1Data =
 * (impliedBlobsPerDay * Total_Blobgas_Per_Blob) / (AvgEstimatedSizePerTx * transactionsPerDay[aka E14])
 *
 * C11 | impliedCTSL1Gas
 * (AvgEstimatedSizePerTx * transactionsPerDay * estimatedSize_CalldataGasRatio + (Avg_Compressed_Overhead_Gas_Per_Blob * impliedL1Txs)) / (AvgEstimatedSizePerTx * transactionsPerDay)
 *
 * C12 algorithm | estimatedSizeBlobgasRatio
 * check which comparableTxnType user selects
 * get estimatedSizeBlobgasRatio for choice from constants or api
 * return estimatedSizeBlobgasRatio value for C12
 *
 *
 * C13 | estimatedSize_CalldataGasRatio
 * =INDEX($A$20:$G$32,MATCH('Chain Estimator'!$E$15,$A$20:$A$32,0),MATCH($B13,$A$20:$G$20,0))
 * check which comparableTxnType user selects
 * get estimatedSize_CalldataGasRatio for choice from constants or api
 * return estimatedSize_CalldataGasRatio value for C13
 *
 *
 * N19 | impliedMinimumBlobsPerDay =
 * 24/ maxChannelDuration
 *
 *
 * N20 | impliedEstimatedSizePerBlob =
 * (N5 - N10 - N6) * estimatedSizeBlobgasRatio
 *
 *
 * N21 | impliedL2TxsPerBlob =
 * min((impliedEstimatedSizePerBlob / AvgEstimatedSizePerTx), (transactionsPerDay / (24 / maxChannelDuration)))
 *
 * N22 | impliedBlobsPerDay
 * transactionsPerDay / impliedL2TxsPerBlob
 *
 * N23 | impliedCalldataGasUsedIfL1
 * impliedEstimatedSizePerBlob * impliedBlobsPerDay * (C11 / 16) + (N11 * N22)
 *
 * N24 | L1TxLevelImpliedBlobFullness
 * MIN(N9,(C8*'Chain Estimator'!E14)*('Chain Estimator'!E22/24)/N20)
 *
 * N25 | blobLevelImpliedBlobFullness
 * (impliedL2TxsPerBlob * AvgEstimatedSizePerTx) / impliedEstimatedSizePerBlob
 *
 * N26 | impliedBlobsPerL1Tx
 * ROUND(MAX(N24/1,1),0)
 * round(max(L1TxLevelImpliedBlobFullness/1, 1), 0)
 *
 * N27 | impliedL1Txs
 * impliedBlobsPerDay / impliedBlobsPerL1Tx
 *
 * N30 | totalBlobCommitmentL1Gas
 * impliedL1Txs * L1_Gas_per_Blob_Commitment
 *
 * N31 | totalAltDAPlasmaModeCommitmentL1Gas
 * impliedBlobsPerDay * L1_Gas_Per_AltDA_Plasma_Mode_Commitment
 *
 * N33 | impliedStateProposalsPerDay
 * (outputRootPostFrequency === 0 ? 0 : 24) / outputRootPostFrequency
 *
 * N34 | totalStateProposalL1Gas
 * impliedStateProposalsPerDay * (isFaultProofsEnabled ? Avg_Total_Gas_Used_Per_L1_Fault_Proof_State_Proposal : Avg_Total_Gas_Used_Per_L1_State_Proposal)
 *
 * N35 | totalStateProposalL1GasCoveredByUsers
 * isStateEnabled ? 1 : 0 * totalStateProposalL1Gas
 *
 *
 * E64 | impliedDataGasFeePerTx:::: Using Blobs (EIP-4844)
 * =('Advanced Inputs'!C8*(16*F94*E76+E94*E78)/1000000/1000000000)*E77
 * ((AvgEstimatedSizePerTx * (16 * L1BaseFeeScalar * L1GasBaseFee * L1BlobBaseFeeScalar * blobBaseFee) / 1000000) / 1000000000) * ethToUsdRate
 *
 * E67 | impliedDataGasFeePerTx:::: Using L1calldata
 * =('Advanced Inputs'!C8*(16*F96*E76+E96*E78)/1000000/1000000000)*E77
 * ((AvgEstimatedSizePerTx * (16 * L1BaseFeeScalar[L1Calldata] * L1GasBaseFee * L1BlobBaseFeeScalar[L1Calldata] * blobBaseFee) / 1000000) / 1000000000) * ethToUsdRate
 *
 *
 * E94 | L1BlobBaseFeeScalar::: Using Blobs (EIP-4844)
 * if blobs ? ROUND((('Advanced Inputs'!C10/'Advanced Inputs'!N25/(1-E18))*1000000),0) : 0
 * const res = (impliedCTSL1Data / blobLevelImpliedBlobFullness) / (1-targetDataMargin)
 * Math.round(res * 1000000)
 *
 * E96 | L1BlobBaseFeeScalar:::: Using L1Calldata = 0
 *
 * E98 | L1BlobBaseFeeScalar ::: Using AltDA Plasma Mode = 0
 * check if AltDA mode = 0
 *
 * E76 | L1GasBaseFee
 *
 * F94 | L1BaseFeeScalar
 * =ROUND(((('Advanced Inputs'!N30+'Advanced Inputs'!N35)/(E14*(16*'Advanced Inputs'!C8)))/(1-E18))*1000000,0)
 * const res = (totalBlobCommitmentL1Gas + totalStateProposalL1GasCoveredByUsers)/ transactionsPerDay * (16 * AvgEstimatedSizePerTx) / (1 - targetDataMargin)
 * Math.round(res * 1000000)
 *
 * F96 | L1BaseFeeScalar:::: Using L1Calldata
 * =ROUND(((('Advanced Inputs'!C11/16)/(1-E18))*1000000),0)
 * Math.round(((impliedCTSL1Gas / 16) / (1-targetDataMargin))* 1000000)
 */

///////////////// CUSTOM HELPERS ////////////////////////////
const _determineDAInUse = (dataAvailabilityType: string): string => {
  return dataAvailabilityType === "AltDA Plasma Mode"
    ? "AltDA Plasma Mode"
    : dataAvailabilityType === "L1 Calldata"
    ? "L1 Calldata"
    : "EIP-4844";
};


// =INDEX($A$20:$G$32,MATCH('Chain Estimator'!$E$15,$A$20:$A$32,0),MATCH($B8,$A$20:$G$20,0))
export const getAvgEstimatedSizePerTx = (comparableTxnType: string) => {
  const output = transactionTypes[comparableTxnType].AvgEstimatedSizePerTx;
  console.log("c8::", output);
  return output;
}; // c8 done

// =(N22*N5)/(C8*'Chain Estimator'!E14)
export const calculateImpliedCTSL1Data = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n22 = calculateImpliedBlobsPerDay(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const n5 = Total_Blobgas_Per_Blob;
  const output = (n22 * n5) / (c8 * transactionsPerDay); ;
  console.log("c10::", output);
  return output;
}; // c10 done

// =(C8*'Chain Estimator'!E14*C13 + N11*N27)/(C8*'Chain Estimator'!E14)
export const calculateImpliedCTSL1Gas = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const c13 = getEstimatedSizeCalldataGasRatio(comparableTxnType);
  const n27 = calculateImpliedL1Txs(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const numerator =
    c8 * transactionsPerDay * c13 + Avg_Compressed_Overhead_Gas_Per_Blob * n27;
   const denominator = c8 * transactionsPerDay;
  const output = numerator / denominator;
  console.log("c11::", output);
  return output;
}; // c11 done

// =INDEX($A$20:$G$32,MATCH('Chain Estimator'!$E$15,$A$20:$A$32,0),MATCH($B12,$A$20:$G$20,0))
export const getEstimatedSizeBlobgasRatio = (comparableTxnType: string) => {
  const output = transactionTypes[comparableTxnType].EstimatedSizeBlobgasRatio;
  console.log("c12::", output);
  return output;
}; // c12 done

export const getEstimatedSizeCalldataGasRatio = (comparableTxnType: string) => {
  const output =
    transactionTypes[comparableTxnType].EstimatedSizeCalldataGasRatio;
  console.log("c13::", output);
  return output;
}; // c13 done

// =24/'Chain Estimator'!E22
const calculateImpliedMinimumBlobsPerDay = (
  maxChannelDuration: number
) => {
  const output = 24 / maxChannelDuration;
  console.log("n19::", output);
  return output;
}; // n19

// =(N5-N10-N6)*C12
export const calculateImpliedEstimatedSizePerBlob = (
  comparableTxnType: string
): number => {
  const c12 = getEstimatedSizeBlobgasRatio(comparableTxnType);
  const output =
    (Total_Blobgas_Per_Blob -
      Avg_Compressed_Overhead_Bytes_Per_Blob -
      Overhead_Blobgas_per_Blob) *
    c12;
  console.log("n20::", output);
  return output;
}; // n20 done

// =MIN(N20/C8,'Chain Estimator'!E14/(24/'Chain Estimator'!E22))
export const calculateImpliedL2TxsPerBlob = (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const n20 = calculateImpliedEstimatedSizePerBlob(comparableTxnType);
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const value1 = n20 / c8;
  const value2 = transactionsPerDay / (24 / maxChannelDuration);
  const output = Math.min(value1, value2);
  console.log("n21::", output);
  return output;
}; // n21 done

// ='Chain Estimator'!E14/N21
export const calculateImpliedBlobsPerDay = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const output =
    transactionsPerDay /
    calculateImpliedL2TxsPerBlob(
      comparableTxnType,
      transactionsPerDay,
      maxChannelDuration
    );
  console.log("n22::", output);
  return output;
}; // n22 done

// =N20*N22*(C11/16)+(N11*N22)
export const calculateImpliedCalldataGasUsedIfL1 = (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const n20 = calculateImpliedEstimatedSizePerBlob(comparableTxnType);
  const n22 = calculateImpliedBlobsPerDay(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const c11 = calculateImpliedCTSL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const output =
    n20 * n22 * (c11 / 16) + (Avg_Compressed_Overhead_Gas_Per_Blob * n22);
  console.log("n23::", output);
  return output;
}; // n23 done

// =MIN(N9,(C8*'Chain Estimator'!E14)*('Chain Estimator'!E22/24)/N20)
export const calculateL1TxLevelImpliedBlobFullness = (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const c8 = getEstimatedSizeCalldataGasRatio(comparableTxnType);
  const n20 = calculateImpliedEstimatedSizePerBlob(comparableTxnType);
  const result = (c8 * transactionsPerDay * (maxChannelDuration / 24)) / n20;
  const output = Math.min(Max_No_Of_Blobs_Per_L1_Transaction, result);
  console.log("n24::", output);
  return output;
}; // n24 done

// =(N21*C8)/N20
export const calculateBlobLevelImpliedBlobFullness = (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const n21 = calculateImpliedL2TxsPerBlob(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  );
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const n20 = calculateImpliedEstimatedSizePerBlob(comparableTxnType);
  const output = (n21 * c8) / n20;
  console.log("n25::", output);
  return output;
}; // n25 done

// =ROUND(MAX(N24/1,1),0)
export const calculateImpliedBlobsPerL1Tx = (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const n24 = calculateL1TxLevelImpliedBlobFullness(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  );
  const maxValue = Math.max(n24, 1);
  const output = Math.round(maxValue);
  console.log("n26::", output);
  return output;
}; // n26 done

// =N22/N26
export const calculateImpliedL1Txs = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n22 = calculateImpliedBlobsPerDay(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const n26 = calculateImpliedBlobsPerL1Tx(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  );
  const output = n22 / n26;
  console.log("n27::", output);
  return output;
}; // n27 done

// =N27*N7
export const calculateTotalBlobCommitmentL1Gas = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n27 = calculateImpliedL1Txs(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const output = n27 * L1_Gas_per_Blob_Commitment;
  console.log("n30::", output);
  return output;
}; // n30 done

// =N22*N8
export const calculateTotalAltDAPlasmaModeCommitmentL1Gas = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n22 = calculateImpliedBlobsPerDay(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const output = n22 * L1_Gas_Per_AltDA_Plasma_Mode_Commitment;
  console.log("n31::", output);
  return output;
}; // n31 done

// =IF('Chain Estimator'!E23=0,0,24/'Chain Estimator'!E23)
export const calculateImpliedStateProposalsPerDay = (
  outputRootPostFrequency: number
) => {
  const output =
    outputRootPostFrequency === 0 ? 0 : 24 / outputRootPostFrequency;
  console.log("n33::", output);
  return output;
}; // n33 done

// =N33*IF('Chain Estimator'!E17="Yes",N16,N12)
export const calculateTotalStateProposalL1Gas = (
  outputRootPostFrequency: number,
  isFaultProofsEnabled: boolean
): number => {
  const n33 = calculateImpliedStateProposalsPerDay(outputRootPostFrequency);
  const output =
    n33 *
    (isFaultProofsEnabled
      ? Avg_Total_Gas_Used_Per_L1_Fault_Proof_State_Proposal
      : Avg_Total_Gas_Used_Per_L1_State_Proposal);
  console.log("n34::", output);
  return output;
}; // n34 done

// =IF('Chain Estimator'!E24="Yes",1,0)*N34
export const calculateTotalStateProposalL1GasCoveredByUsers = (
  isStateEnabled: boolean,
  outputRootPostFrequency: number,
  isFaultProofsEnabled: boolean
) => {
  const n34 = calculateTotalStateProposalL1Gas(
    outputRootPostFrequency,
    isFaultProofsEnabled
  );
  const output = (isStateEnabled ? 1 : 0) * n34;
  console.log("n35::", output);
  return output;
}; // n35 done

const _calculateL1BlobBaseFeeScalar = (
  determinedDAInUse: string,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number
) => {
  let output = 0;
  const c10 = calculateImpliedCTSL1Data(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const n25 = calculateBlobLevelImpliedBlobFullness(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  );
  const e18 = _targetDataMarginInPercentage(targetDataMargin);
  if (determinedDAInUse === "EIP-4844") {
    output = (c10 / n25 / (1 - e18)) * 1000000;
  }

  console.log("_calculateL1BlobBaseFeeScalar:::", output);
  return Math.round(output);
};

export async function getL1GasBaseFee(): Promise<number> {
  const response = await fetch(L1GasBaseFee);
  const baseFee = await response.text();
  console.log("L1GasBaseFee_response::",baseFee);
  const output = parseFloat(baseFee);
  console.log("e76:::", output);
  return output;
} // e76 done

export const getBlobBaseFee = async (): Promise<number> => {
  const response = await fetch(blobBaseFee);
  const fee = await response.text();
  console.log("BlobBaseFee_response::", fee);
  const output = parseFloat(fee);
  console.log("e78:::", output);
  return output;
}; // e78 done

// =ROUND((('Advanced Inputs'!C10/'Advanced Inputs'!N25/(1-E18))*1000000),0)
export const calculateL1BlobBaseFeeScalarUsingBlob = (
  determinedDAInUse: string,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number
) => {
  const output = _calculateL1BlobBaseFeeScalar(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  console.log("e94:::", output);
  return output;
}; // e94 done

export const calculateL1BlobBaseFeeScalarUsingL1Calldata = (
  determinedDAInUse: string,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number
) => {
  const output = _calculateL1BlobBaseFeeScalar(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  console.log("e96::", output);
  return output;
}; // e96 done 

export const calculateL1BlobBaseFeeScalarUsingPlasmaMode = (
  determinedDAInUse: string,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number
) => {
  const output = _calculateL1BlobBaseFeeScalar(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
   console.log("e98::", output);
   return output;
}; // e98 done

export const calculateL1BaseFeeScalarUsingBlobs = (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number
) => {
  const n30 = calculateTotalBlobCommitmentL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const n35 = calculateTotalStateProposalL1GasCoveredByUsers(
    isStateEnabled,
    outputRootPostFrequency,
    isFaultProofsEnabled
  );
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const e18 = _targetDataMarginInPercentage(targetDataMargin);
  const numerator = n30 + n35;
  const denominator = transactionsPerDay * (16 * c8);
  const result = numerator / denominator / (1 - e18);
  return Math.round(result * 1000000);
}; // f94 done

export const calculateL1BaseFeeScalarUsingL1Calldata = (
  targetDataMargin: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
): number => {
  const e18 = _targetDataMarginInPercentage(targetDataMargin);
  const c11 = calculateImpliedCTSL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const value = c11 / 16 / (1 - e18);
  const output = Math.round(value * 1000000);
  console.log("f96::", output)
  return output
}; // f96 done

export const calculateL1BaseFeeScalarUsingPlasmaMode = (
  targetDataMargin: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  isStateEnabled: boolean,
  outputRootPostFrequency: number,
  isFaultProofsEnabled: boolean
) => {
  const n31 = calculateTotalAltDAPlasmaModeCommitmentL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const n35 = calculateTotalStateProposalL1GasCoveredByUsers(
    isStateEnabled,
    outputRootPostFrequency,
    isFaultProofsEnabled
  );
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const e18 = _targetDataMarginInPercentage(targetDataMargin);
  const value = (n31 + n35) / (transactionsPerDay * (16 * c8)) / (1 - e18);
  const output = Math.round(value * 1000000);
  console.log("f98::", output);
  return output;
}; // f98 done

const _targetDataMarginInPercentage = (targetDataMargin: number): number => {
  return targetDataMargin / 100;
};

const _getCalculateImpliedDataGasFeePerTxParams = async (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number,
  dataAvailabilityType: string
) => {
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const f94 = calculateL1BaseFeeScalarUsingBlobs(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const f96 = calculateL1BaseFeeScalarUsingL1Calldata(
    targetDataMargin,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const e76 = await getL1GasBaseFee();
  const determinedDAInUse = _determineDAInUse(dataAvailabilityType);
  const e94 = calculateL1BlobBaseFeeScalarUsingBlob(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const e96 = calculateL1BlobBaseFeeScalarUsingL1Calldata(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const e78 = await getBlobBaseFee();
  const e77 = await getEthToUsdRate();
  return { c8, e76, e77, e78, e94, e96, f94, f96 };
};

const _getBaseFeeScalarCalculationParams = async (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number,
  dataAvailabilityType: string
) => {
  const determinedDAInUse = _determineDAInUse(dataAvailabilityType);
  const e98 = calculateL1BlobBaseFeeScalarUsingPlasmaMode(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const e64 = await calculateImpliedDataGasFeePerTxUsingBlobs(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    dataAvailabilityType,
    targetDataMargin
  );
  const e67 = await calculateImpliedDataGasFeePerTxUsingL1Calldata(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    dataAvailabilityType,
    targetDataMargin
  );
  const e96 = calculateL1BlobBaseFeeScalarUsingL1Calldata(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const e94 = calculateL1BlobBaseFeeScalarUsingBlob(
    determinedDAInUse,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const f94 = calculateL1BaseFeeScalarUsingBlobs(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin
  );
  const f96 = calculateL1BaseFeeScalarUsingL1Calldata(
    targetDataMargin,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const f98 = calculateL1BaseFeeScalarUsingPlasmaMode(
    targetDataMargin,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    isStateEnabled,
    outputRootPostFrequency,
    isFaultProofsEnabled
  );
  return { e98, e64, e67, e96, e94, f94, f96, f98 };
};

export const calculateImpliedDataGasFeePerTxUsingBlobs = async (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  dataAvailabilityType: string,
  targetDataMargin: number
) => {
  const { c8, f94, e76, e77, e78, e94 } =
    await _getCalculateImpliedDataGasFeePerTxParams(
      isStateEnabled,
      isFaultProofsEnabled,
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTxnType,
      targetDataMargin,
      dataAvailabilityType
    );
  const value = (c8 * (16 * f94 * e76 + e94 * e78)) / 1000000 / 1000000000;
  const output = value * e77;
  console.log("e64::", output)
  return output
}; // e64 done

export const calculateImpliedDataGasFeePerTxUsingL1Calldata = async (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  dataAvailabilityType: string,
  targetDataMargin: number
) => {
  const { c8, f96, e76, e77, e78, e96 } =
    await _getCalculateImpliedDataGasFeePerTxParams(
      isStateEnabled,
      isFaultProofsEnabled,
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTxnType,
      targetDataMargin,
      dataAvailabilityType
    );
  const value = (c8 * (16 * f96 * e76 + e96 * e78)) / 1000000 / 1000000000;
  const output = value * e77;
   console.log("e67::", output);
   return output;
}; // e67 done

export async function displayL1BlobBaseFeeScalar(
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  dataAvailabilityType: string,
  targetDataMargin: number
) {
  const { e98, e64, e67, e96, e94 } = await _getBaseFeeScalarCalculationParams(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin,
    dataAvailabilityType
  );
  return calculateBlobTransactionCost(
    dataAvailabilityType,
    e98,
    e64,
    e67,
    e96,
    e94
  );
} // e37 done

export async function displayL1BaseFeeScalar(
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  targetDataMargin: number,
  dataAvailabilityType: string
) {
  const { f98, e64, e67, f96, f94 } = await _getBaseFeeScalarCalculationParams(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin,
    dataAvailabilityType
  );
  return calculateAltDAOrL1TransactionCost(dataAvailabilityType, f98, e64, e67, f96, f94);
} // e38

export const Total_Blobgas_Per_Blob = 131072; // N5
export const Overhead_Blobgas_per_Blob = 1028; // N6
export const L1_Gas_per_Blob_Commitment = 21000.0; // N7
export const L1_Gas_Per_AltDA_Plasma_Mode_Commitment = 21532.0; // N8
export const Max_No_Of_Blobs_Per_L1_Transaction = 5; // N9
export const Avg_Compressed_Overhead_Bytes_Per_Blob = 406; // N10
export const Avg_Compressed_Overhead_Gas_Per_Blob = 6385; // N11
export const Avg_Total_Gas_Used_Per_L1_State_Proposal = 86847.5; // N12
export const FastLZ_Intercept = -42585600; // N13
export const FastLZ_Coefficient = 836500; // N14
export const FatLZ_Min_Transaction_Size = 100; // N15
export const Avg_Total_Gas_Used_Per_L1_Fault_Proof_State_Proposal = 420926.0; // N16
