import React, { useState, useEffect } from 'react';
import './PhraseResult.css';
import PhraseModal from './PhraseModal';
import Pagination from '../mainSearchPage/Pagination';

const ITEMS_PER_PAGE = 16;

const PhraseResult = ({ phrases = [], loading, error }) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedPhrase, setSelectedPhrase] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.max(1, Math.ceil((phrases?.length || 0) / ITEMS_PER_PAGE));

	useEffect(() => {
		setCurrentPage(1);
	}, [phrases.length]);

	const getCurrentPagePhrases = () => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return phrases.slice(start, start + ITEMS_PER_PAGE);
	};

	const showDetail = (e, phraseData) => {
		e.preventDefault();
		setSelectedPhrase(phraseData);
		setIsModalOpen(true);
	};

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	if (loading) {
		return (
			<div className="phrase-loading">
				<div className="loading-spinner"></div>
				<p>載入俗諺語中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="phrase-empty">
				<p>{error}</p>
			</div>
		);
	}

	if (!phrases || phrases.length === 0) {
		return (
			<div className="phrase-empty">
				<p>沒有找到符合條件的成語</p>
			</div>
		);
	}

	const currentPhrases = getCurrentPagePhrases();
	const leftPhrases = currentPhrases.slice(0, Math.ceil(currentPhrases.length / 2));
	const rightPhrases = currentPhrases.slice(Math.ceil(currentPhrases.length / 2));

	return (
		<div>
			<div className="row pt-0 mx-0" id="phraseResult">
				<div className="col-12 col-md-6 px-1">
					{leftPhrases.map((phrase, index) => (
						<a key={`left-${index}`} href="#" onClick={(e) => showDetail(e, phrase)}>
							<div className="row px-3 py-3 my-2 phaseCard cardContainer mx-0">
								<div className="col-12 p-0 phaseTitle">{phrase.Data}</div>
							</div>
						</a>
					))}
				</div>

				<div className="col-12 col-md-6 px-1">
					{rightPhrases.map((phrase, index) => (
						<a key={`right-${index}`} href="#" onClick={(e) => showDetail(e, phrase)}>
							<div className="row px-3 py-3 my-2 phaseCard cardContainer mx-0">
								<div className="col-12 p-0 phaseTitle">{phrase.Data}</div>
							</div>
						</a>
					))}
				</div>
			</div>

			{totalPages > 1 && (
				<div className="phrase-pagination">
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
						maxVisible={4}
					/>
				</div>
			)}

			{selectedPhrase && (
				<PhraseModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					phrase={selectedPhrase.Data}
					type={selectedPhrase.Type}
					pronunciation={selectedPhrase.Tai_lo}
					interpretation={selectedPhrase.Explain}
					pronun_diff={selectedPhrase["Pronunciation variants"]}
					audio={selectedPhrase.audio && selectedPhrase.audio.length > 0 ? selectedPhrase.audio[0] : null}
				/>
			)}
		</div>
	);
};

export default PhraseResult;