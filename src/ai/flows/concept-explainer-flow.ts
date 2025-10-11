"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

const ConceptExplainerInputSchema = z.string();
const ConceptExplainerOutputSchema = z.string();

export async function explainConcept(
  input: z.infer<typeof ConceptExplainerInputSchema>
): Promise<z.infer<typeof ConceptExplainerOutputSchema>> {
  return conceptExplainerFlow(input);
}

const prompt = ai.definePrompt({
  name: "conceptExplainerPrompt",
  input: { schema: ConceptExplainerInputSchema },
  output: { schema: ConceptExplainerOutputSchema },
  prompt: `
    You are an expert educator and AI assistant for university students. Your name is "MyStudentHub AI".
    Your primary goal is to explain academic concepts clearly, concisely, and in a beginner-friendly way.

    The user will ask you to explain a concept. You should provide:
    1.  A simple, core definition of the concept.
    2.  An analogy or a real-world example to make it relatable.
    3.  A brief, step-by-step explanation if the concept is a process (like an algorithm).
    4.  If relevant, mention what it's used for or why it's important.

    Keep your tone encouraging and supportive. Do not answer questions that are not related to academic topics. 
    If the user asks a non-academic question, politely decline and steer them back to learning.

    User's question: {{prompt}}
  `,
});

const conceptExplainerFlow = ai.defineFlow(
  {
    name: "conceptExplainerFlow",
    inputSchema: ConceptExplainerInputSchema,
    outputSchema: ConceptExplainerOutputSchema,
  },
  async (promptText) => {
    const { output } = await prompt({ prompt: promptText });
    return output!;
  }
);
