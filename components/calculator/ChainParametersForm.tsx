import type { ReactElement } from "react";
import { useState } from "react";
import { TextInput, SelectInput } from "./Inputs";
import { ResultsParams, ResultsTable } from "./ResultsTable";
import {
  displayL1BaseFeeScalar,
  displayL1BlobBaseFeeScalar,
  calculateOverallL1DataAndStateCostsMargin,
  calculateModeledDAPlusStateRevenueOnL2,
  calculateTotalL1StateProposalCostsInETH,
  determineDAInUse,
  calculateImpliedDataGasFeePerTxUsingBlobs,
  calculateImpliedDataGasFeePerTxUsingL1Calldata,
  calculateImpliedDataGasFeePerTxUsingAltDAPlasmaMode,
  resultsFeeScalarsAssumed,
  impliedDataGasFee
} from "@/utils/calculator-helpers";
import { Loader } from "./Loader";

type ComparableTransactionType = "Base" | "Zora" | "Mint" | "Mode";
type DataAvailabilityType = "Ethereum" | "AltDA Plasma Mode";

export function ChainParametersForm(): ReactElement {
  const [transactionsPerDay, setTransactionsPerDay] = useState(500000);
  const [comparableTransactionType, setComparableTransactionType] =
    useState<ComparableTransactionType>("General OP Mainnet");
  const [dataAvailabilityType, setDataAvailabilityType] = useState<DataAvailabilityType>("Ethereum");
  const [isFaultProofEnabled, setIsFaultProofEnabled] = useState("yes");
  const [targetDataFeeMargin, setTargetDataFeeMargin] = useState(5);
  const [maxBlobsPerL1Transaction, setMaxBlobsPerL1Transaction] = useState(5);
  const [maxChannelDuration, setMaxChannelDuration] = useState(5);
  const [outputRootPostFrequency, setOutputRootPostFrequency] = useState(1  );
  const [isIncludeOutputRootCosts, setIsIncludeOutputRootCosts] = useState("yes");
  const [resultsParams, setResultsParams] = useState<ResultsParams>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const comparableTransactionTypeOptions = [
    "General OP Mainnet",
    "Base",
    "Zora",
    "Mint",
    "Mode",
  ];
  const dataAvailabilityTypeOptions = ["Ethereum", "AltDA Plasma Mode"];
  const booleanOptions = ["Yes", "No"];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResult(false)

    //e37
    const l1BlobBaseFeeScalar = await displayL1BlobBaseFeeScalar(
      stringToBoolean(isIncludeOutputRootCosts),
      stringToBoolean(isFaultProofEnabled),
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTransactionType,
      dataAvailabilityType,
      targetDataFeeMargin
    );

    //e38
    const l1BaseFeeScalar = await displayL1BaseFeeScalar(
      isIncludeOutputRootCosts,
      isFaultProofEnabled,
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTransactionType,
      targetDataFeeMargin,
      dataAvailabilityType
    );

    // e58
    const overallL1DataAndStateCostsMargin =
      await calculateOverallL1DataAndStateCostsMargin(
        transactionsPerDay,
        comparableTransactionType,
        l1BlobBaseFeeScalar,
        l1BaseFeeScalar,
        dataAvailabilityType,
        maxChannelDuration,
        outputRootPostFrequency,
        isFaultProofEnabled
      );

    //e56
    const totalL1StateProposalCostsInETH =
      await calculateTotalL1StateProposalCostsInETH(
        outputRootPostFrequency,
        isFaultProofEnabled
      );

    // e118
    const modeledDAPlusStateRevenueOnL2 =
      await calculateModeledDAPlusStateRevenueOnL2(
        transactionsPerDay,
        comparableTransactionType,
        l1BlobBaseFeeScalar,
        l1BaseFeeScalar
      );

    // e64
    const impliedDataGasFeePerTxUsingBlobs =
      await calculateImpliedDataGasFeePerTxUsingBlobs(
        isIncludeOutputRootCosts,
        isFaultProofEnabled,
        outputRootPostFrequency,
        transactionsPerDay,
        maxChannelDuration,
        comparableTransactionType,
        dataAvailabilityType,
        targetDataFeeMargin
      );
   
    // e67
    const impliedDataGasFeePerTxUsingL1Calldata =
      await calculateImpliedDataGasFeePerTxUsingL1Calldata(
        isIncludeOutputRootCosts,
        isFaultProofEnabled,
        outputRootPostFrequency,
        transactionsPerDay,
        maxChannelDuration,
        comparableTransactionType,
        dataAvailabilityType,
        targetDataFeeMargin
      );

    // e66
    const impliedDataGasFeePerTxUsingAltDAPlasmaMode =
      await calculateImpliedDataGasFeePerTxUsingAltDAPlasmaMode(
        isIncludeOutputRootCosts,
        isFaultProofEnabled,
        outputRootPostFrequency,
        transactionsPerDay,
        maxChannelDuration,
        comparableTransactionType,
        dataAvailabilityType,
        targetDataFeeMargin
      );

    const dataAvailabilityInUse = determineDAInUse(dataAvailabilityType);
    
    const assumedFeeScalarMessage = resultsFeeScalarsAssumed(
      comparableTransactionType, // e15
      transactionsPerDay, // e14
      dataAvailabilityType, // E16
      targetDataFeeMargin, // E18
      isIncludeOutputRootCosts, // E24
      maxChannelDuration // E22
    );
    const impliedDataGasFeeMessage = await impliedDataGasFee(dataAvailabilityType)

    const data = {
      dataAvailabilityType, // e16
      l1BlobBaseFeeScalar, // e37
      l1BaseFeeScalar, // e38
      overallL1DataAndStateCostsMargin, // e58
      totalL1StateProposalCostsInETH, // e56
      modeledDAPlusStateRevenueOnL2, // e118
      dataAvailabilityInUse, // F35
      impliedDataGasFeePerTxUsingBlobs, // e64
      impliedDataGasFeePerTxUsingL1Calldata, // e67
      impliedDataGasFeePerTxUsingAltDAPlasmaMode, // e66
      assumedFeeScalarMessage,
      impliedDataGasFeeMessage,
    };
    setResultsParams(data);
    setIsLoading(false);
    setShowResult(true)
  };

  const stringToBoolean = (value: string): boolean => {
    return value === "yes" || value === "Yes" ? true : false;
  }

  return (
    <div>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="calculator-chain-inputs">
          <h2 className="calculator-heading_sub">Chain Inputs</h2>
          <TextInput
            otherProps={{ value: transactionsPerDay }}
            onInputChange={setTransactionsPerDay}
            labelClass="calculator-label"
            description="Txs / Day, excluding Internal system transactions"
            type="number"
            className="calculator-input mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Transactions per Day"
          />

          <SelectInput
            labelClass="calculator-label"
            data={comparableTransactionTypeOptions}
            onSelect={setComparableTransactionType}
            description="What are the transaction types are similar to"
            className="calculator-select t-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Comparable Transaction Type"
          />

          <SelectInput
            labelClass="calculator-label"
            data={dataAvailabilityTypeOptions}
            onSelect={setDataAvailabilityType}
            description="Ethereum (Blobs or Calldata) or AltDA Plasma Mode (Alt-DA)"
            className="calculator-select t-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Data Availability Type"
          />

          <SelectInput
            labelClass="calculator-label"
            data={booleanOptions}
            onSelect={setIsFaultProofEnabled}
            description="Are Fault Proofs enabled on the chain? (Note: Ethereum DA Only)"
            className="calculator-select t-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Fault Proofs Enabled"
          />

          <TextInput
            otherProps={{ value: targetDataFeeMargin }}
            onInputChange={setTargetDataFeeMargin}
            description="Buffer charged on top of L1 & Blob Data costs"
            labelClass="calculator-label"
            type="number"
            className="calculator-input mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Target Data Fee Margin"
          />
        </div>
        <div className="calculator-advanced-inputs">
          <h2 className="calculator-heading_sub">Advanced Inputs</h2>
          <TextInput
            otherProps={{ value: maxBlobsPerL1Transaction }}
            onInputChange={setMaxBlobsPerL1Transaction}
            labelClass="calculator-label"
            description="Maximum amount of blobs submitted per L1 Transaction (max: 6)"
            type="number"
            className="calculator-input mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Max # of Blobs per L1 Transaction"
          />

          <TextInput
            description="Max hours are we willing to wait between batch submissions"
            otherProps={{ value: maxChannelDuration }}
            onInputChange={setMaxChannelDuration}
            labelClass="calculator-label"
            type="number"
            className="calculator-input mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="op-batcher Max Channel Duration (hours)"
          />
          <TextInput
            description="Hours between each state proposals on L1 (0 if chain doesn't pay)"
            otherProps={{ value: outputRootPostFrequency }}
            onInputChange={setOutputRootPostFrequency}
            labelClass="calculator-label"
            type="number"
            className="calculator-input mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Output Root Post Frequency (hours)"
          />
          <SelectInput
            description="Is the cost of state/output proposals passed on to L2 users?"
            labelClass="calculator-label"
            data={booleanOptions}
            onSelect={setIsIncludeOutputRootCosts}
            className="calculator-select mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
            label="Include Root Costs in User Fees?"
          />
        </div>
        <button className="calculator-button" type="submit">
          Calculate
        </button>
      </form>
      {isLoading && <Loader />}
      {!isLoading && showResult && <ResultsTable data={resultsParams} />}
    </div>
  );
}
