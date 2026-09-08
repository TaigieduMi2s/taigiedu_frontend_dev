import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './DragConfirmButton.css';

/**
 * 拖曳排序的「未儲存變更」操作列 (Sticky Save Bar)
 *
 * 依 TAIGIE-254 的討論結論改成固定在畫面底部的操作列：
 * 原本的「確認順序」按鈕接在表格下方，列表一長就被捲到看不見，
 * 管理員拖曳完以為已經生效、其實沒送出，前台自然不會跟著變。
 *
 * 行為：
 * - 只有「有未儲存的順序變更」時才出現（visible），平常完全不佔空間。
 * - 固定在視窗底部，列表捲到哪裡都看得到；桌機讓開左側 AdminSidebar 的寬度。
 * - 文案用「儲存順序」而非「確認」，明確表示會寫入資料庫。
 * - 有未儲存變更時關閉／重整分頁會跳出瀏覽器的離開確認。
 */
const DragConfirmButton = ({ visible, onClick, onCancel, isLoading = false }) => {
  // 未儲存就離開頁面時攔一下（瀏覽器只允許顯示自己的預設文案）
  useEffect(() => {
    if (!visible) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="drag-save-bar" role="status">
      <div className="drag-save-bar-inner">
        <span className="drag-save-bar-message">
          <span className="drag-save-bar-icon" aria-hidden="true">!</span>
          順序已變更，尚未儲存
        </span>
        <div className="drag-save-bar-actions">
          {onCancel && (
            <button
              type="button"
              className="btn drag-save-bar-cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary drag-save-bar-save"
            onClick={onClick}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : '儲存順序'}
          </button>
        </div>
      </div>
    </div>
  );
};

DragConfirmButton.propTypes = {
  /** 是否有未儲存的順序變更 */
  visible: PropTypes.bool,
  /** 按下「儲存順序」 */
  onClick: PropTypes.func.isRequired,
  /** 按下「取消」（未提供時不顯示取消鈕） */
  onCancel: PropTypes.func,
  /** 儲存中：兩顆按鈕都會 disabled */
  isLoading: PropTypes.bool,
};

export default DragConfirmButton;
