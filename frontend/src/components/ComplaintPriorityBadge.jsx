import React from 'react';

export function ComplaintPriorityBadge({ priority }) {
  const getStyle = () => {
    switch (priority) {
      case 'Urgent':
        return 'text-[#B51232] dark:text-[#C51F3D] font-extrabold';
      case 'High':
        return 'text-[#B66A00] dark:text-[#D18A16] font-bold';
      case 'Medium':
        return 'text-[#10213A] dark:text-[#F8FAFC] font-semibold';
      case 'Low':
      default:
        return 'text-[#60708A] dark:text-[#AEB9C9] font-medium';
    }
  };

  return (
    <span className={`text-xs ${getStyle()}`}>
      {priority || 'Medium'}
    </span>
  );
}

export default ComplaintPriorityBadge;
