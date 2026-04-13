import React, { useState, useEffect } from 'react';
import './PhraseResult.css';
import PhraseModal from './PhraseModal';
import leftChevron from "../assets/chevron-left.svg";
import doubleLeftChevron from "../assets/chevron-double-left.svg";

const PhraseResult = ({ phrases = [], loading, error }) => {
	console.log("PhraseResult 收到的數據:", { phrases, loading, error });

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedPhrase, setSelectedPhrase] = useState(null);
	const [displayedPhrases, setDisplayedPhrases] = useState([]);
	const [leftPhrases, setLeftPhrases] = useState([]);
	const [rightPhrases, setRightPhrases] = useState([]);

	// 分頁設置
	const ITEMS_PER_PAGE = 16;
	const [currentPage, setCurrentPage] = useState(1);

	// 這裡改為計算屬性，不直接存為狀態
	const totalPages = Math.max(1, Math.ceil((phrases?.length || 0) / ITEMS_PER_PAGE));
	const VISIBLE_PAGES = 10;

	// 當 phrases 變化時重置頁碼
	useEffect(() => {
		setCurrentPage(1);
	}, [phrases.length]); // 只在 phrases 長度變化時重置頁碼

	// 當收到新的成語列表或頁碼變化時，更新顯示
	useEffect(() => {
		console.log("更新顯示成語，當前頁:", currentPage, "總頁數:", totalPages);

		if (phrases && phrases.length > 0) {
			// 為分頁準備數據
			const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
			const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, phrases.length);
			console.log(`顯示索引範圍: ${startIndex} 到 ${endIndex}, 總共 ${phrases.length} 條成語`);

			const pageItems = phrases.slice(startIndex, endIndex);
			setDisplayedPhrases(pageItems);

			// 分為左右兩列
			const leftItems = pageItems.slice(0, Math.ceil(pageItems.length / 2));
			const rightItems = pageItems.slice(Math.ceil(pageItems.length / 2));

			console.log("分列後:", { 左列: leftItems.length, 右列: rightItems.length });

			setLeftPhrases(leftItems);
			setRightPhrases(rightItems);
		} else {
			setDisplayedPhrases([]);
			setLeftPhrases([]);
			setRightPhrases([]);
		}
	}, [phrases, currentPage]);

	// 在 showDetail 函數中添加
	const showDetail = (e, phraseData) => {
		e.preventDefault(); // 防止預設的連結行為
		console.log("查看成語詳情:", phraseData);
		console.log("方音差數據屬性名稱:", Object.keys(phraseData)); // 查看屬性名稱
		console.log("方音差數據:", phraseData["Pronunciation variants"]); // 顯示實際數據
		setSelectedPhrase(phraseData);
		setIsModalOpen(true);
	};

	// 分頁處理函數
	const handlePageChange = (pageNumber) => {
		console.log("切換到頁面:", pageNumber);
		setCurrentPage(pageNumber);
	};

	const handlePreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(prev => prev - 1);
		}
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(prev => prev + 1);
		}
	};

	const handleFirstPage = () => {
		setCurrentPage(1);
	};

	const handleLastPage = () => {
		setCurrentPage(totalPages);
	};

	// 計算要顯示的頁碼
	const getPageNumbers = () => {
		let start = Math.max(1, currentPage - 4);
		let end = Math.min(totalPages, start + VISIBLE_PAGES - 1);

		if (end === totalPages) {
			start = Math.max(1, end - VISIBLE_PAGES + 1);
		}

		if (start === 1) {
			end = Math.min(totalPages, VISIBLE_PAGES);
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	// 渲染加載狀態
	if (loading) {
		return (
			<div className="phrase-loading">
				<div className="loading-spinner"></div>
				<p>載入俗諺語中...</p>
			</div>
		);
	}

	// 渲染錯誤狀態
	if (error) {
		return (
			<div className="phrase-empty">
				<p>{error}</p>
			</div>
		);
	}

	// 沒有成語
	if (!phrases || phrases.length === 0) {
		return (
			<div className="phrase-empty">
				<p>沒有找到符合條件的成語</p>
			</div>
		);
	}

	console.log("渲染成語卡片，左側:", leftPhrases.length, "右側:", rightPhrases.length);

	return (
		<div>
			<div className="row pt-0 px-0" id="phraseResult">
				<div className="col-12 col-md-6">
					{leftPhrases.map((phrase, index) => (
						<a key={`left-${index}`} href="#" onClick={(e) => showDetail(e, phrase)}>
							<div className="row px-3 py-3 my-2 phaseCard cardContainer">
								<div className="col-12 p-0 phaseTitle">{phrase.Data}</div>
							</div>
						</a>
					))}
				</div>

				<div className="col-12 col-md-6">
					{rightPhrases.map((phrase, index) => (
						<a key={`right-${index}`} href="#" onClick={(e) => showDetail(e, phrase)}>
							<div className="row px-3 py-3 my-2 phaseCard cardContainer">
								<div className="col-12 p-0 phaseTitle">{phrase.Data}</div>
							</div>
						</a>
					))}
				</div>

				{totalPages > 1 && (
					<div className="pagination-container">
						<ul className="pagination">
							{/* 跳轉至第一頁 */}
							<li className="page-item first-page-button">
								<a className={`page-link icon-link ${currentPage <= 1 ? 'invisible' : ''}`}
									onClick={handleFirstPage}>
									<img src={doubleLeftChevron} alt="第一頁" className="pagination-icon" />
								</a>
							</li>

							{/* 上一頁 */}
							<li className="page-item back-button">
								<a className={`page-link icon-link ${currentPage <= 1 ? 'invisible' : ''}`}
									onClick={handlePreviousPage}>
									<img src={leftChevron} alt="上一頁" className="pagination-icon" />
								</a>
							</li>

							{getPageNumbers().map(number => (
								<li key={number}
									className={`page-item ${currentPage === number ? 'active' : ''}`}>
									<a className="page-link"
										onClick={() => handlePageChange(number)}>
										{number}
									</a>
								</li>
							))}

							{/* 下一頁 */}
							<li className="page-item next-button">
								<a className={`page-link icon-link ${currentPage >= totalPages ? 'invisible' : ''}`}
									onClick={handleNextPage}>
									<img src={leftChevron} alt="下一頁" className="pagination-icon right-arrow" />
								</a>
							</li>

							{/* 跳轉至最後一頁 */}
							<li className="page-item last-page-button">
								<a className={`page-link icon-link ${currentPage >= totalPages ? 'invisible' : ''}`}
									onClick={handleLastPage}>
									<img src={doubleLeftChevron} alt="最後一頁" className="pagination-icon right-arrow" />
								</a>
							</li>
						</ul>
					</div>
				)}
			</div>

			{selectedPhrase && (
				<PhraseModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					phrase={selectedPhrase.Data}
					type={selectedPhrase.Type}
					pronunciation={selectedPhrase.Tai_lo}
					interpretation={selectedPhrase.Explain}
					pronun_diff={selectedPhrase["Pronunciation variants"]} // 修正屬性名稱
					audio={selectedPhrase.audio && selectedPhrase.audio.length > 0 ? selectedPhrase.audio[0] : null}
				/>
			)}
		</div>
	);
};

export default PhraseResult;