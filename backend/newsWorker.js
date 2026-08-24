import { createClient } from '@supabase/supabase-js';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', // Live Stage / Concert
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80', // DJ / Music Performance
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80', // Colorful Music Lights
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80', // Crowd Music Festival
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80', // Headphones / Vinyl
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80', // Acoustic Guitar
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80', // Piano / Studio
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80', // Music Concert Night
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80', // Audio Equalizer
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', // Dance & Music Event
];

export async function fetchRssNews() {
  const rssSources = [
    {
      url: 'https://news.google.com/rss/search?q=music+bollywood+entertainment&hl=en-IN&gl=IN&ceid=IN:en',
      category: 'Bollywood & Music',
    },
    {
      url: 'https://news.google.com/rss/search?q=south+asian+music+artists&hl=en-IN&gl=IN&ceid=IN:en',
      category: 'South Asian Trends',
    },
  ];

  const articles = [];
  const seenUrls = new Set();

  for (const source of rssSources) {
    if (articles.length >= 10) break;
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (!response.ok) continue;
      const xmlText = await response.text();

      const itemSplit = xmlText.split(/<item>/gi).slice(1);
      for (const itemXml of itemSplit) {
        if (articles.length >= 10) break;

        const titleMatch = /<title>(.*?)<\/title>/is.exec(itemXml);
        const linkMatch = /<link>(.*?)<\/link>/is.exec(itemXml);
        const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/is.exec(itemXml);
        const sourceMatch = /<source[^>]*>(.*?)<\/source>/is.exec(itemXml);

        let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
        let link = linkMatch ? linkMatch[1].trim() : '';
        let pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
        let sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'SurSuno News';

        // Clean HTML entities & tags
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

        if (title && link && !seenUrls.has(link)) {
          seenUrls.add(link);
          const fallbackImage = FALLBACK_IMAGES[articles.length % FALLBACK_IMAGES.length];
          const publishedAt = isNaN(Date.parse(pubDate)) ? new Date().toISOString() : new Date(pubDate).toISOString();

          articles.push({
            title,
            description: `Latest ${source.category} story reported by ${sourceName}. Read full article for complete details.`,
            image_url: fallbackImage,
            source_name: sourceName || 'SurSuno Music News',
            article_url: link,
            published_at: publishedAt,
            category: source.category,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('RSS fetch attempt warning:', err.message);
    }
  }

  return articles.slice(0, 10);
}

export async function fetchAndSyncNews() {
  const freshArticles = await fetchRssNews();

  if (!freshArticles || freshArticles.length === 0) {
    throw new Error('Failed to fetch new articles from RSS feeds.');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase credentials not configured in backend environment; returning live RSS articles.');
    return { status: true, source: 'live_rss', count: freshArticles.length, articles: freshArticles };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Safe update strategy:
  // 1. Upsert new articles
  const { data, error: upsertErr } = await supabase
    .from('news')
    .upsert(freshArticles, { onConflict: 'article_url' })
    .select();

  if (upsertErr) {
    console.error('Supabase upsert error:', upsertErr.message);
    return { status: true, source: 'live_rss_fallback', count: freshArticles.length, articles: freshArticles };
  }

  // 2. Remove old articles not in current set
  const currentUrls = freshArticles.map((a) => a.article_url);
  const { error: deleteErr } = await supabase
    .from('news')
    .delete()
    .not('article_url', 'in', `(${currentUrls.map((u) => `"${u}"`).join(',')})`);

  if (deleteErr) {
    console.warn('Supabase cleanup warning:', deleteErr.message);
  }

  return { status: true, source: 'supabase', count: freshArticles.length, articles: freshArticles };
}
