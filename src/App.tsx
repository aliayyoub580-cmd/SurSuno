import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar, BottomNav } from './components/Navigation';
import { Player } from './components/Player';
import { PWABanner } from './components/PWABanner';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { TrendingPage } from './pages/TrendingPage';
import { NewsPage } from './pages/NewsPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { LanguagePage } from './pages/LanguagePage';
import { GenresPage } from './pages/GenresPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { DownloadPage } from './pages/DownloadPage';
import { useEffect } from 'react';

function RouterContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Header />
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        <Sidebar />
        <main className="flex-1 px-4 md:px-6 pt-6 pb-[2rem] overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomePage onNavigate={navigate} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/language/:lang" element={<LanguagePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/download" element={<DownloadPage />} />
          </Routes>
        </main>
      </div>
      <Player />
      <BottomNav />
      <PWABanner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterContent />
    </BrowserRouter>
  );
}
