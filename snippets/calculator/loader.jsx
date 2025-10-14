export const Loader = () => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  };

  const svgStyle = {
    width: '60px',
    height: '60px'
  };

  return (
    <div style={containerStyle}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={svgStyle}>
        <circle
          fill="#FF0420"
          stroke="#FF0420"
          strokeWidth="15"
          r="15"
          cx="40"
          cy="65"
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur="1.1"
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin="-.4"
          />
        </circle>
        <circle
          fill="#FF0420"
          stroke="#FF0420"
          strokeWidth="15"
          r="15"
          cx="100"
          cy="65"
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur="1.1"
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin="-.2"
          />
        </circle>
        <circle
          fill="#FF0420"
          stroke="#FF0420"
          strokeWidth="15"
          r="15"
          cx="160"
          cy="65"
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur="1.1"
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin="0"
          />
        </circle>
      </svg>
    </div>
  );
};
