import React from "react";

type Props = {
  otherProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
  label?: string;
  description?: string;
  handleToggle: (isChecked: boolean) => void;
};

export const CheckboxInput: React.FC<Props> = React.memo(
  ({ otherProps, label, description, className, handleToggle }) => {
    return (
      <div className="flex items-center gap-2">
        <input
          {...otherProps}
          type="checkbox"
          onChange={(e) => handleToggle(e.target.checked)}
          className={`${className} meta-checkbox accent-custom-purple toggle bg-custom-purple`}
        />
        {label && <label className="text-sm">{label}</label>}
        {description && <p className="text-xs my-1">{description}</p>}
      </div>
    );
  }
);
CheckboxInput.displayName = "CheckboxInput";
