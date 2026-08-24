import { fetchAndSyncNews } from '../backend/newsWorker.js';

async function run() {
  console.log('[SurSuno News Worker] Starting daily news update task...');
  try {
    const result = await fetchAndSyncNews();
    console.log('[SurSuno News Worker] Success:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('[SurSuno News Worker] Error during news sync:', err);
    process.exit(1);
  }
}

run();
