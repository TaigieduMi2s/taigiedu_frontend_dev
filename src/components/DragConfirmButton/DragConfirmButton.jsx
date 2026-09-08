import { useEffect, useRef, useState } from 'react';
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
 * - **捲到頁尾時會停在 Footer 上緣**，不會蓋住 Footer。
 * - 因為是浮在畫面上的（fixed），會在原位留一個等高的佔位區，
 *   把下方內容往下推，避免蓋住表格的最後一列。
 * - 文案用「儲存順序」而非「確認」，明確表示會寫入資料庫。
 * - 有未儲存變更時關閉／重整分頁會跳出瀏覽器的離開確認。
 */
const DragConfirmButton = ({ visible, onClick, onCancel, isLoading = false }) => {
  // 操作列距離視窗底部的距離：Footer 還沒進畫面時是 0（貼齊視窗底部），
  // Footer 一進畫面就等於它露出來的高度，等於把操作列頂在 Footer 上緣。
  const [bottomOffset, setBottomOffset] = useState(0);
  // 操作列是 fixed、不佔版面，所以要在原位放一個等高的佔位區把內容往下推，
  // 否則表格最後一列會被蓋住（高度是量出來的，手機版換行變高時也才跟得上）。
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;

    const update = () => {
      const footer = document.querySelector('.footer');
      if (!footer) {
        setBottomOffset(0);
        return;
      }
      const footerTop = footer.getBoundingClientRect().top;
      setBottomOffset(Math.max(0, window.innerHeight - footerTop));
    };

    update();
    // capture: true 讓內層容器的捲動也算數（後台內容區自己有 overflow）
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);
    // 表格列數變動、圖片載入等都會改變 Footer 的位置
    const observer = new ResizeObserver(update);
    observer.observe(document.body);

    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [visible]);

  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar) {
      setBarHeight(0);
      return undefined;
    }
    const measure = () => setBarHeight(bar.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [visible]);

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
    <>
      {/* 佔位區：高度 = 操作列高度 + 一點呼吸空間，讓表格最後一列不會被蓋住 */}
      <div
        className="drag-save-bar-spacer"
        style={{ height: barHeight ? `${barHeight + 16}px` : undefined }}
        aria-hidden="true"
      />
      <div
        ref={barRef}
        className="drag-save-bar"
        role="status"
        style={{ bottom: `${bottomOffset}px` }}
      >
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
    </>
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
