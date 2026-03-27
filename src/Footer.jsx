import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  const handleLinkClick = (path) => {
    navigate(path);
  };

  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-buttons">
        <button className="footer-button" onClick={() => handleLinkClick('team')}>團隊介紹</button>
        <button className="footer-button" onClick={() => handleLinkClick('terms')}>使用條款</button>
        <button className="footer-button" onClick={() => handleLinkClick('policy')}>隱私政策</button>
      </div>
      <div className="footer-text">
        © 2024 台語文教學共融平台 All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;