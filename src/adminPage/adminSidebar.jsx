import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./adminSidebar.css";
import bookIcon from '../assets/adminPage/book.svg';
import cloudIcon from '../assets/adminPage/cloudComputing.svg';
import houseIcon from '../assets/adminPage/house.svg';
import playIcon from '../assets/adminPage/playButton.svg';
import testIcon from '../assets/adminPage/test.svg';
import userIcon from '../assets/adminPage/userCircle.svg';
import chevronUpIcon from "../assets/chevron-up.svg";

// 靜態選單定義搬到組件外，避免每次 render 重新建立引用，減少 useEffect 依賴問題
const MENU_ITEMS = [
  { id: 1,
    label: "主頁搜尋",
    icon: houseIcon,
    hasSubmenu: true,
    submenuItems: [
      { id: 'adminTestInfo', label: "考試資訊", path: "/admin/main-search/test" },
      { id: 'adminNewsInfo', label: "活動快訊", path: "/admin/main-search/news" }
    ]
  },
  { id: 2,
    label: "台灣文化",
    icon: bookIcon,
    hasSubmenu: true,
    submenuItems: [
      { id: 'food', label: "飲食", path: "/admin/culture/food" },
      { id: 'festival', label: "節慶", path: "/admin/culture/festival" }
    ]
  },
  { id: 3,
    label: "認證考試",
    icon: testIcon,
    hasSubmenu: true,
    submenuItems: [
      { id: 'adminExamInfo', label: "認證類型", path: "/admin/exam/info" },
      { id: 'adminBooks', label: "推薦用書", path: "/admin/exam/books" },
      { id: 'adminChannels', label: "教育頻道", path: "/admin/exam/channels" },
    ]
  },
  { id: 4, label: "媒體與社群資源", icon: playIcon, path: "/admin/socialmedia" },
  { id: 5,
    label: "台語教學資源共享平台",
    icon: cloudIcon,
    hasSubmenu: true,
    submenuItems: [
      { id: 'adminUploadManagement', label: "上傳項目管理", path: "/admin/resource/upload" },
      { id: 'adminHeaderEditor', label: "編輯課本選單", path: "/admin/resource/header" },
    ]
  },
  { id: 6, label: "會員管理", icon: userIcon, path: "/admin/member" }
];

const AdminSidebar = () => {
  const [activeItem, setActiveItem] = useState(null); // 目前展開或被點擊的主選單 id
  const [activeSubItem, setActiveSubItem] = useState(null); // 被選取的子選單 id
  const [isSubMenuOpen, setIsSubMenuOpen] = useState({}); // { [主選單id]: true/false }
  const navigate = useNavigate();
  const location = useLocation();

  // 當 URL 變更時，根據當前路徑來設定 activeItem
  // 根據目前路徑決定哪個主選單/子選單高亮與展開
  useEffect(() => {
    // 1. 先找是否直接匹配單層（無子選單）
    const direct = MENU_ITEMS.find(item => item.path && item.path === location.pathname);
    if (direct) {
      setActiveItem(direct.id);
      setActiveSubItem(null);
      return;
    }
    // 2. 找子選單
    const parent = MENU_ITEMS.find(item => item.hasSubmenu && item.submenuItems.some(sub => sub.path === location.pathname));
    if (parent) {
      const sub = parent.submenuItems.find(s => s.path === location.pathname);
      setActiveItem(parent.id);
      setActiveSubItem(sub.id);
      setIsSubMenuOpen(prev => ({ ...prev, [parent.id]: true }));
      return;
    }
    // 3. 沒有匹配，重置
    setActiveItem(null); setActiveSubItem(null);
  }, [location.pathname]);

   const handleClick = (id, path, hasSubmenu) => {
    if (hasSubmenu) {
      setIsSubMenuOpen(prev => ({ ...prev, [id]: !prev[id] }));
      setActiveItem(id);
      setActiveSubItem(null);
    } else {
      setActiveItem(id);
      setActiveSubItem(null);
      if (path) navigate(path);
    }
  };
  const handleSubItemClick = (subItemId, path, parentId) => {
    setActiveSubItem(subItemId);
    setActiveItem(parentId); // 保留父選單高亮
    setIsSubMenuOpen(prev => ({ ...prev, [parentId]: true }));
    navigate(path);
  };

  return (
    <div className="sidebar">
  {MENU_ITEMS.map((item) => (
        <div key={item.id}>
          <button
            className={`menu-item ${activeItem === item.id ? "active" : ""}`}
            onClick={() => handleClick(item.id, item.path, item.hasSubmenu)}
          >
            <img
              src={item.icon}
              alt={`${item.label} icon`}
              className={`menu-icon ${activeItem === item.id ? "active-icon" : ""}`}
            />
            {item.label}
            {item.hasSubmenu && (
              <span className={`arrow ${isSubMenuOpen[item.id] ? 'up' : 'down'}`}>
              <img src={chevronUpIcon} />
            </span>
            )}
          </button>
          {item.hasSubmenu && isSubMenuOpen[item.id] && (
            <div className="submenu">
              {item.submenuItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className={`submenu-item ${activeSubItem === subItem.id ? "active" : ""}`}
                  onClick={() => handleSubItemClick(subItem.id, subItem.path, item.id)}
                >
                  {subItem.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminSidebar;
