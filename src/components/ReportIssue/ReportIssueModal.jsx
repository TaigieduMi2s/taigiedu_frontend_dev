import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { UnifiedModal } from '../UnifiedModal/UnifiedModal';
import CustomSelect from '../CustomSelect/CustomSelect';
import { useToast } from '../Toast';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile } from '../../services/uploadService';
import { submitIssueReport } from '../../services/reportIssueService';
import {
    ISSUE_TYPE_OPTIONS,
    ISSUE_TYPE_PROBLEM,
    REPORT_FEATURE_OPTIONS,
    UPLOAD_ACCEPT,
    UPLOAD_HINT,
    UPLOAD_MAX_BYTES,
    getReportPageConfig,
} from './reportIssueConfig';
import './ReportIssue.css';

/**
 * 回報問題彈窗
 * 以共用的 UnifiedModal 為外框（沿用遮罩、關閉鈕、動畫與手機版 bottom sheet 樣式），
 * 內容則是這支元件自己的表單；各功能頁面的差異全部收斂在 reportIssueConfig。
 *
 * 流程（依 Figma + TAIGIE-252 定案）：
 * 功能頁面 → 問題類別 →（選「問題回報」才出現細項）→ 問題名稱 → 問題描述 → 上傳檔案（非必填）→ 送出
 *
 * 入口統一在全站 Footer，彈窗不知道使用者要回報哪個功能，所以「功能頁面」由使用者自己選；
 * pageKey 只有在「從某個頁面直接帶著功能開啟」時才需要傳，會被當成預設值。
 */
const ReportIssueModal = ({ isOpen, onClose, pageKey, label, detailOptions }) => {
    // 使用者在下拉選到的功能頁面；有帶 pageKey 就以它為預設值
    const [featureKey, setFeatureKey] = useState(pageKey || '');

    const config = useMemo(
        () => getReportPageConfig(featureKey, { label, detailOptions }),
        [featureKey, label, detailOptions]
    );

    const { showToast } = useToast();
    const { user } = useAuth();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [issueType, setIssueType] = useState('');
    const [issueCategory, setIssueCategory] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 每次開啟都重置表單，避免上次的內容殘留
    useEffect(() => {
        if (!isOpen) return;
        setFeatureKey(pageKey || '');
        setIssueType('');
        setIssueCategory('');
        setTitle('');
        setDescription('');
        setFile(null);
        setIsSubmitting(false);
        setIsSubmitted(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [isOpen, pageKey]);

    // 細項下拉只在「已選功能頁面」＋「問題回報」＋「該功能有設定細項」時出現
    const showDetailSelect =
        Boolean(featureKey) &&
        issueType === ISSUE_TYPE_PROBLEM &&
        config.detailOptions.length > 0;

    const isFormValid =
        Boolean(featureKey) &&
        Boolean(issueType) &&
        (!showDetailSelect || Boolean(issueCategory)) &&
        title.trim().length > 0 &&
        description.trim().length > 0;

    // 換功能頁面時細項清單會整組換掉，舊的選擇留著就會送出不屬於該功能的細項
    const handleFeatureChange = (value) => {
        setFeatureKey(value);
        setIssueCategory('');
    };

    const handleIssueTypeChange = (value) => {
        setIssueType(value);
        // 切回「其他」時要一併清掉細項，否則會送出殘留的資料
        if (value !== ISSUE_TYPE_PROBLEM) setIssueCategory('');
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        if (!UPLOAD_ACCEPT.split(',').includes(selected.type)) {
            showToast('僅限上傳 JPG 或 PNG 圖片檔', 'error');
            event.target.value = '';
            return;
        }
        if (selected.size > UPLOAD_MAX_BYTES) {
            showToast('檔案大小不可超過 100MB', 'error');
            event.target.value = '';
            return;
        }

        setFile(selected);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isFormValid || isSubmitting || isSubmitted) return;

        setIsSubmitting(true);
        try {
            let attachment = '';
            if (file) {
                attachment = await uploadFile(file);
            }

            const result = await submitIssueReport({
                page: config.pageKey,
                page_label: config.label,
                page_path: `${location.pathname}${location.search}`,
                issue_type: issueType,
                issue_category: showDetailSelect ? issueCategory : '',
                title: title.trim(),
                description: description.trim(),
                attachment,
                username: user?.name || user?.username || user?.email || '',
                created_at: new Date().toISOString(),
            });

            // 依設計稿，送出後按鈕先變成「已送出!」，短暫停留後再關閉彈窗
            setIsSubmitted(true);
            showToast(result?.message || '已收到您的回報，感謝您的協助', 'success');
            setTimeout(() => onClose(), 1200);
        } catch (error) {
            console.error('回報問題送出失敗:', error);
            showToast(error?.message || '回報失敗，請稍後再試', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <UnifiedModal isOpen={isOpen} onClose={onClose} className="report-issue-modal">
            <h2 className="report-issue-title">
                {/* 從指定頁面開啟時才在標題帶出功能名稱；Footer 開啟時功能由使用者自己選 */}
                回報問題{pageKey && config.label ? ` - ${config.label}` : ''}
            </h2>

            <form className="report-issue-form" onSubmit={handleSubmit} noValidate>
                <div className="report-issue-field">
                    <label className="report-issue-label" htmlFor="report-issue-feature">
                        <span className="report-issue-required">*</span>功能頁面
                    </label>
                    <CustomSelect
                        id="report-issue-feature"
                        className="report-issue-select-feature"
                        options={REPORT_FEATURE_OPTIONS}
                        value={featureKey || null}
                        onChange={handleFeatureChange}
                        placeholder="請選擇要回報的功能"
                        size="sm"
                    />
                </div>

                <div className="report-issue-field">
                    <label className="report-issue-label" htmlFor="report-issue-type">
                        <span className="report-issue-required">*</span>問題類別
                    </label>
                    <div className="report-issue-selects">
                        <CustomSelect
                            id="report-issue-type"
                            className="report-issue-select-type"
                            options={ISSUE_TYPE_OPTIONS}
                            value={issueType}
                            onChange={handleIssueTypeChange}
                            placeholder=""
                            size="sm"
                        />
                        {showDetailSelect && (
                            <CustomSelect
                                className="report-issue-select-detail"
                                options={config.detailOptions}
                                value={issueCategory}
                                onChange={setIssueCategory}
                                placeholder=""
                                size="sm"
                            />
                        )}
                    </div>
                </div>

                <div className="report-issue-field">
                    <label className="report-issue-label" htmlFor="report-issue-title">
                        <span className="report-issue-required">*</span>問題名稱
                    </label>
                    <input
                        id="report-issue-title"
                        type="text"
                        className="report-issue-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="report-issue-field">
                    <label className="report-issue-label" htmlFor="report-issue-description">
                        <span className="report-issue-required">*</span>問題描述
                    </label>
                    <textarea
                        id="report-issue-description"
                        className="report-issue-textarea"
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="report-issue-upload-row">
                    <button
                        type="button"
                        className={`report-issue-upload-button ${file ? 'has-file' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {!file && (
                            <svg
                                className="report-issue-upload-icon"
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M11.5 2.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 17.5h8a1.5 1.5 0 0 0 1.5-1.5V6.5L11.5 2.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M11.5 2.5v4h4"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                        {file ? '已上傳檔案!' : '上傳檔案'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="report-issue-file-input"
                        accept={UPLOAD_ACCEPT}
                        onChange={handleFileChange}
                    />
                    <span className="report-issue-upload-hint">{UPLOAD_HINT}</span>
                </div>

                <div className="report-issue-actions">
                    <button
                        type="submit"
                        className={`report-issue-submit ${isSubmitted ? 'is-submitted' : ''}`}
                        disabled={!isFormValid || isSubmitting || isSubmitted}
                    >
                        {isSubmitted ? '已送出!' : isSubmitting ? '送出中…' : '送出'}
                    </button>
                </div>
            </form>
        </UnifiedModal>
    );
};

ReportIssueModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    /**
     * reportIssueConfig 的頁面代碼，如 'phrase'、'exam'。
     * 非必填：從全站 Footer 開啟時不指定，改由使用者在「功能頁面」下拉自己選。
     */
    pageKey: PropTypes.string,
    /** 覆寫彈窗標題後綴（未指定時取 config） */
    label: PropTypes.string,
    /** 覆寫第二層細項選項（未指定時取 config） */
    detailOptions: PropTypes.arrayOf(PropTypes.string),
};

export default ReportIssueModal;
