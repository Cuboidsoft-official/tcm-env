const GEMINI_API_KEY = "AQ.Ab8RN6Ipj1uRaigDXlfQnUpAgHP1MldOR1zte9lZn5WBqZYe9A";

const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
  "gemini-3.5-flash",
  "gemma-4-31b-it"
];

async function callGeminiApi(prompt) {
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
