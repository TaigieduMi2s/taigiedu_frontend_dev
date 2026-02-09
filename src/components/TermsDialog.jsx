import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './TermsDialog.css';
import '../styles/markdown.css';

const TermsDialog = ({ isOpen, onClose, onAccept, type = 'terms' }) => {
    const [content, setContent] = useState('');
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const contentRef = useRef(null);

    const title = type === 'terms' ? '網站使用條款' : '隱私權政策';
    const markdownFile = type === 'terms'
        ? '/docs/legal/terms-of-service.md'
        : '/docs/legal/privacy-policy.md';

    useEffect(() => {
        if (isOpen) {
            const baseUrl = import.meta.env.BASE_URL.endsWith('/')
                ? import.meta.env.BASE_URL.slice(0, -1)
                : import.meta.env.BASE_URL;

            // 讀取 markdown 文件
            fetch(`${baseUrl}${markdownFile}`)
                .then((response) => response.text())
                .then((text) => {
                    // 移除第一行的 H1 大標題，因為對話框已經有標題了
                    const processedText = text.replace(/^#\s+.*(\r?\n)*/, '').trim();
                    setContent(processedText);
                })
                .catch((error) => console.error('Error loading document:', error));

            // 重置狀態
            setHasScrolledToBottom(false);
            setShowScrollHint(false);
        }
    }, [isOpen, markdownFile]);

    const handleScroll = (e) => {
        const element = e.target;
        const scrollPercentage =
            (element.scrollTop + element.clientHeight) / element.scrollHeight;

        // 當滾動到底部（95%以上）時，標記為已讀
        if (scrollPercentage >= 0.95) {
            setHasScrolledToBottom(true);
            setShowScrollHint(false);
        }
    };

    const handleAccept = () => {
        if (hasScrolledToBottom) {
            onAccept();
        } else {
            // 顯示提示訊息，引導使用者滾動到底部
            setShowScrollHint(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="terms-dialog-overlay">
            <div className="terms-dialog-container">
                <div className="terms-dialog-header">
                    <h2>{title}</h2>
                    <button className="terms-dialog-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div
                    className="terms-dialog-content"
                    ref={contentRef}
                    onScroll={handleScroll}
                >
                    <div className="markdown-content">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>

                {showScrollHint && (
                    <div className="terms-scroll-hint">
                        請先閱讀完整內容，將滾動條拉到底部
                    </div>
                )}

                <div className="terms-dialog-footer">
                    <button
                        className={`terms-dialog-accept ${hasScrolledToBottom ? 'enabled' : 'disabled'}`}
                        onClick={handleAccept}
                        disabled={!hasScrolledToBottom}
                    >
                        我已閱讀並同意
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsDialog;
