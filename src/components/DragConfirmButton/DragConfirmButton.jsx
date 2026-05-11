import './DragConfirmButton.css';

const DragConfirmButton = ({ visible, onClick, isLoading = false }) => {
  if (!visible) return null;

  return (
    <div className="drag-confirm-row">
      <button
        className="btn btn-primary admin-add-button"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? '儲存中...' : '確認順序'}
      </button>
    </div>
  );
};

export default DragConfirmButton;
