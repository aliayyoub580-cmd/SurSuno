import { createClient } from '@supabase/supabase-js';
import { fetchRssNews } from '../backend/newsWorker.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Supabase Setup] Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setup() {
  console.log('[Supabase Setup] Connecting to Supabase project at', SUPABASE_URL);

  // 1. Fetch 10 RSS news articles
  console.log('[Supabase Setup] Fetching 10 initial news articles from RSS...');
  const articles = await fetchRssNews();
  console.log(`[Supabase Setup] Got ${articles.length} news articles.`);

  // 2. Insert into news table
  console.log('[Supabase Setup] Upserting articles into Supabase "news" table...');
  const { data, error } = await supabase
    .from('news')
    .upsert(articles, { onConflict: 'article_url' })
    .select();

  if (error) {
    console.error('[Supabase Setup] Error inserting into news table:', error.message);
  } else {
    console.log(`[Supabase Setup] Successfully populated ${data ? data.length : articles.length} articles into Supabase!`);
  }
}

setup();
