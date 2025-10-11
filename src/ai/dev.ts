import 'dotenv/config';
import { devLocal, DevLocalOpenAIFlow } from '@genkit-ai/dotprompt';

// Flows will be imported for their side effects in this file.
import './flows/concept-explainer-flow';

const llm: DevLocalOpenAIFlow = {
  name: 'openai',
  path: 'https://openrouter.ai/api/v1/chat/completions',
  key: process.env.OPENROUTER_API_KEY,
};

devLocal({
  llm,
  prompt: 'You are a helpful AI assistant. Answer the user\'s question.',
});
