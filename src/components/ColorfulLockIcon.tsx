
import React from 'react';

export const ColorfulLockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="#FFD700" stroke="#B8860B" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#B8860B" fill="none" />
  </svg>
);
