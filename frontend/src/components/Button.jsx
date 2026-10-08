import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-label text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[6px]";
  
  const variants = {
    primary: "bg-[#B51232] dark:bg-[#C51F3D] text-white hover:bg-[#94102A] dark:hover:bg-[#A91531] active:bg-[#800E24] shadow-2xs",
    secondary: "bg-white dark:bg-[#202B3D] text-[#10213A] dark:text-[#F8FAFC] border border-[#DED8CC] dark:border-[#344155] hover:bg-[#FDF2F4] dark:hover:bg-[#263246] hover:text-[#B51232] dark:hover:text-[#C51F3D]",
    outline: "bg-transparent text-[#10213A] dark:text-[#F8FAFC] border border-[#DED8CC] dark:border-[#344155] hover:bg-[#FDF2F4] dark:hover:bg-[#202B3D] hover:text-[#B51232] dark:hover:text-[#C51F3D]",
    danger: "bg-[#B51232] dark:bg-[#D6455D] text-white hover:bg-[#94102A] dark:hover:bg-[#B5344A]",
    success: "bg-[#008A4A] dark:bg-[#22A06B] text-white hover:bg-[#00733E] dark:hover:bg-[#1B8457]",
    ghost: "bg-transparent text-[#60708A] dark:text-[#AEB9C9] hover:bg-[#FAF7F0] dark:hover:bg-[#202B3D] hover:text-[#10213A] dark:hover:text-[#F8FAFC]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-xs",
    lg: "px-5 py-2.5 text-xs font-bold"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
