export const CheckboxInput = ({ 
  otherProps, 
  label, 
  description, 
  className, 
  handleToggle 
}) => {
  function onCheckboxChange(e) {
    const isChecked = e.target.checked;
    handleToggle(isChecked);
  }

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  };

  const labelStyle = {
    fontSize: '14px',
    color: '#333'
  };

  const descriptionStyle = {
    fontSize: '12px',
    color: '#666'
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: '#FF0420',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      {description && <p style={descriptionStyle}>{description}</p>}
      <input
        {...otherProps}
        type="checkbox"
        onChange={onCheckboxChange}
        style={{ ...checkboxStyle, ...className }}
      />
    </div>
  );
};
