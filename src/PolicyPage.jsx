import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './PolicyPage.css';
import './styles/markdown.css';

const PolicyPage = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    // 讀取 markdown 文件
    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL.slice(0, -1)
      : import.meta.env.BASE_URL;

    fetch(`${baseUrl}/docs/legal/privacy-policy.md`)
      .then((response) => response.text())
      .then((text) => setContent(text))
      .catch((error) => console.error('Error loading privacy policy:', error));
  }, []);

  return (
    <div className="policy-container">
      <div className="policy-content markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default PolicyPage;
