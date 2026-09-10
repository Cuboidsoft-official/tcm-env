// Default Standard Exams List for Mock Test Selector
export const defaultGovExamsList = [
  {
    id: "ex_ssc_cgl",
    name: "SSC CGL",
    category: "SSC",
    tier: "Tier 1",
    badge: "Group B & C",
    bgColor: "#EFF6FF",
    iconColor: "#0284C7"
  },
  {
    id: "ex_ssc_chsl",
    name: "SSC CHSL",
    category: "SSC",
    tier: "Tier 1",
    badge: "10+2 Level",
    bgColor: "#F0FDF4",
    iconColor: "#16A34A"
  },
  {
    id: "ex_rrb_ntpc",
    name: "Railway NTPC",
    category: "Railway",
    tier: "CBT 1",
    badge: "Railways",
    bgColor: "#FEFCE8",
    iconColor: "#CA8A04"
  },
  {
    id: "ex_ibps_po",
    name: "IBPS PO",
    category: "Banking",
    tier: "Prelims",
    badge: "PSU Banks",
    bgColor: "#FAF5FF",
    iconColor: "#9333EA"
  },
  {
    id: "ex_upsc_cse",
    name: "UPSC CSE",
    category: "UPSC",
    tier: "Prelims",
    badge: "IAS / IPS",
    bgColor: "#FFF1F2",
    iconColor: "#E11D48"
  }
];

// Seeded Full Mock Tests
export const defaultMockTests = [
  {
    id: "mock_ssc_cgl_01",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    title: "SSC CGL Tier-1 Full Mock Test 01",
    testType: "full",
    tier: "Tier 1",
    durationMins: 60,
    totalQuestions: 100,
    maxMarks: 200,
    negativeMarking: 0.50,
    positiveMarks: 2.0,
    difficulty: "Mixed",
    languages: ["English", "Hindi"],
    status: "Not Attempted",
    attemptCount: 1420
  },
  {
    id: "mock_ssc_cgl_02",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    title: "SSC CGL Tier-1 Full Mock Test 02",
    testType: "full",
    tier: "Tier 1",
    durationMins: 60,
    totalQuestions: 100,
    maxMarks: 200,
    negativeMarking: 0.50,
    positiveMarks: 2.0,
    difficulty: "Medium",
    languages: ["English", "Hindi"],
    status: "Not Attempted",
    attemptCount: 980
  },
  {
    id: "mock_ssc_cgl_sub_reasoning",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    title: "SSC CGL Reasoning Sectional Test",
    testType: "subject",
    tier: "Tier 1",
    durationMins: 15,
    totalQuestions: 25,
    maxMarks: 50,
    negativeMarking: 0.50,
    positiveMarks: 2.0,
    difficulty: "Mixed",
    languages: ["English", "Hindi"],
    status: "Not Attempted",
    attemptCount: 2150
  },
  {
    id: "mock_ssc_cgl_top_quant",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    title: "Percentage & Profit Loss Speed Test",
    testType: "topic",
    tier: "Tier 1",
    durationMins: 15,
    totalQuestions: 15,
    maxMarks: 30,
    negativeMarking: 0.50,
    positiveMarks: 2.0,
    difficulty: "Medium",
    languages: ["English", "Hindi"],
    status: "Not Attempted",
    attemptCount: 3100
  },
  {
    id: "mock_rrb_ntpc_01",
    examId: "ex_rrb_ntpc",
    examName: "Railway NTPC",
    title: "RRB NTPC CBT-1 Full Length Mock 01",
    testType: "full",
    tier: "CBT 1",
    durationMins: 90,
    totalQuestions: 100,
    maxMarks: 100,
    negativeMarking: 0.33,
    positiveMarks: 1.0,
    difficulty: "Mixed",
    languages: ["English", "Hindi"],
    status: "Not Attempted",
    attemptCount: 1890
  }
];

// Helper generator to create 100 realistic government CBT questions in English & Hindi
export function generateMockQuestions(testId, examName = "SSC CGL") {
  const sections = [
    { name: "General Intelligence & Reasoning", nameHi: "सामान्य बुद्धिमत्ता एवं तर्कशक्ति", code: "reasoning", count: 25 },
    { name: "General Awareness", nameHi: "सामान्य जानकारी (GK)", code: "ga", count: 25 },
    { name: "Quantitative Aptitude", nameHi: "मात्रात्मक रुझान (गणित)", code: "quant", count: 25 },
    { name: "English Comprehension", nameHi: "अंग्रेजी समझ", code: "english", count: 25 }
  ];

  const questions = [];
  let idCounter = 1;

  sections.forEach((sec) => {
    for (let i = 1; i <= sec.count; i++) {
      const qIndex = idCounter;
      let qText = "";
      let qTextHi = "";
      let options = [];
      let optionsHi = [];
      let correctAns = "A";
      let exp = "";
      let expHi = "";
      let topic = "General";

      if (sec.code === "reasoning") {
        if (i % 4 === 1) {
          qText = `In a certain code language, 'STATION' is written as 'TVBUJPO'. How will 'TEACHER' be written in that language?`;
          qTextHi = `एक निश्चित कूट भाषा में, 'STATION' को 'TVBUJPO' लिखा जाता है। उसी भाषा में 'TEACHER' को कैसे लिखा जाएगा?`;
          options = [
            { label: "A", text: "UFBCHFS" },
            { label: "B", text: "UFBDIFS" },
            { label: "C", text: "UFBDIES" },
            { label: "D", text: "UFBCHDS" }
          ];
          optionsHi = options;
          correctAns = "A";
          exp = "Each letter is incremented by +1 (S->T, T->U, A->B, T->U, I->J, O->P, N->O). Similarly TEACHER -> UFBCHFS.";
          expHi = "प्रत्येक अक्षर में +1 की वृद्धि की जाती है (S->T, T->U, A->B...)। उसी प्रकार TEACHER -> UFBCHFS.";
          topic = "Coding-Decoding";
        } else if (i % 4 === 2) {
          qText = `Select the related number from the given alternatives: 12 : 144 :: 15 : ?`;
          qTextHi = `दिए गए विकल्पों में से संबंधित संख्या को चुनिए: 12 : 144 :: 15 : ?`;
          options = [
            { label: "A", text: "210" },
            { label: "B", text: "225" },
            { label: "C", text: "250" },
            { label: "D", text: "195" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "12^2 = 144. Similarly 15^2 = 225.";
          expHi = "12 का वर्ग = 144। उसी प्रकार 15 का वर्ग = 225.";
          topic = "Analogy";
        } else if (i % 4 === 3) {
          qText = `Find the missing term in the series: 7, 10, 16, 25, 37, ?`;
          qTextHi = `श्रृंखला में लुप्त पद ज्ञात कीजिए: 7, 10, 16, 25, 37, ?`;
          options = [
            { label: "A", text: "52" },
            { label: "B", text: "50" },
            { label: "C", text: "49" },
            { label: "D", text: "54" }
          ];
          optionsHi = options;
          correctAns = "A";
          exp = "Differences are +3, +6, +9, +12. Next difference is +15. 37 + 15 = 52.";
          expHi = "अंतर +3, +6, +9, +12 हैं। अगला अंतर +15 होगा। 37 + 15 = 52.";
          topic = "Number Series";
        } else {
          qText = `Pointing to a photograph, Rohit said, 'She is the mother of my father's only son.' How is the woman related to Rohit?`;
          qTextHi = `एक तस्वीर की ओर इशारा करते हुए रोहित ने कहा, 'वह मेरे पिता के इकलौते बेटे की माँ है।' वह महिला रोहित से किस प्रकार संबंधित है?`;
          options = [
            { label: "A", text: "Sister" },
            { label: "B", text: "Mother" },
            { label: "C", text: "Aunt" },
            { label: "D", text: "Grandmother" }
          ];
          optionsHi = [
            { label: "A", text: "बहन" },
            { label: "B", text: "माता" },
            { label: "C", text: "चाची / मौसी" },
            { label: "D", text: "दादी / नानी" }
          ];
          correctAns = "B";
          exp = "Father's only son is Rohit himself. Mother of Rohit's father's only son is Rohit's mother.";
          expHi = "पिता का इकलौता बेटा खुद रोहित है। रोहित के पिता के इकलौते बेटे की माँ रोहित की माता है।";
          topic = "Blood Relations";
        }
      } else if (sec.code === "ga") {
        if (i % 4 === 1) {
          qText = `Which Article of the Indian Constitution deals with the Right to Equality?`;
          qTextHi = `भारतीय संविधान का कौन सा अनुच्छेद समानता के अधिकार से संबंधित है?`;
          options = [
            { label: "A", text: "Articles 14-18" },
            { label: "B", text: "Articles 19-22" },
            { label: "C", text: "Articles 23-24" },
            { label: "D", text: "Articles 25-28" }
          ];
          optionsHi = [
            { label: "A", text: "अनुच्छेद 14-18" },
            { label: "B", text: "अनुच्छेद 19-22" },
            { label: "C", text: "अनुच्छेद 23-24" },
            { label: "D", text: "अनुच्छेद 25-28" }
          ];
          correctAns = "A";
          exp = "Articles 14 to 18 of Part III of the Constitution guarantee the Right to Equality.";
          expHi = "संविधान के भाग III के अनुच्छेद 14 से 18 समानता के अधिकार की गारंटी देते हैं।";
          topic = "Indian Polity";
        } else if (i % 4 === 2) {
          qText = `Who among the following was the founder of the Maurya Empire?`;
          qTextHi = `निम्नलिखित में से कौन मौर्य साम्राज्य के संस्थापक थे?`;
          options = [
            { label: "A", text: "Ashoka" },
            { label: "B", text: "Chandragupta Maurya" },
            { label: "C", text: "Bindusara" },
            { label: "D", text: "Bimbisara" }
          ];
          optionsHi = [
            { label: "A", text: "अशोक" },
            { label: "B", text: "चंद्रगुप्त मौर्य" },
            { label: "C", text: "बिंदुसार" },
            { label: "D", text: "बिंबिसार" }
          ];
          correctAns = "B";
          exp = "Chandragupta Maurya founded the Maurya Empire in 322 BCE with Chanakya's guidance.";
          expHi = "चंद्रगुप्त मौर्य ने चाणक्य के मार्गदर्शन में 322 ईसा पूर्व में मौर्य साम्राज्य की स्थापना की।";
          topic = "Ancient History";
        } else if (i % 4 === 3) {
          qText = `Which river is known as the 'Sorrow of Bengal'?`;
          qTextHi = `किस नदी को 'बंगाल का शोक' कहा जाता है?`;
          options = [
            { label: "A", text: "Kosi" },
            { label: "B", text: "Damodar" },
            { label: "C", text: "Hooghly" },
            { label: "D", text: "Brahmaputra" }
          ];
          optionsHi = [
            { label: "A", text: "कोसी" },
            { label: "B", text: "दामोदर" },
            { label: "C", text: "हुगली" },
            { label: "D", text: "ब्रह्मपुत्र" }
          ];
          correctAns = "B";
          exp = "Damodar River was formerly known as the Sorrow of Bengal due to its devastating floods.";
          expHi = "दामोदर नदी को विनाशकारी बाढ़ के कारण बंगाल का शोक कहा जाता था।";
          topic = "Indian Geography";
        } else {
          qText = `What is the chemical formula of Baking Soda?`;
          qTextHi = `बेकिंग सोडा का रासायनिक सूत्र क्या है?`;
          options = [
            { label: "A", text: "Na2CO3" },
            { label: "B", text: "NaHCO3" },
            { label: "C", text: "NaOH" },
            { label: "D", text: "CaCl2" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "Baking soda is Sodium Bicarbonate (NaHCO3).";
          expHi = "बेकिंग सोडा सोडियम बाइकार्बोनेट (NaHCO3) है।";
          topic = "General Chemistry";
        }
      } else if (sec.code === "quant") {
        if (i % 4 === 1) {
          qText = `If a shirt marked at Rs 800 is sold for Rs 680, what is the discount percentage?`;
          qTextHi = `यदि 800 रुपये अंकित मूल्य वाली शर्ट को 680 रुपये में बेचा जाता है, तो छूट का प्रतिशत क्या है?`;
          options = [
            { label: "A", text: "12%" },
            { label: "B", text: "15%" },
            { label: "C", text: "18%" },
            { label: "D", text: "20%" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "Discount = 800 - 680 = 120. Discount % = (120 / 800) * 100 = 15%.";
          expHi = "छूट = 800 - 680 = 120 रुपये। छूट % = (120 / 800) * 100 = 15%.";
          topic = "Profit & Loss";
        } else if (i % 4 === 2) {
          qText = `A student scores 35% marks and fails by 20 marks. If passing percentage is 40%, find the maximum marks.`;
          qTextHi = `एक छात्र 35% अंक प्राप्त करता है और 20 अंकों से अनुत्तीर्ण हो जाता है। यदि उत्तीर्ण प्रतिशत 40% है, तो अधिकतम अंक ज्ञात कीजिए।`;
          options = [
            { label: "A", text: "350" },
            { label: "B", text: "400" },
            { label: "C", text: "500" },
            { label: "D", text: "450" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "5% difference = 20 marks. So 100% maximum marks = (20 / 5) * 100 = 400.";
          expHi = "5% का अंतर = 20 अंक। अतः 100% अधिकतम अंक = (20 / 5) * 100 = 400.";
          topic = "Percentage";
        } else if (i % 4 === 3) {
          qText = `A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?`;
          qTextHi = `150 मीटर लंबी एक ट्रेन एक खंभे को 15 सेकंड में पार करती है। किमी/घंटा में ट्रेन की गति क्या है?`;
          options = [
            { label: "A", text: "36 km/h" },
            { label: "B", text: "45 km/h" },
            { label: "C", text: "54 km/h" },
            { label: "D", text: "30 km/h" }
          ];
          optionsHi = [
            { label: "A", text: "36 किमी/घंटा" },
            { label: "B", text: "45 किमी/घंटा" },
            { label: "C", text: "54 किमी/घंटा" },
            { label: "D", text: "30 किमी/घंटा" }
          ];
          correctAns = "A";
          exp = "Speed = 150 / 15 = 10 m/s. In km/h = 10 * (18 / 5) = 36 km/h.";
          expHi = "गति = 150 / 15 = 10 मीटर/सेकंड। किमी/घंटा में = 10 * (18 / 5) = 36 किमी/घंटा।";
          topic = "Time & Distance";
        } else {
          qText = `Find the simple interest on Rs 5000 at 8% per annum for 3 years.`;
          qTextHi = `5000 रुपये पर 8% प्रति वर्ष की दर से 3 वर्षों के लिए साधारण ब्याज ज्ञात कीजिए।`;
          options = [
            { label: "A", text: "Rs 1200" },
            { label: "B", text: "Rs 1400" },
            { label: "C", text: "Rs 1000" },
            { label: "D", text: "Rs 1500" }
          ];
          optionsHi = [
            { label: "A", text: "1200 रुपये" },
            { label: "B", text: "1400 रुपये" },
            { label: "C", text: "1000 रुपये" },
            { label: "D", text: "1500 रुपये" }
          ];
          correctAns = "A";
          exp = "SI = (P * R * T) / 100 = (5000 * 8 * 3) / 100 = Rs 1200.";
          expHi = "साधारण ब्याज = (P * R * T) / 100 = (5000 * 8 * 3) / 100 = 1200 रुपये।";
          topic = "Simple Interest";
        }
      } else {
        if (i % 4 === 1) {
          qText = `Select the synonym of the given word: ADMONISH`;
          qTextHi = `दिए गए शब्द का पर्यायवाची चुनें: ADMONISH`;
          options = [
            { label: "A", text: "Praise" },
            { label: "B", text: "Warn / Reprimand" },
            { label: "C", text: "Encourage" },
            { label: "D", text: "Permit" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "Admonish means to warn or reprimand someone firmly.";
          expHi = "Admonish का अर्थ किसी को चेतावनी देना या डांटना है।";
          topic = "Vocabulary";
        } else if (i % 4 === 2) {
          qText = `Identify the error in the sentence: 'She is more smarter than her elder sister.'`;
          qTextHi = `वाक्य में त्रुटि पहचानें: 'She is more smarter than her elder sister.'`;
          options = [
            { label: "A", text: "She is" },
            { label: "B", text: "more smarter" },
            { label: "C", text: "than her" },
            { label: "D", text: "elder sister" }
          ];
          optionsHi = options;
          correctAns = "B";
          exp = "Double comparative ('more smarter') is incorrect. Use 'smarter' instead of 'more smarter'.";
          expHi = "दोहरे तुलनात्मक शब्द ('more smarter') का उपयोग गलत है। केवल 'smarter' का प्रयोग करें।";
          topic = "Grammar";
        } else if (i % 4 === 3) {
          qText = `Select the antonym of the given word: METICULOUS`;
          qTextHi = `दिए गए शब्द का विलोम चुनें: METICULOUS`;
          options = [
            { label: "A", text: "Careless" },
            { label: "B", text: "Precise" },
            { label: "C", text: "Cautious" },
            { label: "D", text: "Detailed" }
          ];
          optionsHi = options;
          correctAns = "A";
          exp = "Meticulous means showing great attention to detail. Its opposite is careless.";
          expHi = "Meticulous का अर्थ है अत्यंत सतर्क या सूक्ष्म। इसका विलोम Careless (लापरवाह) है।";
          topic = "Vocabulary";
        } else {
          qText = `Choose the one-word substitution for: 'One who collects stamps.'`;
          qTextHi = `इसके लिए एक शब्द चुनें: 'One who collects stamps.'`;
          options = [
            { label: "A", text: "Philatelist" },
            { label: "B", text: "Numismatist" },
            { label: "C", text: "Bibliophile" },
            { label: "D", text: "Optimist" }
          ];
          optionsHi = options;
          correctAns = "A";
          exp = "A Philatelist is a person who collects or studies postage stamps.";
          expHi = "Philatelist वह व्यक्ति होता है जो डाक टिकट एकत्र करता है।";
          topic = "One Word Substitution";
        }
      }

      questions.push({
        id: `q_${testId}_${qIndex}`,
        questionNumber: qIndex,
        sectionName: sec.name,
        sectionNameHi: sec.nameHi,
        sectionCode: sec.code,
        questionText: qText,
        questionTextHi: qTextHi,
        options,
        optionsHi,
        correctAnswer: correctAns,
        explanation: exp,
        explanationHi: expHi,
        topicName: topic,
        subjectName: sec.name,
        positiveMarks: 2.0,
        negativeMarks: 0.5,
        language: "English"
      });

      idCounter++;
    }
  });

  return questions;
}
