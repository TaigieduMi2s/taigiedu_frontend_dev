import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, maxVisible = 4 }) => {
  const getVisiblePages = () => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const range = [];
    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('...');
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) range.push('...');
      range.push(totalPages);
    }

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