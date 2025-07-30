import React from 'react';

const VenetianTile = ({ className = '', children }) => {
  return (
    <div className={`venetian-tile ${className}`}>
      {children}
    </div>
  );
};

export default VenetianTile;
