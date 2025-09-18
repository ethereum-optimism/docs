// React hooks are available globally in Mintlify
const { useState } = React;

export const Steps = ({ children }) => {
  const stepsStyle = {
    counterReset: 'steps',
    marginBottom: '2rem'
  };

  return (
    <div style={stepsStyle} className="steps-container">
      <style jsx>{`
        .steps-container {
          counter-reset: steps;
        }
        .step-item {
          counter-increment: steps;
          position: relative;
          margin-bottom: 2rem;
          padding-left: 3rem;
          border-left: 2px solid #e5e7eb;
          padding-bottom: 1.5rem;
        }
        .step-item::before {
          content: counter(steps);
          position: absolute;
          left: -1rem;
          top: 0;
          width: 2rem;
          height: 2rem;
          background-color: #FF0420;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: bold;
          z-index: 1;
        }
        .step-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: #1f2937;
        }
        .step-content {
          padding-left: 0.5rem;
        }
        .step-content > *:first-child {
          margin-top: 0;
        }
        .step-content > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
      {children}
    </div>
  );
};

export const Step = ({ title, children }) => {
  return (
    <div className="step-item">
      <h3 className="step-title">{title}</h3>
      <div className="step-content">
        {children}
      </div>
    </div>
  );
};
