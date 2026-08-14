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

export async function generateSyllabusWithAI(courseTitle, category = "TCM Information Tech", duration = "20 Days") {
  const daysMatch = (duration || "").match(/(\d+)\s*(days?|weeks?)/i);
  let totalDays = 20;
  if (daysMatch) {
    const val = parseInt(daysMatch[1], 10);
    const unit = daysMatch[2].toLowerCase();
    totalDays = unit.startsWith("week") ? val * 7 : val;
  }
  totalDays = Math.min(Math.max(totalDays, 5), 45);

  const prompt = `You are Google Gemini AI acting as Senior Curriculum Architect at TCM Academy. Design an IN-DEPTH, highly specific, DAY-BY-DAY day-wise curriculum for a course titled "${courseTitle}" under category "${category}" planned for a total duration of "${totalDays} Days".

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

export async function generateCourseOverviewInsightsWithAI(courseTitle, category = "TCM Academy", level = "All Levels") {
  const prompt = `You are Google Gemini AI acting as Lead Career Counselor & Industry Analyst at TCM Academy. Provide highly accurate, professional career and salary insights for a course titled "${courseTitle}" in category "${category}" for level "${level}".

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

export async function generateMcqQuizWithGemini(topic, courseTitle = "TCM Course") {
  const prompt = `You are Google Gemini AI acting as Lead Examiner at TCM Academy. Generate EXACTLY 10 multiple-choice questions (MCQs) for a student practice test on the topic "${topic}" of the course "${courseTitle}".

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
  const prompt = `You are Groq AI, Senior Career Advisor and Learning Strategist at TCM Academy (The Code Munk).
Your job is to interactively guide a student to build their ideal tech career roadmap, select appropriate TCM Academy courses, and plan their budget.

System Knowledge about TCM Academy Courses:
- Full Stack Web Development (MERN / React / Node.js): Beginner to Advanced (₹4,999 - ₹9,999)
- AI & Machine Learning Masterclass (Python / PyTorch / LLMs): Intermediate (₹6,999 - ₹12,999)
- Mobile App Development (React Native / Expo / iOS & Android): Beginner to Pro (₹5,499 - ₹8,999)
- Data Structures & Algorithms (DSA in C++ / Java / Python): Foundational (₹2,999 - ₹4,999)
- DevOps & Cloud Architecture (Docker / K8s / AWS / CI-CD): Advanced (₹7,999 - ₹14,999)
- UI/UX & Product Design (Figma / Design Systems): Beginner (₹3,499 - ₹6,499)

Chat Conversation History:
${chatMessages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

User Message: "${currentPrompt}"
Selected Domain / Goal: "${targetGoal}"
Expected Budget: "${budget}"

Instructions:
1. Provide a concise, highly encouraging, structured response (under 200 words).
2. If the user hasn't specified their domain/field or budget yet, ask helpful questions.
3. Recommend specific TCM Academy courses that fit their goals and budget.
4. Include a 4-Step Month-by-Month roadmap (Month 1, Month 2, Month 3, Month 4+).
5. Encourage them to tap "Send to WhatsApp (9238695500)" to receive their final roadmap document!`;

  try {
    const response = await callGeminiApi(prompt);
    if (response && response.trim()) {
      return response.trim();
    }
  } catch (error) {
    console.warn("Groq AI Roadmap chat response error:", error);
  }

  return "Thank you for sharing your learning goals! Based on your target field, we recommend starting with our Full Stack Web Development Masterclass or AI Masterclass at TCM Academy. Your estimated budget will be ₹4,999 - ₹8,999. Click 'Send to WhatsApp (9238695500)' below to receive your complete roadmap!";
}

export async function generateInteractiveAiRoadmapAndChat(chatHistory = [], userMessage = "") {
  const prompt = `You are TCM AI, the official Senior AI Learning Architect & Career Counselor at TCM Academy (The Code Munk).
IMPORTANT IDENTITY RULE: You must ONLY identify yourself as "TCM AI". Never mention "Groq", "Llama", "Google Gemini", "ChatGPT", or any third-party provider name.

Your job is to interactively chat with a student, understand what they want to learn, ask clarifying questions if needed, and build a BEAUTIFULLY STRUCTURED, EASY-TO-READ Day-by-Day & Monthly learning roadmap.

System Knowledge about TCM Academy Courses:
- Full Stack Web Development (MERN / React / Node.js): ₹4,999 (3 Months)
- AI & Machine Learning Masterclass (Python / PyTorch / LLMs): ₹5,999 (3 Months)
- Mobile App Development (React Native / Expo / iOS & Android): ₹3,999 (2 Months)
- Python & Data Structures & Algorithms (DSA): ₹2,999 (2 Months)
- UPSC & Govt Exam General Studies Masterclass: ₹3,499 (3 Months)

Chat History:
${chatHistory.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

New Student Message: "${userMessage}"

FORMATTING RULES FOR STUDENT CLARITY:
1. Always keep responses neat, clean, well-spaced, and easy to read so students never get confused.
2. Use clear section headers:
   📌 SUMMARY & GOAL
   📅 MONTHLY MILESTONES (Month 1, Month 2, Month 3...)
   🗓️ DAY-BY-DAY SCHEDULE (Day 1, Day 2, Day 3... up to Day 30)
   💡 RECOMMENDED TCM COURSES & PROJECTS
3. Under Day-by-Day, group into clean multi-day or single-day blocks (e.g. Day 1-3: Setup & Fundamentals, Day 4-7: State & Logic...).
4. End with a short encouraging note reminding them that they can ask TCM AI to adjust daily hours or add specific subjects anytime!`;

  try {
    const text = await callGeminiApi(prompt);
    if (text && text.trim()) {
      // Strip out any accidental third-party mentions
      return text.trim()
        .replace(/Groq\s*AI/gi, "TCM AI")
        .replace(/Llama\s*\d*(\.\d*)?/gi, "TCM AI")
        .replace(/Gemini\s*AI/gi, "TCM AI");
    }
  } catch (err) {
    console.warn("TCM AI Roadmap Chat Generation error:", err);
  }

  return "I'm TCM AI, ready to build your custom learning roadmap! Tell me what skill, topic, or career goal you'd like to master (e.g. Full Stack Web, Python DSA, AI, Mobile App, UPSC Prep) and how many hours you can study daily.";
}
