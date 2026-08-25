import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Header } from './components/Header';
import { Sidebar, BottomNav } from './components/Navigation';
import { Player } from './components/Player';
import { PWABanner } from './components/PWABanner';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OnboardingArtistPicker } from './pages/OnboardingArtistPicker';
import { OnboardingConfirmation } from './pages/OnboardingConfirmation';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { TrendingPage } from './pages/TrendingPage';
import { NewsPage } from './pages/NewsPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ArtistDetail } from './pages/ArtistDetail';
import { LanguagePage } from './pages/LanguagePage';
import { GenresPage } from './pages/GenresPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DownloadPage } from './pages/DownloadPage';

function AppLayoutShell() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col w-full">
      <Header />
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 px-4 sm:px-6 md:px-8 pt-6 pb-40 md:pb-28 overflow-x-hidden w-full">
          <Routes>
            <Route path="/" element={<HomePage onNavigate={navigate} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/artist/:artistId" element={<ArtistDetail />} />
            <Route path="/language/:lang" element={<LanguagePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
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
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding routes (Protected) */}
        <Route
          path="/onboarding/artists"
          element={
            <ProtectedRoute>
              <OnboardingArtistPicker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/confirmation"
          element={
            <ProtectedRoute>
              <OnboardingConfirmation />
            </ProtectedRoute>
          }
        />

        {/* All main application routes (Protected) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayoutShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
