import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  const handleLinkClick = (path) => {
    // 獲取當前的 base path
    const base = import.meta.env.BASE_URL || '/';
    const fullPath = base === '/' ? path : `${base}${path}`;
    window.open(fullPath, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-buttons">
        <button className="footer-button">Our team</button>
        <button className="footer-button" onClick={() => handleLinkClick('terms')}>Terms</button>
        <button className="footer-button" onClick={() => handleLinkClick('policy')}>Policy</button>
        <button className="footer-button" onClick={() => handleLinkClick('admin')}>Admin</button>
      </div>
      <div className="footer-text">
        © 2024 台語文教學共融平台 All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;