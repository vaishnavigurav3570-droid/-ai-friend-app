import { callAi } from './services/ai/runner.js';
import { aiProviders } from './config/ai.js';
import { logger } from './utils/logger.js';

async function runTest() {
  console.log('\n=======================================');
  console.log('🧪 TEST 1: Normal execution (OpenRouter)');
  console.log('=======================================\n');
  
  try {
    const response1 = await callAi(
      'You are a helpful assistant. Reply in exactly one short sentence.',
      'What is the meaning of life?'
    );
    console.log('\n🟢 Response:\n', response1);
  } catch (e: any) {
    console.error('Test 1 failed:', e.message);
  }

  console.log('\n=======================================');
  console.log('🧪 TEST 2: Forced Fallback (ZhipuAI)');
  console.log('=======================================\n');

  // Deliberately break OpenRouter by giving it a fake API key
  const originalKey = aiProviders.openrouter.apiKey;
  aiProviders.openrouter.apiKey = 'sk-or-v1-fake-key-that-will-fail-12345';

  try {
    const response2 = await callAi(
      'You are a helpful assistant. Reply in exactly one short sentence.',
      'Why is the sky blue?'
    );
    console.log('\n🟢 Response:\n', response2);
  } catch (e: any) {
    console.error('Test 2 failed:', e.message);
  } finally {
    // Restore the key
    aiProviders.openrouter.apiKey = originalKey;
  }
}

runTest().then(() => process.exit(0));
