import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { NewsArticle } from '@/types';

const API_BASE = '/api';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
];

export async function fetchLiveRssFallback(): Promise<NewsArticle[]> {
  const rssUrl = 'https://news.google.com/rss/search?q=music+bollywood+entertainment&hl=en-IN&gl=IN&ceid=IN:en';
  try {
    const res = await axios.get(rssUrl, { timeout: 8000 });
    const xmlText = res.data;
    if (typeof xmlText !== 'string') return [];

    const itemMatches = xmlText.split(/<item>/gi).slice(1);
    const articles: NewsArticle[] = [];

    for (const itemXml of itemMatches) {
      if (articles.length >= 10) break;
      const titleMatch = /<title>(.*?)<\/title>/is.exec(itemXml);
      const linkMatch = /<link>(.*?)<\/link>/is.exec(itemXml);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/is.exec(itemXml);
      const sourceMatch = /<source[^>]*>(.*?)<\/source>/is.exec(itemXml);

      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
      let link = linkMatch ? linkMatch[1].trim() : '';
      let pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
      let sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'SurSuno News';

      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '')
        .trim();

      sourceName = sourceName
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();

      if (title && link) {
        const fallbackImage = FALLBACK_IMAGES[articles.length % FALLBACK_IMAGES.length];
        const publishedAt = isNaN(Date.parse(pubDate)) ? new Date().toISOString() : new Date(pubDate).toISOString();

        articles.push({
          title,
          description: `Latest Music & Entertainment story reported by ${sourceName}. Click read story for details.`,
          image_url: fallbackImage,
          source_name: sourceName || 'SurSuno Music News',
          article_url: link,
          published_at: publishedAt,
          category: 'Bollywood & Music',
        });
      }
    }
    return articles;
  } catch (err) {
    console.warn('Frontend direct RSS fallback fetch error:', err);
    return [];
  }
}

export async function fetchLatestNews(): Promise<NewsArticle[]> {
  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data as NewsArticle[];
      }
    } catch (err) {
      console.warn('Supabase news fetch warning:', err);
    }
  }

  // 2. Try Backend API endpoint
  try {
    const res = await axios.get(`${API_BASE}/news/`, { timeout: 8000 });
    if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data as NewsArticle[];
    }
  } catch (err) {
    console.warn('API news fetch warning, switching to direct RSS fallback:', err);
  }

  // 3. Direct Client-side RSS Fallback
  return await fetchLiveRssFallback();
}
