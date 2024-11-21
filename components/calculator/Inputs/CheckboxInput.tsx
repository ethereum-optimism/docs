import React from "react";

type Props = {
  otherProps?: any;
  className?: string;
  label?: string;
  description?:string;
  handleToggle: (e: any) => void;
};

export const CheckboxInput: React.FC<Props> = React.memo(
  ({ otherProps, label, description, className, handleToggle }) => {
    function onCheckboxChange(e: any) {
      const isChecked = e.target.checked;
      handleToggle(isChecked);
    }
    return (
      <div className="flex items-center gap-2">
        {label && <label className="text-sm">{label}</label>}
        <p className="text-xs my-1">{description}</p>
        <input
          {...otherProps}
          type="checkbox"
          onChange={onCheckboxChange}
          className={`${className} meta-checkbox accent-custom-puple toggle bg-custom-puple`}
        />
      </div>
    );
  }
);
CheckboxInput.displayName = "CheckboxInput";
