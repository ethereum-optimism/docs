import { TextInput } from "/snippets/calculator/text-input.jsx"
import { SelectInput } from "/snippets/calculator/select-input.jsx"
import { Loader } from "/snippets/calculator/loader.jsx"
import { ResultsTable } from "/snippets/calculator/results-table.jsx"

export const ChainParametersForm = () => {
  const [transactionsPerDay, setTransactionsPerDay] = useState(500000);
  const [comparableTransactionType, setComparableTransactionType] = useState("General OP Mainnet");
  const [dataAvailabilityType, setDataAvailabilityType] = useState("Ethereum");
  const [isFaultProofEnabled, setIsFaultProofEnabled] = useState("yes");
  const [targetDataFeeMargin, setTargetDataFeeMargin] = useState(5);
  const [maxBlobsPerL1Transaction, setMaxBlobsPerL1Transaction] = useState(5);
  const [maxChannelDuration, setMaxChannelDuration] = useState(5);
  const [outputRootPostFrequency, setOutputRootPostFrequency] = useState(1);
  const [isIncludeOutputRootCosts, setIsIncludeOutputRootCosts] = useState("yes");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const comparableTransactionTypeOptions = [
    "General OP Mainnet",
    "Base",
    "Zora",
    "Mint",
    "Mode",
  ];
  const dataAvailabilityTypeOptions = ["Ethereum", "AltDA Plasma Mode"];
  const booleanOptions = ["Yes", "No"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simplified calculation - in real implementation, this would call the calculator helpers
    setTimeout(() => {
      const mockResults = {
        l1BlobBaseFeeScalar: "1000000",
        l1BaseFeeScalar: "5000",
        overallL1DataAndStateCostsMargin: `${targetDataFeeMargin}%`,
        dataAvailabilityType,
        estimatedCostPerTransaction: "$0.001"
      };
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };

  const formStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold'
  };

  const buttonStyle = {
    backgroundColor: '#FF0420',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  };

  return (
    <div>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2>Chain Parameters Calculator</h2>
        
        <div>
          <h3>Chain Inputs</h3>
          <TextInput
            otherProps={{ value: transactionsPerDay }}
            onInputChange={setTransactionsPerDay}
            description="Txs / Day, excluding Internal system transactions"
            type="number"
            label="Transactions per Day"
          />

          <SelectInput
            data={comparableTransactionTypeOptions}
            onSelect={setComparableTransactionType}
            description="What transaction types are similar to"
            label="Comparable Transaction Type"
          />

          <SelectInput
            data={dataAvailabilityTypeOptions}
            onSelect={setDataAvailabilityType}
            description="Ethereum (Blobs or Calldata) or AltDA Plasma Mode (Alt-DA)"
            label="Data Availability Type"
          />

          <SelectInput
            data={booleanOptions}
            onSelect={setIsFaultProofEnabled}
            description="Are Fault Proofs enabled on the chain? (Note: Ethereum DA Only)"
            label="Fault Proofs Enabled"
          />

          <TextInput
            otherProps={{ value: targetDataFeeMargin }}
            onInputChange={setTargetDataFeeMargin}
            description="Buffer charged on top of L1 & Blob Data costs"
            type="number"
            label="Target Data Fee Margin"
          />
        </div>

        <div>
          <h3>Advanced Inputs</h3>
          <TextInput
            description="Max hours are we willing to wait between batch submissions"
            otherProps={{ value: maxChannelDuration }}
            onInputChange={setMaxChannelDuration}
            type="number"
            label="op-batcher Max Channel Duration (hours)"
          />
          
          <TextInput
            description="Hours between each state proposals on L1 (0 if chain doesn't pay)"
            otherProps={{ value: outputRootPostFrequency }}
            onInputChange={setOutputRootPostFrequency}
            type="number"
            label="Output Root Post Frequency (hours)"
          />
        </div>

        <button type="submit" style={buttonStyle} disabled={isLoading}>
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {isLoading && <Loader />}
      {results && <ResultsTable data={results} />}
    </div>
  );
};
