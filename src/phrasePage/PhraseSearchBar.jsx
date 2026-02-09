import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MultiSelect from './multiselect';
import './PhraseSearchBar.css';
import searchIcon from '../assets/home/search_logo.svg';

const PhraseSearchBar = ({ availableCategories = [], onCategoryFilter, allPhrases = [] }) => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories') ? searchParams.get('categories').split(',') : []
  );
  const navigate = useNavigate();

  // 處理初始載入與 URL 參數同步
  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    const urlCategoriesParam = searchParams.get('categories');
    
    setQuery(urlQuery);

    if (urlCategoriesParam !== null) {
      // 如果 URL 有類別參數（即使是空的），以 URL 為準
      setSelectedCategories(urlCategoriesParam ? urlCategoriesParam.split(',') : []);
    } else if (availableCategories.length > 0 && !urlQuery) {
      // 只有在 URL 完全沒有 categories 參數且沒有搜尋關鍵字時，才執行初始全選
      setSelectedCategories(availableCategories);
    }
  }, [searchParams, availableCategories]);

  const categories = availableCategories.length > 0 ? availableCategories : [
    '數字',
    '經濟',
    '地名',
    '氣候',
    '人際關係',
    '社會人文',
    '人與國家',
    '動物',
    '植物',
    '天文',
    '器官與肢體',
    '團隊合作',
    '飲食',
    '家庭倫常',
    '樂器',
    '顏色',
    '戲劇'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    
    // 構建搜尋參數
    const newSearchParams = new URLSearchParams();
    if (query.trim() !== '') {
      newSearchParams.append('query', query);
    }
    if (selectedCategories.length > 0) {
      newSearchParams.append('categories', selectedCategories.join(','));
    }
    navigate(`/phrase?${newSearchParams.toString()}`);
  };

  const handleCategoryChange = (selected) => {
    setSelectedCategories(selected);
    console.log('已選擇類別:', selected);
    
    // 檢查是否有搜尋關鍵字
    const currentQuery = searchParams.get('query') || '';
    
    if (!currentQuery.trim()) {
      // 如果沒有搜尋關鍵字，進行本地篩選
      if (onCategoryFilter) {
        onCategoryFilter(selected);
      }
    } else {
      // 如果有搜尋關鍵字，更新 URL 並觸發 API 搜尋
      const newSearchParams = new URLSearchParams();
      if (currentQuery.trim() !== '') {
        newSearchParams.append('query', currentQuery);
      }
      if (selected.length > 0) {
        newSearchParams.append('categories', selected.join(','));
      }
      navigate(`/phrase?${newSearchParams.toString()}`);
    }
  };

  return (
    <div className="search-Bar">
      <div className="input-container">
        <div className="filter-section">
          <MultiSelect
            options={categories}
            selectedOptions={selectedCategories}
            onChange={handleCategoryChange}
            placeholder="意涵分類"
            displayText="意涵分類"
          />
        </div>
        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="phrase-search-input"
            placeholder="輸入關鍵字搜尋成語"
          />
          <img
            src={searchIcon}
            className="search-icon"
            onClick={handleSearch}
            alt="search"
          />
        </form>
      </div>
    </div>
  );
};

export default PhraseSearchBar;