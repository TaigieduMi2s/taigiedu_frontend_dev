import React, { useState, useEffect, useRef } from 'react';
import './RelativeCalculatorPage.css';

const REL_LABELS = {
  '父': '爸爸', '母': '媽媽', '兄': '哥哥',
  '弟': '弟弟', '姊': '姊姊', '妹': '妹妹',
  '夫': '先生', '妻': '太太', '子': '兒子', '女': '女兒',
};

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
    <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
  </svg>
);

const RelativeCalculatorPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState([]);   // e.g. ['父','的','母']
  const [result, setResult] = useState(null);
  const [calculated, setCalculated] = useState(false);

  const audioRef = useRef(null);
  const ttsRequestIdRef = useRef(0);
  const ttsAbortRef = useRef(null);

  const handlePlayTTS = async (text) => {
    if (!text) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
    }

    ttsRequestIdRef.current += 1;
    const requestId = ttsRequestIdRef.current;
    
    const controller = new AbortController();
    ttsAbortRef.current = controller;

    try {
      const parameters = {
        tts_lang: 'tb',
        tts_data: text,
        tts_request_id: Date.now()
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/synthesize_speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const synthesized_audio_base64 = await response.text();
      if (requestId !== ttsRequestIdRef.current) {
        return;
      }

      const audioElement = new Audio(`data:audio/wav;base64,${synthesized_audio_base64}`);
      audioRef.current = audioElement;
      await audioElement.play();

    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('合成音頻失敗:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ttsAbortRef.current) {
        ttsAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetch('/data/relatives3.json')
      .then(r => r.json())
      .then(rows => { setData(rows); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const relCount = chain.filter(v => v !== '的').length;
  const lastItem = chain[chain.length - 1];
  const lastIsOf  = lastItem === '的';
  const lastIsRel = chain.length > 0 && lastItem !== '的';
  const canAddRel = (chain.length === 0 || lastIsOf) && relCount < 3;
  const canAddOf  = lastIsRel && relCount < 3;
  const canCalc   = relCount > 0 && !lastIsOf;

  const handleRel = (rel) => {
    if (!canAddRel) return;
    setChain(prev => [...prev, rel]);
    setCalculated(false);
    setResult(null);
  };

  const handleOf = () => {
    if (!canAddOf) return;
    setChain(prev => [...prev, '的']);
  };

  const handleEqual = () => {
    if (!canCalc) return;
    const rels = chain.filter(v => v !== '的');
    const [r1 = '無', r2 = '無', r3 = '無'] = rels;
    const found = data.filter(
      row => row.rel1 === r1 && row.rel2 === r2 && row.rel3 === r3
    );
    setResult(found.length > 0 ? found[0] : null);
    setCalculated(true);
  };

  const handleClear = () => {
    setChain([]);
    setResult(null);
    setCalculated(false);
  };

  // Build display string for 親戚關係 row
  const chainDisplay = chain.map(v => v === '的' ? '的' : REL_LABELS[v]).join(' ');

  // Result display
  const resultZh = result?.zh || '';
  const resultTw = result?.tw || '';
  const resultTl = result?.tl || '';

  if (loading) return <div className="rc-loading">載入中…</div>;

  const REL_BTNS = ['父', '母', '兄', '弟', '姊', '妹', '夫', '妻', '子', '女'];

  return (
    <div className="rc-page">
      <div className="rc-container">

        {/* 說明文字 */}
        <div className="rc-instructions">
          <h2 className="rc-inst-title">【親戚稱謂計算機】使用方法</h2>
          <ul className="rc-inst-list">
            <li>上方顯示「親戚關係」，呈現的是按鈕輸入的內容；「親戚稱謂」顯示的則是輸入的結果</li>
            <li>請先點選一個關係按鈕（例如：父、妹、妻、子），再按下「的」按鈕。再按下其他關係按鈕來疊加親戚關係（例如："爸爸的弟弟" 或 "妻子的哥哥"）。最後按下「＝」按鈕，「親戚稱謂」就會顯示結果</li>
          </ul>
        </div>

        {/* 主體：計算機 + 結果 */}
        <div className="rc-main">

          {/* 計算機卡片 */}
          <div className="rc-calc-card">

            {/* 顯示區 */}
            <div className="rc-display">
              <div className="rc-display-row">
                <span className="rc-display-label">親戚關係</span>
                <span className="rc-display-chain">
                  {chainDisplay || <span className="rc-display-placeholder">請選擇關係</span>}
                  {canCalc && <span className="rc-display-eq"> ＝</span>}
                </span>
              </div>
              <div className="rc-display-row rc-display-result-row">
                <span className="rc-display-label">親戚稱謂</span>
                <span className="rc-display-name">
                  {calculated
                    ? (resultZh || resultTw || (result ? resultTl : '查無結果'))
                    : <span className="rc-display-placeholder">稱</span>
                  }
                </span>
              </div>
            </div>

            {/* 按鈕格 */}
            <div className="rc-grid">
              {/* Row 1: 父 母 長(disabled) 幼(disabled) */}
              {['父', '母'].map(rel => (
                <button
                  key={rel}
                  className={`rc-btn rc-btn-rel ${chain.includes(rel) && chain[chain.length-1] === rel ? 'rc-btn-active' : ''} ${!canAddRel ? 'rc-btn-dim' : ''}`}
                  onClick={() => handleRel(rel)}
                  disabled={!canAddRel}
                >
                  {rel}
                </button>
              ))}
              <button className="rc-btn rc-btn-disabled" disabled>長</button>
              <button className="rc-btn rc-btn-disabled" disabled>幼</button>

              {/* Row 2: 兄 弟 姊 妹 */}
              {['兄', '弟', '姊', '妹'].map(rel => (
                <button
                  key={rel}
                  className={`rc-btn rc-btn-rel ${chain.includes(rel) && chain[chain.length-1] === rel ? 'rc-btn-active' : ''} ${!canAddRel ? 'rc-btn-dim' : ''}`}
                  onClick={() => handleRel(rel)}
                  disabled={!canAddRel}
                >
                  {rel}
                </button>
              ))}

              {/* Row 3: 夫 妻 清除重取(2col) */}
              {['夫', '妻'].map(rel => (
                <button
                  key={rel}
                  className={`rc-btn rc-btn-rel ${chain.includes(rel) && chain[chain.length-1] === rel ? 'rc-btn-active' : ''} ${!canAddRel ? 'rc-btn-dim' : ''}`}
                  onClick={() => handleRel(rel)}
                  disabled={!canAddRel}
                >
                  {rel}
                </button>
              ))}
              <button className="rc-btn rc-btn-clear rc-btn-span2" onClick={handleClear}>
                清除重取
              </button>

              {/* Row 4: 子 女 的 = */}
              {['子', '女'].map(rel => (
                <button
                  key={rel}
                  className={`rc-btn rc-btn-rel ${chain.includes(rel) && chain[chain.length-1] === rel ? 'rc-btn-active' : ''} ${!canAddRel ? 'rc-btn-dim' : ''}`}
                  onClick={() => handleRel(rel)}
                  disabled={!canAddRel}
                >
                  {rel}
                </button>
              ))}
              <button
                className={`rc-btn rc-btn-of ${!canAddOf ? 'rc-btn-dim' : ''}`}
                onClick={handleOf}
                disabled={!canAddOf}
              >
                的
              </button>
              <button
                className={`rc-btn rc-btn-eq ${!canCalc ? 'rc-btn-dim' : ''}`}
                onClick={handleEqual}
                disabled={!canCalc}
              >
                ＝
              </button>
            </div>
          </div>

          {/* 結果卡片 */}
          {calculated && (
            <div className="rc-result-card">
              {result ? (
                <>
                  <div className="rc-result-main">
                    <span className="rc-result-zh">{resultZh || resultTw || resultTl}</span>
                    {resultTl && (
                      <>
                        <span className="rc-result-tl">
                          【{resultTl}】
                        </span>
                        <button className="rc-result-speaker" aria-label="發音" onClick={() => handlePlayTTS(resultTl)} title="播放台羅發音">
                          <SpeakerIcon />
                        </button>
                      </>
                    )}
                  </div>
                  {resultTw && resultZh && resultTw !== resultZh && (
                    <div className="rc-result-alt">{resultTw}</div>
                  )}
                </>
              ) : (
                <div className="rc-result-empty">查無此稱謂，請確認輸入關係</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelativeCalculatorPage;
