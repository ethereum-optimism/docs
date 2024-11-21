import React from "react";

type Props = {
  placeholder?: string;
  className?: string;
  type: "text" | "email" | "password" | "number";
  label?: string;
  labelClass?: string;
  otherProps?: any;
  description?: string;
  error?: string;
  isDisabled?: boolean;
  onInputChange?: (e: any) => void;
};

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
}: Props) => {
  const handleInputChange = (e: any) => {
    const val = e.target.value;
    onInputChange(val);
  };
  return (
    <div className="flex flex-col">
      {label && (
        <label className={`${labelClass} font-semibold text-sm md:text-xl`}>
          {label}
        </label>
      )}
      <p className="text-xs my-1 calcularor-label_description">{description}</p>

      <input
        {...otherProps}
        onChange={handleInputChange}
        type={type}
        disabled={isDisabled}
        className={`${className} border-custom-puple focus:border-custom-puple outline-custom-puple bg-transparent  placeholder:text-sm placeholder:text-faded-white border  w-full rounded-lg text-base`}
        placeholder={placeholder}
      />
    </div>
  );
};
