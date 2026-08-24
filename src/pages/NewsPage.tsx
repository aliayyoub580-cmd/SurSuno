import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { animate, stagger } from 'animejs';
import { fetchLatestNews } from '@/services/newsApi';
import type { NewsArticle } from '@/types';
import { ExternalLinkIcon, NewsIcon } from '@/components/Icons';

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Recently';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const articles = await fetchLatestNews();
      if (articles.length > 0) {
        setNews(articles);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    if (!loading && news.length > 0 && cardsRef.current) {
      const items = cardsRef.current.querySelectorAll('.news-card-item');
      if (items.length) {
        animate(items as any, {
          translateY: [24, 0],
          opacity: [0, 1],
          delay: stagger(80),
          easing: 'outCubic',
          duration: 500,
        });
      }
    }
  }, [loading, news]);

  const featured = news[0];
  const gridNews = news.slice(1);

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/20 via-purple-500/10 to-pink-500/20 p-6 md:p-8 border border-border">
        <div className="flex items-center gap-3 text-accent font-semibold text-sm mb-2">
          <NewsIcon size={22} />
          <span className="uppercase tracking-wider">SurSuno Daily Digest</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-text">
          Music & Entertainment News
        </h1>
        <p className="text-sm md:text-base text-text-muted mt-2 max-w-2xl">
          Stay updated with top daily stories, artist announcements, and global music trends. Updated automatically every 24 hours.
        </p>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-8 animate-pulse">
          <div className="w-full h-80 rounded-2xl bg-surface-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-surface-2" />
            ))}
          </div>
        </div>
      )}

      {/* Error / Failure State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <NewsIcon size={24} />
          </div>
          <h2 className="text-xl font-bold text-text">Something went wrong</h2>
          <p className="text-sm text-text-muted max-w-md">
            We couldn't load the latest news right now. Please check your connection and try again.
          </p>
          <button
            onClick={loadNews}
            className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content View */}
      {!loading && !error && news.length > 0 && (
        <div ref={cardsRef} className="space-y-8">
          {/* Featured Article Card */}
          {featured && (
            <div className="news-card-item opacity-0">
              <motion.a
                href={featured.article_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group block relative overflow-hidden rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all shadow-lg"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative h-64 lg:h-96 overflow-hidden">
                    <img
                      src={featured.image_url}
                      alt={featured.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent text-white shadow-md">
                      Featured Story
                    </span>
                  </div>

                  <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-surface">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                        <span className="text-accent">{featured.source_name}</span>
                        <span>{formatRelativeTime(featured.published_at)}</span>
                      </div>

                      <h2 className="text-xl md:text-2xl font-bold text-text group-hover:text-accent transition-colors line-clamp-3">
                        {featured.title}
                      </h2>

                      <p className="text-sm text-text-muted line-clamp-4 leading-relaxed">
                        {featured.description}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center text-sm font-semibold text-accent gap-2 group-hover:translate-x-1 transition-transform">
                      <span>Read Full Story</span>
                      <ExternalLinkIcon size={16} />
                    </div>
                  </div>
                </div>
              </motion.a>
            </div>
          )}

          {/* 9 Daily News Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text">Latest Stories</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridNews.map((article, index) => (
                <div key={article.article_url || index} className="news-card-item opacity-0">
                  <motion.a
                    href={article.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="group flex flex-col h-full overflow-hidden rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all shadow-md"
                  >
                    <div className="relative h-48 overflow-hidden bg-surface-2">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-surface/80 backdrop-blur-md text-text border border-border">
                        {article.category}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span className="font-medium text-accent">{article.source_name}</span>
                          <span>{formatRelativeTime(article.published_at)}</span>
                        </div>

                        <h4 className="text-base font-bold text-text group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>

                        <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                          {article.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-semibold text-accent">
                        <span>Read More</span>
                        <ExternalLinkIcon size={14} />
                      </div>
                    </div>
                  </motion.a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
