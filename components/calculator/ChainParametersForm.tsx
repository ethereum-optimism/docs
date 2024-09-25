import type { ReactElement } from "react";
import { useState } from "react";
import { TextInput, SelectInput, CheckboxInput } from "./Inputs";
import { ResultsTable } from "./ResultsTable";
import {
  calculateImpliedStateProposalsPerDay,
  getAvgEstimatedSizePerTx,
  displayL1BlobBaseFeeScalar,
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
  const [isAdvancedInputs, setIsAdvancedInputs] = useState<boolean>(false);

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

    // const result2 = calculateTotalAltDAPlasmaModeCommitmentL1Gas(
    //   transactionsPerDay,
    //   maxChannelDuration,
    //   comparableTransactionType
    // );
    // const result4 = calculateImpliedStateProposalsPerDay(outputRootPostFrequency);
    
    // const result5 = calculateImpliedDataGasFeePerTxUsingL1Calldata(
    //   isIncludeOutputRootCosts,
    //   isFaultProofEnabled,
    //   outputRootPostFrequency,
    //   transactionsPerDay,
    //   maxChannelDuration,
    //   comparableTransactionType,
    //   dataAvailabilityType,
    //   targetDataFeeMargin
    // );

    // const xyz = calculateL1BaseFeeScalarUsingBlobs(
    //   isIncludeOutputRootCosts,
    //   isFaultProofEnabled,
    //   outputRootPostFrequency,
    //   transactionsPerDay,
    //   maxChannelDuration,
    //   comparableTransactionType,
    //   targetDataFeeMargin
    // )

    // const result5  = getL1GasBaseFee();
    // console.log("RESULT2:::", result2);
    console.log("RESULT5:::e37", result);
    // console.log("xyz:::", xyz);
  };

  const handleToggle = (val: any) => {
    setIsAdvancedInputs(val);
  };

  // console.log("WHEW::", transactionsPerDay)
  // console.log("JEDDB::", comparableTransactionType);
  // console.log("XXAAB::", dataAvailabilityType);
  // console.log("FFFAULTPRFF::", isFaultProofEnabled);
  // console.log("OUTROOCOST::", isIncludeOutputRootCosts);

  const stringToBoolean = (value: string): boolean => {
    return value === "yes" ? true : false
  }

 
  return (
    <div>
      <form className="chain-inputs-form" onSubmit={handleSubmit}>
        <TextInput
          otherProps={{ value: transactionsPerDay }}
          onInputChange={setTransactionsPerDay}
          type="number"
          className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
          label="Transactions per Day"
        />

        <SelectInput
          data={comparableTransactionTypeOptions}
          onSelect={setComparableTransactionType}
          className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
          label="Comparable Transaction Type"
        />

        <SelectInput
          data={dataAvailabilityTypeOptions}
          onSelect={setDataAvailabilityType}
          className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
          label="Data Availability Type"
        />

        <SelectInput
          data={booleanOptions}
          onSelect={setIsFaultProofEnabled}
          className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
          label="Fault Proofs Enabled"
        />

        <TextInput
          otherProps={{ value: targetDataFeeMargin }}
          onInputChange={setTargetDataFeeMargin}
          type="number"
          className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
          label="Target Data Fee Margin"
        />
        <div>
          <div className="flex justify-between items-center">
            <p
              className={`font-semibold text-sm md:text-xl ${
                !isAdvancedInputs ? "text-gray-500" : ""
              }`}
            >
              Advanced Inputs
            </p>
            <CheckboxInput handleToggle={handleToggle} />
          </div>
        </div>
        {isAdvancedInputs && (
          <div className="advanced-settings">
            <h2>Advanced Inputs</h2>
            <TextInput
              otherProps={{ value: maxBlobsPerL1Transaction }}
              onInputChange={setMaxBlobsPerL1Transaction}
              type="number"
              className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
              label="Max # of Blobs per L1 Transaction"
            />

            <TextInput
              otherProps={{ value: maxChannelDuration }}
              onInputChange={setMaxChannelDuration}
              type="number"
              className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
              label="op-batcher Max Channel Duration (hours)"
            />
            <TextInput
              otherProps={{ value: outputRootPostFrequency }}
              onInputChange={setOutputRootPostFrequency}
              type="number"
              className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
              label="Output Root Post Frequency (hours)"
            />
            <SelectInput
              data={booleanOptions}
              onSelect={setIsIncludeOutputRootCosts}
              className="mt-1 sm:text-lg py-1 px-2 sm:py-2 sm:px-4"
              label="Include Root Costs in User Fees?"
            />
          </div>
        )}

        <button type="submit">Calculate</button>
      </form>
      <ResultsTable />
    </div>
  );
}
