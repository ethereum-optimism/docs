import React from "react";

type Props = {
  className?: string;
  label?: string;
  data: any[];
  otherProps?: any;
  description?: string;
  labelClass?: string;
  onSelect?: (e: any) => void;
};

export const SelectInput: React.FC<Props> = React.memo(
  ({ className, labelClass, description, otherProps, label, data, onSelect }) => {
    const handleSelect = (e: any) => {
      const value = e.target.value
      onSelect(value)
    }
    return (
      <div className="flex flex-col ">
        {label && (
          <label className={`font-semibold text-sm md:text-xl ${labelClass}`}>
            {label}
          </label>
        )}
        <p className="text-xs my-1 calcularor-label_description">
          {description}
        </p>
        <div className="grid">
          <select
            {...otherProps}
            onChange={handleSelect}
            className={`${className} appearance-none row-start-1 col-start-1 focus:bg-background bg-transparent py-1 px-2   border  w-full rounded-lg border-custom-puple`}
          >
            {data.map((selectValue, index) => (
              <option
                key={index}
                className="cursor-pointer "
                value={selectValue}
              >
                {selectValue}
              </option>
            ))}
          </select>
          {/* <IoIosArrowDown className="place-self-end mb-3 sm:mx-4  row-start-1  col-start-1 pointer-events-none " /> */}
        </div>
      </div>
    );
  }
);
SelectInput.displayName = "SelectInput";
