/**
 * 台語文化（test）— 假資料 API
 *
 * ⚠️ 這是開發階段的 mock，尚未串接後端。前台（/culture-test）與後台（/admin/culture-test）
 * 共用本檔的同一份記憶體資料，因此在後台新增／修改／刪除後，切到前台即可看到結果
 * （重整頁面就會回到初始假資料）。
 *
 * ── 分類結構（2026-08 依 PM 指示調整）──
 * 來源表（影音資料管理總表 - 分類彙整）有三層，本頁**只收第一層的「文化」這一支**，
 * 並取其後兩層當作篩選：
 *   篩選第一層 = 來源表第二層（B 欄）：戲曲 / 祭典 / 傳統工藝 / 地方,產業
 *   篩選第二層 = 來源表第三層（C 欄「列舉細項」）：歌仔戲 / 布袋戲 / …
 *
 * 來源表第一層（A 欄）不出現在篩選與畫面上；本頁範圍內固定是「文化」，
 * 僅保留在 `parent` / `parent_category` 欄位供後端對照。
 *
 * ⚠️ 其餘 A 分類（職業台語、文學、教育、新聞/訪談、藝術表現）**PM 確認本頁不收**，
 * 因此原本那些分類與其假資料已整批移除，不要再加回來。
 *
 * ── 回傳格式 ──
 * 前台比照「媒體與社群資源」（POST /media）：一次回傳全部資料，
 * 依篩選第一層分組，每筆帶 subcategory（篩選第二層）。
 * 篩選、搜尋、分頁皆由前台處理。
 * 後台比照 /admin/socialmedia：GET 列表回傳攤平陣列（含已刪除），
 * 新增／修改／刪除／復原走 add / modify（action 1=刪除、2=復原、3=修改）。
 * 端點與欄位規格見 docs/culture_test_api.md。
 */

/**
 * 資料類型（前台搜尋列的類型下拉：全部／影音／文本）
 *
 * 2026-09 台語文化要同時收影音與文本兩種資料，版面參考國家文化記憶庫的搜尋列。
 * 目前先做**混合方案**：「全部」時兩種類型一起呈現，選了類型才出現分類下拉；
 * 兩種類型暫時共用同一套分類。
 * ⚠️ 前提是文本資料表的分類與影音「差不多」，尚待比對確認；若分類完全不同，
 * 需改成先選類型、各自篩選。
 */
export const CONTENT_TYPES = [
  { value: 'video', label: '影音' },
  { value: 'text', label: '文本' },
];

/**
 * 兩層分類（陣列順序即前台顯示順序）
 *
 * name     = 來源表第二層（篩選第一層）
 * parent   = 來源表第一層（A 欄，畫面不顯示，保留給後端對照）
 * children = 來源表第三層（篩選第二層）
 */
export const CATEGORY_TREE = [
  {
    name: '戲曲',
    parent: '文化',
    children: ['歌仔戲', '布袋戲', '歌詩', '其他偶戲'],
  },
  {
    name: '祭典',
    parent: '文化',
    children: ['藝閣/陣頭', '禮俗/儀式', '媽祖', '王爺'],
  },
  {
    name: '傳統工藝',
    parent: '文化',
    children: [
      '雕塑類',
      '木藝類',
      '竹藝類',
      '製陶/剪黏/窯藝/泥作類',
      '金工類',
      '漆藝/彩繪類',
      '編織/刺繡類',
      '其他類',
    ],
  },
  {
    name: '地方/產業',
    parent: '文化',
    children: ['自然資源', '人造物品', '飲食', '節慶', '其他類'],
  },
];

/**
 * 第三層分類的 id 對照（模擬 culture_category 資料表的 level 3）
 *
 * ⚠️ 「其他類」同時屬於「傳統工藝」與「地方/產業」，名稱不唯一，
 * 因此 key 一律用「第二層>第三層」全路徑，後端的唯一鍵也必須是 (parent_id, name)。
 */
const CATEGORY_IDS = (() => {
  const map = {};
  let nextId = 10;
  CATEGORY_TREE.forEach(node => {
    node.children.forEach(child => {
      map[`${node.name}>${child}`] = nextId++;
    });
  });
  return map;
})();

/** 由第三層分類 id 反查所屬的三層名稱（後端會回填這三個字串，前端不自己組） */
const CATEGORY_BY_ID = (() => {
  const map = {};
  CATEGORY_TREE.forEach(node => {
    node.children.forEach(child => {
      map[CATEGORY_IDS[`${node.name}>${child}`]] = {
        parent_category: node.parent,
        category: node.name,
        subcategory: child,
      };
    });
  });
  return map;
})();

/** 取得第三層分類 id；後台表單送出的是分類名稱，這裡負責轉成 category_id */
export const getCategoryId = (category, subcategory) =>
  CATEGORY_IDS[`${category}>${subcategory}`] ?? null;

/**
 * 假標題的取材主題（純粹為了讓 mock 標題看起來像真的，不具分類意義）
 *
 * key 用「第二層>第三層」全路徑，因為「其他類」同時出現在
 * 「傳統工藝」與「地方/產業」底下，只用第三層名稱會撞。
 */
const TOPICS = {
  // 戲曲
  '戲曲>歌仔戲': ['歌仔戲身段', '歌仔戲曲調', '野台歌仔戲', '內台歌仔戲'],
  '戲曲>布袋戲': ['金光布袋戲', '傳統掌中戲', '戲偶雕刻', '口白藝術'],
  '戲曲>歌詩': ['唸歌', '月琴說唱', '台語歌詩吟唱'],
  '戲曲>其他偶戲': ['皮影戲', '傀儡戲', '懸絲偶戲'],

  // 祭典
  '祭典>藝閣/陣頭': ['藝閣遶境', '宋江陣', '八家將', '官將首'],
  '祭典>禮俗/儀式': ['生命禮俗', '歲時節俗', '二十四節氣', '婚喪喜慶'],
  '祭典>媽祖': ['大甲媽祖遶境', '白沙屯進香', '媽祖信仰'],
  '祭典>王爺': ['王船祭典', '燒王船', '五府千歲'],

  // 傳統工藝
  '傳統工藝>雕塑類': ['神像雕刻', '石雕', '泥塑'],
  '傳統工藝>木藝類': ['大木作', '小木作', '三義木雕', '傳統家具'],
  '傳統工藝>竹藝類': ['竹編', '竹管厝', '竹製生活器物'],
  '傳統工藝>製陶/剪黏/窯藝/泥作類': ['交趾陶', '剪黏', '鶯歌陶瓷', '磚瓦窯'],
  '傳統工藝>金工類': ['錫工藝', '打鐵', '金銀細工'],
  '傳統工藝>漆藝/彩繪類': ['建築彩繪', '門神彩繪', '漆器'],
  '傳統工藝>編織/刺繡類': ['纏花', '傳統刺繡', '藺草編'],
  '傳統工藝>其他類': ['紙紮', '燈籠', '製香'],

  // 地方/產業
  '地方/產業>自然資源': ['鹽田', '潟湖', '溫泉', '林業'],
  '地方/產業>人造物品': ['老街建築', '糖廠', '古橋', '水圳'],
  '地方/產業>飲食': ['夜市小吃', '白河蓮藕', '東港黑鮪魚', '辦桌菜'],
  '地方/產業>節慶': ['端午', '中元', '元宵', '中秋'],
  '地方/產業>其他類': ['在地信仰', '聚落故事', '產業轉型'],
};

const TITLE_PATTERNS = [
  topic => `${topic}專題報導`,
  topic => `認識${topic}：入門介紹`,
  topic => `${topic}的歷史與演變`,
  topic => `職人專訪：${topic}的傳承`,
  topic => `${topic}實作紀錄`,
  topic => `校園走讀：${topic}`,
  topic => `${topic}與台語詞彙教學`,
  topic => `地方誌：${topic}的在地故事`,
  topic => `${topic}紀錄片精選`,
  topic => `${topic}主題講座`,
];

// 固定種子的偽亂數，確保每次重整看到的假資料一致（方便比對畫面）
const seededRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

/** 固定起算日往後推，讓每筆假資料的建立時間看起來有先後但每次重整都一樣 */
const mockTimestamp = (offsetDays) =>
  new Date(Date.UTC(2026, 0, 1, 2, 0, 0) + offsetDays * 86400000).toISOString();

/**
 * 建立攤平的假資料（後台格式）
 *
 * 前台需要的分組格式由 groupForFrontend() 從這份攤平資料推導，
 * 兩邊共用同一份陣列，後台改動才會即時反映到前台。
 */
const buildMockItems = () => {
  const random = seededRandom(20260807);
  const items = [];
  let id = 1;

  CATEGORY_TREE.forEach(node => {
    // 目前四個分類都有第三層；仍保留無子項的分支，避免日後分類調整時壞掉
    const buckets = node.children.length > 0
      ? node.children.map(name => ({ subcategory: name, topicKey: `${node.name}>${name}` }))
      : [{ subcategory: '', topicKey: node.name }];

    let sortOrder = 1;

    buckets.forEach(({ subcategory, topicKey }) => {
      const topics = TOPICS[topicKey] || [subcategory || node.name];
      const count = 20 + Math.floor(random() * 26); // 每組 20~45 筆

      for (let index = 0; index < count; index += 1) {
        const topic = topics[Math.floor(random() * topics.length)];
        const pattern = TITLE_PATTERNS[index % TITLE_PATTERNS.length];
        const round = Math.floor(index / TITLE_PATTERNS.length) + 1;
        const createdAt = mockTimestamp(id % 210);
        items.push({
          id,
          type: 'video',
          category_id: getCategoryId(node.name, subcategory),
          // A 欄，前台不顯示，保留供後端對照
          parent_category: node.parent,
          category: node.name,
          subcategory,
          title: `${pattern(topic)}${round > 1 ? `（${round}）` : ''}`,
          // 尚無圖片資料，前台會顯示預設佔位圖；接上 API 後改放縮圖路徑
          image: null,
          url: `https://example.com/video/${id}`,
          sort_order: sortOrder++,
          is_deleted: false,
          created_at: createdAt,
          updated_at: createdAt,
        });
        id += 1;
      }
    });
  });

  return items;
};

// 假作者名（虛構），接上 API 後改用文本資料表的作者欄位
const TEXT_AUTHORS = ['陳怡君', '林家豪', '黃淑芬', '張志偉', '李佩珊', '吳宗翰'];

const TEXT_SUMMARY_PATTERNS = [
  (topic, sub) => `整理${topic}的發展脈絡與在地說法，收錄${sub}相關的台語詞彙與例句，適合作為課堂延伸閱讀。`,
  (topic, sub) => `訪談從事${sub}的在地耆老與職人，以台語逐字記錄${topic}的做法、禁忌與代代相傳的故事。`,
  (topic, sub) => `從文獻與老照片回顧${topic}，說明${sub}在不同地區的差異，並附上台語發音與用字對照。`,
  (topic) => `以${topic}為主題設計的教學講義，包含情境對話、詞彙練習與學習單，可直接用於台語課程。`,
];

const TEXT_TITLE_PATTERNS = [
  topic => `${topic}文獻整理`,
  topic => `${topic}田野調查報告`,
  topic => `${topic}台語詞彙表`,
  topic => `${topic}口述歷史逐字稿`,
  topic => `${topic}教學講義`,
];

/**
 * 建立文本類型的假資料（前台專用）
 *
 * ⚠️ 文本資料的真實分類尚未確認，這裡暫時套用影音的同一套分類，只為了讓
 * 類型下拉切到「文本」時有東西可看。後台 /admin/culture-test 目前只管影音，
 * 因此文本不放進 MOCK_ITEMS，後台看不到也改不到。
 * id 以 `text-` 開頭，避免與影音的數字 id 撞 key。
 */
const buildMockTextItems = () => {
  const random = seededRandom(20260917);
  const items = [];
  let id = 1;

  CATEGORY_TREE.forEach(node => {
    let sortOrder = 1;

    node.children.forEach(subcategory => {
      const topics = TOPICS[`${node.name}>${subcategory}`] || [subcategory];
      const count = 3 + Math.floor(random() * 6); // 每組 3~8 筆

      for (let index = 0; index < count; index += 1) {
        const topic = topics[Math.floor(random() * topics.length)];
        const pattern = TEXT_TITLE_PATTERNS[index % TEXT_TITLE_PATTERNS.length];
        const summary = TEXT_SUMMARY_PATTERNS[Math.floor(random() * TEXT_SUMMARY_PATTERNS.length)];
        items.push({
          id: `text-${id}`,
          type: 'text',
          parent_category: node.parent,
          category: node.name,
          subcategory,
          title: pattern(topic),
          // 以下三個欄位只有文本有，前台搜尋結果列用來顯示作者、日期與摘要
          author: TEXT_AUTHORS[Math.floor(random() * TEXT_AUTHORS.length)],
          summary: summary(topic, subcategory),
          published_at: mockTimestamp(Math.floor(random() * 240)).slice(0, 10),
          image: null,
          url: `https://example.com/text/${id}`,
          sort_order: sortOrder++,
          is_deleted: false,
        });
        id += 1;
      }
    });
  });

  return items;
};

// 記憶體資料表：前台讀未刪除的、後台讀全部，後台的異動直接改這個陣列
let MOCK_ITEMS = buildMockItems();
let nextItemId = MOCK_ITEMS.length + 1;
const MOCK_TEXT_ITEMS = buildMockTextItems();

/** 依 category_order 把攤平資料分組成前台要的格式，只收未刪除的 */
const groupForFrontend = () => {
  const data = {};
  CATEGORY_TREE.forEach(node => {
    data[node.name] = [];
  });

  // 影音與文本合併後依 sort_order 排序（sort 為穩定排序，同序位時影音在前）
  [...MOCK_ITEMS, ...MOCK_TEXT_ITEMS]
    .filter(item => !item.is_deleted)
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach(item => {
      if (!data[item.category]) data[item.category] = [];
      data[item.category].push({
        id: item.id,
        type: item.type,
        parent_category: item.parent_category,
        category: item.category,
        subcategory: item.subcategory,
        title: item.title,
        image: item.image,
        url: item.url,
        ...(item.type === 'text' && {
          author: item.author,
          summary: item.summary,
          published_at: item.published_at,
        }),
      });
    });

  return data;
};

const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 【前台】取得台語文化影音（mock）
 *
 * 回傳格式比照 POST /culture-media：
 *   {
 *     category_order: ['戲曲', '祭典', '傳統工藝', '地方/產業'],  // 篩選第一層
 *     categories: [{ name, parent, children }],
 *     content_types: [{ value: 'video', label: '影音' }, { value: 'text', label: '文本' }],
 *     data: { 戲曲: [{ ..., type: 'video' | 'text', subcategory: '歌仔戲' }], ... }
 *   }
 */
export const fetchCultureItems = async () => {
  await delay();
  return {
    category_order: CATEGORY_TREE.map(node => node.name),
    categories: CATEGORY_TREE,
    content_types: CONTENT_TYPES,
    data: groupForFrontend(),
  };
};

/**
 * 【後台】取得影音列表（mock，對應 GET /admin/culture-media）
 *
 * 回傳攤平陣列且**包含已刪除的資料**（後台以 is_deleted 分成「目前資源／刪除紀錄」兩個視圖）。
 */
export const fetchAdminCultureItems = async () => {
  await delay();
  return MOCK_ITEMS.map(item => ({ ...item }));
};

/**
 * 【後台】新增一筆（mock，對應 POST /admin/culture-media/add）
 *
 * payload: { category_id, title, url, image }
 * 真實 API 只吃 category_id，三個分類字串由後端回填。
 */
export const addCultureItem = async ({ category_id, title, url, image = null }) => {
  await delay(200);
  const names = CATEGORY_BY_ID[category_id];
  if (!names) throw new Error('分類不存在');

  const now = new Date().toISOString();
  const maxSort = MOCK_ITEMS
    .filter(item => item.category === names.category)
    .reduce((max, item) => Math.max(max, item.sort_order), 0);

  MOCK_ITEMS.push({
    id: nextItemId++,
    type: 'video',
    category_id,
    ...names,
    title,
    image,
    url,
    sort_order: maxSort + 1,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  });

  return { success: true, message: '新增成功' };
};

/**
 * 【後台】修改／刪除／復原（mock，對應 POST /admin/culture-media/modify）
 *
 * action: '1' = 刪除（軟刪除）／'2' = 復原／'3' = 修改
 */
export const modifyCultureItem = async ({ id, action, category_id, title, url, image }) => {
  await delay(200);
  const target = MOCK_ITEMS.find(item => String(item.id) === String(id));
  if (!target) throw new Error('找不到該筆資料');

  if (action === '1') {
    target.is_deleted = true;
  } else if (action === '2') {
    target.is_deleted = false;
  } else if (action === '3') {
    const names = CATEGORY_BY_ID[category_id];
    if (!names) throw new Error('分類不存在');
    Object.assign(target, names, { category_id, title, url, image });
  } else {
    throw new Error('未知的 action');
  }

  target.updated_at = new Date().toISOString();
  return { success: true, message: '更新成功' };
};

/** 測試／開發用：把假資料重設回初始狀態 */
export const resetCultureMockData = () => {
  MOCK_ITEMS = buildMockItems();
  nextItemId = MOCK_ITEMS.length + 1;
};

export default fetchCultureItems;
