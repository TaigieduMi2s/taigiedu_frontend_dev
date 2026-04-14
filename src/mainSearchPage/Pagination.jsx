import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const isMobile = window.innerWidth <= 480;
    const delta = isMobile ? 1 : 2;
    const range = [];

    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] > 2) range.unshift('...');
    if (range[0] !== 1) range.unshift(1);

    if (range[range.length - 1] < totalPages - 1) range.push('...');
    if (range[range.length - 1] !== totalPages) range.push(totalPages);

    return range;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="pagination">
      <button
        className="page-button page-nav"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {visiblePages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="page-ellipsis">…</span>
        ) : (
          <button
            key={page}
            className={`page-button ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="page-button page-nav"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;