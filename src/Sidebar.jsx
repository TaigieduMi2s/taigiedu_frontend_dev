import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import homeIcon from "./assets/sidebar_icon/主頁.svg";
import transcriptIcon from "./assets/sidebar_icon/逐字稿.svg";
import readIcon from "./assets/sidebar_icon/朗讀.svg";
import translateIcon from "./assets/sidebar_icon/文字轉換.svg";
import resourceIcon from "./assets/sidebar_icon/資源共享平台.svg";
import phraseIcon from "./assets/sidebar_icon/俗諺語.svg";
import celebrityIcon from "./assets/sidebar_icon/名人堂.svg";
import cultureIcon from "./assets/sidebar_icon/文化.svg";
import socialMediaIcon from "./assets/sidebar_icon/媒體與社群資源.svg";
import examIcon from "./assets/sidebar_icon/認證考試.svg";
import chevronUpIcon from "./assets/chevron-up.svg";

const Sidebar = () => {
  const basePath = import.meta.env.BASE_URL || '/';
  const [activeItem, setActiveItem] = useState(null); // 用於追蹤哪個選單被選取
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const navigate = useNavigate(); // 使用 React Router 的 navigate
  const location = useLocation(); // 監聽當前路由變化

  const menuItems = [
    { id: 1, label: "主頁搜尋", icon: homeIcon, path: "/" },
    { id: 2, label: "台語逐字稿", icon: transcriptIcon, path: "/transcript" },
    { id: 3, label: "台語朗讀", icon: readIcon, path: "/read" },
    { id: 4, label: "台語文字轉換", icon: translateIcon, path: "/translate" },
    { id: 5, label: "台語教學資源共享平台", icon: resourceIcon, path: "/resource" },
    { id: 6, label: "台語俗諺語", icon: phraseIcon, path: "/phrase" },
    { id: 7, label: "台語名人堂", icon: celebrityIcon, path: "/celebrity" },
    {
      id: 8,
      label: "台語文化",
      icon: cultureIcon,
      hasSubmenu: true,
      submenuItems: [
        { id: 'food', label: "飲食", path: "/culture/food" },
        { id: 'festival', label: "節慶", path: "/culture/festival" }
      ]
    },
    { id: 9, label: "媒體與社群資源", icon: socialMediaIcon, path: "/socialmedia" },
    { id: 10, label: "認證考試", icon: examIcon, path: "/exam" },
  ];

  // 當 URL 變更時，根據當前路徑來設定 activeItem
  useEffect(() => {
    const matchedItem = menuItems.find(item => item.path === location.pathname);
    if (matchedItem) {
      setActiveItem(matchedItem.id);
      setIsSubMenuOpen(matchedItem.hasSubmenu || false);
    } else {
      // 檢查是否為子選單
      const parentItem = menuItems.find(item => item.hasSubmenu && item.submenuItems.some(sub => sub.path === location.pathname));
      if (parentItem) {
        setActiveItem(parentItem.id);
        setIsSubMenuOpen(true);
        setActiveSubItem(parentItem.submenuItems.find(sub => sub.path === location.pathname).id);
      } else {
        setActiveItem(null);
        setIsSubMenuOpen(false);
        setActiveSubItem(null);
      }
    }
  }, [location.pathname]); // 監聽 location.pathname 變化

  const handleClick = (id, path, hasSubmenu) => {
    if (hasSubmenu) {
      setIsSubMenuOpen(!isSubMenuOpen);
      setActiveItem(id);
      setActiveSubItem(null);
    } else {
      setActiveItem(id);
      setActiveSubItem(null);
      navigate(path);
    }
  };

  const handleSubItemClick = (subItemId, path) => {
    setActiveSubItem(subItemId);
    setActiveItem(null);
    setIsSubMenuOpen(true); // Keep submenu open when submenu item is active
    navigate(path);
  };

  return (
    <div className="sidebar" data-testid="sidebar">
      {menuItems.map((item) => (
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
              <span className={`arrow ${isSubMenuOpen ? 'up' : 'down'}`}>
                <img src={chevronUpIcon} />
              </span>
            )}
          </button>
          {item.hasSubmenu && isSubMenuOpen && (
            <div className="submenu">
              {item.submenuItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className={`submenu-item ${activeSubItem === subItem.id ? "active" : ""}`}
                  onClick={() => handleSubItemClick(subItem.id, subItem.path)}
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

export default Sidebar;
