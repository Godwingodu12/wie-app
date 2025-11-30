import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      {...rest}   // <-- Enables onClick, etc.
    >
      {children}
    </div>
  );
};
export default Card;
