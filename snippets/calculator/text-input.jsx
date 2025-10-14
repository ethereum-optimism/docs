export const TextInput = ({
  label,
  placeholder,
  className,
  type,
  otherProps,
  isDisabled,
  description,
  labelClass,
  onInputChange,
}) => {
  const handleInputChange = (e) => {
    const val = e.target.value;
    onInputChange(val);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px'
  };

  const labelStyle = {
    fontWeight: '600',
    fontSize: '16px',
    marginBottom: '4px',
    color: '#333'
  };

  const descriptionStyle = {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px'
  };

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'transparent',
    ...otherProps?.style
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={{ ...labelStyle, ...labelClass }}>
          {label}
        </label>
      )}
      {description && (
        <p style={descriptionStyle}>{description}</p>
      )}
      <input
        {...otherProps}
        onChange={handleInputChange}
        type={type}
        disabled={isDisabled}
        style={inputStyle}
        placeholder={placeholder}
      />
    </div>
  );
};
