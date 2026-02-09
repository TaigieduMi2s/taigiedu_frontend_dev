import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from '../../../components/Toast';
import AdminModal from '../../../components/AdminModal';
import AdminDataTable from '../../../components/AdminDataTable';
import './adminFestivalPage.css';
import jpgIcon from '../../../assets/adminPage/jpg icon.svg';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';
import speakerIcon from '../../../assets/speaker-wave.svg';

const getFileNameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last || '';
  } catch { return ''; }
};

const AdminFestivalPage = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allFestival, setAllFestival] = useState([]);
  const [statusFilter, setStatusFilter] = useState('published');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZhName, setNewZhName] = useState('');
  const [newTwName, setNewTwName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [newZhDesc, setNewZhDesc] = useState('');
  const [newTwDesc, setNewTwDesc] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  // 日期：農曆/國曆 + 月/日
  const [dateType, setDateType] = useState('lunar'); // lunar | solar
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [audioRef, setAudioRef] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  // 檔案上傳
  const fileInputRef = useRef(null);
  const [newImageFile, setNewImageFile] = useState(null);
  // TTS / 錄音
  const [ttsGenerated, setTtsGenerated] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [usingRecording, setUsingRecording] = useState(false);
  const ttsUtterRef = useRef(null);
  const [recState, setRecState] = useState('idle'); // idle | recording | review
  const mediaRecorderRef = useRef(null);
  const [recordUrl, setRecordUrl] = useState('');
  const recordedAudioRef = useRef(null);
  const [recordPlaying, setRecordPlaying] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // 過濾資料
  const festivalList = useMemo(() => {
    return allFestival.filter(i => i.status === statusFilter);
  }, [allFestival, statusFilter]);

  const handlePlayAudio = useCallback((item) => {
    if (playingId === item.id) {
      if (audioRef) { try { audioRef.pause(); audioRef.currentTime = 0; } catch { /* ignore */ } }
      if (ttsUtterRef.current) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
      setPlayingId(null);
      return;
    }
    if (audioRef) { try { audioRef.pause(); } catch { /* ignore */ } }
    if (ttsUtterRef.current) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
    if (item.audioUrl) {
      const a = new Audio(item.audioUrl);
      a.addEventListener('ended', () => { setPlayingId(null); });
      a.play().catch(() => {/* ignore */ });
      setAudioRef(a);
      setPlayingId(item.id);
    } else if (item.ttsText) {
      if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
      const utter = new SpeechSynthesisUtterance(item.ttsText);
      try {
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => /zh|cmn|nan/i.test(v.lang));
        if (zhVoice) utter.voice = zhVoice; utter.lang = (zhVoice && zhVoice.lang) || 'zh-TW';
      } catch { /* ignore */ }
      utter.onend = () => { setPlayingId(null); ttsUtterRef.current = null; };
      window.speechSynthesis.speak(utter);
      ttsUtterRef.current = utter;
      setAudioRef(null);
      setPlayingId(item.id);
    }
  }, [audioRef, playingId, showToast]);

  useEffect(() => { return () => { if (audioRef) { try { audioRef.pause(); } catch { /* ignore */ } } }; }, [audioRef]);

  const fetchFestival = useCallback(() => {
    setIsLoading(true); setError(null);
    setTimeout(() => {
      try {
        const mockData = [
          // 目前項目
          { id: 1, zhName: "清明節", twName: "tshing-bîng-tse", imageUrl: "", imageName: "圖1.jpeg", zhDesc: "約當國曆四月四日或五日，民眾…", twDesc: "約當國曆四月四日或五日…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/Trumpet.mp3", timestamp: "國曆四月四日", status: "published" },
          { id: 2, zhName: "中秋節", twName: "Tiong-tshiû", imageUrl: "", imageName: "圖2.jpeg", zhDesc: "我國傳統民俗節日之一…", twDesc: "我國傳統民俗節日之一…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav", timestamp: "農曆八月十五日", status: "published" },
          // 下架
          { id: 3, zhName: "端午節", twName: "Tuan-ngóo-tse", imageUrl: "", imageName: "圖3.jpeg", zhDesc: "午時節慶…", twDesc: "午時節慶…", audioUrl: "", timestamp: "農曆五月初五", status: "archived" }
        ];
        const formatted = mockData.map(i => ({ id: i.id, zhName: i.zhName, twName: i.twName, imageUrl: i.imageUrl || '', imageName: i.imageName || '', zhDesc: i.zhDesc || '', twDesc: i.twDesc || '', audioUrl: i.audioUrl || '', timestamp: i.timestamp || 'N/A', status: i.status || 'published' }));
        setAllFestival(formatted);
      } catch (e) {
        showToast(`載入節慶資料失敗: ${e.message}`, 'error');
        setError(e.message);
      } finally { setIsLoading(false); }
    }, 600);
  }, [showToast]);

  useEffect(() => { fetchFestival(); }, [fetchFestival]);

  const handleAddClick = () => { if (festivalList.length >= 12 && statusFilter === 'published') { showToast('目前節慶項目已滿 12 個，請先刪除一個再新增。', 'warning'); return; } setShowAddModal(true); };
  const handleEditClick = (item) => {
    setIsEditing(true); setCurrentEditItem(item);
    setNewZhName(item.zhName || ''); setNewTwName(item.twName || '');
    setNewImageUrl(item.imageUrl || ''); setNewImageName(item.imageName || '');
    setNewZhDesc(item.zhDesc || '');
    setNewTwDesc(item.twDesc || '');
    setNewAudioUrl(item.audioUrl || '');
    setTtsGenerated(!!item.ttsText);
    setUsingRecording(false);
    setTtsPlaying(false); setTtsProgress(0);
    setRecState('idle'); setRecordUrl(''); setRecordPlaying(false); setRecordProgress(0);
    // 嘗試從 timestamp 解析日期型別與數字，若不是標準格式就保留空白
    if (item.timestamp && typeof item.timestamp === 'string') {
      if (item.timestamp.startsWith('農曆')) setDateType('lunar');
      else if (item.timestamp.startsWith('國曆')) setDateType('solar');
    }
    setDateMonth(''); setDateDay('');
    setNewImageFile(null);
    setTtsGenerated(false); setTtsPlaying(false); setTtsProgress(0); setUsingRecording(false);
    setShowAddModal(true);
  };
  const handleModalClose = () => {
    setShowAddModal(false);
    setNewZhName(''); setNewTwName(''); setNewImageUrl(''); setNewImageName('');
    setNewZhDesc(''); setNewTwDesc(''); setNewAudioUrl('');
    setDateType('lunar'); setDateMonth(''); setDateDay('');
    setNewImageFile(null);
    setTtsGenerated(false); setTtsPlaying(false); setTtsProgress(0); setUsingRecording(false);
    setRecState('idle'); setRecordUrl(''); setRecordPlaying(false); setRecordProgress(0);
    setIsEditing(false); setCurrentEditItem(null);
  };

  const handleReplaceFileClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/(image\/jpeg|image\/png)/.test(f.type)) { showToast('僅支援 JPG/PNG', 'warning'); return; }
    if (f.size > 2 * 1024 * 1024) { showToast('檔案超過 2MB 限制', 'warning'); return; }
    setNewImageFile(f);
    setNewImageName(f.name);
  };

  const handleGenerateTTS = () => {
    if (!newTwName) { showToast('請先輸入「名稱(臺羅)」', 'warning'); return; }
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTtsGenerated(true); setTtsPlaying(false); setUsingRecording(false); setTtsProgress(0);
  };
  const handlePlayTTS = () => {
    if (!ttsGenerated) return;
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    if (ttsPlaying) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } setTtsPlaying(false); setTtsProgress(0); return; }
    const utter = new SpeechSynthesisUtterance(newTwName);
    try {
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => /zh|cmn|nan/i.test(v.lang));
      if (zhVoice) utter.voice = zhVoice; utter.lang = (zhVoice && zhVoice.lang) || 'zh-TW';
    } catch { /* ignore */ }
    const est = Math.max(1, Math.round((newTwName || '').length * 0.08 * 1000));
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / est);
      setTtsProgress(p);
      if (p >= 1) { clearInterval(timer); }
    }, 60);
    utter.onend = () => { setTtsPlaying(false); setTtsProgress(0); clearInterval(timer); };
    utter.onerror = () => { setTtsPlaying(false); setTtsProgress(0); clearInterval(timer); };
    ttsUtterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setTtsPlaying(true);
  };

  const handleDiscardTTS = () => {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTtsGenerated(false); setTtsPlaying(false); setTtsProgress(0);
    setUsingRecording(true);
  };

  // 錄音控制
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showToast('此瀏覽器不支援錄音', 'warning'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordUrl(url);
        setRecState('review');
        setRecordPlaying(false); setRecordProgress(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecState('recording');
    } catch (e) { showToast('無法啟動錄音：' + (e.message || ''), 'error'); }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') { try { mr.stop(); } catch { /* ignore */ } }
    mediaRecorderRef.current = null;
  };

  const handleToggleRecording = () => { if (recState !== 'recording') startRecording(); else stopRecording(); };

  const handlePlayRecorded = () => {
    if (!recordUrl) return;
    if (recordPlaying) {
      if (recordedAudioRef.current) { try { recordedAudioRef.current.pause(); recordedAudioRef.current.currentTime = 0; } catch { /* ignore */ } }
      setRecordPlaying(false); setRecordProgress(0);
      return;
    }
    const audio = recordedAudioRef.current || new Audio(recordUrl);
    recordedAudioRef.current = audio;
    audio.onended = () => { setRecordPlaying(false); setRecordProgress(1); };
    audio.ontimeupdate = () => { try { setRecordProgress(Math.min(1, audio.currentTime / (audio.duration || 1))); } catch { /* ignore */ } };
    audio.play().catch(() => { });
    setRecordPlaying(true);
  };

  const handleReRecord = () => {
    if (recordUrl) { try { URL.revokeObjectURL(recordUrl); } catch { /* ignore */ } }
    setRecordUrl(''); setRecordPlaying(false); setRecordProgress(0); setRecState('idle');
  };

  const toCnNum = (n) => {
    const map1 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (n <= 10) return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][n];
    if (n < 20) return '十' + map1[n - 10];
    const tens = Math.floor(n / 10), ones = n % 10;
    return (tens > 1 ? map1[tens] + '十' : '十') + (ones ? map1[ones] : '');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newZhName || !newTwName || !newZhDesc || !newTwDesc) { showToast('請填寫必填欄位', 'warning'); return; }
    if (!dateMonth || !dateDay) { showToast('請填寫日期', 'warning'); return; }
    // 範圍防呆
    const m = Number(dateMonth); const d = Number(dateDay);
    if (isNaN(m) || isNaN(d)) { showToast('日期需為數字', 'warning'); return; }
    if (m < 1 || m > 12) { showToast('月份需介於 1-12', 'warning'); return; }
    const maxD = dateType === 'solar' ? 31 : 30;
    if (d < 1 || d > maxD) { showToast(`日期(${dateType === 'solar' ? '國曆' : '農曆'})需介於 1-${maxD}`, 'warning'); return; }
    const now = new Date();
    const ts = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const label = (dateType === 'lunar' ? '農曆' : '國曆') + `${toCnNum(Number(dateMonth))}月${toCnNum(Number(dateDay))}日`;
    if (isEditing && currentEditItem) {
      setAllFestival(prev => prev.map(i => i.id === currentEditItem.id ? { ...i, zhName: newZhName, twName: newTwName, imageUrl: newImageFile ? URL.createObjectURL(newImageFile) : newImageUrl, imageName: newImageFile ? newImageFile.name : newImageName, zhDesc: newZhDesc, twDesc: newTwDesc, audioUrl: usingRecording ? (recordUrl || '') : newAudioUrl, ttsText: (!usingRecording && ttsGenerated) ? newTwName : '', timestamp: label } : i));
      showToast('項目已更新', 'success');
    } else {
      const newItem = { id: 'festival-' + Date.now(), zhName: newZhName, twName: newTwName, imageUrl: newImageFile ? URL.createObjectURL(newImageFile) : '', imageName: newImageFile ? newImageFile.name : '', zhDesc: newZhDesc, twDesc: newTwDesc, audioUrl: usingRecording ? (recordUrl || '') : '', ttsText: (!usingRecording && ttsGenerated) ? newTwName : '', timestamp: label || ts, status: 'published' };
      setAllFestival(prev => [newItem, ...prev]);
      showToast('新節慶項目已新增', 'success');
    }
    handleModalClose();
  };

  const handleDeleteClick = (itemId) => {
    const isRestore = statusFilter === 'archived';
    const confirmMsg = isRestore ? '確定要復原此筆已下架的項目嗎？' : '確定要下架此筆項目嗎？';
    if (!window.confirm(confirmMsg)) return;
    try {
      setAllFestival(prev => prev.map(i => i.id === itemId ? { ...i, status: isRestore ? 'published' : 'archived' } : i));
      showToast(isRestore ? '項目已復原' : '項目已下架', 'success');
    } catch (e) {
      console.error(isRestore ? '復原失敗:' : '下架失敗:', e);
      showToast(`${isRestore ? '復原' : '下架'}失敗: ${e.message}`, 'error');
    }
  };

  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  // 拖曳處理
  const handleDragEnd = useCallback((activeId, overId) => {
    if (!overId) return;

    setAllFestival(prev => {
      const oldIndex = prev.findIndex(i => i.id === activeId);
      const newIndex = prev.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  }, []);

  // 定義表格欄位
  const columns = useMemo(() => [
    {
      id: 'edit',
      header: '修改',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <button className="admin-action-btn edit-btn" onClick={() => handleEditClick(row.original)}>
          <img src={editIcon} alt="編輯" className="admin-action-icon" />
        </button>
      )
    },
    {
      accessorKey: 'zhName',
      header: '名稱(華文)',
      enableSorting: true,
    },
    {
      accessorKey: 'twName',
      header: '名稱(臺羅)',
      enableSorting: true,
    },
    {
      id: 'image',
      accessorKey: 'imageName',
      header: '圖片',
      enableSorting: true,
      cell: ({ row }) => (
        (row.original.imageUrl || row.original.imageName) ? (
          <div className="file-cell">
            <img src={jpgIcon} alt="JPG檔" className="file-icon-image" />
            <span className="file-name">{row.original.imageName || getFileNameFromUrl(row.original.imageUrl) || '圖片'}</span>
          </div>
        ) : <span className="text-muted">無</span>
      )
    },
    {
      accessorKey: 'zhDesc',
      header: '華語釋義',
      enableSorting: false,
      cell: ({ row }) => <span title={row.original.zhDesc}>{row.original.zhDesc}</span>
    },
    {
      accessorKey: 'twDesc',
      header: '台語釋義',
      enableSorting: false,
      cell: ({ row }) => <span title={row.original.twDesc}>{row.original.twDesc}</span>
    },
    {
      id: 'audio',
      header: '語音',
      enableSorting: false,
      cell: ({ row }) => (
        (row.original.audioUrl || row.original.ttsText) ? (
          <div className="audio-cell">
            <button type="button" className={`audio-play-btn ${playingId === row.original.id ? 'is-playing' : ''}`} onClick={() => handlePlayAudio(row.original)} aria-label={playingId === row.original.id ? '暫停' : '播放'} title={playingId === row.original.id ? '暫停' : '播放'}>
              <img src={speakerIcon} alt="播放" className="audio-icon" />
            </button>
          </div>
        ) : (
          <span className="text-muted">無</span>
        )
      )
    },
    {
      id: 'action',
      header: '刪除',
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <button className={statusFilter === 'archived' ? "admin-action-btn restore-btn" : "admin-action-btn delete-btn"} onClick={() => handleDeleteClick(row.original.id)}>
          <img src={statusFilter === 'archived' ? uturnIcon : deleteIcon} alt={statusFilter === 'archived' ? "恢復" : "刪除"} className="admin-action-icon" />
        </button>
      )
    },
    {
      accessorKey: 'timestamp',
      header: '日期',
      enableSorting: true,
    }
  ], [statusFilter, playingId, handlePlayAudio]);

  return (
    <div className="admin-test-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">台灣文化 &gt; 節慶 &gt; <span>{statusFilter === 'published' ? '目前項目' : '下架記錄'}</span></h5>
        <div className="admin-controls-row">
          <button className="btn btn-primary me-3 admin-add-button" onClick={handleAddClick}>
            <img src={addIcon} alt="新增項目" />新增項目
          </button>
          <div className="status-filter">
            <span className="me-2 text-secondary">目前狀態：</span>
            <select className="form-select admin-status-dropdown" value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="published">目前項目</option>
              <option value="archived">下架記錄</option>
            </select>
          </div>
        </div>
      </div>

      <AdminDataTable
        data={festivalList}
        columns={columns}
        enableDragging={true}
        enableSorting={true}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchFestival}
        emptyState={{ message: '目前沒有節慶資料' }}
      />

      {/* 使用 AdminModal 組件 */}
      <AdminModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        title={isEditing ? '編輯項目' : '新增項目'}
        onSubmit={handleFormSubmit}
      >
        <div className="mb-3">
          <label htmlFor="newZhName" className="form-label admin-form-label">*名稱(華文)</label>
          <input type="text" className="form-control admin-form-control" id="newZhName" value={newZhName} onChange={(e) => setNewZhName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label htmlFor="newTwName" className="form-label admin-form-label">*名稱(臺羅)</label>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input type="text" className="form-control admin-form-control" id="newTwName" value={newTwName} onChange={(e) => setNewTwName(e.target.value)} required style={{ maxWidth: '240px' }} />
            {!ttsGenerated && !usingRecording && (
              <button type="button" className="btn btn-outline-primary" onClick={handleGenerateTTS}>產生語音</button>
            )}
            {ttsGenerated && !usingRecording && (
              <div className="tts-controls">
                <button type="button" className="btn-tts-secondary" onClick={handlePlayTTS} aria-label={ttsPlaying ? '停止' : '播放'}>
                  {ttsPlaying ? '■ 停止' : '▶ 播放'}
                </button>
                <div className="tts-progress-bar">
                  <div className="tts-progress-inner" style={{ width: ttsPlaying ? `${Math.round(ttsProgress * 100)}%` : '0%' }}></div>
                </div>
                <button type="button" className="btn-record-outline" onClick={handleDiscardTTS}>捨棄生成發音，自己錄音</button>
              </div>
            )}
            {usingRecording && (
              <div className="record-controls">
                {recState !== 'review' && (
                  <button type="button" className={recState === 'recording' ? 'btn-record-outline' : 'btn-record-primary'} onClick={handleToggleRecording}>
                    {recState === 'recording' ? '錄音中 ■' : '點此錄音'}
                  </button>
                )}
                {recState === 'recording' && (
                  <span className="inline-hint">再點擊一次結束錄音</span>
                )}
                {recState === 'review' && (
                  <>
                    <button type="button" className="btn-tts-secondary" onClick={handlePlayRecorded}>{recordPlaying ? '■ 停止' : '▶ 播放'}</button>
                    <div className="record-progress-bar">
                      <div className="record-progress-inner" style={{ width: `${Math.round(recordProgress * 100)}%` }}></div>
                    </div>
                    <button type="button" className="btn-record-outline" onClick={handleReRecord}>再次錄音</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label admin-form-label">*日期</label>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select className="form-select admin-form-control" style={{ width: '110px' }} value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <option value="lunar">農曆</option>
              <option value="solar">國曆</option>
            </select>
            <input type="number" className="form-control admin-form-control" placeholder="月" value={dateMonth} min={1} max={12} onChange={(e) => setDateMonth(e.target.value)} style={{ width: '90px' }} />
            <span>月</span>
            <input type="number" className="form-control admin-form-control" placeholder="日" value={dateDay} min={1} max={dateType === 'solar' ? 31 : 30} onChange={(e) => setDateDay(e.target.value)} style={{ width: '90px' }} />
            <span>日</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label admin-form-label">*圖片</label>
          <div className="d-flex align-items-center gap-3">
            <div className="file-cell">
              <img src={jpgIcon} alt="JPG檔" className="file-icon-image" />
              <span className="file-name">{newImageName || '未選擇檔案'}</span>
            </div>
            <button type="button" className="btn btn-outline-secondary" onClick={handleReplaceFileClick}>上傳檔案</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          <div className="form-text">*限 JPG、PNG可上傳，限制 2MB。</div>
        </div>
        <div className="mb-3">
          <label htmlFor="newZhDesc" className="form-label admin-form-label">*華語釋義</label>
          <textarea className="form-control admin-form-control" id="newZhDesc" rows="3" value={newZhDesc} onChange={(e) => setNewZhDesc(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label htmlFor="newTwDesc" className="form-label admin-form-label">*台語釋義</label>
          <textarea className="form-control admin-form-control" id="newTwDesc" rows="3" value={newTwDesc} onChange={(e) => setNewTwDesc(e.target.value)} required />
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminFestivalPage;
