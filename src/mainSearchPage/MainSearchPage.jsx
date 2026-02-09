import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import './MainSearchPage.css';

const MainSearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialCategories = searchParams.get('categories')
    ? searchParams.get('categories').split(',')
    : [];

  // 狀態管理
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 從 API 獲取搜尋結果
  // 修改 useEffect 部分中決定使用的分類邏輯

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!initialQuery) {
        setSearchResults([]);
        setFilteredResults([]);
        setAvailableResources([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {

        const preciseSearch = `"${initialQuery}"`;
        const parameters = {
          'text': preciseSearch,
          'size': 1000,
          'mark': true,
          'tags': ["<b style='color:red;'>", "</b>"],
          'lang': ["T", "K", "Z", "P"]
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/sentence_search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parameters)
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // 轉換 API 數據為組件所需格式
        const formattedResults = data.data.documents.map((doc, index) => {
          let content = 'No content available';
          if (doc.highlight?.Body && doc.highlight.Body.length > 0) {
            content = doc.highlight.Body[0];
          }
          else if (doc.highlight?.Title && doc.highlight.Title.length > 0) {
            content = doc.highlight.Title[0];
          }
          else if (doc.Body) {
            content = doc.Body;
          }
          return {
            id: index + 1,
            resource: doc.Source || 'Unknown Source',
            content: content,
            url: doc.Url || '#',
          };
        });

        // 提取不重複的資源名稱
        const uniqueResources = [...new Set(formattedResults.map(item => item.resource))];
        setAvailableResources(uniqueResources);

        // 決定要使用哪些分類
        let categoriesToUse;

        // 如果 URL 中有指定分類，使用 URL 中的分類
        if (initialCategories.length > 0) {
          categoriesToUse = initialCategories;
        } else {
          // 否則全選所有資源
          categoriesToUse = uniqueResources;
          setSelectedCategories(uniqueResources); // 關鍵：明確設置選中的類別為所有資源
        }

        setSearchResults(formattedResults);

        // 根據選定的類別過濾結果
        filterResults(formattedResults, categoriesToUse);

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('搜尋發生錯誤，請稍後再試。');
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [initialQuery]);

  // 過濾搜尋結果
  const filterResults = (results, categories) => {
    if (!categories || categories.length === 0) {
      setFilteredResults(results);
      return;
    }

    const filtered = results.filter(item => categories.includes(item.resource));
    setFilteredResults(filtered);
  };

  // 處理類別選擇變更
  const handleCategoryChange = (newCategories) => {
    setSelectedCategories(newCategories);
    filterResults(searchResults, newCategories);
  };

  return (
    <div className="main-search-page">
      <SearchBar
        initialQuery={initialQuery}
        categories={availableResources}
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
      />
      <div className="results-container">
        <SearchResults
          results={filteredResults}
          isLoading={isLoading}
          error={error}
          keyword={initialQuery}
          totalItems={filteredResults.length}
        />
      </div>
    </div>
  );
};

export default MainSearchPage;