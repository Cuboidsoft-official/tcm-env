import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { GovExam } from "./models/GovExam.js";
import { GovSubject } from "./models/GovSubject.js";
import { GovTopic } from "./models/GovTopic.js";
import { GovQuestion } from "./models/GovQuestion.js";

dotenv.config();

const sampleExams = [
  {
    name: "SSC CGL",
    category: "SSC",
    description: "Staff Selection Commission Combined Graduate Level Examination",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150"
  },
  {
    name: "SSC CHSL",
    category: "SSC",
    description: "Combined Higher Secondary Level Examination",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150"
  },
  {
    name: "Railway NTPC",
    category: "Railway",
    description: "RRB Non-Technical Popular Categories Exam",
    logo: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=150"
  },
  {
    name: "IBPS PO",
    category: "Banking",
    description: "Institute of Banking Personnel Selection Probationary Officer",
    logo: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=150"
  },
  {
    name: "UPSC Civil Services",
    category: "UPSC",
    description: "Union Public Service Commission Civil Services Examination",
    logo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=150"
  },
  {
    name: "State PSC",
    category: "State PSC",
    description: "State Public Service Commission General Studies & Aptitude",
    logo: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=150"
  },
  {
    name: "Police Constable",
    category: "Police",
    description: "State Police Constable Selection Exam",
    logo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"
  }
];

const sampleQuestions = [
  // --- SSC CGL 2024 ---
  {
    exam: "SSC CGL",
    year: 2024,
    subject: "Reasoning",
    topic: "Analogy",
    type: "pyq",
    question: "Book : Read :: Food : ?",
    options: [
      { label: "A", text: "Cook" },
      { label: "B", text: "Eat" },
      { label: "C", text: "Buy" },
      { label: "D", text: "Sell" }
    ],
    correctAnswer: "B",
    explanation: "Just as a 'Book' is meant to be 'Read', 'Food' is meant to be 'Eaten'. Therefore, 'Eat' is the correct logical relationship."
  },
  {
    exam: "SSC CGL",
    year: 2024,
    subject: "Reasoning",
    topic: "Number Series",
    type: "pyq",
    question: "Find the missing number in the series: 4, 9, 19, 39, 79, ?",
    options: [
      { label: "A", text: "159" },
      { label: "B", text: "149" },
      { label: "C", text: "169" },
      { label: "D", text: "139" }
    ],
    correctAnswer: "A",
    explanation: "Pattern: Each number is (Previous × 2) + 1. So: 4×2+1=9; 9×2+1=19; 19×2+1=39; 39×2+1=79; 79×2+1 = 159."
  },
  {
    exam: "SSC CGL",
    year: 2024,
    subject: "Quantitative Aptitude",
    topic: "Percentage",
    type: "pyq",
    question: "If a number is increased by 20% and then decreased by 20%, what is the net percentage change in the number?",
    options: [
      { label: "A", text: "No change" },
      { label: "B", text: "4% Increase" },
      { label: "C", text: "4% Decrease" },
      { label: "D", text: "2% Decrease" }
    ],
    correctAnswer: "C",
    explanation: "Net Change = a + b + (a×b)/100 = +20 - 20 + (20 × -20)/100 = -400/100 = -4%. Hence a 4% decrease."
  },
  {
    exam: "SSC CGL",
    year: 2024,
    subject: "General Awareness",
    topic: "Indian History",
    type: "pyq",
    question: "Who was the founder of the Maurya Empire in ancient India?",
    options: [
      { label: "A", text: "Ashoka the Great" },
      { label: "B", text: "Chandragupta Maurya" },
      { label: "C", text: "Bindusara" },
      { label: "D", text: "Bimbisara" }
    ],
    correctAnswer: "B",
    explanation: "Chandragupta Maurya founded the Maurya Empire in 322 BCE with the help of his mentor Chanakya (Kautilya), defeating Dhana Nanda."
  },
  {
    exam: "SSC CGL",
    year: 2024,
    subject: "English Comprehension",
    topic: "Idioms & Phrases",
    type: "pyq",
    question: "Select the most appropriate meaning of the given idiom: 'Spill the beans'",
    options: [
      { label: "A", text: "To waste food" },
      { label: "B", text: "To reveal a secret prematurely" },
      { label: "C", text: "To perform a miracle" },
      { label: "D", text: "To cause confusion" }
    ],
    correctAnswer: "B",
    explanation: "'Spill the beans' means to disclose confidential or secret information prematurely or unintentionally."
  },

  // --- SSC CGL 2023 ---
  {
    exam: "SSC CGL",
    year: 2023,
    subject: "Reasoning",
    topic: "Coding-Decoding",
    type: "pyq",
    question: "In a certain code language, 'SMART' is written as 'QKYPR'. How will 'BRAIN' be written in that language?",
    options: [
      { label: "A", text: "ZPYGL" },
      { label: "B", text: "APXFK" },
      { label: "C", text: "ZPYGK" },
      { label: "D", text: "YQXFM" }
    ],
    correctAnswer: "A",
    explanation: "Each letter is shifted back by 2 positions in alphabet: S(-2)=Q, M(-2)=K, A(-2)=Y, R(-2)=P, T(-2)=R. Thus B(-2)=Z, R(-2)=P, A(-2)=Y, I(-2)=G, N(-2)=L → ZPYGL."
  },
  {
    exam: "SSC CGL",
    year: 2023,
    subject: "Quantitative Aptitude",
    topic: "Profit & Loss",
    type: "pyq",
    question: "A article is sold for ₹960 at a loss of 20%. What should be the selling price to gain 20%?",
    options: [
      { label: "A", text: "₹1,200" },
      { label: "B", text: "₹1,440" },
      { label: "C", text: "₹1,280" },
      { label: "D", text: "₹1,360" }
    ],
    correctAnswer: "B",
    explanation: "80% of CP = 960 => CP = 960 × (100/80) = ₹1,200. SP for 20% gain = 1,200 × 1.20 = ₹1,440."
  },

  // --- Railway NTPC 2024 ---
  {
    exam: "Railway NTPC",
    year: 2024,
    subject: "General Science",
    topic: "Physics",
    type: "pyq",
    question: "What is the SI unit of electrical resistance?",
    options: [
      { label: "A", text: "Volt" },
      { label: "B", text: "Ampere" },
      { label: "C", text: "Ohm" },
      { label: "D", text: "Watt" }
    ],
    correctAnswer: "C",
    explanation: "The SI unit of electrical resistance is the Ohm (represented by Ω), named after German physicist Georg Simon Ohm."
  },
  {
    exam: "Railway NTPC",
    year: 2024,
    subject: "Mathematics",
    topic: "Time & Work",
    type: "pyq",
    question: "A can complete a task in 12 days and B can complete it in 24 days. Working together, in how many days will they finish the task?",
    options: [
      { label: "A", text: "6 days" },
      { label: "B", text: "8 days" },
      { label: "C", text: "10 days" },
      { label: "D", text: "16 days" }
    ],
    correctAnswer: "B",
    explanation: "Combined 1-day work = 1/12 + 1/24 = 3/24 = 1/8. Total time = 8 days."
  },

  // --- IBPS PO 2024 ---
  {
    exam: "IBPS PO",
    year: 2024,
    subject: "Reasoning Ability",
    topic: "Syllogism",
    type: "pyq",
    question: "Statements: All apples are fruits. All fruits are healthy.\nConclusions:\nI. All apples are healthy.\nII. Some healthy things are apples.",
    options: [
      { label: "A", text: "Only Conclusion I follows" },
      { label: "B", text: "Only Conclusion II follows" },
      { label: "C", text: "Both Conclusion I and II follow" },
      { label: "D", text: "Neither follows" }
    ],
    correctAnswer: "C",
    explanation: "Since Apples ⊂ Fruits ⊂ Healthy, All apples are healthy (I is True). Also, part of healthy things are apples (II is True). Both follow."
  },

  // --- UPSC Civil Services 2024 ---
  {
    exam: "UPSC Civil Services",
    year: 2024,
    subject: "General Studies",
    topic: "Indian Polity",
    type: "pyq",
    question: "Which Article of the Constitution of India guarantees the Right to Equality before Law?",
    options: [
      { label: "A", text: "Article 14" },
      { label: "B", text: "Article 19" },
      { label: "C", text: "Article 21" },
      { label: "D", text: "Article 32" }
    ],
    correctAnswer: "A",
    explanation: "Article 14 guarantees equality before law and equal protection of laws to all persons within the territory of India."
  }
];

export async function seedGovData() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tcm";
    if (process.env.MONGODB_URI) {
      await connectDatabase();
    } else {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log("Connected to local MongoDB for Gov seed");
      } catch (e) {
        console.warn("Local MongoDB not running for CLI seed script; backend will operate with memory store fallback if offline.");
        return;
      }
    }
    console.log("Seeding Government Exam Question Bank...");

    for (const exData of sampleExams) {
      await GovExam.findOneAndUpdate(
        { name: exData.name },
        exData,
        { upsert: true, new: true }
      );
    }

    let insertedCount = 0;
    for (const qData of sampleQuestions) {
      let exam = await GovExam.findOne({ name: qData.exam });
      if (!exam) {
        exam = await GovExam.create({ name: qData.exam, category: "SSC" });
      }

      let subject = await GovSubject.findOne({ examId: exam._id, name: qData.subject });
      if (!subject) {
        subject = await GovSubject.create({ examId: exam._id, name: qData.subject, icon: "book-open" });
      }

      let topic = await GovTopic.findOne({ subjectId: subject._id, name: qData.topic });
      if (!topic) {
        topic = await GovTopic.create({ subjectId: subject._id, name: qData.topic });
      }

      const existingQ = await GovQuestion.findOne({
        examId: exam._id,
        year: qData.year,
        questionText: qData.question
      });

      if (!existingQ) {
        await GovQuestion.create({
          examId: exam._id,
          examName: exam.name,
          year: qData.year,
          subjectId: subject._id,
          subjectName: subject.name,
          topicId: topic._id,
          topicName: topic.name,
          type: qData.type || "pyq",
          questionText: qData.question,
          options: qData.options,
          correctAnswer: qData.correctAnswer,
          explanation: qData.explanation,
          language: "en",
          source: "official_pyq",
          isVerified: true,
          isActive: true
        });
        insertedCount++;
      }
    }

    console.log(`Successfully seeded ${insertedCount} Government Exam Questions across SSC CGL, Railway, IBPS PO, and UPSC!`);
  } catch (err) {
    console.error("Failed to seed Government Exam data:", err);
  }
}

if (process.argv[1] && process.argv[1].includes("seedGovData.js")) {
  seedGovData().then(() => process.exit(0));
}
