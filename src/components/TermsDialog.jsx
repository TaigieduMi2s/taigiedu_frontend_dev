import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { UnifiedModal } from './UnifiedModal/UnifiedModal';
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

            fetch(`${baseUrl}${markdownFile}`)
                .then((response) => response.text())
                .then((text) => {
                    const processedText = text.replace(/^#\s+.*(\r?\n)*/, '').trim();
                    setContent(processedText);
                })
                .catch((error) => console.error('Error loading document:', error));

            setHasScrolledToBottom(false);
            setShowScrollHint(false);
        }
    }, [isOpen, markdownFile]);

    const handleScroll = (e) => {
        const element = e.target;
        const scrollPercentage =
            (element.scrollTop + element.clientHeight) / element.scrollHeight;

        if (scrollPercentage >= 0.95) {
            setHasScrolledToBottom(true);
            setShowScrollHint(false);
        }
    };

    const handleAccept = () => {
        if (hasScrolledToBottom) {
            onAccept();
        } else {
            setShowScrollHint(true);
        }
    };

    return (
        <UnifiedModal isOpen={isOpen} onClose={onClose} className="terms-dialog">
            <div className="terms-dialog-inner">
                <div className="terms-dialog-header" style={{ marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{title}</h2>
                </div>

                <div
                    className="terms-dialog-content"
                    ref={contentRef}
                    onScroll={handleScroll}
                    style={{ maxHeight: '60vh', overflowY: 'auto', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}
                >
                    <div className="markdown-content">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>

                {showScrollHint && (
                    <div style={{ color: '#F37458', fontSize: '14px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        請先閱讀完整內容，將滾動條拉到底部
                    </div>
                )}

                <div className="terms-dialog-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        className={`btn ${hasScrolledToBottom ? 'btn-primary' : 'btn-outline disabled'}`}
                        onClick={handleAccept}
                        style={{ width: '200px', opacity: hasScrolledToBottom ? 1 : 0.5 }}
                    >
                        我已閱讀並同意
                    </button>
                </div>
            </div>
        </UnifiedModal>
    );
};

export default TermsDialog;
