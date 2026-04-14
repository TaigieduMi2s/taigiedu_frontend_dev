import React, { useState, useEffect } from 'react';
import './SearchResults.css';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 20;

const SearchResults = ({
  results = [],
  isLoading = false,
  error = null,
  keyword = '',
  totalItems = 0,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setTotalPages(Math.ceil(results.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [results]);

  const getCurrentPageResults = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return results.slice(start, start + ITEMS_PER_PAGE);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentResults = getCurrentPageResults();

  if (isLoading) {
    return (
      <div className="sr-state-wrapper">
        <div className="sr-spinner" aria-label="載入中"></div>
        <p className="sr-state-text">搜尋中，請稍候...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sr-state-wrapper sr-error">
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0 && keyword) {
    return (
      <div className="sr-state-wrapper">
        <p className="sr-state-text">找不到符合「{keyword}」的搜尋結果</p>
        <p className="sr-state-hint">試試其他關鍵字，或減少搜尋條件</p>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="sr-wrapper">
      {/* 結果摘要 */}
      <p className="sr-summary">
        約 <strong>{totalItems}</strong> 筆含有「{keyword}」的搜尋結果
      </p>

      {/* 結果清單 */}
      <ol className="sr-list">
        {currentResults.map((result) => (
          <li key={result.id} className="sr-item">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sr-item-link"
            >
              {/* 來源資訊列 */}
              <div className="sr-item-source">
                <span className="sr-source-tag">{result.resource}</span>
                <svg
                  className="sr-external-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M7.5 1H11m0 0v3.5M11 1L5.5 6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {/* 內容片段 */}
              <div
                className="sr-item-snippet"
                dangerouslySetInnerHTML={{ __html: result.content }}
              />
            </a>
          </li>
        ))}
      </ol>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="sr-pagination-container">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            maxVisible={4}
          />
        </div>
      )}
    </div>
  );
};

export default SearchResults;
