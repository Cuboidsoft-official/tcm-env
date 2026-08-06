const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Ipj1uRaigDXlfQnUpAgHP1MldOR1zte9lZn5WBqZYe9A";

const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
  "gemini-3.5-flash",
  "gemma-4-31b-it"
];

export async function askGeminiAi(prompt, systemInstruction = "") {
  const cleanPrompt = (prompt || "").trim();
  if (!cleanPrompt) return null;

  const fullPrompt = systemInstruction
    ? `[System Instruction: ${systemInstruction}]\n\nStudent Question: ${cleanPrompt}`
    : cleanPrompt;

  // Try candidate Gemini models
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          console.log(`Successfully generated AI response using Gemini model: ${modelName}`);
          return text.trim();
        }
      } else {
        const errText = await response.text();
        console.warn(`Gemini model ${modelName} returned status ${response.status}:`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} exception:`, err.message);
    }
  }

  // Fallback: Smart Academic Answer Generator if external API quota is rate-limited
  return generateSmartAcademicFallback(cleanPrompt);
}

function generateSmartAcademicFallback(query) {
  const text = query.toLowerCase();

  if (text.includes("python") && (text.includes("django") || text.includes("kaise") || text.includes("work") || text.includes("kam"))) {
    return `🐍 **Python & Django Overview**:

1. **Python Kaise Kaam Karta Hai?**
   - Python ek **Interpreted High-Level Language** hai. Aapka code pehle Bytecode (\`.pyc\`) me convert hota hai aur fir **Python Virtual Machine (PVM)** dwara line-by-line execute hota hai.

2. **Django Ke Saath Python Kaise Use Hota Hai?**
   - **Django** Python ka popular **Full-Stack Web Framework** hai jo **MVT (Model-View-Template)** architecture follow karta hai:
     - **Model**: Database tables aur schema define karta hai.
     - **View**: Business logic aur request-response handle karta hai.
     - **Template**: HTML UI render karta hai.

3. **Quick Example**:
\`\`\`python
# Django View Example
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello TCM Academy Learner!")
\`\`\`

💡 *Need live clarification? Tap "Need Mentor Help" below!*`;
  }

  if (text.includes("python")) {
    return `🐍 **Python Programming Fundamentals**:

1. **Core Concept**: Python clean syntax aur dynamic typing use karta hai. Isme memory management **Garbage Collector** dwara automatic handle hoti hai.
2. **Key Execution Steps**:
   - Source Code (\`.py\`) ➡️ Bytecode (\`.pyc\`) ➡️ Execution via PVM.
3. **Common Use Cases**: Web Development (Django/Flask), AI/ML (TensorFlow, PyTorch), Data Science (Pandas, NumPy).`;
  }

  if (text.includes("html") || text.includes("web") || text.includes("css")) {
    return `🌐 **Web Development Concept**:

1. **HTML (HyperText Markup Language)**: Web page ka skeleton/structure banata hai (Headings, Paragraphs, Buttons, Forms).
2. **CSS**: Visual styling, colors, glassmorphism, aur layouts manage karta hai.
3. **JS**: Interactivity, API requests, aur dynamic DOM updates enable karta hai.`;
  }

  return `📚 **TCM AI Academic Explanation**:

Regarding **"${query}"**:

1. **Core Concept**: Is topic me key principles logically interconnected hote hain. Line-by-line logic aur fundamental rules follow karna essential hai.
2. **Step-by-Step Breakdown**:
   - **Step 1**: Basic syntax aur core definitions ko align karein.
   - **Step 2**: Practical implementation aur test cases verify karein.
3. **Best Practice**: Clean structure use karein aur real-world examples se cross-check karein.

💡 *Further doubts? Tap "Need Mentor Help" or create a Live Poll below!*`;
}
