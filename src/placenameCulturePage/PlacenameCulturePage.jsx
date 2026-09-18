import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect/CustomSelect';
import { UnifiedModal } from '../components/UnifiedModal/UnifiedModal';
import TainanMap from './TainanMap';
import { TAINAN_DISTRICTS } from './tainanMapData';
import { getDistrictIcon } from './districtIcons';
import {
    getRegions,
    getCounties,
    getDistrictList,
    getDistrictBrief,
    getDistrictDetail,
    DEFAULT_REGION,
    DEFAULT_COUNTY,
} from '../services/placenameCultureMockApi';
import './PlacenameCulturePage.css';

// 台語地名與文化 — 兩層導覽（單一頁面元件，透過 query string 切換層級）
//   /placename-culture                  -> 第一層（臺南全圖 + 導覽說明；滑過行政區看簡介）
//   /placename-culture?district=安平區   -> 第二層（單一行政區放大 + 完整介紹）
// 內容目前皆來自 services/placenameCultureMockApi.js 的 mock 資料。

const SpeakerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.6 4.5c0-.36-.213-.684-.543-.826a.9.9 0 0 0-.974.17L6.243 8.4H3.2a.9.9 0 0 0-.839.576A10.4 10.4 0 0 0 1.8 12c0 1.064.198 2.085.561 3.024a.9.9 0 0 0 .839.576h3.043l4.84 4.555a.9.9 0 0 0 .974.17.9.9 0 0 0 .543-.826V4.5Z" />
        <path d="M19.74 6.06a.9.9 0 1 0-1.273 1.273 6.6 6.6 0 0 1 0 9.334.9.9 0 1 0 1.273 1.273 8.4 8.4 0 0 0 0-11.88Z" />
        <path d="M17.197 8.603a.9.9 0 1 0-1.273 1.273 3 3 0 0 1 0 4.248.9.9 0 1 0 1.273 1.273 4.8 4.8 0 0 0 0-6.794Z" />
    </svg>
);

const DiceIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
);

// 80×80 的行政區圖示（設計稿標註「保留 icon 位置 80*80」）
// 後端提供 iconUrl 時優先使用，否則以 assets/tainan_map/ 內同名的圖檔遞補；
// 兩者皆無（例如未來新增的縣市）才顯示空版位。
const IconSlot = ({ src, name }) => {
    const iconSrc = src || getDistrictIcon(name);

    return iconSrc ? (
        <img className="pc-icon-slot" src={iconSrc} alt={name} />
    ) : (
        <div className="pc-icon-slot pc-icon-slot-empty" aria-hidden="true">
            <svg viewBox="0 0 80 80">
                <path d="M0 0h80v80H0z" />
                <path d="M0 0l80 80M80 0L0 80" />
            </svg>
        </div>
    );
};

// 音檔尚未提供，先以停用狀態保留播放按鈕的版位
const AudioButton = ({ audioUrl, label }) => (
    <button
        type="button"
        className="pc-audio-btn"
        disabled={!audioUrl}
        title={audioUrl ? `播放「${label}」發音` : '發音音檔尚未提供'}
        aria-label={`播放「${label}」發音`}
        onClick={() => {
            if (audioUrl) new Audio(audioUrl).play().catch(() => { });
        }}
    >
        <SpeakerIcon />
    </button>
);

// 後端資料可能有缺欄（例如某區沒有古地名、沒有里舊名、某個里舊名沒有說明），
// 缺的欄位一律不顯示，連同標籤／標題一起隱藏，不留空白或「undefined」。
const hasText = (value) => typeof value === 'string' && value.trim() !== '';

// 長文欄位可能是段落陣列或單一字串；濾掉空段落
const toParagraphs = (value) => (Array.isArray(value) ? value : [value]).filter(hasText);

// 沒有名稱的里舊名整筆略過
const toOldVillageNames = (list) =>
    (Array.isArray(list) ? list : [])
        .filter((item) => hasText(item?.name))
        .map((item) => ({ ...item, description: toParagraphs(item.description) }));

const PlacenameCulturePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const district = searchParams.get('district') || '';
    const level = district ? 2 : 1;

    // ---- 上方三個下拉選單（保留未來擴增其他縣市地圖使用）----
    const [regions, setRegions] = useState([]);
    const [region, setRegion] = useState(DEFAULT_REGION);
    const [counties, setCounties] = useState([]);
    const [county, setCounty] = useState(DEFAULT_COUNTY);
    const [districtNames, setDistrictNames] = useState([]);

    // ---- 第一層：滑過地圖時顯示的簡介 ----
    const [hoveredName, setHoveredName] = useState(null);
    const [brief, setBrief] = useState(null);

    // ---- 第二層：完整介紹 + 里舊名懸浮視窗 ----
    const [detail, setDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openOldName, setOpenOldName] = useState(null);

    const goToDistrict = useCallback(
        (name) => {
            const next = new URLSearchParams(searchParams);
            if (name) next.set('district', name);
            else next.delete('district');
            setSearchParams(next);
        },
        [searchParams, setSearchParams]
    );

    const backToMap = useCallback(() => goToDistrict(''), [goToDistrict]);

    const exploreRandom = () => {
        const pool = TAINAN_DISTRICTS;
        goToDistrict(pool[Math.floor(Math.random() * pool.length)].name);
    };

    // ---- 載入下拉選單資料 ----
    useEffect(() => {
        getRegions()
            .then((res) => setRegions(res?.data || []))
            .catch((err) => console.error('載入地區清單失敗:', err));
    }, []);

    useEffect(() => {
        getCounties(region)
            .then((res) => {
                const list = res?.data || [];
                setCounties(list);
                setCounty((prev) => (list.includes(prev) ? prev : list[0] || ''));
            })
            .catch((err) => console.error('載入縣市清單失敗:', err));
    }, [region]);

    useEffect(() => {
        getDistrictList(county)
            .then((res) => setDistrictNames(res?.data || []))
            .catch((err) => console.error('載入行政區清單失敗:', err));
    }, [county]);

    // ---- 第一層：hover 行政區 -> 取得簡介 ----
    useEffect(() => {
        if (level !== 1 || !hoveredName) {
            setBrief(null);
            return undefined;
        }
        let cancelled = false;
        getDistrictBrief(hoveredName)
            .then((res) => {
                if (!cancelled) setBrief(res?.data || null);
            })
            .catch((err) => console.error('載入行政區簡介失敗:', err));
        return () => {
            cancelled = true;
        };
    }, [level, hoveredName]);

    // ---- 第二層：載入完整介紹 ----
    useEffect(() => {
        if (!district) {
            setDetail(null);
            return undefined;
        }
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        setOpenOldName(null);

        getDistrictDetail(district)
            .then((res) => {
                if (cancelled) return;
                if (res?.status !== 'success' || !res.data) {
                    throw new Error('mock api response format invalid');
                }
                setDetail({
                    ...res.data,
                    description: toParagraphs(res.data.description),
                    oldVillageNames: toOldVillageNames(res.data.oldVillageNames),
                });
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('載入行政區資料失敗:', err);
                setError('載入資料時發生錯誤，請稍後再試。');
                setDetail(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [district]);

    return (
        <div className="placename-culture-page">
            {/* 上方工具列：地區 / 縣市 / 區域（sticky 效果由 page-filter-header 提供） */}
            <div className="pc-toolbar page-filter-header">
                <div className="pc-toolbar-content">
                    <div className="pc-select-wrap">
                        <CustomSelect options={regions} value={region} onChange={setRegion} placeholder="地區" />
                    </div>
                    <div className="pc-select-wrap">
                        <CustomSelect options={counties} value={county} onChange={setCounty} placeholder="縣市" />
                    </div>
                    <div className="pc-select-wrap">
                        <CustomSelect
                            options={districtNames}
                            value={district}
                            onChange={goToDistrict}
                            placeholder="區域"
                        />
                    </div>
                </div>
            </div>

            {/* ============ 第一層：臺南全圖 ============ */}
            {level === 1 && (
                <section className="pc-overview">
                    <div className="pc-overview-map">
                        <TainanMap
                            variant="full"
                            hoveredName={hoveredName}
                            onHoverDistrict={setHoveredName}
                            onSelectDistrict={goToDistrict}
                        />
                    </div>

                    <div className="pc-overview-side">
                        {brief ? (
                            <div className="pc-brief">
                                <IconSlot src={brief.iconUrl} name={brief.name} />
                                <div className="pc-brief-heading">
                                    <h2 className="pc-brief-name">{brief.name}</h2>
                                    {hasText(brief.romaji) && <p className="pc-brief-romaji">{brief.romaji}</p>}
                                </div>
                                {hasText(brief.summary) && <p className="pc-brief-summary">{brief.summary}</p>}
                            </div>
                        ) : (
                            <div className="pc-intro">
                                <h1 className="pc-intro-title">地名背後的故事：展開屬於你的台南地名探險之旅</h1>
                                <p className="pc-intro-text">
                                    歡迎來到台南——全台灣歷史最悠久的城市。這裡的每一條巷弄都藏著百年的故事，每一個地名都刻畫著先民的生活足跡。從安平的浪潮到鹽水的煙火，台南
                                    37 個行政區如同 37
                                    顆璀璨的珍珠，等待你點擊發掘。現在，請選取地圖上的任一區域，聽聽這塊土地各個行政區域的發音與故事，展開屬於你的台語文化之旅！
                                </p>

                                <p className="pc-intro-hint">
                                    <span className="pc-intro-arrow" aria-hidden="true">←</span>
                                    移動游標來了解行政區
                                </p>

                                <button type="button" className="pc-random-btn" onClick={exploreRandom}>
                                    <DiceIcon />
                                    隨機探索
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ============ 第二層：單一行政區完整介紹 ============ */}
            {level === 2 && (
                <section className="pc-detail">
                    <div className="pc-detail-map">
                        <button
                            type="button"
                            className="pc-mini-map"
                            onClick={backToMap}
                            title="回到臺南地圖"
                            aria-label="回到臺南地圖"
                        >
                            <TainanMap variant="mini" activeName={district} showLabel={false} />
                        </button>

                        <div className="pc-single-map">
                            <TainanMap variant="single" activeName={district} ariaLabel={`${district}地圖`} />
                        </div>
                    </div>

                    <div className="pc-detail-side">
                        {isLoading && <p className="pc-msg">載入中…</p>}
                        {error && <p className="pc-msg pc-msg-error">{error}</p>}

                        {!isLoading && !error && !detail && <p className="pc-msg">查無「{district}」的資料。</p>}

                        {detail && (
                            <>
                                <div className="pc-detail-heading">
                                    <IconSlot src={detail.iconUrl} name={detail.name} />
                                    <div className="pc-detail-titles">
                                        <div className="pc-detail-title-row">
                                            <h1 className="pc-detail-name">{detail.name}</h1>
                                            {hasText(detail.romaji) && (
                                                <span className="pc-detail-romaji">{detail.romaji}</span>
                                            )}
                                            <AudioButton audioUrl={detail.audioUrl} label={detail.name} />
                                        </div>
                                        {hasText(detail.oldName) && <p className="pc-detail-oldname">古地名：{detail.oldName}</p>}
                                    </div>
                                </div>

                                {detail.description.length > 0 && (
                                    <div className="pc-detail-body">
                                        {detail.description.map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))}
                                    </div>
                                )}

                                {detail.oldVillageNames.length > 0 && (
                                    <div className="pc-oldnames">
                                        <h2 className="pc-oldnames-title">里舊名：</h2>
                                        <p className="pc-oldnames-list">
                                            {detail.oldVillageNames.map((item, index) => (
                                                <React.Fragment key={item.name}>
                                                    {index > 0 && <span className="pc-oldnames-sep">、</span>}
                                                    {/* 沒有說明的里舊名不開懸浮視窗，只顯示文字 */}
                                                    {item.description.length > 0 ? (
                                                        <button
                                                            type="button"
                                                            className="pc-oldname-link"
                                                            onClick={() => setOpenOldName(item)}
                                                        >
                                                            {item.name}
                                                            {hasText(item.romaji) && item.romaji}
                                                        </button>
                                                    ) : (
                                                        <span className="pc-oldname-text">
                                                            {item.name}
                                                            {hasText(item.romaji) && item.romaji}
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* 里舊名懸浮視窗 */}
            <UnifiedModal
                isOpen={Boolean(openOldName)}
                onClose={() => setOpenOldName(null)}
                className="pc-oldname-modal"
            >
                {openOldName && (
                    <>
                        <div className="pc-oldname-modal-heading">
                            <h2>
                                {openOldName.name}
                                {hasText(openOldName.romaji) && <> <span>{openOldName.romaji}</span></>}
                            </h2>
                            <AudioButton audioUrl={openOldName.audioUrl} label={openOldName.name} />
                        </div>
                        <div className="pc-oldname-modal-body">
                            {openOldName.description.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </>
                )}
            </UnifiedModal>
        </div>
    );
};

export default PlacenameCulturePage;
