import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
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
import DownloadPage from "./resourcePage/DownloadPage";
import LoginPage from "./resourcePage/LoginPage";
import RegisterPage from "./resourcePage/RegisterPage";
import CelebrityDetails from "./celebrity/CelebrityDetails";
import TermsPage from "./TermsPage.jsx";
import PolicyPage from "./PolicyPage.jsx";
import AdminMain from "./adminPage/adminMain";
import AdminSidebar from "./adminPage/adminSidebar";
import AdminTestPage from "./adminPage/adminContent/adminHome/adminTestPage";
import AdminNewsPage from "./adminPage/adminContent/adminHome/adminNewsPage";
import AdminExamInfo from "./adminPage/adminContent/adminHome/examPage/adminExamInfo";
import AdminExamBooks from "./adminPage/adminContent/adminHome/examPage/adminExamBooks";
import AdminExamChannels from "./adminPage/adminContent/adminHome/examPage/adminExamChannels";
import AdminMemberPage from "./adminPage/adminContent/adminHome/adminMemberPage";
import AdminFilePreview from "./adminPage/adminContent/adminHome/adminresourcePage/AdminFilePreview";
import AdminFoodPage from "./adminPage/adminContent/adminHome/adminFoodPage";
import AdminFestivalPage from "./adminPage/adminContent/adminHome/adminFestivalPage";
import AdminSocialmediaPage from "./adminPage/adminContent/adminHome/adminSocialmediaPage";
import AdminResourcePage from "./adminPage/adminContent/adminHome/adminresourcePage/AdminResourcePage";
import ResourceHeaderPage from "./adminPage/adminContent/adminHome/adminresourcePage/ResourceHeaderPage";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isPreviewPage = location.pathname === '/file-preview';
  const isDownloadPage = location.pathname === '/download';
  const isCelebrityDetail = location.pathname === '/celebrity/detail';
  const isAdminPage = location.pathname === '/admin';
  const isAdminContent = location.pathname.startsWith('/admin/');

  return (
    <div className="app">
      <Header />
      <div className={`maincontent ${isPreviewPage || isDownloadPage || isCelebrityDetail || isAdminPage ? 'preview-page' : ''}`}>
        {!isPreviewPage && !isDownloadPage && !isCelebrityDetail && (isAdminContent ? <AdminSidebar /> : isAdminPage ? null : <Sidebar />)}
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
            path="/admin/exam/books"
            element={
              <AdminRoute>
                <AdminExamBooks />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/exam/channels"
            element={
              <AdminRoute>
                <AdminExamChannels />
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
        </Routes>
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
