import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from '../../../components/Toast';
import { authenticatedFetch } from '../../../services/authService';
import AdminModal from '../../../components/AdminModal';
import AdminDataTable from '../../../components/AdminDataTable';
import './adminFoodPage.css';
import jpgIcon from '../../../assets/adminPage/jpg icon.svg';
import editIcon from '../../../assets/adminPage/pencil.svg';
import deleteIcon from '../../../assets/adminPage/trash.svg';
import addIcon from '../../../assets/adminPage/plus.svg';
import uturnIcon from '../../../assets/adminPage/uturn.svg';
import speakerIcon from '../../../assets/speaker-wave.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.taigiedu.com/backend';

const getFileNameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last || '';
  } catch { return ''; }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const blobUrlToBase64 = async (blobUrl) => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const [ttsGenerated, setTtsGenerated] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [usingRecording, setUsingRecording] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [audioRef, setAudioRef] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const ttsUtterRef = useRef(null);
  const [ttsProgress, setTtsProgress] = useState(0);
  // 錄音狀態
  const [recState, setRecState] = useState('idle'); // idle | recording | review
  const mediaRecorderRef = useRef(null);
  const [recordUrl, setRecordUrl] = useState('');
  const recordedAudioRef = useRef(null);
  const [recordPlaying, setRecordPlaying] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // 過濾資料
  const foodList = useMemo(() => {
    return allFood.filter(i => i.status === statusFilter);
  }, [allFood, statusFilter]);

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

  const fetchFood = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/culture/food`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '載入失敗');
      }
      const formatted = result.food_data.map(item => ({
        id: item.id,
        zhName: item.name || '',
        twName: item.name_tl || '',
        imageUrl: item.figure || '',
        imageName: item.figure ? getFileNameFromUrl(item.figure) : '',
        zhDesc: item.intro_mandarin || '',
        twDesc: item.intro_taigi || '',
        audioUrl: item.audio_data || '',
        ttsText: '',
        timestamp: item.timestamp || 'N/A',
        status: item.status === 'publish' ? 'published' : item.status === 'archive' ? 'archived' : item.status,
      }));
      setAllFood(formatted);
    } catch (e) {
      showToast(`載入飲食資料失敗: ${e.message}`, 'error');
      setAllFood([]);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchFood(); }, [fetchFood]);

  const handleAddClick = () => {
    setShowAddModal(true);
  };

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

  const handleGenerateTTS = () => {
    if (!newTwName) { showToast('請先輸入「名稱(台羅)」', 'warning'); return; }
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setTtsGenerated(true);
    setUsingRecording(false);
    setTtsPlaying(false);
  };

  const handlePlayTTSInline = () => {
    if (!ttsGenerated) return;
    if (!('speechSynthesis' in window)) { showToast('此瀏覽器不支援語音播放', 'warning'); return; }
    if (ttsPlaying) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      setTtsPlaying(false);
      setTtsProgress(0);
      return;
    }
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
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
    setTtsGenerated(false);
    setTtsPlaying(false);
    setTtsProgress(0);
    setUsingRecording(true);
  };

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
        setRecordUrl(url);
        setRecState('review');
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
    if (recordUrl) { try { URL.revokeObjectURL(recordUrl); } catch { /* ignore */ } }
    setRecordUrl(''); setRecordPlaying(false); setRecordProgress(0);
    setRecState('idle');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newZhName || !newTwName || !newZhDesc || !newTwDesc) {
      showToast('請填寫必填欄位', 'warning'); return;
    }

    try {
      // 準備圖片資料
      let figureData = newImageUrl || '';
      if (newImageFile) {
        figureData = await fileToBase64(newImageFile);
      }

      // 準備音訊資料
      let audioData = '';
      if (usingRecording && recordUrl) {
        audioData = await blobUrlToBase64(recordUrl);
      } else if (!usingRecording && !ttsGenerated) {
        audioData = newAudioUrl || '';
      }

      if (isEditing && currentEditItem) {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/culture/food/modify`, {
          method: 'POST',
          body: JSON.stringify({
            id: String(currentEditItem.id),
            action: '3',
            name: newZhName,
            name_tl: newTwName,
            intro_mandarin: newZhDesc,
            intro_taigi: newTwDesc,
            figure: figureData,
            audio_data: audioData,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '更新失敗');
        showToast('項目已更新', 'success');
      } else {
        const response = await authenticatedFetch(`${API_BASE_URL}/admin/culture/food/add`, {
          method: 'POST',
          body: JSON.stringify({
            name: newZhName,
            name_tl: newTwName,
            intro_mandarin: newZhDesc,
            intro_taigi: newTwDesc,
            figure: figureData,
            audio_data: audioData,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '新增失敗');
        showToast('新飲食項目已新增', 'success');
      }

      handleModalClose();
      await fetchFood();
    } catch (e) {
      showToast(`操作失敗: ${e.message}`, 'error');
    }
  };

  const handleDeleteClick = async (itemId) => {
    const isRestore = statusFilter === 'archived';
    const confirmMsg = isRestore ? '確定要復原此筆已下架的項目嗎？' : '確定要下架此筆項目嗎？';
    if (!window.confirm(confirmMsg)) return;
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admin/culture/food/modify`, {
        method: 'POST',
        body: JSON.stringify({
          id: String(itemId),
          action: isRestore ? '2' : '1',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '操作失敗');
      showToast(isRestore ? '項目已復原' : '項目已下架', 'success');
      await fetchFood();
    } catch (e) {
      console.error(isRestore ? '復原失敗:' : '下架失敗:', e);
      showToast(`${isRestore ? '復原' : '下架'}失敗: ${e.message}`, 'error');
    }
  };

  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  // 拖曳處理（本地排序，API 無 change endpoint）
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
      header: '華文釋義',
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
        <h5 className="mb-3 text-secondary">台語文化 &gt; 飲食 &gt; <span>{statusFilter === 'published' ? '目前項目' : '刪除紀錄'}</span></h5>
        <div className="admin-controls-row">
          <button className="btn btn-primary me-3 admin-add-button" onClick={handleAddClick}>
            <img src={addIcon} alt="新增項目" />新增項目
          </button>
          <div className="status-filter">
            <span className="me-2 text-secondary">目前狀態：</span>
            <select className="form-select admin-status-dropdown" value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="published">目前項目</option>
              <option value="archived">刪除紀錄</option>
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
          <label htmlFor="newZhDesc" className="form-label admin-form-label">*華文釋義</label>
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
