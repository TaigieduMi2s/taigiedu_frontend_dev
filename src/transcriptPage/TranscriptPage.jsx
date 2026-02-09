import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import "./TranscriptPage.css";
import { useToast } from "../components/Toast";
import TranscriptHeader from "./TranscriptHeader";
import TranscriptContent from "./TranscriptContent";

// 創建字體大小的 Context
const FontSizeContext = createContext();

// 自定義 Hook，方便在其他組件中訪問字體大小
export const useFontSize = () => useContext(FontSizeContext);

const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState("小"); // 預設字體大小為中

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

const TranscriptPage = () => {
  const [isRecording, setIsRecording] = useState(false); // 錄音狀態
  const [isProcessing, setIsProcessing] = useState(false); // 處理中狀態
  const [isEditable, setIsEditable] = useState(false); // 背景狀態（灰或白）
  const [fontSize, setFontSize] = useState("小"); // 字體大小
  const [audioRecorder, setAudioRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const [content, setContent] = useState({
    台文漢字: "",
    台羅: "",
    白話字: ""
  });
  const [error, setError] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  // const [toast, setToast] = useState({ message: null, type: null });
  const { showError, showToast } = useToast();
  useEffect(() => {
    return () => {
      // 清理音訊 URL
      if (audioSource) {
        URL.revokeObjectURL(audioSource);
      }
    };
  }, [audioSource]);

  // const showError = (message) => {
  //   setToast({ message: null, type: null });  // 先重置
  //   setTimeout(() => {
  //     setToast({ message, type: 'error' });
  //   }, 100);

  //   setTimeout(() => {
  //     setToast({ message: null, type: null });
  //   }, 3000);
  // };

  // const showToast = (message, type = 'success') => {
  //   setToast({ message: null, type: null });  // 先重置
  //   setTimeout(() => {
  //     setToast({ message, type });
  //   }, 100);

  //   setTimeout(() => {
  //     setToast({ message: null, type: null });
  //   }, 3000);
  // };

  const startRecording = async () => {
    console.log('Starting recording...');

    // 檢查是否在安全上下文中運行
    if (!window.isSecureContext) {
      showError('錄音功能需要在 HTTPS 或 localhost 環境下使用');
      return;
    }

    // 檢查瀏覽器支援
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Browser API check failed:', {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      });
      showError('您的瀏覽器不支援錄音功能，請使用較新版本的 Chrome、Firefox 或 Edge');
      return;
    }

    try {
      // 直接請求麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000
        }
      });

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.start();
      setAudioRecorder(recorder);
      setIsRecording(true);
      setIsEditable(false);
    } catch (error) {
      console.error('錄音初始化失敗:', error);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (error.name === 'NotAllowedError') {
        showError('未提供網站錄音權限，請檢視瀏覽器設定或重新載入頁面');
      } else if (error.name === 'NotFoundError') {
        showError('未找到麥克風設備，請確保您的設備已連接並正確配置');
      } else if (error.name === 'NotSupportedError') {
        showError('您的瀏覽器不支援錄音功能');
      } else {
        showError(`錄音初始化失敗: ${error.message}`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
      setIsRecording(false);
      setIsProcessing(true);

      // 在 stopRecording 函數中修改 API 回應處理部分
      // 在 stopRecording 函數中修改 API 回應處理部分
      audioRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          // 保存錄音的音訊
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioSource(audioUrl);
          const reader = new FileReader();

          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/transcribe_speech`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  stt_type: 'base64',
                  stt_lang: 'tw',
                  stt_data: base64Audio
                })
              });

              const responseData = await response.json();
              console.log('=== API Response Content ===');
              console.log('Raw response:', responseData);

              // 檢查是否為靜音回應 - 新格式 {"message": {"tw": "<silent>", ...}}
              if (responseData.message && responseData.message.tw === "<{silent}>") {
                showToast('這段錄音似乎沒有聲音，請再嘗試一次！', "warning");
                setIsProcessing(false);
                return; // 提前退出，不更新文本內容
              }

              // 更新各個標籤的內容
              if (responseData.message) {
                setContent({
                  台文漢字: responseData.message.tw || "",
                  台羅: responseData.message.tl || "",
                  白話字: responseData.message.poj || ""
                });
              } else {
                console.error('API 回傳格式錯誤:', responseData);
                showError('API 回傳格式錯誤');
                setIsProcessing(false);
                return;
              }

              setIsEditable(true);
              setIsProcessing(false);  // 重置處理狀態
            } catch (error) {
              console.error('API Error:', error);
              console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
              });
              showError('轉換失敗，請重試');
              setIsProcessing(false);  // 錯誤時也要重置處理狀態
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          setIsProcessing(false);  // 錯誤時重置處理狀態
          showError('音訊處理失敗，請重試');
        }
      };

      // 清理錄音資源
      audioRecorder.stream.getTracks().forEach(track => track.stop());
      audioChunksRef.current = [];
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size); // 改變字體大小
  };

  // const handleRecordClick = () => {
  //   if (isProcessing) return; // 禁止在處理中操作
  //   if (isRecording) {
  //     // 停止錄音並開始處理
  //     setIsRecording(false);
  //     setIsProcessing(true);
  //     setTimeout(() => {
  //       setIsProcessing(false); // 處理完成
  //       setIsEditable(true); // 背景變白
  //     }, 3000);
  //   } else {
  //     // 開始錄音
  //     setIsRecording(true);
  //     setIsEditable(false); // 背景為灰色
  //   }
  // };
  const handleRecordClick = async () => {
    if (isProcessing) return;

    try {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    } catch (error) {
      console.error('Recording operation failed:', error);
      setIsRecording(false);
      setIsProcessing(false);
      alert('錄音操作失敗，請重試');
    }
  };

  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    setIsEditable(false);

    try {
      // 保存上傳的音訊檔案
      const audioUrl = URL.createObjectURL(file);
      setAudioSource(audioUrl);
      // 讀取音訊檔案並轉換為 base64
      const reader = new FileReader();

      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      const base64Audio = base64Data.split(',')[1];

      // 呼叫 API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/transcribe_speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stt_type: 'base64',
          stt_lang: 'tw',
          stt_data: base64Audio
        })
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log('=== API Response Content ===');
      console.log('Raw response:', responseData);

      // 檢查是否為靜音回應 - 新格式 {"message": {"tw": "<silent>", ...}}
      if (responseData.message && responseData.message.tw === "<{silent}>") {
        showToast('這段音檔似乎沒有聲音，請檢查後再試一次！', 'warning');
        setIsProcessing(false);
        return; // 提前退出，不更新文本內容
      }

      // 更新各個標籤的內容
      if (responseData.message) {
        setContent({
          台文漢字: responseData.message.tw || "",
          台羅: responseData.message.tl || "",
          白話字: responseData.message.poj || ""
        });
      } else {
        console.error('API 回傳格式錯誤:', responseData);
        showError('API 回傳格式錯誤');
        setIsProcessing(false);
        return;
      }

      setIsEditable(true);
    } catch (error) {
      console.error('File processing failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      showError('檔案處理失敗，請重試');
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="transcript-page">
      <FontSizeProvider>
        <TranscriptHeader
          isRecording={isRecording}
          isProcessing={isProcessing}
          fontSize={fontSize}
          onRecordClick={handleRecordClick}
          onFontSizeChange={handleFontSizeChange}
          onFileUpload={handleFileUpload}
        />
        <TranscriptContent
          isEditable={isEditable}
          fontSize={fontSize}
          content={content}
          setContent={setContent}
          audioSource={audioSource}
          showToast={showToast}
        />
        {/* {toast.message && (
          <div className={`error-toast ${toast.type}`}>
            {toast.message}
          </div>
        )} */}
      </FontSizeProvider>
    </div>
  );
};

export default TranscriptPage;
