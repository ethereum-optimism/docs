// React hooks are available globally in Mintlify
const { useState } = React;

/**
 * The WipCallout function renders a custom callout component with optional context text for
 * displaying maintenance messages.
 */
export const WipCallout = ({ context }) => {
  const [closeCallout, setCloseCallout] = useState(false);
  
  if (closeCallout) return null;
  
  return (
    <div style={{
      width: '100%',
      marginTop: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ width: '100%', fontSize: '14px', fontWeight: '500' }}>
        {context ? (
          context
        ) : (
          <div>
            Please do not rely on the content of this page as it is currently
            undergoing maintenance. Code samples and solutions may not function
            as expected. Please check back for an update or{' '}
            <a
              href="https://github.com/ethereum-optimism/docs/issues"
              style={{ color: '#FF0420', textDecoration: 'underline' }}
            >
              sign up to help us revise this page
            </a>
            . We welcome your contribution! ❤️
          </div>
        )}
      </div>
      <button
        style={{
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          marginLeft: '8px'
        }}
        onClick={() => setCloseCallout(true)}
      >
        ×
      </button>
    </div>
  );
};

export const InteropCallout = ({ context }) => {
  const [closeCallout, setCloseCallout] = useState(false);
  
  if (closeCallout) return null;
  
  return (
    <div style={{
      width: '100%',
      marginTop: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#e3f2fd',
      border: '1px solid #90caf9',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ width: '100%', fontSize: '14px', fontWeight: '500' }}>
        {context ? (
          context
        ) : (
          <div>
            Interop is currently in <strong>active development</strong> and not
            yet ready for production use. The information provided here may
            change frequently. We recommend checking back regularly for the most up-to-date
            information.
          </div>
        )}
      </div>
      <button
        style={{
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          marginLeft: '8px'
        }}
        onClick={() => setCloseCallout(true)}
      >
        ×
      </button>
    </div>
  );
};

const BetaCallout = ({ context, featureName }) => {
  return (
    <div style={{
      width: '100%',
      marginTop: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f3e5f5',
      border: '1px solid #ce93d8',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ width: '100%', fontSize: '14px', fontWeight: '500' }}>
        {context ? (
          context
        ) : (
          <div>
            The {featureName} feature is currently in <strong>Beta</strong> within
            the MIT-licensed OP Stack. Beta features are built and reviewed by
            the Optimism Collective's core contributors, and provide developers
            with early access to highly requested configurations. These features
            may experience stability issues, and we encourage feedback from our
            early users.
          </div>
        )}
      </div>
    </div>
  );
};

export const AltCallout = (props) => {
  return <BetaCallout {...props} featureName="Alt-DA Mode" />;
};

export const CGTCallout = (props) => {
  return <BetaCallout {...props} featureName="Custom Gas Token" />;
};
