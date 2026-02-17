import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const BACKEND_URL = import.meta.VITE_BACKEND_URL || 'http://localhost:3000'

export const instantiateBatch = async (genomes, topicContext, targetWords = []) => {
  try {
    const planetList = targetWords.length > 0 ? targetWords.join(", ") : "the items";

    const prompt = `

Role: You are an expert in Cognitive Science and Advanced Mnemonics.
export const instantiateBatch = async (genomes, topicContext, targetWords = []) => {
Task: Create EXACTLY ${genomes.length} high-fidelity mnemonics for the Targets: ${planetList} in this topic context:${topicContext}.

The sentences must meet these Core Requirement:

Orthographic & Phonetic Mirroring:  Do NOT use traditional first-letter acrostics (e.g., "Apple" for "Abducens"). Instead, you must select mnemonic words that share:
Phonetic Mirroring: Similar vowel sounds, syllable counts, or rhythmic stress (e.g., "Genius" for "Genus").
Orthographic Similarity: A high percentage of shared characters in the same spelling order (e.g., "Spectators" for "Species" or "Clarence" for "Class").
Sensory Vividness: The words must be concrete nouns or action verbs. Link them into a bizarre, "sticky" mental image (the Von Restorff effect) to ensure the sequence is unforgettable.
Initial Letter Matching: Every mnemonic word must begin with the exact same starting character (case-insensitive) as its corresponding target name.
Order Preservation: The mnemonic words must appear in the exact order as the target list.
No Extra Words: The sentence must only include the mnemonic words—no fillers or connectors.
Constraint: Match these letters and roles:

${genomes.map((g, i) => `[${i + 1}]: ${g.map(s => `${s.letter}(${s.role})`).join(" ")}`).join("\n")}

CRITICAL: Return ONLY valid JSON with NO markdown, NO explanations, NO formatting.
Use this EXACT format: { "mnemonics": [ { "sentence": "...", "words": [] } ] }

Do NOT include any "relation" or "role" fields. Only sentence and words array.
`;

    console.log('Sending request to:', `${BACKEND_URL}/mistral`);

    const response = await fetch(`${BACKEND_URL}/mistral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    // Parse the full response from Flask
    const jsonResponse = await response.json();
    console.log("Full Mistral API response:", jsonResponse);

    // Safely extract the content field
    const choices = jsonResponse.choices;
    if (!choices || choices.length === 0) {
      console.error('No choices in response:', jsonResponse);
      throw new Error('No choices in Mistral API response');
    }

    const firstChoice = choices[0];
    if (!firstChoice.message) {
      console.error('No message in first choice:', firstChoice);
      throw new Error('No message in Mistral API response');
    }

    const content = firstChoice.message.content;
    if (!content) {
      console.error('No content in message:', firstChoice.message);
      throw new Error('No content in Mistral API response');
    }

    console.log("Raw Mistral content:", content);

    // Clean the content: Remove markdown, extra whitespace, and invalid characters
    let cleanText = content
      .replace(/```json|```/g, "")  // Remove markdown code blocks
      .replace(/[\r\n]+/g, " ")      // Replace newlines with spaces
      .replace(/\s+/g, " ")         // Collapse multiple spaces
      .trim();

    console.log("Cleaned content:", cleanText);

    // Parse the cleaned content as JSON
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Mistral content as JSON. Trying to extract JSON manually...", parseError);
      console.error("Content that failed to parse:", cleanText);

      // Try to extract JSON from the text (e.g., if Mistral added extra text)
      const jsonMatch = cleanText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error("Failed to parse extracted JSON:", extractError);
          throw new Error("Invalid JSON format in Mistral response");
        }
      } else {
        throw new Error("No valid JSON found in Mistral response");
      }
    }

    console.log("Parsed data:", data);

    // Ensure data.mnemonics exists and is an array
    if (!data.mnemonics || !Array.isArray(data.mnemonics)) {
      console.error('Invalid mnemonics structure:', data);
      throw new Error("Invalid mnemonics data in Mistral response");
    }

    console.log("Successfully returning mnemonics:", data.mnemonics.length);
    return data.mnemonics;

  } catch (error) {
    console.error("=== FULL ERROR in instantiateBatch ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Return fallback phenotypes with the error message
    return genomes.map(g => ({
      sentence: `Error: ${error.message}`,
      words: g.map(slot => slot.letter),
    }));
  }
};




export const debugModels = async () => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${import.meta.env.VITE_GEMINI_API_KEY}`);
  const data = await response.json();
  // console.log("Allowed Models for this key:", data);
};