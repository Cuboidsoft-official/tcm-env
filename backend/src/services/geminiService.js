const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Ipj1uRaigDXlfQnUpAgHP1MldOR1zte9lZn5WBqZYe9A";

export async function askGeminiAi(prompt, systemInstruction = "") {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const fullPrompt = systemInstruction
      ? `[System Directive: ${systemInstruction}]\n\nQuestion: ${prompt}`
      : prompt;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API HTTP Error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText && resultText.trim()) {
      return resultText.trim();
    }
    return null;
  } catch (err) {
    console.error("askGeminiAi Exception:", err.message);
    return null;
  }
}
