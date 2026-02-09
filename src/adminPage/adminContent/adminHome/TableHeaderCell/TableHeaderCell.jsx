import React from 'react';
import './TableHeaderCell.css';
import chevronUpIcon from '../../../../assets/chevron-up.svg';

const TableHeaderCell = ({ label = '', showArrow = true, bgColor }) => {
  return (
    <div
      className="table-header-cell"
      data-name="Table header cell"
      style={bgColor ? { background: bgColor } : undefined}
    >
      <div className="table-header-inner">
        <span className="table-header-label">{label}</span>
        {showArrow && (
          <img className="table-header-arrow" src={chevronUpIcon} alt="arrow" />
        )}
      </div>
    </div>
  );
};

export default TableHeaderCell;
