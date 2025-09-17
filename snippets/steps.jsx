import { useState } from 'react';

export const Steps = ({ children }) => {
  const stepsStyle = {
    counter: 'reset steps',
    marginBottom: '2rem'
  };

  const stepStyle = {
    counterIncrement: 'steps',
    marginBottom: '2rem',
    position: 'relative',
    paddingLeft: '3rem',
    borderLeft: '2px solid #e5e7eb'
  };

  const stepNumberStyle = {
    position: 'absolute',
    left: '-1rem',
    top: '0',
    width: '2rem',
    height: '2rem',
    backgroundColor: '#FF0420',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    content: 'counter(steps)'
  };

  const stepContentStyle = {
    paddingLeft: '0.5rem'
  };

  // Process children to extract steps based on h3 elements
  const processSteps = (children) => {
    if (!children) return [];
    
    // Convert children to array if it's not already
    const childArray = Array.isArray(children) ? children : [children];
    let steps = [];
    let currentStep = null;
    let stepCounter = 0;

    const processNode = (node) => {
      if (typeof node === 'string') {
        return node;
      }
      
      if (node && node.props) {
        // Check if this is an h3 heading (step title)
        if (node.type === 'h3' || (typeof node.type === 'string' && node.type.toLowerCase() === 'h3')) {
          // Start a new step
          if (currentStep) {
            steps.push(currentStep);
          }
          stepCounter++;
          currentStep = {
            title: node.props.children,
            content: [],
            number: stepCounter
          };
          return null;
        }
        
        // If we have a current step, add content to it
        if (currentStep) {
          currentStep.content.push(node);
          return null;
        }
      }
      
      return node;
    };

    // Process each child
    childArray.forEach(child => {
      if (typeof child === 'string') {
        // Handle text content
        const lines = child.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('### ')) {
            // This is a step heading
            if (currentStep) {
              steps.push(currentStep);
            }
            stepCounter++;
            currentStep = {
              title: trimmedLine.substring(4),
              content: [],
              number: stepCounter
            };
          } else if (trimmedLine && currentStep) {
            // Add content to current step
            currentStep.content.push(trimmedLine);
          }
        });
      } else {
        processNode(child);
      }
    });

    // Add the last step
    if (currentStep) {
      steps.push(currentStep);
    }

    return steps;
  };

  // For now, let's create a simpler version that just styles the content
  // and expects the markdown to be properly structured
  return (
    <div style={stepsStyle} className="steps-container">
      <style jsx>{`
        .steps-container {
          counter-reset: steps;
        }
        .steps-container h3 {
          counter-increment: steps;
          position: relative;
          padding-left: 3rem;
          margin-bottom: 1.5rem;
          border-left: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }
        .steps-container h3::before {
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
        }
        .steps-container > *:not(h3) {
          margin-left: 3rem;
          padding-left: 0.5rem;
          border-left: 2px solid #e5e7eb;
          margin-bottom: 1rem;
        }
        .steps-container > h3 + * {
          margin-top: 0;
        }
        .steps-container > *:last-child {
          border-left-color: transparent;
        }
      `}</style>
      {children}
    </div>
  );
};
