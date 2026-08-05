const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateSyllabusWithAI(courseTitle, category = "TCM Information Tech", duration = "20 Days") {
  const prompt = `You are an elite Senior Curriculum Architect at TCM Academy. Design an IN-DEPTH, highly specific, practical day-by-day curriculum for a course titled "${courseTitle}" under category "${category}" planned for a total duration of "${duration}".

CRITICAL REQUIREMENTS:
1. Every module title and lesson MUST be 100% SPECIFIC to "${courseTitle}". Do NOT use generic placeholder words like "Paradigm Overview" or "Core Fundamentals". Mention specific technologies, tools, libraries, or frameworks of "${courseTitle}".
2. Adapt module titles to the duration "${duration}" (e.g. if duration is "20 Days", divide into 4 phases: "Phase 1 (Days 1–5): ...", "Phase 2 (Days 6–10): ...", "Phase 3 (Days 11–15): ...", "Phase 4 (Days 16–20): ...").
3. Generate 4 to 5 structured modules. Each module MUST contain 4 detailed lessons covering theory, live coding, hands-on lab, and project building.

Return ONLY raw valid JSON (no markdown fences, no backticks, no conversational text):
{
  "modules": [
    {
      "id": "m1",
      "title": "Module 1 (Days 1–5): ${courseTitle} Core Architecture & Environment",
      "lessons": [
        "Lesson 1.1: ${courseTitle} Environment Setup & Tooling",
        "Lesson 1.2: Essential Building Blocks & Syntax",
        "Lesson 1.3: Hands-on Lab: Building First Live ${courseTitle} Module",
        "Lesson 1.4: Code Review & Problem Clearance"
      ]
    },
    {
      "id": "m2",
      "title": "Module 2 (Days 6–10): Advanced ${courseTitle} Systems & State",
      "lessons": [
        "Lesson 2.1: Advanced Patterns & State Architecture in ${courseTitle}",
        "Lesson 2.2: Live API Connectivity & Database Integration",
        "Lesson 2.3: Performance Profiling & Optimization",
        "Lesson 2.4: Real-World Hands-on Project"
      ]
    },
    {
      "id": "m3",
      "title": "Module 3 (Days 11–15): Security, Testing & Cloud Services",
      "lessons": [
        "Lesson 3.1: ${courseTitle} Security Standards & Auth Validation",
        "Lesson 3.2: Automated Unit, Integration & End-to-End Testing",
        "Lesson 3.3: CI/CD Pipeline & Cloud Deployment Setup",
        "Lesson 3.4: Live Production Debugging"
      ]
    },
    {
      "id": "m4",
      "title": "Module 4 (Days 16–20): Full Industry Capstone & Career Placement",
      "lessons": [
        "Lesson 4.1: Capstone Architecture & Database Design for ${courseTitle}",
        "Lesson 4.2: Scalability, Load Testing & Monitoring",
        "Lesson 4.3: Portfolio Build & Mock Technical Interview",
        "Lesson 4.4: Final Capstone Defense, Certification & Placement Drive"
      ]
    }
  ]
}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://thecodemunk.in",
        "X-Title": "TCM Academy Course Creator"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Clean JSON markdown fences if present
    const cleanedJson = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson);
    if (parsed && Array.isArray(parsed.modules)) {
      return parsed.modules;
    }
    throw new Error("Invalid syllabus format returned by AI.");
  } catch (error) {
    console.warn("AI Generation failed, using smart structured fallback:", error);
    
    const daysMatch = (duration || "").match(/(\d+)\s*days?/i);
    const totalDays = daysMatch ? parseInt(daysMatch[1], 10) : 20;
    const step = Math.max(1, Math.floor(totalDays / 4));

    return [
      {
        id: `m1-${Date.now()}`,
        title: `Module 1 (Days 1–${step}): ${courseTitle} Core Foundations`,
        lessons: [
          `Lesson 1.1: ${courseTitle} Setup & Toolchain Configuration`,
          `Lesson 1.2: Core Concepts, Syntax & Architecture`,
          `Lesson 1.3: Hands-on Lab: Building Essential Component`,
          `Lesson 1.4: Live Doubt Resolution & Daily Practice`
        ]
      },
      {
        id: `m2-${Date.now()}`,
        title: `Module 2 (Days ${step + 1}–${step * 2}): Advanced ${courseTitle} Engineering`,
        lessons: [
          `Lesson 2.1: Advanced Patterns & Logic Flows in ${courseTitle}`,
          `Lesson 2.2: State Management & System Integration`,
          `Lesson 2.3: Real-Time API Connectivity & Database Setup`,
          `Lesson 2.4: Mid-Term Hands-on Assessment Project`
        ]
      },
      {
        id: `m3-${Date.now()}`,
        title: `Module 3 (Days ${step * 2 + 1}–${step * 3}): Performance, Security & Testing`,
        lessons: [
          `Lesson 3.1: Performance Profiling & Optimization for ${courseTitle}`,
          `Lesson 3.2: Security Best Practices & Authentication`,
          `Lesson 3.3: Automated Testing & Continuous Integration`,
          `Lesson 3.4: Production Architecture Design`
        ]
      },
      {
        id: `m4-${Date.now()}`,
        title: `Module 4 (Days ${step * 3 + 1}–${totalDays}): Production Capstone & Placement`,
        lessons: [
          `Lesson 4.1: End-to-End Live Industry Capstone Project`,
          `Lesson 4.2: Cloud Deployment & CI/CD Pipelines`,
          `Lesson 4.3: Mock Interview & Portfolio Review for ${courseTitle}`,
          `Lesson 4.4: Final Evaluation, Certification & Placement Drive`
        ]
      }
    ];
  }
}

export async function generateCourseOverviewInsightsWithAI(courseTitle, category = "TCM Academy", level = "All Levels") {
  const prompt = `You are a Lead Career Counselor & Industry Analyst at TCM Academy. Provide highly accurate, professional career and salary insights for a course titled "${courseTitle}" in category "${category}" for level "${level}".

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
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://thecodemunk.in",
        "X-Title": "TCM Academy Insights"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || "";
      const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.whyLearn && parsed.salaryInsights) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("AI Overview Insights failed, using fallback:", error);
  }

  const titleLower = (courseTitle || "").toLowerCase();
  const isGovt = titleLower.includes("upsc") || titleLower.includes("ssc") || titleLower.includes("bank") || titleLower.includes("govt");
  const isNeetJee = titleLower.includes("neet") || titleLower.includes("jee") || titleLower.includes("board");

  if (isGovt) {
    return {
      whyLearn: [
        "Job Security & Prestige: High-paying, respected government officer positions with pension & medical benefits.",
        "Direct Public Impact: Play an active role in national administration, policymaking & governance.",
        "Structured Competitive Strategy: Clear exam syllabus with high return on dedicated practice."
      ],
      salaryInsights: {
        avgSalary: "₹56,100 – ₹2,25,000 / month",
        hiringCompanies: ["IAS / IPS Cadre", "Central Govt Ministries", "RBI / Public Banks", "SSC Officer Posts"],
        growthRate: "Top Govt Officer Cadre",
        careerRoles: ["Civil Servant", "Banking Officer", "Govt Section Officer"]
      }
    };
  }

  if (isNeetJee) {
    return {
      whyLearn: [
        "Premier College Admission: Secure seats in AIIMS, IITs, NITs & top government medical/engineering colleges.",
        "High-Yield MCQ Mastery: Master speed & accuracy tricks to solve 180+ questions error-free.",
        "Strong Professional Foundation: Essential for lucrative medical & engineering careers."
      ],
      salaryInsights: {
        avgSalary: "Top Tier Medical & IIT Placements",
        hiringCompanies: ["AIIMS / Hospitals", "Google", "Microsoft", "Top Global R&D"],
        growthRate: "Top 1% Career Path",
        careerRoles: ["Medical Specialist", "IIT Engineer", "R&D Scientist"]
      }
    };
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
