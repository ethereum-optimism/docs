/**
 * The AutorelayCallout function renders a callout component with a message about autorelays
 * 
 * @returns {ReactElement} The AutorelayCallout component, a callout that explains about autorelays.
 */
export const AutorelayCallout = () => {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      marginTop: '24px',
      marginBottom: '24px'
    }}>
      <p style={{ margin: 0 }}>
        <strong>Note:</strong> Normally we expect Superchain blockchains to run an autorelayer and relay your messages automatically.
        However, for performance reasons or reliability, you might decide to submit the executing message manually.
        See below to learn how to do that.
      </p>
    </div>
  );
};
