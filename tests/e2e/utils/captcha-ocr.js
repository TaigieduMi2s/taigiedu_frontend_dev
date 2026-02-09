/**
 * 驗證碼 OCR 辨識工具
 * 使用 tesseract.js + sharp 進行圖像預處理和文字辨識
 * 
 * 📌 用於 Playwright 測試中自動辨識驗證碼圖片
 */

// 使用動態導入以避免 ESM/CommonJS 相容性問題
let Tesseract;
let sharp;

async function loadDependencies() {
    if (!Tesseract) {
        const tesseractModule = await import('tesseract.js');
        Tesseract = tesseractModule.default || tesseractModule;
    }
    if (!sharp) {
        const sharpModule = await import('sharp');
        sharp = sharpModule.default || sharpModule;
    }
}

/**
 * 預處理驗證碼圖片以提高 OCR 辨識率
 * @param {Buffer} imageBuffer - 原始圖片 buffer
 * @returns {Promise<Buffer>} - 預處理後的圖片 buffer
 */
async function preprocessImage(imageBuffer) {
    await loadDependencies();
    try {
        const processed = await sharp(imageBuffer)
            // 轉為灰階
            .grayscale()
            // 增加對比度
            .normalize()
            // 調整對比度和亮度
            .linear(1.5, -50)
            // 二值化 (閾值處理) - 讓文字更清晰
            .threshold(128)
            // 移除雜訊
            .median(1)
            // 放大圖片 (提高辨識率)
            .resize({ width: 400, kernel: 'lanczos3' })
            // 銳化
            .sharpen({ sigma: 1 })
            .toBuffer();

        return processed;
    } catch (error) {
        console.warn('圖片預處理失敗，使用原始圖片:', error.message);
        return imageBuffer;
    }
}

/**
 * 從 base64 字串解碼為 Buffer
 * @param {string} base64String - base64 編碼的圖片字串 (可包含 data:image/xxx;base64, 前綴)
 * @returns {Buffer}
 */
function base64ToBuffer(base64String) {
    // 移除 data:image/xxx;base64, 前綴
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

/**
 * 清理 OCR 辨識結果
 * @param {string} text - 原始辨識文字
 * @returns {string} - 清理後的文字 (只保留字母和數字)
 */
function cleanOcrResult(text) {
    // 移除空白、換行符、特殊字符，只保留字母和數字
    let cleaned = text.replace(/[^a-zA-Z0-9]/g, '');

    // 只修正 OCR 中明顯不可能出現在驗證碼中的字符
    // 大多數驗證碼會避免使用 l (小寫L) 和 I (大寫i)，因為容易與 1 混淆
    // 但 Z, S, B, O 等字母可能是驗證碼的一部分，不應該盲目替換
    cleaned = cleaned
        .replace(/l/g, '1')   // 小寫 l -> 1 (形狀極為相似)
        .replace(/I/g, '1');  // 大寫 I -> 1 (形狀極為相似)

    // 注意：不替換 O->0, Z->2, S->5, B->8
    // 因為這些字母可能本身就是驗證碼的一部分

    return cleaned.toUpperCase();
}

/**
 * 使用 OCR 辨識驗證碼圖片
 * @param {string} base64Image - base64 編碼的驗證碼圖片
 * @param {Object} options - 選項配置
 * @param {boolean} [options.preprocess=true] - 是否進行圖片預處理
 * @param {string} [options.lang='eng'] - 辨識語言
 * @param {number} [options.expectedLength=4] - 預期的驗證碼長度
 * @returns {Promise<{text: string, confidence: number, raw: string}>}
 */
export async function recognizeCaptcha(base64Image, options = {}) {
    const {
        preprocess = true,
        lang = 'eng',
        expectedLength = 4
    } = options;

    try {
        // 確保依賴已載入
        await loadDependencies();
        // 將 base64 轉換為 Buffer
        let imageBuffer = base64ToBuffer(base64Image);

        // 預處理圖片
        if (preprocess) {
            imageBuffer = await preprocessImage(imageBuffer);
        }

        // 使用 Tesseract 進行 OCR 辨識
        const result = await Tesseract.recognize(imageBuffer, lang, {
            // 設定 Tesseract 參數
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_pageseg_mode: '7', // 單行文字模式
        });

        const rawText = result.data.text;
        const cleanedText = cleanOcrResult(rawText);

        // 如果長度不符合預期，可能需要額外處理
        let finalText = cleanedText;
        if (expectedLength && cleanedText.length > expectedLength) {
            finalText = cleanedText.substring(0, expectedLength);
        }

        console.log(`[OCR] 原始辨識: "${rawText.trim()}" -> 清理後: "${finalText}" (置信度: ${result.data.confidence.toFixed(1)}%)`);

        return {
            text: finalText,
            confidence: result.data.confidence,
            raw: rawText.trim()
        };
    } catch (error) {
        console.error('[OCR] 驗證碼辨識失敗:', error);
        throw error;
    }
}

/**
 * 從頁面獲取驗證碼圖片並進行 OCR 辨識
 * @param {import('@playwright/test').Page} page - Playwright page 對象
 * @param {string} captchaImageSelector - 驗證碼圖片的選擇器
 * @param {Object} options - OCR 選項
 * @returns {Promise<string>} - 辨識出的驗證碼文字
 */
export async function getCaptchaFromPage(page, captchaImageSelector = 'img.captcha-image', options = {}) {
    // 等待驗證碼圖片出現
    const captchaImg = page.locator(captchaImageSelector);
    await captchaImg.waitFor({ state: 'visible', timeout: 10000 });

    // 獲取圖片的 src 屬性
    const imgSrc = await captchaImg.getAttribute('src');

    if (!imgSrc) {
        throw new Error('無法獲取驗證碼圖片 src');
    }

    // 如果是 base64 格式
    if (imgSrc.startsWith('data:image')) {
        const result = await recognizeCaptcha(imgSrc, options);
        return result.text;
    }

    // 如果是 URL，需要下載圖片
    // 這裡假設驗證碼都是 base64 格式
    throw new Error('不支援的驗證碼圖片格式，請使用 base64 編碼的圖片');
}

/**
 * 嘗試多次辨識驗證碼 (如果辨識失敗可刷新重試)
 * @param {import('@playwright/test').Page} page - Playwright page 對象
 * @param {Object} options - 配置選項
 * @param {string} [options.captchaSelector='img.captcha-image'] - 驗證碼圖片選擇器
 * @param {string} [options.refreshSelector='button.captcha-refresh-button'] - 刷新按鈕選擇器
 * @param {number} [options.maxRetries=3] - 最大重試次數
 * @param {number} [options.minConfidence=60] - 最低置信度要求
 * @returns {Promise<string>} - 辨識出的驗證碼
 */
export async function getCaptchaWithRetry(page, options = {}) {
    const {
        captchaSelector = 'img.captcha-image',
        refreshSelector = 'button.captcha-refresh-button',
        maxRetries = 3,
        minConfidence = 60,
        expectedLength = 4
    } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[OCR] 嘗試第 ${attempt}/${maxRetries} 次辨識驗證碼...`);

            // 等待驗證碼圖片載入
            const captchaImg = page.locator(captchaSelector);
            await captchaImg.waitFor({ state: 'visible', timeout: 10000 });

            // 給予一點時間讓圖片完全載入
            await page.waitForTimeout(500);

            // 獲取圖片 src
            const imgSrc = await captchaImg.getAttribute('src');

            if (!imgSrc || !imgSrc.startsWith('data:image')) {
                console.warn('[OCR] 驗證碼圖片格式異常，嘗試刷新...');
                if (attempt < maxRetries) {
                    await page.click(refreshSelector);
                    await page.waitForTimeout(1000);
                    continue;
                }
            }

            // 進行 OCR 辨識
            const result = await recognizeCaptcha(imgSrc, { expectedLength });

            // 檢查辨識結果
            if (result.text.length === expectedLength && result.confidence >= minConfidence) {
                console.log(`[OCR] ✓ 辨識成功: "${result.text}" (置信度: ${result.confidence.toFixed(1)}%)`);
                return result.text;
            }

            console.warn(`[OCR] 辨識結果不理想 (長度: ${result.text.length}, 置信度: ${result.confidence.toFixed(1)}%)，嘗試刷新...`);

            if (attempt < maxRetries) {
                await page.click(refreshSelector);
                await page.waitForTimeout(1000);
            }
        } catch (error) {
            console.error(`[OCR] 第 ${attempt} 次辨識失敗:`, error.message);
            if (attempt < maxRetries) {
                await page.click(refreshSelector).catch(() => { });
                await page.waitForTimeout(1000);
            }
        }
    }

    throw new Error(`[OCR] 無法在 ${maxRetries} 次嘗試內成功辨識驗證碼`);
}

export default {
    recognizeCaptcha,
    getCaptchaFromPage,
    getCaptchaWithRetry
};
