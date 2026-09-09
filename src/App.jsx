import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import { FLAGS } from './config/permissions';
import envConfig from './config';
import "./styles/global.css";
import "./App.css";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import MainContent from "./MainContent";
import MainSearchPage from "./mainSearchPage/MainSearchPage.jsx";
import TranscriptPage from "./transcriptPage/TranscriptPage.jsx";
import ReadPage from "./readPage/ReadPage.jsx";
import PhrasePage from "./phrasePage/PhrasePage.jsx";
import CelebrityPage from "./celebrity/CelebrityPage.jsx";
import TranslatePage from "./translatePage/TranslatePage.jsx";
import ResourcePage from "./resourcePage/ResourcePage.jsx";
import FilePreview from "./resourcePage/FilePreview.jsx";
import DeleteResource from "./resourcePage/DeleteResource";
import UploadResource from "./resourcePage/UploadResource";
import CultureFood from "./culture/food/FoodPage";
import CultureFestival from "./culture/festival/FestivalPage";
import SocialmediaPage from "./socialmediaPage/SocialmediaPage";
import ExamPage from "./examPage/ExamPage";
import TopicIntegrationPage from "./featuredResourcePage/TopicIntegrationPage";
import PlacenameCulturePage from "./placenameCulturePage/PlacenameCulturePage";
import CultureTestPage from "./cultureTestPage/CultureTestPage";
import OccupationTestPage from "./occupationTestPage/OccupationTestPage";
import OccupationDetailPage from "./occupationTestPage/OccupationDetailPage";
import DownloadPage from "./resourcePage/DownloadPage";
import LoginPage from "./resourcePage/LoginPage";
import RegisterPage from "./resourcePage/RegisterPage";
import CelebrityDetails from "./celebrity/CelebrityDetails";
import ServiceSuspensionNotice from "./components/Announcement/ServiceSuspensionNotice.jsx";
import GeneralAnnouncementModal from "./components/Announcement/GeneralAnnouncementModal.jsx";
import OutageTopBanner from "./components/OutageTopBanner/OutageTopBanner.jsx";
import RelativeCalculatorPage from "./relativeCalculatorPage/RelativeCalculatorPage.jsx";
import TermsPage from "./TermsPage.jsx";
import TeamPage from "./TeamPage.jsx";
import PolicyPage from "./PolicyPage.jsx";
import AdminMain from "./adminPage/adminMain";
import AdminSidebar from "./adminPage/adminSidebar";
import AdminTestPage from "./adminPage/adminContent/adminHome/adminTestPage";
import AdminNewsPage from "./adminPage/adminContent/adminHome/adminNewsPage";
import AdminExamInfo from "./adminPage/adminContent/adminHome/examPage/adminExamInfo";
import AdminMemberPage from "./adminPage/adminContent/adminHome/adminMemberPage";
import AdminFilePreview from "./adminPage/adminContent/adminHome/adminresourcePage/AdminFilePreview";
import AdminFoodPage from "./adminPage/adminContent/adminHome/adminFoodPage";
import AdminFestivalPage from "./adminPage/adminContent/adminHome/adminFestivalPage";
import AdminCultureTestPage from "./adminPage/adminContent/adminHome/adminCultureTestPage";
import AdminOccupationTestPage from "./adminPage/adminContent/adminHome/adminOccupationTestPage";
import AdminOccupationPreviewPage from "./adminPage/adminContent/adminHome/adminOccupationPreviewPage";
import AdminSocialmediaPage from "./adminPage/adminContent/adminHome/adminSocialmediaPage";
import AdminResourcePage from "./adminPage/adminContent/adminHome/adminresourcePage/AdminResourcePage";
import ResourceHeaderPage from "./adminPage/adminContent/adminHome/adminresourcePage/ResourceHeaderPage";
import AdminAnnouncementPage from "./adminPage/adminContent/adminHome/adminAnnouncementPage";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (envConfig.features.enableRobotsNoindex) {
      let meta = document.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = "robots";
        document.head.appendChild(meta);
      }
      meta.content = "noindex, nofollow";
    }
  }, []);

  const isPreviewPage = location.pathname === '/file-preview';
  const isDownloadPage = location.pathname === '/download';
  const isCelebrityDetail = location.pathname === '/celebrity/detail';
  const isAdminPage = location.pathname === '/admin';
  const isAdminContent = location.pathname.startsWith('/admin/');
  const isTopicIntegrationFeatureEnabled = envConfig.features.enableTopicIntegrationFeature;
  const isPlacenameCultureFeatureEnabled = envConfig.features.enablePlacenameCultureFeature;
  const isCultureTestFeatureEnabled = envConfig.features.enableCultureTestFeature;
  const isOccupationTestFeatureEnabled = envConfig.features.enableOccupationTestFeature;
  const isRelativeCalculatorFeatureEnabled = envConfig.features.enableRelativeCalculatorFeature;

  // 路由切換時自動收起 sidebar（手機版）
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isAdminPage || isAdminContent) {
      document.body.classList.add('admin-body');
    } else {
      document.body.classList.remove('admin-body');
    }
    return () => document.body.classList.remove('admin-body');
  }, [isAdminPage, isAdminContent]);

  const showSidebar = !isPreviewPage && !isDownloadPage && !isCelebrityDetail && !isAdminPage && !isAdminContent;
  // 後台內容頁使用 AdminSidebar（手機版同樣以漢堡選單開合）
  const showAdminSidebar = !isPreviewPage && !isDownloadPage && !isCelebrityDetail && isAdminContent;

  return (
    <div className="app">
      <ServiceSuspensionNotice />
      {!isAdminPage && !isAdminContent && <GeneralAnnouncementModal />}
      <OutageTopBanner />
      <Header
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        sidebarOpen={sidebarOpen}
        showMenuButton={showSidebar || showAdminSidebar}
      />

      {/* 手機版 sidebar overlay 遮罩 */}
      {(showSidebar || showAdminSidebar) && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`maincontent ${isPreviewPage || isDownloadPage || isCelebrityDetail || isAdminPage ? 'preview-page' : ''}`}>
        {showSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        {showAdminSidebar && (
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <div className={isAdminContent ? 'admin-content-scroll' : ''}>
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/search" element={<MainSearchPage />} />
          <Route path="/transcript" element={<TranscriptPage />} />
          <Route path="/phrase" element={<PhrasePage />} />
          <Route path="/read" element={<ReadPage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/resource" element={<ResourcePage />} />
          <Route path="/file-preview" element={<FilePreview />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route
            path="/delete-resource"
            element={
              <ProtectedRoute requireAuth={true}>
                <DeleteResource />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-resource"
            element={
              <ProtectedRoute requireAuth={true}>
                <UploadResource />
              </ProtectedRoute>
            }
          />
          <Route path="/celebrity" element={<CelebrityPage />} />
          <Route path="/celebrity/detail" element={<CelebrityDetails />} />
          <Route path="/culture/food" element={<CultureFood />} />
          <Route path="/culture/festival" element={<CultureFestival />} />
          <Route path="/socialmedia" element={<SocialmediaPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route
            path="/topic-integration"
            element={
              isTopicIntegrationFeatureEnabled
                ? <TopicIntegrationPage />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/placename-culture"
            element={
              isPlacenameCultureFeatureEnabled
                ? <PlacenameCulturePage />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/culture-test"
            element={
              isCultureTestFeatureEnabled
                ? <CultureTestPage />
                : <Navigate to="/" replace />
            }
          />
          {/* 職業台語（test）：版面比照教學資源共享平台，詳細頁在站內開啟（不另開分頁） */}
          <Route
            path="/occupation-test"
            element={
              isOccupationTestFeatureEnabled
                ? <OccupationTestPage />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/occupation-test/:id"
            element={
              isOccupationTestFeatureEnabled
                ? <OccupationDetailPage />
                : <Navigate to="/" replace />
            }
          />
          {/* 親戚計算機：側邊欄與路由要一起擋，只擋側邊欄的話直接輸入網址仍進得去 */}
          <Route
            path="/relative-calculator"
            element={
              isRelativeCalculatorFeatureEnabled
                ? <RelativeCalculatorPage />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin 路由 - 需要管理員權限 */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminMain />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/main-search/test"
            element={
              <AdminRoute>
                <AdminTestPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/main-search/news"
            element={
              <AdminRoute>
                <AdminNewsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/culture/food"
            element={
              <AdminRoute>
                <AdminFoodPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/culture/festival"
            element={
              <AdminRoute>
                <AdminFestivalPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/culture-test"
            element={
              <AdminRoute>
                {isCultureTestFeatureEnabled
                  ? <AdminCultureTestPage />
                  : <Navigate to="/admin" replace />}
              </AdminRoute>
            }
          />
          <Route
            path="/admin/occupation-test"
            element={
              <AdminRoute>
                {isOccupationTestFeatureEnabled
                  ? <AdminOccupationTestPage />
                  : <Navigate to="/admin" replace />}
              </AdminRoute>
            }
          />
          {/* 職業台語專用的檔案預覽頁（不共用 /admin/file-preview，原因見該頁檔頭） */}
          <Route
            path="/admin/occupation-test/preview"
            element={
              <AdminRoute>
                {isOccupationTestFeatureEnabled
                  ? <AdminOccupationPreviewPage />
                  : <Navigate to="/admin" replace />}
              </AdminRoute>
            }
          />
          <Route
            path="/admin/socialmedia"
            element={
              <AdminRoute>
                <AdminSocialmediaPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/resource"
            element={
              <AdminRoute>
                <AdminResourcePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/resource/upload"
            element={
              <AdminRoute>
                <AdminResourcePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/resource/header"
            element={
              <AdminRoute>
                <ResourceHeaderPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/exam/info"
            element={
              <AdminRoute>
                <AdminExamInfo />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/member"
            element={
              <AdminRoute>
                <AdminMemberPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/file-preview"
            element={
              <AdminRoute>
                <AdminFilePreview />
              </AdminRoute>
            }
          />
          {/* 公告管理（Popup 公告）僅系統管理員可進入 */}
          <Route
            path="/admin/announcement"
            element={
              <ProtectedRoute requireAuth={true} requiredFlag={FLAGS.SYSTEM_MANAGER}>
                <AdminAnnouncementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}


const App = () => {
  // 獲取 Vite 的 BASE_URL,確保 React Router 使用正確的 base path
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <ToastProvider>
      <BrowserRouter
        basename={basename}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
