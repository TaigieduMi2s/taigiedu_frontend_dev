import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from '../../../components/Toast';
import AdminModal from '../../../components/AdminModal';
import AdminDataTable from '../../../components/AdminDataTable';
import './adminFoodPage.css';
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

const AdminFoodPage = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allFood, setAllFood] = useState([]);
  const [statusFilter, setStatusFilter] = useState('published');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZhName, setNewZhName] = useState('');
  const [newTwName, setNewTwName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newZhDesc, setNewZhDesc] = useState('');
  const [newTwDesc, setNewTwDesc] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  // TTS 與錄音流程狀態
  const [ttsGenerated, setTtsGenerated] = useState(false); // 是否已產生語音（TTS）
  const [ttsPlaying, setTtsPlaying] = useState(false);     // 目前是否在播放 TTS
  const [usingRecording, setUsingRecording] = useState(false); // 是否已切換成自行錄音模式
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [audioRef, setAudioRef] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const ttsUtterRef = useRef(null);
  // ttsProgress 為估算播放進度（目前 UI 僅以播放中條填滿，保留供未來細化）
  const [ttsProgress, setTtsProgress] = useState(0);
  // 錄音狀態
  const [recState, setRecState] = useState('idle'); // idle | recording | review
  const mediaRecorderRef = useRef(null);
  // recordChunks 暫存錄音片段（目前僅用於組成 blob，後續可擴充顯示大小等）
  const [recordChunks, setRecordChunks] = useState([]); // eslint-disable-line no-unused-vars
  const [recordUrl, setRecordUrl] = useState('');
  const recordedAudioRef = useRef(null);
  const [recordPlaying, setRecordPlaying] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // 過濾資料
  const foodList = useMemo(() => {
    return allFood.filter(i => i.status === statusFilter);
  }, [allFood, statusFilter]);

  const handlePlayAudio = useCallback((item) => {
    // 同一列再次點擊 => 停止
    if (playingId === item.id) {
      if (audioRef) { try { audioRef.pause(); audioRef.currentTime = 0; } catch { /* ignore */ } }
      if (ttsUtterRef.current) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
      setPlayingId(null);
      return;
    }

    // 停掉上一段
    if (audioRef) { try { audioRef.pause(); } catch { /* ignore */ } }
    if (ttsUtterRef.current) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }

    if (item.audioUrl) {
      const a = new Audio(item.audioUrl);
      a.addEventListener('ended', () => { setPlayingId(null); });
      a.play().catch(() => {/* ignore play error */ });
      setAudioRef(a);
      setPlayingId(item.id);
    } else if (item.ttsText) {
      if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
      const utter = new SpeechSynthesisUtterance(item.ttsText);
      try {
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => /zh|cmn|nan/i.test(v.lang));
        if (zhVoice) utter.voice = zhVoice;
        utter.lang = (zhVoice && zhVoice.lang) || 'zh-TW';
      } catch { /* ignore */ }
      utter.onend = () => { setPlayingId(null); ttsUtterRef.current = null; };
      window.speechSynthesis.speak(utter);
      ttsUtterRef.current = utter;
      setAudioRef(null);
      setPlayingId(item.id);
    }
  }, [audioRef, playingId, showToast]);

  useEffect(() => {
    return () => {
      if (audioRef) { try { audioRef.pause(); } catch { /* ignore */ } }
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ }
    };
  }, [audioRef]);

  const fetchFood = useCallback(() => {
    setIsLoading(true); setError(null);
    setTimeout(() => {
      try {
        const mockData = [
          // 目前項目
          { id: 1, zhName: "米糕", twName: "bí-ko", imageUrl: "https://picsum.photos/seed/ricecake/120/90", imageName: "米糕圖1.jpeg", zhDesc: "甜糯米蒸後，加入滷…", twDesc: "甜糯米蒸。蒸米蒸熟…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav", timestamp: "2025/04/01 23:55:00", status: "published" },
          { id: 2, zhName: "鹹酥雞", twName: "kiâm-soo-ke", imageUrl: "https://picsum.photos/seed/pork/120/90", imageName: "鹹酥雞.jpeg", zhDesc: "一種小吃…將豬肚內小塊…", twDesc: "一種小吃。將豬肚內肉…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/Trumpet.mp3", timestamp: "2025/04/01 23:55:00", status: "published" },
          // 下架記錄（示範）
          { id: 3, zhName: "草仔粿", twName: "cháu-á-kué", imageUrl: "https://picsum.photos/seed/cake/120/90", imageName: "草仔粿.jpg", zhDesc: "糯米與艾草製作…", twDesc: "糯米對合艾草…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav", timestamp: "2025/03/20 10:30:00", status: "archived" },
          { id: 4, zhName: "碗粿", twName: "uán-kué", imageUrl: "https://picsum.photos/seed/wankue/120/90", imageName: "碗粿.jpeg", zhDesc: "米漿蒸熟配滷汁…", twDesc: "米漿蒸熟，配滷…", audioUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav", timestamp: "2025/03/18 09:15:00", status: "archived" }
        ];
        const formatted = mockData.map(i => ({ id: i.id, zhName: i.zhName, twName: i.twName, imageUrl: i.imageUrl || '', imageName: i.imageName || '', zhDesc: i.zhDesc || '', twDesc: i.twDesc || '', audioUrl: i.audioUrl || '', timestamp: i.timestamp || 'N/A', status: i.status || 'published' }));
        setAllFood(formatted);
      } catch (e) {
        showToast(`載入飲食資料失敗: ${e.message}`, 'error');
        setError(e.message);
      } finally { setIsLoading(false); }
    }, 600);
  }, [showToast]);

  useEffect(() => { fetchFood(); }, [fetchFood]);

  const handleAddClick = () => { if (foodList.length >= 12 && statusFilter === 'published') { showToast('目前飲食項目已滿 12 個，請先刪除一個再新增。', 'warning'); return; } setShowAddModal(true); };
  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentEditItem(item);
    setNewZhName(item.zhName || '');
    setNewTwName(item.twName || '');
    setNewImageUrl(item.imageUrl || '');
    setNewImageName(item.imageName || '');
    setNewImageFile(null);
    setNewZhDesc(item.zhDesc || '');
    setNewTwDesc(item.twDesc || '');
    setNewAudioUrl(item.audioUrl || '');
    // 若原本有 ttsText，視為已產生 TTS
    setTtsGenerated(!!item.ttsText);
    setUsingRecording(false);
    setTtsPlaying(false);
    setShowAddModal(true);
  };
  const handleModalClose = () => {
    setShowAddModal(false);
    setNewZhName(''); setNewTwName('');
    setNewImageUrl(''); setNewImageName(''); setNewImageFile(null);
    setNewZhDesc(''); setNewTwDesc('');
    setNewAudioUrl('');
    setTtsGenerated(false); setTtsPlaying(false); setUsingRecording(false);
    setIsEditing(false); setCurrentEditItem(null);
    setRecState('idle'); setRecordUrl(''); setRecordPlaying(false); setRecordProgress(0);
  };

  const handleReplaceFileClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setNewImageFile(f);
    setNewImageName(f.name);
  };

  // 產生 TTS 語音（僅標記，不立即播放）
  const handleGenerateTTS = () => {
    if (!newTwName) { showToast('請先輸入「名稱(台羅)」', 'warning'); return; }
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    // 取消任何現有 TTS 播放
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTtsGenerated(true);
    setUsingRecording(false);
    setTtsPlaying(false);
  };

  // 播放或停止已產生之 TTS
  const handlePlayTTSInline = () => {
    if (!ttsGenerated) return;
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    // 若正在播放 => 停止
    if (ttsPlaying) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      setTtsPlaying(false);
      setTtsProgress(0);
      return;
    }
    // 開始播放
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    const utter = new SpeechSynthesisUtterance(newTwName);
    try {
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => /zh|cmn|nan/i.test(v.lang));
      if (zhVoice) utter.voice = zhVoice; utter.lang = (zhVoice && zhVoice.lang) || 'zh-TW';
    } catch { /* ignore */ }
    // 估算一個大致播放時間來顯示進度（粗略）：每字 0.08s
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

  // 捨棄生成發音，改用自行錄音模式
  const handleDiscardTTS = () => {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTtsGenerated(false);
    setTtsPlaying(false);
    setTtsProgress(0);
    setUsingRecording(true);
  };

  // 錄音控制
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('此瀏覽器不支援錄音', 'warning'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordChunks(chunks);
        setRecordUrl(url);
        setRecState('review');
        // 停掉進行中的播放狀態
        setRecordPlaying(false); setRecordProgress(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecState('recording');
    } catch (e) {
      showToast('無法啟動錄音：' + (e.message || ''), 'error');
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try { mr.stop(); } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null;
  };

  const handleToggleRecording = () => {
    if (recState !== 'recording') startRecording(); else stopRecording();
  };

  const handlePlayRecorded = () => {
    if (!recordUrl) return;
    // 切換播放/停止
    if (recordPlaying) {
      if (recordedAudioRef.current) { try { recordedAudioRef.current.pause(); recordedAudioRef.current.currentTime = 0; } catch { /* ignore */ } }
      setRecordPlaying(false); setRecordProgress(0);
      return;
    }
    const audio = recordedAudioRef.current || new Audio(recordUrl);
    recordedAudioRef.current = audio;
    audio.onended = () => { setRecordPlaying(false); setRecordProgress(1); };
    audio.ontimeupdate = () => {
      try { setRecordProgress(Math.min(1, audio.currentTime / (audio.duration || 1))); } catch { /* ignore */ }
    };
    audio.play().catch(() => { });
    setRecordPlaying(true);
  };

  const handleReRecord = () => {
    // 釋放舊的 Object URL
    if (recordUrl) { try { URL.revokeObjectURL(recordUrl); } catch { /* ignore */ } }
    setRecordUrl(''); setRecordChunks([]); setRecordPlaying(false); setRecordProgress(0);
    setRecState('idle');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newZhName || !newTwName || !newZhDesc || !newTwDesc) { showToast('請填寫必填欄位', 'warning'); return; }
    const now = new Date();
    const ts = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    if (isEditing && currentEditItem) {
      const updated = {
        ...currentEditItem,
        zhName: newZhName,
        twName: newTwName,
        imageUrl: newImageFile ? URL.createObjectURL(newImageFile) : newImageUrl,
        imageName: newImageFile ? newImageFile.name : newImageName,
        zhDesc: newZhDesc,
        twDesc: newTwDesc,
        audioUrl: usingRecording ? (recordUrl || '') : newAudioUrl,
        ttsText: (!usingRecording && ttsGenerated) ? newTwName : ''
      };
      setAllFood(prev => prev.map(i => i.id === currentEditItem.id ? updated : i));
      showToast('項目已更新', 'success');
    } else {
      const newItem = {
        id: 'food-' + Date.now(),
        zhName: newZhName,
        twName: newTwName,
        imageUrl: newImageFile ? URL.createObjectURL(newImageFile) : '',
        imageName: newImageFile ? newImageFile.name : '',
        zhDesc: newZhDesc,
        twDesc: newTwDesc,
        audioUrl: usingRecording ? (recordUrl || '') : '',
        ttsText: (!usingRecording && ttsGenerated) ? newTwName : '',
        timestamp: ts,
        status: 'published'
      };
      setAllFood(prev => [newItem, ...prev]);
      showToast('新飲食項目已新增', 'success');
    }
    handleModalClose();
  };

  const handleDeleteClick = (itemId) => {
    const isRestore = statusFilter === 'archived';
    const confirmMsg = isRestore ? '確定要復原此筆已下架的項目嗎？' : '確定要下架此筆項目嗎？';
    if (!window.confirm(confirmMsg)) return;
    try {
      setAllFood(prev => prev.map(i => i.id === itemId ? { ...i, status: isRestore ? 'published' : 'archived' } : i));
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

    setAllFood(prev => {
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
      header: '名稱(台羅)',
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
      header: '建立時間',
      enableSorting: true,
    }
  ], [statusFilter, playingId, handlePlayAudio]);

  return (
    <div className="admin-test-page p-4">
      <div className="admin-header-main">
        <h5 className="mb-3 text-secondary">首頁搜尋 &gt; 飲食 &gt; <span>{statusFilter === 'published' ? '目前項目' : '下架記錄'}</span></h5>
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
        data={foodList}
        columns={columns}
        enableDragging={true}
        enableSorting={true}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
        error={error}
        onRetry={fetchFood}
        emptyState={{ message: '目前沒有飲食資料' }}
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
          <label htmlFor="newTwName" className="form-label admin-form-label">*名稱(台羅)</label>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <input type="text" className="form-control admin-form-control" id="newTwName" value={newTwName} onChange={(e) => setNewTwName(e.target.value)} required style={{ maxWidth: '240px' }} />
            {!ttsGenerated && !usingRecording && (
              <button type="button" className="btn btn-outline-primary" onClick={handleGenerateTTS}>產生語音</button>
            )}
            {ttsGenerated && !usingRecording && (
              <div className="tts-controls">
                <button type="button" className="btn-tts-secondary" onClick={handlePlayTTSInline} aria-label={ttsPlaying ? '停止' : '播放'}>
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
          <label className="form-label admin-form-label">圖片</label>
          <div className="d-flex align-items-center gap-3">
            <div className="file-cell">
              <img src={jpgIcon} alt="JPG檔" className="file-icon-image" />
              <span className="file-name">{newImageName || '未選擇檔案'}</span>
            </div>
            <button type="button" className="btn btn-outline-secondary" onClick={handleReplaceFileClick}>上傳檔案</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
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

export default AdminFoodPage;
