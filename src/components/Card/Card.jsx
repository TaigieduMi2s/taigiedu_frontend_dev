import "./Card.css";
import loveIconFilled from "../../assets/Union (Stroke).svg";
import loveIconOutline from "../../assets/resourcepage/heart-outline.svg";
import downloadIcon from "../../assets/arrow-down-circle.svg";

/**
 * Card — composition 式卡片積木
 *
 * 由使用端自行組裝需要的部分，不做 boolean prop 開關、也不 fork：
 *
 *   <Card className="my-card" onClick={…}>
 *     <Card.Preview imageUrl={url}>
 *       <Card.FileType>PDF</Card.FileType>
 *       <Card.Stats likes={3} downloads={5} isLiked />
 *     </Card.Preview>
 *     <Card.Content>
 *       <Card.Title>標題</Card.Title>
 *       <Card.Uploader name="某某" />
 *       <Card.Tags tags={["國小", "課本"]} />
 *     </Card.Content>
 *   </Card>
 *
 * 設計約束（勿破壞）：
 * 1. class 一律 `cc-` 前綴，不得使用任何既有 class 名（避免全域樣式碰撞）。
 * 2. 間距由容器（`.cc-card` / `.cc-content`）以 flex gap 統一管理，子元件本身不帶 margin，
 *    因此任意增減子元件都不會出現異常空隙。
 * 3. **積木不寫死任何高度**（卡片高、預覽圖高、內容區高都不寫）。
 *    高度屬於「使用脈絡」，由使用端的 CSS 自己給，例如：
 *      .resource-card .cc-preview { height: 222px; }
 *    ⚠️ `Card.Preview` 是以 background-image 呈現，使用端**必須**給它高度，否則會是 0 高。
 * 4. 顏色／圓角／字級／間距等數值定義在 `.cc-card` 層級的 CSS variables（見 Card.css），
 *    使用端要微調時覆寫變數即可，不必改積木。
 */
const Card = ({ children, onClick, className = "" }) => (
  <div className={`cc-card ${className}`.trim()} onClick={onClick}>
    {children}
  </div>
);

/** 預覽圖：以背景圖呈現，並作為 FileType／Stats 等浮動元素的定位基準 */
const Preview = ({ imageUrl, className = "", children }) => (
  <div
    className={`cc-preview ${className}`.trim()}
    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
  >
    {children}
  </div>
);

/** 檔案類型標籤：貼在預覽圖左下角 */
const FileType = ({ className = "", children }) => (
  <div className={`cc-file-type ${className}`.trim()}>{children}</div>
);

/**
 * 點讚數／下載數：貼在預覽圖右上角
 *
 * 傳入 `onLikeClick` 時愛心改渲染成可點的 `<button>`（會 stopPropagation，不觸發卡片本身的 onClick）；
 * 沒傳就跟原本一樣只是顯示用。`likeDisabled` 用於請求進行中避免連點。
 */
const Stats = ({ likes, downloads, isLiked = false, onLikeClick, likeDisabled = false, className = "" }) => {
  const likeContent = (
    <>
      <img
        src={isLiked ? loveIconFilled : loveIconOutline}
        alt={isLiked ? "Liked" : "Not liked"}
        className="cc-likes-icon"
      />
      <span>{likes}</span>
    </>
  );

  return (
    <div className={`cc-stats ${className}`.trim()}>
      {onLikeClick ? (
        <button
          type="button"
          className="cc-likes cc-likes-button"
          aria-pressed={isLiked}
          aria-label={isLiked ? "取消點讚" : "點讚"}
          aria-disabled={likeDisabled}
          onClick={(e) => {
            // 不用 disabled：部分瀏覽器對 disabled 按鈕的點擊會落到外層卡片，變成開啟預覽
            e.stopPropagation();
            if (!likeDisabled) onLikeClick(e);
          }}
        >
          {likeContent}
        </button>
      ) : (
        <div className="cc-likes">{likeContent}</div>
      )}
      <div className="cc-downloads">
        <img src={downloadIcon} alt="Downloads" className="cc-downloads-icon" />
        <span>{downloads}</span>
      </div>
    </div>
  );
};

/** 文字內容區：負責內距與各行之間的 gap */
const Content = ({ className = "", children }) => (
  <div className={`cc-content ${className}`.trim()}>{children}</div>
);

const Title = ({ className = "", children }) => (
  <h3 className={`cc-title ${className}`.trim()}>{children}</h3>
);

/** 上傳者：預設輸出「上傳者：某某」，需要別的文案時直接傳 children 覆蓋 */
const Uploader = ({ name, label = "上傳者", className = "", children }) => (
  <p className={`cc-uploader ${className}`.trim()}>
    {children ?? `${label}：${name}`}
  </p>
);

const Tags = ({ tags = [], className = "" }) => (
  <div className={`cc-tags ${className}`.trim()}>
    {tags.map((tag, index) => (
      <span key={index} className="cc-tag">
        {tag}
      </span>
    ))}
  </div>
);

Card.Preview = Preview;
Card.FileType = FileType;
Card.Stats = Stats;
Card.Content = Content;
Card.Title = Title;
Card.Uploader = Uploader;
Card.Tags = Tags;

export default Card;
