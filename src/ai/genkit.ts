import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Will default to `GEMINI_API_KEY` environment variable.
    }),
  ],
  model: 'gemini-pro',
});
