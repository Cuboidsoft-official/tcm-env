const GROQ_API_KEY = "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";
const GEMINI_API_KEY = "AQ.Ab8RN6Ipj1uRaigDXlfQnUpAgHP1MldOR1zte9lZn5WBqZYe9A";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro"
];

async function callGeminiApi(prompt) {
  // 1. Try Groq API first (Llama 3.3 70B & fast inference)
  if (GROQ_API_KEY) {
    for (const modelName of GROQ_MODELS) {
      try {
        const url = "https://api.groq.com/openai/v1/chat/completions";
        const requestBody = {
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2500
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            console.log(`Groq API generated response using model: ${modelName}`);
            return text.trim();
          }
        }
      } catch (err) {
        console.warn(`Groq model ${modelName} error:`, err.message);
      }
    }
  }

  // 2. Fallback to Gemini models
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
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
          console.log(`Google Gemini API generated response using model: ${modelName}`);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn(`Google Gemini model ${modelName} error:`, err.message);
    }
  }
  return null;
}

export async function generateSyllabusWithAI(courseTitle, category = "TCM One Information Tech", duration = "20 Days") {
  const daysMatch = (duration || "").match(/(\d+)\s*(days?|weeks?)/i);
  let totalDays = 20;
  if (daysMatch) {
    const val = parseInt(daysMatch[1], 10);
    const unit = daysMatch[2].toLowerCase();
    totalDays = unit.startsWith("week") ? val * 7 : val;
  }
  totalDays = Math.min(Math.max(totalDays, 5), 45);

  const prompt = `You are Google Gemini AI acting as Senior Curriculum Architect at TCM One Academy. Design an IN-DEPTH, highly specific, DAY-BY-DAY day-wise curriculum for a course titled "${courseTitle}" under category "${category}" planned for a total duration of "${totalDays} Days".

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${totalDays} Day-by-Day modules. Title each module clearly starting with "Day 1:", "Day 2:", "Day 3:", ..., "Day ${totalDays}:".
2. Every day module MUST contain 2 to 3 detailed practical lessons 100% SPECIFIC to "${courseTitle}". Mention specific tools, libraries, or frameworks of "${courseTitle}".

Return ONLY raw valid JSON (no markdown fences, no backticks, no conversational text):
{
  "modules": [
    {
      "id": "m1",
      "title": "Day 1: ${courseTitle} Foundations & Tooling Setup",
      "lessons": [
        "Lesson 1.1: Tooling & Environment Configuration",
        "Lesson 1.2: Essential Fundamentals & Core Syntax"
      ]
    },
    {
      "id": "m2",
      "title": "Day 2: ${courseTitle} Core Architecture & Logic",
      "lessons": [
        "Lesson 2.1: Key Architectural Patterns",
        "Lesson 2.2: Live API & State Management"
      ]
    }
  ]
}`;

  try {
    const rawContent = await callGeminiApi(prompt);
    if (rawContent) {
      const cleanedJson = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);
      if (parsed && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
        return parsed.modules;
      }
    }
  } catch (error) {
    console.warn("Google Gemini Syllabus Generation failed, using dynamic N-Day fallback:", error);
  }

  // Dynamic N-Day Fallback Engine for all selected days (Day 1 to Day N)
  const dayTopicTemplates = [
    "Environment Setup & Tooling Configuration",
    "Core Foundations & Basic Architecture",
    "Essential Concepts & Practical Syntax",
    "Hands-on Component & Interface Design",
    "State Management & Data Flow Architecture",
    "API Connectivity & Asynchronous Data Fetching",
    "Backend Routing & Middleware Configuration",
    "Database Modeling & Schemas Design",
    "Authentication & Security Authorization",
    "Real-time Data Communication & WebSockets",
    "Error Handling & Boundary Strategies",
    "Automated Testing & Integration Suites",
    "Performance Tuning & Memory Optimization",
    "Cloud Hosting & DevOps Pipeline Setup",
    "Production Capstone Architecture & Deployment"
  ];

  const fallbackModules = [];
  for (let d = 1; d <= totalDays; d++) {
    const templateIdx = (d - 1) % dayTopicTemplates.length;
    const dayTopic = dayTopicTemplates[templateIdx];
    fallbackModules.push({
      id: `day_${d}_${Date.now()}`,
      title: `Day ${d}: ${dayTopic} for ${courseTitle}`,
      lessons: [
        `Lesson ${d}.1: ${dayTopic} Theory & Core Concepts`,
        `Lesson ${d}.2: Live Practical Hands-on Implementation`,
        `Lesson ${d}.3: Day ${d} Doubts Clearance & Practice Code`
      ]
    });
  }

  return fallbackModules;
}

export async function generateCourseOverviewInsightsWithAI(courseTitle, category = "TCM One Academy", level = "All Levels") {
  const prompt = `You are Google Gemini AI acting as Lead Career Counselor & Industry Analyst at TCM One Academy. Provide highly accurate, professional career and salary insights for a course titled "${courseTitle}" in category "${category}" for level "${level}".

Return ONLY raw valid JSON (no markdown fences, no backticks, no conversational text):
{
  "whyLearn": [
    "High Market Demand: Huge requirement for skilled ${courseTitle} professionals across IT, Tech & Product companies.",
    "Lucrative Salary & Growth: Offers high entry-level compensation with rapid annual appraisal rates.",
    "Practical Industry Skills: Hands-on mastery of modern tools, frameworks, and real-world project development."
  ],
  "salaryInsights": {
    "avgSalary": "₹6.5 LPA – ₹18.0 LPA",
    "hiringCompanies": ["TCS", "Google", "Amazon", "Infosys", "Top Startups"],
    "growthRate": "+28% YoY Industry Demand",
    "careerRoles": ["Software Developer", "Full Stack Engineer", "System Architect"]
  }
}`;

  try {
    const rawContent = await callGeminiApi(prompt);
    if (rawContent) {
      const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.whyLearn && parsed.salaryInsights) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Google Gemini Overview Insights failed, using fallback:", error);
  }

  return {
    whyLearn: [
      `High Industry Demand: Companies actively seek skilled ${courseTitle} engineers with portfolio projects.`,
      `Lucrative Salary Packages: Starting packages range from ₹6.5 LPA up to ₹18 LPA for skilled professionals.`,
      `Hands-on Portfolio Building: Build production-grade projects to showcase directly to recruiters.`
    ],
    salaryInsights: {
      avgSalary: "₹6.5 LPA – ₹18.0 LPA",
      hiringCompanies: ["Google", "TCS", "Amazon", "Infosys", "Tech Startups"],
      growthRate: "+28% YoY Demand",
      careerRoles: [`${courseTitle} Engineer`, "Software Architect", "Technical Specialist"]
    }
  };
}

export async function generateMcqQuizWithGemini(topic, courseTitle = "TCM One Course") {
  const prompt = `You are TCM One AI acting as Lead Examiner at TCM One Academy. Generate EXACTLY 10 multiple-choice questions (MCQs) for a student practice test on the topic "${topic}" of the course "${courseTitle}".

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 10 questions. Each question must have 4 options: ["A", "B", "C", "D"].
2. Provide the 0-indexed correct option index ("correctIndex": 0, 1, 2, or 3) and a brief clear explanation ("explanation": "string").

Return ONLY raw valid JSON (no markdown fences, no backticks, no conversational text):
{
  "quizTitle": "10-MCQ Daily Quiz: ${topic}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation for option A."
    }
  ]
}`;

  try {
    const rawContent = await callGeminiApi(prompt);
    if (rawContent) {
      const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed.questions;
      }
    }
  } catch (error) {
    console.warn("Google Gemini Quiz Generation failed, using structured 10 MCQs fallback:", error);
  }

  // Dynamic 10 MCQs Fallback
  return Array.from({ length: 10 }, (_, i) => ({
    id: `q_${i + 1}`,
    question: `Question ${i + 1}: What is the core practical requirement of ${topic} in ${courseTitle}?`,
    options: [
      `Modular Architecture & Practical Best Practices for ${topic}`,
      `Legacy synchronous execution without state guards`,
      `Depreciated standard with high execution latency`,
      `Single-threaded fallback without validation`
    ],
    correctIndex: 0,
    explanation: `Option A is correct. ${topic} requires modern modular architecture and real-time execution in ${courseTitle}.`
  }));
}

export async function generateRoadmapChatResponseWithGroq(chatMessages = [], currentPrompt = "", targetGoal = "", budget = "") {
  const prompt = `You are TCM One AI, Senior Career Advisor and Learning Strategist at TCM One Academy.
Your job is to interactively guide a student to build their ideal tech career roadmap using ONLY official courses, services, and pricing available in the TCM One App.

System Knowledge about TCM One Academy App Courses & Pricing:
- Full Stack Web Development (MERN / React / Node.js): ₹4,999 (3 Months)
- AI & Machine Learning Masterclass (Python / PyTorch / LLMs): ₹5,999 (3 Months)
- Mobile App Development (React Native / Expo / iOS & Android): ₹3,999 (2 Months)
- Python & Data Structures & Algorithms (DSA): ₹2,999 (2 Months)
- NEET & JEE Rank Booster Exam Prep: ₹3,499 (3 Months)

System Knowledge about TCM One App Premium Services:
- TCM Verified Pro Membership: ₹499/month or ₹2,999/year
- Featured Profile: Verified student badge & recruiter highlight
- Real Domain Project: Live hosted project, domain certificate & review
- ATS Resume Builder: AI ATS resume builder & PDF export
- Cloud Lab Access: On-demand cloud coding lab environment

Chat Conversation History:
${chatMessages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

User Message: "${currentPrompt}"
Selected Domain / Goal: "${targetGoal}"
Expected Budget: "${budget}"

Instructions:
1. DO NOT use any emojis in your response. Keep text clean and professional.
2. Provide a concise, structured response (under 200 words).
3. Recommend specific TCM One App courses and premium features matching their budget.
4. Include a 3-Month Month-by-Month roadmap (Month 1, Month 2, Month 3).`;

  try {
    const response = await callGeminiApi(prompt);
    if (response && response.trim()) {
      return response.trim().replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
    }
  } catch (error) {
    console.warn("Groq AI Roadmap chat response error:", error);
  }

  return "Thank you for sharing your learning goals. Based on your target field, we recommend starting with our Full Stack Web Development Masterclass (₹4,999) or AI Masterclass (₹5,999) available directly in the app.";
}

export async function generateInteractiveAiRoadmapAndChat(chatHistory = [], userMessage = "") {
  const prompt = `You are TCM One AI, the official Senior AI Learning Architect & Career Counselor at TCM One Academy.
IMPORTANT IDENTITY RULE: You must ONLY identify yourself as "TCM One AI". Never mention "Groq", "Llama", "Google Gemini", "ChatGPT", or any third-party provider name.

STRICT DATA ACCURACY RULE:
You MUST ONLY recommend courses, plans, features, and pricing that ACTUALLY EXIST in the TCM One Academy App as specified in the System Knowledge below. DO NOT invent fake prices, fake courses, or fake subscription tiers!

System Knowledge about TCM One Academy App Available Courses & Pricing:
- Full Stack Web Development (MERN, React, Node.js): ₹4,999 (3 Months Live Batch)
- AI & Machine Learning Masterclass (Python, PyTorch, LLMs): ₹5,999 (3 Months Live Batch)
- Mobile App Development (React Native, Expo, iOS/Android): ₹3,999 (2 Months Live Batch)
- Python & Data Structures Algorithms (DSA): ₹2,999 (2 Months Live Batch)
- NEET & JEE Rank Booster Exam Prep: ₹3,499 (3 Months Live Batch)

System Knowledge about TCM One Premium Features & Subscriptions Available in App:
- TCM Verified Pro Membership: ₹499/month or ₹2,999/year (Includes all Pro features below)
- Featured Profile Service: Verified profile badge & recruiter highlight (Included in Pro)
- Real Domain Project Service: Live domain hosting, production project & certificate (Included in Pro / ₹1,499 standalone)
- ATS Resume Builder: AI ATS resume creation & PDF export (Included in Pro / ₹299 standalone)
- Cloud Lab Access: On-demand cloud IT coding lab environment (Included in Pro / ₹499 standalone)

Chat History:
${chatHistory.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

New Student Message: "${userMessage}"

FORMATTING RULES:
1. DO NOT use any emojis in your response. Keep text clean and professional.
2. Keep responses concise, structured, and easy to read.
3. For general inquiries, provide:
   - SUMMARY & GOAL
   - MONTHLY OVERVIEW (Month 1, Month 2, Month 3)
   - RECOMMENDED APP COURSES & PRICING
   - AVAILABLE PRO FEATURES
4. Only output a detailed day-by-day syllabus when the student explicitly asks for "day by day", "daily schedule", or "day 1 to 30".`;

  try {
    const text = await callGeminiApi(prompt);
    if (text && text.trim()) {
      // Strip out any accidental third-party mentions or emojis
      return text.trim()
        .replace(/Groq\s*AI/gi, "TCM One AI")
        .replace(/Llama\s*\d*(\.\d*)?/gi, "TCM One AI")
        .replace(/Gemini\s*AI/gi, "TCM One AI")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
    }
  } catch (err) {
    console.warn("TCM One AI Roadmap Chat Generation error:", err);
  }

  return "I am TCM One AI, ready to build your custom learning roadmap. Tell me what skill or career goal you would like to master (Full Stack Web, Python DSA, AI Masterclass, Mobile App, NEET/JEE Prep) and your available daily study hours.";
}
