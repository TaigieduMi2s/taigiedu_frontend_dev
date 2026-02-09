import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MainContent.css";
import heroImage from "./assets/Rectangle 7310.svg";
import searchIcon from "./assets/home/search_logo.svg";
import todayEventsIcon from "./assets/todayEvents.svg";

const MainContent = () => {
  const navigate = useNavigate(); // 使用 useNavigate 來進行頁面跳轉
  const [query, setQuery] = useState("");
  const [keywords, setKeywords] = useState([]); // 存儲API回傳的關鍵字
  const [isLoading, setIsLoading] = useState(true);
  const [idiom, setIdiom] = useState(null); // 存儲俗語諺資料
  const [idiomLoading, setIdiomLoading] = useState(true);
  const [examInfo, setExamInfo] = useState([]); // 存儲考試資訊
  const [newsInfo, setNewsInfo] = useState([]); // 存儲活動快訊
  const [examLoading, setExamLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [todayEvents, setTodayEvents] = useState([]); // 存儲今日大事
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);

  // 今日大事彈窗狀態
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 組件掛載時獲取關鍵字和俗語諺
  useEffect(() => {
    fetchKeywords();
    fetchRandomIdiom();
    fetchExamInfo();
    fetchNewsInfo();
    fetchTodayEvents();
  }, []);

  // 從API獲取隨機俗語諺
  const fetchRandomIdiom = async () => {
    setIdiomLoading(true);
    try {
      const parameters = {}; // 無需附帶參數，空物件即可

      const response = await fetch(
        "https://dev.taigiedu.com/backend/idiom_random",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parameters)
        }
      );

      const data = await response.json();

      if (data.status === "success" && data.data) {
        setIdiom(data.data);
        console.log("取得一則俗諺語：", data);
        console.log("諺語內容：", data.data.Data);
        console.log("解釋：", data.data.Explain);
        console.log("台羅拼音：", data.data.Tai_lo);
      } else {
        console.error("API回傳格式錯誤:", data);
        setIdiom(null);
      }
    } catch (error) {
      console.error("獲取俗語諺失敗:", error);
      setIdiom(null);
    } finally {
      setIdiomLoading(false);
    }
  };

  // 從API獲取關鍵字 (使用 fetch 而非 axios)
  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const parameters = {
        "text": "我愛台語"
      };

      const response = await fetch(
        "https://dev.taigiedu.com/backend/top_keywords",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parameters)
        }
      );

      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        setKeywords(data.data);
      } else {
        console.error("API回傳格式錯誤:", data);
        // 如果API失敗，使用預設關鍵字
        setKeywords(["台語文", "國中", "奇異果", "母語", "王育德"]);
      }
    } catch (error) {
      console.error("獲取關鍵字失敗:", error);
      // 如果API失敗，使用預設關鍵字
      setKeywords(["台語文", "國中", "奇異果", "母語", "王育德"]);
    } finally {
      setIsLoading(false);
    }
  };

  // 從API獲取考試資訊
  const fetchExamInfo = async () => {
    setExamLoading(true);
    try {
      const response = await fetch(
        "https://dev.taigiedu.com/backend/info/test",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
          // 嘗試不傳送 body 或傳送 null
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("考試資訊API回傳:", data);

      if (Array.isArray(data)) {
        // 顯示所有資料
        setExamInfo(data);
      } else {
        console.error("考試資訊API回傳格式錯誤:", data);
        setExamInfo([]);
      }
    } catch (error) {
      console.error("獲取考試資訊失敗:", error);
      setExamInfo([]);
    } finally {
      setExamLoading(false);
    }
  };

  // 從API獲取活動快訊
  const fetchNewsInfo = async () => {
    setNewsLoading(true);
    try {
      const response = await fetch(
        "https://dev.taigiedu.com/backend/info/news",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
          // 嘗試不傳送 body 或傳送 null
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("活動快訊API回傳:", data);

      if (Array.isArray(data)) {
        // 顯示所有資料
        setNewsInfo(data);
      } else {
        console.error("活動快訊API回傳格式錯誤:", data);
        setNewsInfo([]);
      }
    } catch (error) {
      console.error("獲取活動快訊失敗:", error);
      setNewsInfo([]);
    } finally {
      setNewsLoading(false);
    }
  };

  // 從API獲取今日大事
  const fetchTodayEvents = async () => {
    setEventsLoading(true);
    setEventsError(false);
    try {
      const parameters = {}; // 傳送空的 JSON 物件

      const response = await fetch(
        "https://dev.taigiedu.com/backend/events",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parameters)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("今日大事API回傳:", data);

      if (data.status === "success" && Array.isArray(data.data)) {
        setTodayEvents(data.data);
        setEventsError(false);
      } else if (data.status === "error") {
        console.error("今日大事API回傳錯誤:", data.message);
        setTodayEvents([]);
        setEventsError(true);
      } else {
        console.error("今日大事API回傳格式錯誤:", data);
        setTodayEvents([]);
        setEventsError(true);
      }
    } catch (error) {
      console.error("獲取今日大事失敗:", error);
      setTodayEvents([]);
      setEventsError(true);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/search?query=${encodeURIComponent(tag)}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault(); // 防止頁面重整
    if (query.trim() === "") return;

    // 呼叫 top_keywords API 來建立統計資料
    try {
      const keywordsResponse = await fetch('https://dev.taigiedu.com/backend/top_keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query })
      });

      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        console.log('成功呼叫 key_words:', keywordsData);
      }
    } catch (error) {
      console.error('呼叫 top_keywords API 失敗:', error);
      // 即使失敗也繼續執行搜尋
    }

    navigate(`/search?query=${query}`); // 跳轉到搜尋結果頁面
  };

  return (
    <main className="main-content">
      {/* Hero Image Section with gradient background and text overlay */}
      <section className="hero-section px-0 pt-6" data-testid="home-hero-section">
        <div className="w-full max-w-[1600px] mx-auto h-[450px] relative bg-gradient-to-r from-[#4AA3BA] to-[#96D0B3] overflow-hidden rounded-lg">
          <img
            src={heroImage}
            alt="台語文教學共融平台"
            className="w-full h-full object-cover"
          />
          <div className="hero-text absolute top-1/3 left-1/4 text-white">
            <div className="big text-4xl font-bold leading-tight">歡迎來到</div>
            <div className="bigbig text-4xl font-bold leading-tight pb-4">
              台語文教學共融平台
            </div>
            <div className="small mt-2 text-xl leading-snug">
              鯨魚以聲音與其他鯨群溝通，聲波能穿越遙遠的距離。
            </div>
            <div className="small mt-2 text-xl leading-snug">
              台語老師透過語言的教學，讓台語的聲音在人群中傳播。
            </div>
            <div className="small mt-2 text-xl leading-snug">
              希翼能以台語為傳播媒介，傳遞咱台灣文化與情感。
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar and Tag Buttons Centered */}
      <div className="w-full max-w-[800px] mx-auto px-6 mt-6 text-center">
        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋..."
            className="search-input"
            data-testid="home-search-input"
          />
          <img
            src={searchIcon}
            className="search-icon"
            onClick={handleSearch} // 點擊圖片觸發搜尋跳轉
            data-testid="home-search-button"
          />
        </form>

        <div className="tag-buttons mt-4 flex justify-center gap-3">
          {isLoading ? (
            <div className="text-gray-500">載入關鍵字中...</div>
          ) : (
            keywords.map((tag) => (
              <button
                key={tag}
                className="button"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid-container mt-10">
        {/* Left Top Column */}
        <div className="fade-in">
          <div className="content-section">
            <h2 className="section-title">俗語諺輪播</h2>
            <div className="text-gray-600">
              {idiomLoading ? (
                <div className="text-gray-500">載入俗語諺中...</div>
              ) : idiom ? (
                <div>
                  <p
                    className="mb-2 text-gray-800"
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      lineHeight: '1.75rem'
                    }}
                  >
                    {idiom.Data}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{idiom.Tai_lo}</p>
                  <hr className="border-gray-300 my-2" />
                  <p className="text-xs text-gray-500 leading-relaxed">{idiom.Explain}</p>
                </div>
              ) : (
                <div>
                  <p
                    className="text-gray-800"
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      lineHeight: '1.75rem'
                    }}
                  >
                    無魚蝦也好
                  </p>
                  <p className="text-sm text-gray-500">Bô hî, hê mā hó</p>
                  <button
                    className="mt-3 text-blue-500 hover:text-blue-700 text-sm underline"
                    onClick={fetchRandomIdiom}
                  >
                    重新載入
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Top Column */}
        <div className="fade-in">
          <div className="content-section">
            <h2 className="section-title">今日大事</h2>
            {eventsLoading ? (
              <div className="text-gray-500">載入今日大事中...</div>
            ) : (
              <ul className="info-list">
                {todayEvents.length > 0 || true ? ( // 強制進入渲染邏輯以顯示多元範例資料
                  (todayEvents.length > 0 && !todayEvents[0].includes("今日無大事") ? todayEvents : [
                    { title: "OO節", content: "" },
                    { title: "OOO生日", content: "" },
                    { title: "歷史上的今天：蕭泰然誕生日 (1938 年 1 月 1 日)", content: "" },
                    {
                      title: "歷史上的今天：柯旗化誕生日 (1929 年 1 月 1 日)",
                      content: "柯旗化，台灣高雄人，是著名的英語教育家、詩人及作家。曾因政治案件入獄多年，在獄中完成了著名的《新英文法》。",
                      date: "1929 年 1 月 1 日"
                    },
                    {
                      title: "歷史上的今天：台灣人的自由台灣成立 (1956 年 1 月 1 日)",
                      content: "1956年元旦，廖文毅等人在日本東京成立「台灣共和國臨時政府」，主張台灣主權獨立。",
                      date: "1956 年 1 月 1 日"
                    }
                  ]).map((item, index) => {
                    // 相容處理：如果是純字串，將其轉為基本物件
                    const eventObj = typeof item === 'string' ? { title: item, content: "" } : item;

                    // 根據您目前的字串處理邏輯解析標題（若是字串格式則解析，若是物件則優先使用 title 欄位）
                    let displayTitle = eventObj.title;
                    let displayDate = eventObj.date || "";

                    if (typeof item === 'string' && item.includes(' ')) {
                      const parts = item.split(' ');
                      const firstPart = parts[0] || '';
                      const fullDateStr = firstPart.includes('：') ? firstPart.split('：')[1] : firstPart;
                      displayTitle = parts.slice(1).join(' ') || item;
                      displayDate = fullDateStr.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1 年 $2 月 $3 日');
                    }

                    // 判斷是否具備細節內容 (以此決定黑色或藍色)
                    const hasDetail = eventObj.content && eventObj.content.trim() !== "";

                    return (
                      <li key={index}>
                        {hasDetail ? (
                          // 有資料：藍色連結
                          <a
                            href="#"
                            className="event-link"
                            style={{ color: '#2d92c1', cursor: 'pointer', textDecoration: 'none' }}
                            onClick={(e) => {
                              e.preventDefault();
                              const eventData = {
                                date: displayDate || '1998 年 10 月 28 日',
                                title: displayTitle,
                                content: eventObj.content,
                                footnote: eventObj.footnote || '歷史大事記',
                                source: eventObj.source || '台灣獨曆',
                                sourceUrl: eventObj.sourceUrl || 'https://www.facebook.com/indepcalendar/'
                              };
                              setSelectedEvent(eventData);
                              setShowEventModal(true);
                            }}
                          >
                            {displayTitle}
                          </a>
                        ) : (
                          // 無資料：黑色純文字
                          <span style={{ color: '#424242', cursor: 'default' }}>
                            {displayTitle}
                          </span>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li>今日無大事</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Left Bottom Column */}
        <div className="fade-in">
          <div className="content-section">
            <h2 className="section-title">考試資訊</h2>
            {examLoading ? (
              <div className="text-gray-500">載入考試資訊中...</div>
            ) : (
              <ul className="info-list list-disc ml-5">
                {examInfo.length > 0 ? (
                  examInfo.map((exam) => (
                    <li key={exam.id}>
                      {exam.url ? (
                        <a
                          className="main-link"
                          href={exam.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          [{exam.category}] {exam.title}
                        </a>
                      ) : (
                        <span className="main-link">
                          [{exam.category}] {exam.title}
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li>暫無考試資訊</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Right Bottom Column */}
        <div className="fade-in">
          <div className="content-section">
            <h2 className="section-title">活動快訊</h2>
            {newsLoading ? (
              <div className="text-gray-500">載入活動快訊中...</div>
            ) : (
              <ul className="info-list">
                {newsInfo.length > 0 ? (
                  newsInfo.map((news) => (
                    <li key={news.id}>
                      {news.url ? (
                        <a
                          className="main-link"
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          [{news.category}] {news.title}
                        </a>
                      ) : (
                        <span className="main-link">
                          [{news.category}] {news.title}
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li>暫無活動快訊</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 今日大事詳細資訊彈窗 */}
      {showEventModal && selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="event-modal-close"
              onClick={() => setShowEventModal(false)}
            >
              ×
            </button>

            <div className="event-modal-header">
              <img src={todayEventsIcon} alt="今日大事" className="event-modal-icon" />
              <div className="event-modal-title-section">
                <div className="event-modal-date">{selectedEvent.date}</div>
                <h2 className="event-modal-title">{selectedEvent.title}</h2>
              </div>
            </div>

            <div className="event-modal-content">
              <div className="event-content-text">
                {selectedEvent.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="event-modal-source">
              <p>資料來源：{selectedEvent.source}</p>
              <p>官方粉專：<a href={selectedEvent.sourceUrl} target="_blank" rel="noopener noreferrer">{selectedEvent.sourceUrl}</a></p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainContent;
