import PropTypes from 'prop-types';
import './AdminModal.css';

/**
 * 通用管理後台 Modal 組件
 * 
 * @param {boolean} isOpen - Modal 是否開啟
 * @param {Function} onClose - 關閉 Modal 的回調函數
 * @param {string} title - Modal 標題
 * @param {React.ReactNode} children - Modal 內容
 * @param {Function} onSubmit - 表單送出的回調函數
 * @param {string} submitText - 送出按鈕文字
 * @param {string} cancelText - 取消按鈕文字
 * @param {boolean} showFooter - 是否顯示底部按鈕區域
 * @param {string} size - Modal 大小 ('sm' | 'md' | 'lg')
 */
const AdminModal = ({
    isOpen = false,
    onClose,
    title = '標題',
    children,
    onSubmit,
    submitText = '送出',
    cancelText = '取消',
    showFooter = true,
    size = 'md',
}) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(e);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const sizeClass = {
        sm: 'modal-sm',
        md: '',
        lg: 'modal-lg',
        xl: 'modal-xl',
    }[size] || '';

    return (
        <>
            <div
                className={`modal fade show`}
                style={{ display: 'block' }}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                onClick={handleBackdropClick}
            >
                <div className={`modal-dialog modal-dialog-centered ${sizeClass}`} role="document">
                    <div className="modal-content admin-modal-content">
                        <div className="modal-header admin-modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={onClose}
                            ></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body admin-modal-body">
                                {children}
                            </div>
                            {showFooter && (
                                <div className="modal-footer admin-modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary admin-btn-cancel"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </button>
                                    <button type="submit" className="btn btn-primary admin-btn-submit">
                                        {submitText}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

AdminModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    cancelText: PropTypes.string,
    showFooter: PropTypes.bool,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

export default AdminModal;
