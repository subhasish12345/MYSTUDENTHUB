import {genkit} from 'genkit';
import {openai} from 'genkit/x/openai';

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY || 'from-config',
    }),
  ],
  model: 'google/gemini-pro',
});
