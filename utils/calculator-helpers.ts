import { transactionTypes } from "./transaction-types";

const L1GasBaseFee =
  "https://raw.githubusercontent.com/ethereum-optimism/op-analytics/refs/heads/main/reference_data/market_data/outputs/suggest_base_fee.txt"; // E76
const ethToUsdRate =
  "https://raw.githubusercontent.com/ethereum-optimism/op-analytics/refs/heads/main/reference_data/market_data/outputs/ethusd.txt"; // E77
const blobBaseFee =
  "https://raw.githubusercontent.com/ethereum-optimism/op-analytics/refs/heads/main/reference_data/market_data/outputs/blob_base_fee.txt"; // E78

// transactionsPerDay === E14: number
// comparableTxnType === E15: string
// dataAvailabilityType === E16: string
// isFaultProofsEnabled === E17: boolean
// targetDataMargin === E18: number
// maxChannelDuration === E22: number
// outputRootPostFrequency === E23: number
// isStateEnabled: boolean, === E24: string

// ModeledExpectedStateCostsOnL1: number === e120 == n40 == e56
// ModeledDACostsOnL1: number === e119 == e55
// ModeledDAPlusStateRevenueOnL2: number === e118

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

export function resultsFeeScalarsAssumed(
  comparableTxnType: string, // e15
  transactionsPerDay: number, // e14
  dataAvailabilityType: string, // E16
  targetDataMargin: number, // E18
  isStateEnabled: string, // E24
  maxChannelDuration: number // E22
): string {
  const n25: number = calculateBlobLevelImpliedBlobFullness(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  ) // n25
  
 const n26: number = calculateImpliedBlobsPerL1Tx(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  ); // n26
  const mode =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? "AltDA Plasma Mode, "
      : `${Math.round(n25 * 100)}% Blob Fullness and ${
          Math.round(n26 * 10) / 10
        } Blobs per L1 Tx (Avg), `;
  const state = isStateEnabled === "Yes" ? " & State" : "";
  return `Fee Scalars Assume: ${mode}Target a ${Math.round(
    targetDataMargin
  )}% Margin on DA${state}, ${
    Math.round(maxChannelDuration * 100000) / 100000
  } hour Max Submission Window.`;
} // output = G41

export async function impliedDataGasFee(
  dataAvailabilityType: string, // E16
): Promise<string> {
 const blobgasBaseFee: number = await getBlobBaseFee()// E78
  const l1BaseFee: number = await getL1GasBaseFee(); // E76
 const ethToUsdRate: number = await getEthToUsdRate() // E77
  const mode =
    dataAvailabilityType === "AltDA Plasma Mode"
      ? "AltDA Plasma Mode, "
      : `${Math.round(blobgasBaseFee * 100) / 100} gwei Blobgas Base Fee, `;
  return `Implied Data Gas Fee Assumes: ${mode}${
    Math.round(l1BaseFee * 10) / 10
  } gwei L1 Base Fee, ${Math.round(ethToUsdRate)} ETH/USD`;
} // output = G42

export function convertToMillionUnits(value: number): number {
  return value / 1000000;
}

export async function getEthToUsdRate(): Promise<number> {
  try {
    const response = await fetch(ethToUsdRate);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    const rateText = await response.text();
    const rate = parseFloat(rateText);
    if (isNaN(rate)) {
      throw new Error(`Failed to parse ETH to USD rate: ${rateText}`);
    }
    return rate;
  } catch (error) {
    console.error('Error fetching ETH to USD rate:', error);
    throw error;
  }
}

export const determineDAInUse = (dataAvailabilityType: string): string => {
  return dataAvailabilityType === "AltDA Plasma Mode"
    ? "AltDA Plasma Mode"
    : dataAvailabilityType === "L1 Calldata"
    ? "L1 Calldata"
    : "EIP-4844";
};

// =INDEX($A$20:$G$32,MATCH('Chain Estimator'!$E$15,$A$20:$A$32,0),MATCH($B8,$A$20:$G$20,0))
const getAvgEstimatedSizePerTx = (comparableTxnType: string) => {
    if (!transactionTypes[comparableTxnType]) {
      throw new Error(`Invalid transaction type: ${comparableTxnType}`);
    }
  const output = transactionTypes[comparableTxnType].AvgEstimatedSizePerTx;
  console.log("c8::", output);
  return output;
}; // c8 done

// =(N22*N5)/(C8*'Chain Estimator'!E14)
const calculateImpliedCTSL1Data = (
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
const calculateImpliedCTSL1Gas = (
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
const getEstimatedSizeBlobgasRatio = (comparableTxnType: string) => {
  const output = transactionTypes[comparableTxnType].EstimatedSizeBlobgasRatio;
  console.log("c12::", output);
  return output;
}; // c12 done

const getEstimatedSizeCalldataGasRatio = (comparableTxnType: string) => {
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
const calculateImpliedEstimatedSizePerBlob = (
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
const calculateImpliedL2TxsPerBlob = (
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
const calculateImpliedBlobsPerDay = (
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
const calculateImpliedCalldataGasUsedIfL1 = (
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
const calculateL1TxLevelImpliedBlobFullness = (
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
const calculateBlobLevelImpliedBlobFullness = (
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
const calculateImpliedBlobsPerL1Tx = (
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
const calculateImpliedL1Txs = (
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
const calculateTotalBlobCommitmentL1Gas = (
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
const calculateTotalAltDAPlasmaModeCommitmentL1Gas = (
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

// N22 * N5
const calculateTotalBlobgas = (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n22 = calculateImpliedBlobsPerDay(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const output = n22 * Total_Blobgas_Per_Blob;
  console.log("n32::", output)
  return output;
}; // n32

// =IF('Chain Estimator'!E23=0,0,24/'Chain Estimator'!E23)
const calculateImpliedStateProposalsPerDay = (
  outputRootPostFrequency: number
) => {
  const output =
    outputRootPostFrequency === 0 ? 0 : 24 / outputRootPostFrequency;
  console.log("n33::", output);
  return output;
}; // n33 done

// =N33*IF('Chain Estimator'!E17="Yes",N16,N12)
const calculateTotalStateProposalL1Gas = (
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
const calculateTotalStateProposalL1GasCoveredByUsers = (
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

// =N30*'Chain Estimator'!E76/1000000000 
const calculateTotalBlobCommitmentCostsInETH = async (
 transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n30 = calculateTotalBlobCommitmentL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const e76 = await getL1GasBaseFee();
  const output = (n30 * e76) / 1000000000;
  console.log("n36::", output)
  return output;
} // n36

// =N31*'Chain Estimator'!E76/1000000000 
const calculateTotalAltDAPlasmaModeCommitmentCostsInETH = async (
   transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n31 = calculateTotalAltDAPlasmaModeCommitmentL1Gas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const e76 = await getL1GasBaseFee();
  const output = n31 * e76 / 1000000000;
  console.log("n37::", output)
  return output;
} // n37 done

// =N32*'Chain Estimator'!E78/1000000000
const calculateTotalBlobgasCostsInETH = async (
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
) => {
  const n32 = calculateTotalBlobgas(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const e78 = await getBlobBaseFee(); 
  const output = (n32 * e78) / 1000000000;
    console.log("n38::", output);
    return output;
} // n38

// =N23*'Chain Estimator'!E76/1000000000
const calculateTotalL1CalldataCostsInETHIfL1 = async (
  comparableTxnType: string,
  transactionsPerDay: number,
  maxChannelDuration: number
) => {
  const n23 = calculateImpliedCalldataGasUsedIfL1(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  ) 
  const e76 = await getL1GasBaseFee();
  const output = (n23 * e76) / 1000000000;
  console.log("n39::", output);
  return output;
} // n39

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

async function getL1GasBaseFee(): Promise<number> {
  try {
    const response = await fetch(L1GasBaseFee);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    const baseFeeText = await response.text();
    console.log("L1GasBaseFee_response::", baseFeeText);
    const output = parseFloat(baseFeeText);
    if (isNaN(output)) {
      throw new Error(`Failed to parse L1 Gas Base Fee: ${baseFeeText}`);
    }
    console.log("e76:::", output);
    return output;
  } catch (error) {
    console.error('Error fetching L1 Gas Base Fee:', error);
    throw error;
  }
}

const getBlobBaseFee = async (): Promise<number> => {
  try {
    const response = await fetch(blobBaseFee);
   if (!response.ok) {
     throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
   }
    const feeText = await response.text();
    console.log("BlobBaseFee_response::", feeText);
    const output = parseFloat(feeText);
  if (isNaN(output)) {
     throw new Error(`Failed to parse Blob Base Fee: ${feeText}`);
  }
    console.log("e78:::", output);
    return output;
  } catch (error) {
    console.error('Error fetching Blob Base Fee:', error);
    throw error;
  }
};

// =ROUND((('Advanced Inputs'!C10/'Advanced Inputs'!N25/(1-E18))*1000000),0)
const calculateL1BlobBaseFeeScalarUsingBlob = (
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

const calculateL1BlobBaseFeeScalarUsingL1Calldata = (
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

const calculateL1BlobBaseFeeScalarUsingPlasmaMode = (
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

const calculateL1BaseFeeScalarUsingBlobs = (
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

const calculateL1BaseFeeScalarUsingL1Calldata = (
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

const calculateL1BaseFeeScalarUsingPlasmaMode = (
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
  const determinedDAInUse = determineDAInUse(dataAvailabilityType);
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
  const determinedDAInUse = determineDAInUse(dataAvailabilityType);
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

// =('Advanced Inputs'!C8*(16*F98*E76+E98*E78)/1000000/1000000000)*E77
export const calculateImpliedDataGasFeePerTxUsingAltDAPlasmaMode = async (
  isStateEnabled: boolean,
  isFaultProofsEnabled: boolean,
  outputRootPostFrequency: number,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string,
  dataAvailabilityType: string,
  targetDataMargin: number
) => {
  const { c8, e76, e77, e78} =
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
  const { f98, e98 } = await _getBaseFeeScalarCalculationParams(
    isStateEnabled,
    isFaultProofsEnabled,
    outputRootPostFrequency,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType,
    targetDataMargin,
    dataAvailabilityType
  );

  const part1 = 16 * f98 * e76;
  const part2 = e98 * e78;
  const sum = part1 + part2;
  const result = sum / 1000000 / 1000000000;
  const output = c8 * result * e77;
  console.log("e66::", output);
  return output;
}; // e66

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

// =N34*'Chain Estimator'!E76/1000000000
export const calculateTotalL1StateProposalCostsInETH = async (
  outputRootPostFrequency: number,
  isFaultProofsEnabled: boolean
) => {
  const n34 = calculateTotalStateProposalL1Gas(
    outputRootPostFrequency,
    isFaultProofsEnabled
  );
  const e76 = await getL1GasBaseFee();
  const output = (n34 * e76) / 1000000000;
  console.log("n40::", output)
  return output;
}; // n40 done

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
} // e38 done

// =E118-(E56+E55) | OverallL1DataAndStateCostsMargin
export const calculateOverallL1DataAndStateCostsMargin = async (
  transactionsPerDay: number,
  comparableTxnType: string,
  displayL1BlobBaseFeeScalar: number,
  displayL1BaseFeeScalar: number,
   dataAvailabilityType: string,
  maxChannelDuration: number,
  outputRootPostFrequency: number,
  isFaultProofsEnabled: boolean
) => {
  const e118 = await calculateModeledDAPlusStateRevenueOnL2(transactionsPerDay, comparableTxnType, displayL1BlobBaseFeeScalar, displayL1BaseFeeScalar)
  const e55 = await calculateModeledDACostsOnL1(
    dataAvailabilityType,
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const e56 = await calculateTotalL1StateProposalCostsInETH(
    outputRootPostFrequency,
    isFaultProofsEnabled
  )
    const output = e118 - (e56 + e55);
    console.log("e58::", output);
    return output;
} // e58

// =(E14*'Advanced Inputs'!C8*(16*G38*E76/1000000000+G37*E78/1000000000))
export const calculateModeledDAPlusStateRevenueOnL2 = async (
  transactionsPerDay: number,
  comparableTxnType: string,
  displayL1BlobBaseFeeScalar: number,
  displayL1BaseFeeScalar: number
) => {
  const c8 = getAvgEstimatedSizePerTx(comparableTxnType);
  const g38 = convertToMillionUnits(displayL1BaseFeeScalar);
  const g37 = convertToMillionUnits(displayL1BlobBaseFeeScalar);
  const e76 = await getL1GasBaseFee();
  const e78 = await getBlobBaseFee();
  const part1 = (16 * g38 * e76) / 1000000000;
  const part2 = (g37 * e78) / 1000000000;
  const output = transactionsPerDay * c8 * (part1 + part2);
  console.log("e118::", output)
  return output
} // e118

async function calculateModeledDACostsOnL1(
  dataAvailabilityType: string,
  transactionsPerDay: number,
  maxChannelDuration: number,
  comparableTxnType: string
): Promise<number> {
  let output = 0;
  const f35 = determineDAInUse(dataAvailabilityType);
  const n36 = await calculateTotalBlobCommitmentCostsInETH(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  );
  const n37 = await calculateTotalAltDAPlasmaModeCommitmentCostsInETH(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const n38 = await calculateTotalBlobgasCostsInETH(
    transactionsPerDay,
    maxChannelDuration,
    comparableTxnType
  )
  const n39 = await calculateTotalL1CalldataCostsInETHIfL1(
    comparableTxnType,
    transactionsPerDay,
    maxChannelDuration
  ) 
  if (dataAvailabilityType === "AltDA Plasma Mode") {
    output = n37;
  } else if (f35 === "EIP-4844") {
    output = n36 + n38;
  } else {
    output = n39;
  }
  console.log("e119::", output)
  return output
} // e119


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