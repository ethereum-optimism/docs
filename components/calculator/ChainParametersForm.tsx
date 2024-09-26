import type { ReactElement } from "react";
import { useState } from "react";
import { TextInput, SelectInput, CheckboxInput } from "./Inputs";
import { ResultsTable } from "./ResultsTable";
import {
  displayL1BaseFeeScalar,
  displayL1BlobBaseFeeScalar,
  calculateTotalAltDAPlasmaModeCommitmentCostsInETH,
} from "@/utils/calculator-helpers";

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

  const comparableTransactionTypeOptions = [
    "General OP Mainnet",
    "Base",
    "Zora",
    "Mint",
    "Mode",
  ];
  const dataAvailabilityTypeOptions = ["Ethereum", "AltDA Plasma Mode"];
  const booleanOptions = ["Yes", "No"];

  const handleCalculateFee = async () => {
    // const result = await displayL1BaseFeeScalar(
    //   stringToBoolean(isIncludeOutputRootCosts),
    //   stringToBoolean(isFaultProofEnabled),
    //   outputRootPostFrequency,
    //   transactionsPerDay,
    //   maxChannelDuration,
    //   comparableTransactionType,
    //   dataAvailabilityType,
    //   targetDataFeeMargin
    // );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const result = await displayL1BlobBaseFeeScalar(
      stringToBoolean(isIncludeOutputRootCosts),
      stringToBoolean(isFaultProofEnabled),
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTransactionType,
      dataAvailabilityType,
      targetDataFeeMargin
    );

    const result2 = await displayL1BaseFeeScalar(
      isIncludeOutputRootCosts,
      isFaultProofEnabled,
      outputRootPostFrequency,
      transactionsPerDay,
      maxChannelDuration,
      comparableTransactionType,
      targetDataFeeMargin,
      dataAvailabilityType
    );
    const res = await calculateTotalAltDAPlasmaModeCommitmentCostsInETH (
      transactionsPerDay,
      maxChannelDuration,
      comparableTransactionType
    )

    console.log("RESULT5:::e37", result);
    console.log("RESULT5:::e38", result2);
    console.log("RESULT6:::", res);
  };

  const stringToBoolean = (value: string): boolean => {
    return value === "yes" ? true : false
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
      <ResultsTable />
    </div>
  );
}
