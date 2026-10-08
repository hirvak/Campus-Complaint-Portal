import React from 'react';
import StatusBadge from './StatusBadge';

export function ComplaintStatusBadge({ status, className = '' }) {
  return <StatusBadge status={status} className={className} />;
}

export default ComplaintStatusBadge;
