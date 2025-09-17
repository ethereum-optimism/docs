export const SelectInput = ({ 
  className, 
  labelClass, 
  description, 
  otherProps, 
  label, 
  data, 
  onSelect 
}) => {
  const handleSelect = (e) => {
    const value = e.target.value;
    onSelect(value);
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

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
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
      <select
        {...otherProps}
        onChange={handleSelect}
        style={selectStyle}
      >
        {data.map((selectValue, index) => (
          <option
            key={index}
            value={selectValue}
          >
            {selectValue}
          </option>
        ))}
      </select>
    </div>
  );
};
