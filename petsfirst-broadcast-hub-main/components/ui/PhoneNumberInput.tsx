import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/phone-input-theme.css";

export interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Phone number input with country selector using react-phone-input-2.
 * Value is the full number (e.g. "+91 3077 524 55"). Styled to match theme #00A89E.
 */
export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder = "Phone number",
  className = "",
  disabled = false,
}) => {
  return (
    <PhoneInput
      country="in"
      value={value}
      onChange={(_value, _country, _e, formattedValue) => {
        onChange(formattedValue ?? value);
      }}
      placeholder={placeholder}
      disabled={disabled}
      enableSearch
      searchPlaceholder="Search country"
      containerClass={className ? `react-tel-input-theme ${className}` : "react-tel-input-theme"}
      inputStyle={{ width: "100%" }}
    />
  );
};

export default PhoneNumberInput;
