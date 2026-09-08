import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReportIssueModal from './components/ReportIssue/ReportIssueModal';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showReportIssue, setShowReportIssue] = useState(false);

  // 依 TAIGIE-252 定案，「回報問題」是全站前台的統一入口，後台頁面不需要
  const showReportIssueButton = !location.pathname.startsWith('/admin');

  const handleLinkClick = (path) => {
    navigate(path);
  };

  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-buttons">
        <button className="footer-button" onClick={() => handleLinkClick('team')}>團隊介紹</button>
        <button className="footer-button" onClick={() => handleLinkClick('terms')}>使用條款</button>
        <button className="footer-button" onClick={() => handleLinkClick('policy')}>隱私政策</button>
        {showReportIssueButton && (
          <button className="footer-button" onClick={() => setShowReportIssue(true)}>回報問題</button>
        )}
      </div>
      <div className="footer-text">
        © {new Date().getFullYear()} 台語文教學共融平台 All Rights Reserved.
      </div>

      {/* 全站唯一的回報問題彈窗；要回報哪個功能由彈窗內的「功能頁面」下拉選擇 */}
      <ReportIssueModal
        isOpen={showReportIssue}
        onClose={() => setShowReportIssue(false)}
      />
    </footer>
  );
};

export default Footer;
