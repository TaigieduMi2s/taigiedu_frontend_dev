import React, { useState, useEffect } from 'react';
import './SearchResults.css';
import leftChevron from "../assets/chevron-left.svg";
import doubleLeftChevron from "../assets/chevron-double-left.svg";

const SearchResults = ({
  results = [],
  isLoading = false,
  error = null,
  keyword = '',
  totalItems = 0,
  singleColumn = false,
}) => {
  // Pagination State
  const ITEMS_PER_PAGE = 16;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const VISIBLE_PAGES = 10;

  // 計算總頁數
  useEffect(() => {
    setTotalPages(Math.ceil(results.length / ITEMS_PER_PAGE));
    // 當結果變化時，重置到第一頁
    setCurrentPage(1);
  }, [results]);

  // Get current page results
  const getCurrentPageResults = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return results.slice(startIndex, endIndex);
  };

  // Split current page results into left and right columns
  const currentResults = getCurrentPageResults();
  const leftResults = currentResults.slice(0, Math.ceil(currentResults.length / 2));
  const rightResults = currentResults.slice(Math.ceil(currentResults.length / 2));

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate visible page numbers
  const getPageNumbers = () => {
    let start = Math.max(1, currentPage - 4);
    let end = Math.min(totalPages, start + VISIBLE_PAGES - 1);

    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - VISIBLE_PAGES + 1);
    }

    // Adjust end if we're near the start
    if (start === 1) {
      end = Math.min(totalPages, VISIBLE_PAGES);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Render search result content with HTML
  const renderContent = (content) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div className="container-fluid">
      {isLoading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">載入搜尋結果中...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger my-5" role="alert">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center my-5">
          <p>未找到符合 "{keyword}" 的搜尋結果</p>
        </div>
      ) : (
        <div className="row">
          <div className="search-summary mb-3">
            找到 {totalItems} 筆含有 "{keyword}" 的搜尋結果
          </div>
          
          {/* 搜尋結果表格區塊 */}
          <div className="col-12">
            <div className="results-table-container">
              <div className="results-table-minimal">
                
                <div className="row mx-0">
                  {/* 桌機版雙標題列 (置頂) */}
                  <div className="col-12 d-none d-md-block p-0 mb-1">
                    <div className="row mx-0">
                      <div className="col-6 px-1">
                        <div className="row titleCard mx-0">
                          <div className="col-1 text-center">#</div>
                          <div className="col-3">資源出處</div>
                          <div className="col-8">內容</div>
                        </div>
                      </div>
                      <div className="col-6 px-1">
                        <div className="row titleCard mx-0">
                          <div className="col-1 text-center">#</div>
                          <div className="col-3">資源出處</div>
                          <div className="col-8">內容</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 手機版單標題列 (置頂) */}
                  <div className="col-12 d-block d-md-none p-0 px-1 mb-1">
                    <div className="row titleCard mx-0">
                      <div className="col-4">資源出處</div>
                      <div className="col-8">內容</div>
                    </div>
                  </div>

                  {/* 統一資料網格列 (自動依賴格柵 left-to-right 換行) */}
                  {currentResults.map((result, index) => (
                    <div key={result.id} className="col-12 col-md-6 px-1 mb-1">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="search-result-link">
                        <div className="row py-3 sentenceCard cardContainer h-100 mx-0">
                          <div className="col-1 d-none d-md-flex p-0 text-muted small align-items-center justify-content-center">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </div>
                          <div className="col-4 col-md-3 p-0 sentenceTitle d-flex align-items-center">
                            {result.resource}
                          </div>
                          <div className="col-8 col-md-8 p-0 sentenceContent">
                            {renderContent(result.content)}
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <ul className="pagination">
                {/* 跳轉至第一頁 */}
                <li className="page-item first-page-button">
                  <a className={`page-link icon-link ${currentPage <= 1 ? 'invisible' : ''}`}
                    onClick={handleFirstPage}>
                    <img src={doubleLeftChevron} alt="第一頁" className="pagination-icon" />
                  </a>
                </li>

                {/* 上一頁 */}
                <li className="page-item back-button">
                  <a className={`page-link icon-link ${currentPage <= 1 ? 'invisible' : ''}`}
                    onClick={handlePreviousPage}>
                    <img src={leftChevron} alt="上一頁" className="pagination-icon" />
                  </a>
                </li>

                {getPageNumbers().map(number => (
                  <li key={number}
                    className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <a className="page-link"
                      onClick={() => handlePageChange(number)}>
                      {number}
                    </a>
                  </li>
                ))}

                {/* 下一頁 */}
                <li className="page-item next-button">
                  <a className={`page-link icon-link ${currentPage >= totalPages ? 'invisible' : ''}`}
                    onClick={handleNextPage}>
                    <img src={leftChevron} alt="下一頁" className="pagination-icon right-arrow" />
                  </a>
                </li>

                {/* 跳轉至最後一頁 */}
                <li className="page-item last-page-button">
                  <a className={`page-link icon-link ${currentPage >= totalPages ? 'invisible' : ''}`}
                    onClick={handleLastPage}>
                    <img src={doubleLeftChevron} alt="最後一頁" className="pagination-icon right-arrow" />
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;