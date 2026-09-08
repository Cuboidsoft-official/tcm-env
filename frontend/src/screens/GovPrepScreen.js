import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Pressable,
  Dimensions,
  Image
} from "react-native";
import { MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";

const phlappyLogo = require("../../assets/icon.png");
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import { shadow } from "../constants/theme";
import {
  getGovCategories,
  getGovExams,
  getGovYears,
  getGovSubjects,
  getGovTopics,
  getGovQuestionCount,
  getGovRandomQuestions,
  getGovQuestions,
  attemptGovQuestion,
  saveGovQuestion,
  getSavedGovQuestions,
  getGovProgress,
  explainGovQuestionWithAI
} from "../api/client";

const { width } = Dimensions.get("window");

const DEFAULT_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const DEFAULT_EXAM_LIST = [
  { id: "ex_ssc_cgl", name: "SSC CGL", category: "SSC", description: "Staff Selection Commission Combined Graduate Level", isActive: true },
  { id: "ex_ssc_chsl", name: "SSC CHSL", category: "SSC", description: "Combined Higher Secondary Level Examination", isActive: true },
  { id: "ex_rrb_ntpc", name: "Railway NTPC", category: "Railway", description: "RRB Non-Technical Popular Categories", isActive: true },
  { id: "ex_rrb_groupd", name: "RRB Group D", category: "Railway", description: "Railway Level 1 Recruitment Examination", isActive: true },
  { id: "ex_ibps_po", name: "IBPS PO", category: "Banking", description: "Institute of Banking Personnel Selection PO", isActive: true },
  { id: "ex_sbi_po", name: "SBI PO", category: "Banking", description: "State Bank of India Probationary Officer", isActive: true },
  { id: "ex_upsc_cse", name: "UPSC Civil Services", category: "UPSC", description: "Civil Services Examination General Studies & CSAT", isActive: true },
  { id: "ex_state_psc", name: "State PSC", category: "State PSC", description: "State Public Service Commission General Studies", isActive: true },
  { id: "ex_police", name: "Police Constable", category: "Police", description: "State Police Recruitment Examination", isActive: true },
  { id: "ex_defence", name: "CDS Defence", category: "Defence", description: "Combined Defence Services Examination", isActive: true }
];

const EXAM_CATEGORY_SUBJECTS = {
  SSC: [
    { id: "sub_reasoning", name: "Reasoning", icon: "brain" },
    { id: "sub_quant", name: "Quantitative Aptitude", icon: "calculator" },
    { id: "sub_ga", name: "General Awareness", icon: "book-open" },
    { id: "sub_english", name: "English Comprehension", icon: "format-title" }
  ],
  Railway: [
    { id: "sub_rrb_math", name: "Mathematics", icon: "calculator" },
    { id: "sub_rrb_reasoning", name: "General Intelligence & Reasoning", icon: "brain" },
    { id: "sub_rrb_sci", name: "General Science", icon: "flask" },
    { id: "sub_rrb_ga", name: "General Awareness & Current Affairs", icon: "globe-model" }
  ],
  Banking: [
    { id: "sub_ibps_reasoning", name: "Reasoning Ability", icon: "brain" },
    { id: "sub_ibps_quant", name: "Quantitative Aptitude", icon: "calculator" },
    { id: "sub_ibps_english", name: "English Language", icon: "format-title" },
    { id: "sub_ibps_banking", name: "Banking & Financial Awareness", icon: "bank" }
  ],
  UPSC: [
    { id: "sub_upsc_gs", name: "General Studies (Polity, History, Geo)", icon: "scale-balance" },
    { id: "sub_upsc_csat", name: "CSAT (Aptitude & Comprehension)", icon: "notebook-text" }
  ],
  "State PSC": [
    { id: "sub_psc_gk", name: "State GK & Culture", icon: "map-marker-path" },
    { id: "sub_psc_gs", name: "General Studies & Polity", icon: "bank" },
    { id: "sub_psc_apt", name: "Mental Ability & Aptitude", icon: "brain" }
  ],
  Police: [
    { id: "sub_pol_gk", name: "General Knowledge & Science", icon: "shield-half-full" },
    { id: "sub_pol_reasoning", name: "Reasoning & Mental Ability", icon: "brain" },
    { id: "sub_pol_num", name: "Numerical Ability", icon: "calculator" }
  ],
  Defence: [
    { id: "sub_def_math", name: "Elementary Mathematics", icon: "calculator" },
    { id: "sub_def_eng", name: "English Language", icon: "format-title" },
    { id: "sub_def_gk", name: "General Knowledge & Science", icon: "shield-star" }
  ]
};

const DEFAULT_QUESTIONS = [
  {
    id: "q_ssc_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Analogy",
    type: "pyq",
    questionText: "Book : Read :: Food : ?",
    questionTextHi: "पुस्तक : पढ़ना :: भोजन : ?",
    options: [
      { label: "A", text: "Cook" },
      { label: "B", text: "Eat" },
      { label: "C", text: "Buy" },
      { label: "D", text: "Sell" }
    ],
    optionsHi: [
      { label: "A", text: "पकाना" },
      { label: "B", text: "खाना" },
      { label: "C", text: "खरीदना" },
      { label: "D", text: "बेचना" }
    ],
    correctAnswer: "B",
    explanation: "Just as a 'Book' is meant to be 'Read', 'Food' is meant to be 'Eaten'. Therefore, 'Eat' is the correct relationship.",
    explanationHi: "जिस प्रकार 'पुस्तक' का सम्बन्ध 'पढ़ने' से है, उसी प्रकार 'भोजन' का सम्बन्ध 'खाने' से है।",
    language: "en"
  },
  {
    id: "q_ssc_2",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Number Series",
    type: "pyq",
    questionText: "Find the missing number in the series: 4, 9, 19, 39, 79, ?",
    questionTextHi: "श्रृंखला में लुप्त संख्या ज्ञात कीजिए: 4, 9, 19, 39, 79, ?",
    options: [
      { label: "A", text: "159" },
      { label: "B", text: "149" },
      { label: "C", text: "169" },
      { label: "D", text: "139" }
    ],
    optionsHi: [
      { label: "A", text: "159" },
      { label: "B", text: "149" },
      { label: "C", text: "169" },
      { label: "D", text: "139" }
    ],
    correctAnswer: "A",
    explanation: "Pattern: Each number is (Previous × 2) + 1. So 79×2+1 = 159.",
    explanationHi: "पैटर्न: प्रत्येक संख्या (पिछली × 2) + 1 है। अतः 79 × 2 + 1 = 159।",
    language: "en"
  },
  {
    id: "q_ssc_3",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Percentage",
    type: "pyq",
    questionText: "If a number is increased by 20% and then decreased by 20%, what is the net percentage change?",
    questionTextHi: "यदि किसी संख्या में 20% की वृद्धि की जाती है और फिर 20% की कमी की जाती है, तो शुद्ध प्रतिशत परिवर्तन क्या है?",
    options: [
      { label: "A", text: "No change" },
      { label: "B", text: "4% Increase" },
      { label: "C", text: "4% Decrease" },
      { label: "D", text: "2% Decrease" }
    ],
    optionsHi: [
      { label: "A", text: "कोई परिवर्तन नहीं" },
      { label: "B", text: "4% वृद्धि" },
      { label: "C", text: "4% कमी" },
      { label: "D", text: "2% कमी" }
    ],
    correctAnswer: "C",
    explanation: "Net Change = +20 - 20 + (20 × -20)/100 = -4%. A net 4% decrease.",
    explanationHi: "शुद्ध परिवर्तन = +20 - 20 + (20 × -20)/100 = -4% (अर्थात 4% की कमी)।",
    language: "en"
  },
  {
    id: "q_ssc_5",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Ratio & Proportion",
    type: "pyq",
    questionText: "The ratio of ages of A and B is 3:4. After 5 years, the ratio becomes 4:5. What is the present age of A?",
    questionTextHi: "A और B की आयु का अनुपात 3:4 है। 5 वर्ष बाद अनुपात 4:5 हो जाता है। A की वर्तमान आयु क्या है?",
    options: [
      { label: "A", text: "12 years" },
      { label: "B", text: "15 years" },
      { label: "C", text: "20 years" },
      { label: "D", text: "25 years" }
    ],
    optionsHi: [
      { label: "A", text: "12 वर्ष" },
      { label: "B", text: "15 वर्ष" },
      { label: "C", text: "20 वर्ष" },
      { label: "D", text: "25 वर्ष" }
    ],
    correctAnswer: "B",
    explanation: "Let present ages be 3x and 4x. (3x + 5)/(4x + 5) = 4/5 => 5(3x + 5) = 4(4x + 5) => 15x + 25 = 16x + 20 => x = 5. Present age of A = 3 × 5 = 15 years.",
    explanationHi: "माना आयु 3x और 4x है। (3x + 5)/(4x + 5) = 4/5 => x = 5। A की वर्तमान आयु = 3 × 5 = 15 वर्ष।",
    language: "en"
  },
  {
    id: "q_ssc_4",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2023,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Indian History",
    type: "pyq",
    questionText: "Who was the founder of the Maurya Empire in ancient India?",
    questionTextHi: "प्राचीन भारत में मौर्य साम्राज्य के संस्थापक कौन थे?",
    options: [
      { label: "A", text: "Ashoka the Great" },
      { label: "B", text: "Chandragupta Maurya" },
      { label: "C", text: "Bindusara" },
      { label: "D", text: "Bimbisara" }
    ],
    optionsHi: [
      { label: "A", text: "सम्राट अशोक" },
      { label: "B", text: "चंद्रगुप्त मौर्य" },
      { label: "C", text: "बिंदुसर" },
      { label: "D", text: "बिंबिसार" }
    ],
    correctAnswer: "B",
    explanation: "Chandragupta Maurya founded the Maurya Empire in 322 BCE.",
    explanationHi: "चंद्रगुप्त मौर्य ने 322 ईसा पूर्व में मौर्य साम्राज्य की स्थापना की थी।",
    language: "en"
  },
  {
    id: "q_ssc_6",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Geography",
    type: "pyq",
    questionText: "Which Indian city is famously known as the 'Pink City' of India?",
    questionTextHi: "भारत के किस शहर को 'गुलाबी नगरी' (Pink City) के नाम से जाना जाता है?",
    options: [
      { label: "A", text: "Udaipur" },
      { label: "B", text: "Jaipur" },
      { label: "C", text: "Jodhpur" },
      { label: "D", text: "Jaisalmer" }
    ],
    optionsHi: [
      { label: "A", text: "उदयपुर" },
      { label: "B", text: "जयपुर" },
      { label: "C", text: "जोधपुर" },
      { label: "D", text: "जैसलमेर" }
    ],
    correctAnswer: "B",
    explanation: "Jaipur is known as the Pink City of India due to the distinctive color of its buildings.",
    explanationHi: "जयपुर को इसकी इमारतों के विशिष्ट गुलाबी रंग के कारण गुलाबी नगरी के रूप में जाना जाता है।",
    language: "en"
  },
  {
    id: "q_ssc_7",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Vocabulary",
    type: "pyq",
    questionText: "Select the most appropriate SYNONYM of the word 'BENEVOLENT':",
    questionTextHi: "'BENEVOLENT' शब्द का सबसे उपयुक्त पर्यायवाची (Synonym) चुनिए:",
    options: [
      { label: "A", text: "Cruel" },
      { label: "B", text: "Kind" },
      { label: "C", text: "Greedy" },
      { label: "D", text: "Hateful" }
    ],
    optionsHi: [
      { label: "A", text: "Cruel (क्रूर)" },
      { label: "B", text: "Kind (दयालु)" },
      { label: "C", text: "Greedy (लालची)" },
      { label: "D", text: "Hateful (घृणास्पद)" }
    ],
    correctAnswer: "B",
    explanation: "'Benevolent' means well-meaning and kindly. Therefore, 'Kind' is the correct synonym.",
    explanationHi: "'Benevolent' का अर्थ दयालु/परोपकारी होता है। अतः 'Kind' सही उत्तर है।",
    language: "en"
  },
  {
    id: "q_ssc_8",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Spelling",
    type: "pyq",
    questionText: "Select the correctly spelt word:",
    questionTextHi: "सही वर्तनी (Correct Spelling) वाला शब्द चुनिए:",
    options: [
      { label: "A", text: "Recieve" },
      { label: "B", text: "Receive" },
      { label: "C", text: "Receave" },
      { label: "D", text: "Receeve" }
    ],
    optionsHi: [
      { label: "A", text: "Recieve" },
      { label: "B", text: "Receive" },
      { label: "C", text: "Receave" },
      { label: "D", text: "Receeve" }
    ],
    correctAnswer: "B",
    explanation: "The correct spelling is 'Receive' (rule: 'i' before 'e' except after 'c').",
    explanationHi: "सही वर्तनी 'Receive' है।",
    language: "en"
  },
  {
    id: "q_rrb_1",
    examId: "ex_rrb_ntpc",
    examName: "Railway NTPC",
    year: 2024,
    subjectId: "sub_rrb_sci",
    subjectName: "General Science",
    topicName: "Physics",
    type: "pyq",
    questionText: "What is the SI unit of electrical resistance?",
    questionTextHi: "विद्युत प्रतिरोध का SI मात्रक क्या है?",
    options: [
      { label: "A", text: "Volt" },
      { label: "B", text: "Ampere" },
      { label: "C", text: "Ohm" },
      { label: "D", text: "Watt" }
    ],
    optionsHi: [
      { label: "A", text: "वोल्ट" },
      { label: "B", text: "एम्पीयर" },
      { label: "C", text: "ओम (Ohm)" },
      { label: "D", text: "वाट" }
    ],
    correctAnswer: "C",
    explanation: "The SI unit of electrical resistance is Ohm (Ω).",
    explanationHi: "विद्युत प्रतिरोध का SI मात्रक ओम (Ohm - Ω) होता है।",
    language: "en"
  },
  {
    id: "q_upsc_1",
    examId: "ex_upsc_cse",
    examName: "UPSC Civil Services",
    year: 2024,
    subjectId: "sub_upsc_polity",
    subjectName: "General Studies",
    topicName: "Indian Polity",
    type: "pyq",
    questionText: "Which Article of the Indian Constitution guarantees 'Equality before Law'?",
    questionTextHi: "भारतीय संविधान का कौन सा अनुच्छेद 'विधि के समक्ष समता' की गारंटी देता है?",
    options: [
      { label: "A", text: "Article 12" },
      { label: "B", text: "Article 14" },
      { label: "C", text: "Article 19" },
      { label: "D", text: "Article 21" }
    ],
    optionsHi: [
      { label: "A", text: "अनुच्छेद 12" },
      { label: "B", text: "अनुच्छेद 14" },
      { label: "C", text: "अनुच्छेद 19" },
      { label: "D", text: "अनुच्छेद 21" }
    ],
    correctAnswer: "B",
    explanation: "Article 14 guarantees equality before law and equal protection of laws to all persons within India.",
    explanationHi: "अनुच्छेद 14 भारत के सभी नागरिकों को कानून के समक्ष समानता की गारंटी देता है।",
    language: "en",
    state: "All"
  },
  {
    id: "q_up_1",
    examId: "ex_state_psc",
    examName: "State PSC",
    year: 2024,
    state: "Uttar Pradesh",
    subjectId: "sub_psc_gk",
    subjectName: "State GK & Culture",
    topicName: "UP Geography & Parks",
    type: "pyq",
    questionText: "In which district of Uttar Pradesh is the Dudhwa National Park located?",
    questionTextHi: "उत्तर प्रदेश के किस जिले में दुधवा राष्ट्रीय उद्यान स्थित है?",
    options: [
      { label: "A", text: "Lakhimpur Kheri" },
      { label: "B", text: "Pilibhit" },
      { label: "C", text: "Varanasi" },
      { label: "D", text: "Gorakhpur" }
    ],
    optionsHi: [
      { label: "A", text: "लखीमपुर खीरी" },
      { label: "B", text: "पीलीभीत" },
      { label: "C", text: "वाराणसी" },
      { label: "D", text: "गोरखपुर" }
    ],
    correctAnswer: "A",
    explanation: "Dudhwa National Park is located in the Lakhimpur Kheri district of Uttar Pradesh, near the Nepal border.",
    explanationHi: "दुधवा राष्ट्रीय उद्यान उत्तर प्रदेश के लखीमपुर खीरी जिले में भारत-नेपाल सीमा के पास स्थित है।",
    language: "en"
  },
  {
    id: "q_bih_1",
    examId: "ex_state_psc",
    examName: "State PSC",
    year: 2024,
    state: "Bihar",
    subjectId: "sub_psc_gk",
    subjectName: "State GK & Culture",
    topicName: "Bihar Geography",
    type: "pyq",
    questionText: "Which river is popularly known as the 'Sorrow of Bihar' due to frequent flooding?",
    questionTextHi: "बार-बार आने वाली बाढ़ के कारण किस नदी को 'बिहार का शोक' (Sorrow of Bihar) कहा जाता है?",
    options: [
      { label: "A", text: "Ganga" },
      { label: "B", text: "Kosi" },
      { label: "C", text: "Gandak" },
      { label: "D", text: "Son" }
    ],
    optionsHi: [
      { label: "A", text: "गंगा" },
      { label: "B", text: "कोशी" },
      { label: "C", text: "गंडक" },
      { label: "D", text: "सोन" }
    ],
    correctAnswer: "B",
    explanation: "Kosi river is known as the Sorrow of Bihar because of its frequent and unpredictable flooding.",
    explanationHi: "कोशी नदी को बार-बार मार्ग बदलने और विनाशकारी बाढ़ के कारण 'बिहार का शोक' कहा जाता है।",
    language: "en"
  },
  {
    id: "q_raj_1",
    examId: "ex_state_psc",
    examName: "State PSC",
    year: 2024,
    state: "Rajasthan",
    subjectId: "sub_psc_gk",
    subjectName: "State GK & Culture",
    topicName: "Rajasthan History & Forts",
    type: "pyq",
    questionText: "Which city in Rajasthan is famously known as the 'Sun City'?",
    questionTextHi: "राजस्थान के किस शहर को 'सूर्य नगरी' (Sun City) के नाम से जाना जाता है?",
    options: [
      { label: "A", text: "Jaipur" },
      { label: "B", text: "Jodhpur" },
      { label: "C", text: "Udaipur" },
      { label: "D", text: "Bikaner" }
    ],
    optionsHi: [
      { label: "A", text: "जयपुर" },
      { label: "B", text: "जोधपुर" },
      { label: "C", text: "उदयपुर" },
      { label: "D", text: "बीकानेर" }
    ],
    correctAnswer: "B",
    explanation: "Jodhpur is called the 'Sun City' for its bright, sunny weather year-round, and 'Blue City' for its blue-painted houses.",
    explanationHi: "जोधपुर को पूरे वर्ष चमकदार धूप के कारण 'सूर्य नगरी' (Sun City) और नीले घरों के कारण 'ब्लू सिटी' कहा जाता है।",
    language: "en"
  },
  {
    id: "q_mp_1",
    examId: "ex_state_psc",
    examName: "State PSC",
    year: 2024,
    state: "Madhya Pradesh",
    subjectId: "sub_psc_gk",
    subjectName: "State GK & Culture",
    topicName: "MP General Knowledge",
    type: "pyq",
    questionText: "Which city in Madhya Pradesh has consistently been ranked as India's Cleanest City in Swachh Survekshan?",
    questionTextHi: "स्वच्छ सर्वेक्षण में मध्य प्रदेश के किस शहर को लगातार भारत का सबसे स्वच्छ शहर चुना गया है?",
    options: [
      { label: "A", text: "Bhopal" },
      { label: "B", text: "Indore" },
      { label: "C", text: "Gwalior" },
      { label: "D", text: "Jabalpur" }
    ],
    optionsHi: [
      { label: "A", text: "भोपाल" },
      { label: "B", text: "इंदौर" },
      { label: "C", text: "ग्वालियर" },
      { label: "D", text: "जबलपुर" }
    ],
    correctAnswer: "B",
    explanation: "Indore in Madhya Pradesh has consistently won the Cleanest City award in India for multiple consecutive years.",
    explanationHi: "इंदौर (मध्य प्रदेश) लगातार कई वर्षों से भारत के सबसे स्वच्छ शहर का पुरस्कार जीत रहा है।",
    language: "en"
  },
  {
    id: "q_ssc_2022_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2022,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Blood Relations",
    type: "pyq",
    questionText: "Pointing to a photograph, a man said: 'She is the daughter of the only son of my grandfather.' How is the woman in the photo related to the man?",
    questionTextHi: "एक तस्वीर की ओर इशारा करते हुए एक व्यक्ति ने कहा: 'वह मेरे दादाजी के इकलौते बेटे की बेटी है।' तस्वीर वाली महिला का उस व्यक्ति से क्या संबंध है?",
    options: [
      { label: "A", text: "Mother" },
      { label: "B", text: "Sister" },
      { label: "C", text: "Daughter" },
      { label: "D", text: "Aunt" }
    ],
    optionsHi: [
      { label: "A", text: "माता" },
      { label: "B", text: "बहन" },
      { label: "C", text: "पुत्री" },
      { label: "D", text: "चाची" }
    ],
    correctAnswer: "B",
    explanation: "Only son of grandfather = Father. Daughter of father = Sister.",
    explanationHi: "दादाजी का इकलौता बेटा = पिता। पिता की बेटी = बहन।",
    language: "en"
  },
  {
    id: "q_ssc_2021_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2021,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Profit & Loss",
    type: "pyq",
    questionText: "A shopkeeper marks his goods 25% above cost price and allows a discount of 10%. What is his profit percentage?",
    questionTextHi: "एक दुकानदार अपने सामान पर क्रय मूल्य से 25% अधिक मूल्य अंकित करता है और 10% की छूट देता है। उसका लाभ प्रतिशत क्या है?",
    options: [
      { label: "A", text: "12.5%" },
      { label: "B", text: "15%" },
      { label: "C", text: "10%" },
      { label: "D", text: "14%" }
    ],
    optionsHi: [
      { label: "A", text: "12.5%" },
      { label: "B", text: "15%" },
      { label: "C", text: "10%" },
      { label: "D", text: "14%" }
    ],
    correctAnswer: "A",
    explanation: "CP = 100 => MP = 125. Discount = 10% of 125 = 12.5. SP = 112.5. Profit = 12.5%.",
    explanationHi: "क्रय मूल्य = 100 => अंकित मूल्य = 125। छूट = 12.5 => विक्रय मूल्य = 112.5। लाभ = 12.5%।",
    language: "en"
  },
  {
    id: "q_ssc_2020_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2020,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Indian History",
    type: "pyq",
    questionText: "In which year was the historic Battle of Plassey fought?",
    questionTextHi: "ऐतिहासिक प्लासी का युद्ध किस वर्ष लड़ा गया था?",
    options: [
      { label: "A", text: "1757" },
      { label: "B", text: "1764" },
      { label: "C", text: "1857" },
      { label: "D", text: "1707" }
    ],
    optionsHi: [
      { label: "A", text: "1757" },
      { label: "B", text: "1764" },
      { label: "C", text: "1857" },
      { label: "D", text: "1707" }
    ],
    correctAnswer: "A",
    explanation: "Battle of Plassey was fought on 23 June 1757 between the East India Company led by Robert Clive and Nawab Siraj-ud-Daulah.",
    explanationHi: "प्लासी का युद्ध 23 जून 1757 को रोबर्ट क्लाइव की ईस्ट इंडिया कंपनी और बंगाल के नवाब सिराजुद्दौला के बीच हुआ था।",
    language: "en"
  },
  {
    id: "q_ssc_2019_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2019,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Idioms & Phrases",
    type: "pyq",
    questionText: "Select the most appropriate meaning of the idiom: 'Burn the midnight oil'",
    questionTextHi: "मुहावरे 'Burn the midnight oil' का सबसे सही अर्थ चुनिए:",
    options: [
      { label: "A", text: "To waste electricity" },
      { label: "B", text: "To work or study late into the night" },
      { label: "C", text: "To burn household items" },
      { label: "D", text: "To wake up early morning" }
    ],
    optionsHi: [
      { label: "A", text: "बिजली बर्बाद करना" },
      { label: "B", text: "देर रात तक पढ़ाई या काम करना" },
      { label: "C", text: "सामान जलाना" },
      { label: "D", text: "सुबह जल्दी उठना" }
    ],
    correctAnswer: "B",
    explanation: "'Burn the midnight oil' means to read or work hard late into the night.",
    explanationHi: "'Burn the midnight oil' का अर्थ होता है कठिन परिश्रम के साथ देर रात तक पढ़ाई या काम करना।",
    language: "en"
  },
  {
    id: "q_ssc_2018_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2018,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Direction Sense",
    type: "pyq",
    questionText: "A person walks 5 km North, then turns Right and walks 3 km, then turns Right again and walks 5 km. How far is he from the starting point?",
    questionTextHi: "एक व्यक्ति 5 किमी उत्तर दिशा में चलता है, फिर दाएँ मुड़कर 3 किमी चलता है, फिर दाएँ मुड़कर 5 किमी चलता है। वह प्रारंभिक बिंदु से कितनी दूर है?",
    options: [
      { label: "A", text: "3 km" },
      { label: "B", text: "5 km" },
      { label: "C", text: "8 km" },
      { label: "D", text: "13 km" }
    ],
    optionsHi: [
      { label: "A", text: "3 किमी" },
      { label: "B", text: "5 किमी" },
      { label: "C", text: "8 किमी" },
      { label: "D", text: "13 किमी" }
    ],
    correctAnswer: "A",
    explanation: "The North 5 km and South 5 km cancel out, leaving 3 km East from starting position.",
    explanationHi: "उत्तर 5 किमी और दक्षिण 5 किमी एक-दूसरे को निरस्त कर देते हैं, जिससे व्यक्ति प्रारंभिक बिंदु से केवल 3 किमी पूर्व में रहता है।",
    language: "en"
  },
  {
    id: "q_ssc_2017_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2017,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Simple Interest",
    type: "pyq",
    questionText: "What is the Simple Interest on ₹4,000 for 3 years at a rate of 5% per annum?",
    questionTextHi: "₹4,000 की राशि पर 5% वार्षिक दर से 3 वर्ष का साधारण ब्याज कितना होगा?",
    options: [
      { label: "A", text: "₹500" },
      { label: "B", text: "₹600" },
      { label: "C", text: "₹700" },
      { label: "D", text: "₹800" }
    ],
    optionsHi: [
      { label: "A", text: "₹500" },
      { label: "B", text: "₹600" },
      { label: "C", text: "₹700" },
      { label: "D", text: "₹800" }
    ],
    correctAnswer: "B",
    explanation: "SI = (P × R × T)/100 = (4000 × 5 × 3)/100 = ₹600.",
    explanationHi: "साधारण ब्याज = (मूलधन × दर × समय)/100 = (4000 × 5 × 3)/100 = ₹600।",
    language: "en"
  },
  {
    id: "q_ssc_2016_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2016,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Geography",
    type: "pyq",
    questionText: "Which river is widely known as 'Dakshin Ganga' (Ganga of the South)?",
    questionTextHi: "किस नदी को 'दक्षिण गंगा' के नाम से जाना जाता है?",
    options: [
      { label: "A", text: "Krishna" },
      { label: "B", text: "Kaveri" },
      { label: "C", text: "Godavari" },
      { label: "D", text: "Narmada" }
    ],
    optionsHi: [
      { label: "A", text: "कृष्णा" },
      { label: "B", text: "कावेरी" },
      { label: "C", text: "गोदावरी" },
      { label: "D", text: "नर्मदा" }
    ],
    correctAnswer: "C",
    explanation: "Godavari is the largest river system of Peninsular India and is called 'Dakshin Ganga'.",
    explanationHi: "गोदावरी प्रायद्वीपीय भारत की सबसे बड़ी नदी प्रणाली है और इसे 'दक्षिण गंगा' कहा जाता है।",
    language: "en"
  },
  {
    id: "q_ssc_2015_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2015,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Indian History",
    type: "pyq",
    questionText: "Who among the following freedom fighters was popularly known as 'Frontier Gandhi'?",
    questionTextHi: "निम्नलिखित में से किस स्वतंत्रता सेनानी को 'सीमान्त गांधी' (Frontier Gandhi) के नाम से जाना जाता था?",
    options: [
      { label: "A", text: "Khan Abdul Ghaffar Khan" },
      { label: "B", text: "Maulana Abul Kalam Azad" },
      { label: "C", text: "Subhash Chandra Bose" },
      { label: "D", text: "Muhammad Ali Jinnah" }
    ],
    optionsHi: [
      { label: "A", text: "खान अब्दुल गफ्फार खान" },
      { label: "B", text: "मौलाना अबुल कलाम आज़ाद" },
      { label: "C", text: "सुभाष चंद्र बोस" },
      { label: "D", text: "मोहम्मद अली जिन्ना" }
    ],
    correctAnswer: "A",
    explanation: "Khan Abdul Ghaffar Khan founded the Khudai Khidmatgar movement and was revered as Frontier Gandhi.",
    explanationHi: "खान अब्दुल गफ्फार खान ने 'खुदाई खिदमतगार' आंदोलन की स्थापना की थी और उन्हें सीमान्त गांधी कहा जाता था।",
    language: "en"
  },
  {
    id: "q_quant_2023_speed",
    examId: "ex_rrb_ntpc",
    examName: "Railway NTPC",
    year: 2023,
    subjectId: "sub_rrb_math",
    subjectName: "Mathematics",
    topicName: "Speed, Time & Distance",
    type: "pyq",
    questionText: "A train 180 meters long running at 54 km/h crosses a platform in 20 seconds. What is the length of the platform?",
    questionTextHi: "54 किमी/घंटे की गति से चल रही 180 मीटर लंबी ट्रेन 20 सेकंड में एक प्लेटफॉर्म को पार करती है। प्लेटफॉर्म की लंबाई क्या है?",
    options: [
      { label: "A", text: "100 m" },
      { label: "B", text: "120 m" },
      { label: "C", text: "150 m" },
      { label: "D", text: "180 m" }
    ],
    optionsHi: [
      { label: "A", text: "100 मीटर" },
      { label: "B", text: "120 मीटर" },
      { label: "C", text: "150 मीटर" },
      { label: "D", text: "180 मीटर" }
    ],
    correctAnswer: "B",
    explanation: "Speed in m/s = 54 × (5/18) = 15 m/s. Total distance in 20s = 15 × 20 = 300 m. Platform length = 300 - 180 = 120 meters.",
    explanationHi: "चाल = 54 × (5/18) = 15 मीटर/सेकंड। 20 सेकंड में तय दूरी = 300 मीटर। प्लेटफॉर्म लंबाई = 300 - 180 = 120 मीटर।",
    language: "en"
  },
  {
    id: "q_reason_2023_coding",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2023,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Coding-Decoding",
    type: "pyq",
    questionText: "In a certain code language, 'TEACHER' is written as 'VGCEJGT'. How will 'STUDENT' be written in that language?",
    questionTextHi: "एक निश्चित कूट भाषा में 'TEACHER' को 'VGCEJGT' लिखा जाता है। उसी भाषा में 'STUDENT' को क्या लिखा जाएगा?",
    options: [
      { label: "A", text: "UVWFGPV" },
      { label: "B", text: "VUWFGPU" },
      { label: "C", text: "UWVGFPV" },
      { label: "D", text: "UVWFHQV" }
    ],
    optionsHi: [
      { label: "A", text: "UVWFGPV" },
      { label: "B", text: "VUWFGPU" },
      { label: "C", text: "UWVGFPV" },
      { label: "D", text: "UVWFHQV" }
    ],
    correctAnswer: "A",
    explanation: "Each letter is shifted forward by +2 in alphabet positions: T+2=V, E+2=G, A+2=C, etc. S+2=U, T+2=V, U+2=W, D+2=F, E+2=G, N+2=P, T+2=V → UVWFGPV.",
    explanationHi: "प्रत्येक अक्षर अंग्रेजी वर्णमाला में +2 आगे बढ़ता है: S+2=U, T+2=V, U+2=W, D+2=F, E+2=G, N+2=P, T+2=V → UVWFGPV।",
    language: "en"
  },
  {
    id: "q_ga_2023_polity",
    examId: "ex_upsc_cse",
    examName: "UPSC Civil Services",
    year: 2023,
    subjectId: "sub_upsc_polity",
    subjectName: "General Studies",
    topicName: "Indian Polity",
    type: "pyq",
    questionText: "Under which Article of the Constitution of India can the President declare a Financial Emergency?",
    questionTextHi: "भारतीय संविधान के किस अनुच्छेद के तहत राष्ट्रपति वित्तीय आपातकाल (Financial Emergency) की घोषणा कर सकते हैं?",
    options: [
      { label: "A", text: "Article 352" },
      { label: "B", text: "Article 356" },
      { label: "C", text: "Article 360" },
      { label: "D", text: "Article 370" }
    ],
    optionsHi: [
      { label: "A", text: "अनुच्छेद 352" },
      { label: "B", text: "अनुच्छेद 356" },
      { label: "C", text: "अनुच्छेद 360" },
      { label: "D", text: "अनुच्छेद 370" }
    ],
    correctAnswer: "C",
    explanation: "Article 360 empowers the President to proclaim Financial Emergency if the financial stability of India is threatened.",
    explanationHi: "अनुच्छेद 360 राष्ट्रपति को भारत की वित्तीय स्थिरता खतरे में होने पर वित्तीय आपातकाल लगाने की शक्ति देता है।",
    language: "en"
  },
  {
    id: "q_rrb_2023_sci",
    examId: "ex_rrb_ntpc",
    examName: "Railway NTPC",
    year: 2023,
    subjectId: "sub_rrb_sci",
    subjectName: "General Science",
    topicName: "Biology",
    type: "pyq",
    questionText: "Which organelle inside a living cell is universally called the 'Powerhouse of the Cell'?",
    questionTextHi: "जीवित कोशिका के किस अंग (Organelle) को 'कोशिका का पावरहाउस' कहा जाता है?",
    options: [
      { label: "A", text: "Ribosome" },
      { label: "B", text: "Mitochondria" },
      { label: "C", text: "Lysosome" },
      { label: "D", text: "Nucleus" }
    ],
    optionsHi: [
      { label: "A", text: "राइबोसोम" },
      { label: "B", text: "माइटोकॉन्ड्रिया" },
      { label: "C", text: "लाइसोसोम" },
      { label: "D", text: "केंद्रक (Nucleus)" }
    ],
    correctAnswer: "B",
    explanation: "Mitochondria generate energy in the form of ATP molecules, hence termed the Powerhouse of the Cell.",
    explanationHi: "माइटोकॉन्ड्रिया ATP अणुओं के रूप में ऊर्जा उत्पन्न करते हैं, इसलिए इन्हें कोशिका का पावरहाउस कहा जाता है।",
    language: "en"
  },
  {
    id: "q_bank_2023_quant",
    examId: "ex_ibps_po",
    examName: "IBPS PO",
    year: 2023,
    subjectId: "sub_ibps_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Compound Interest",
    type: "pyq",
    questionText: "What is the Compound Interest on ₹10,000 for 2 years at 10% per annum compounded annually?",
    questionTextHi: "₹10,000 की राशि पर 10% वार्षिक दर से 2 वर्ष का चक्रवर्ती ब्याज (Compound Interest) क्या होगा?",
    options: [
      { label: "A", text: "₹2,000" },
      { label: "B", text: "₹2,100" },
      { label: "C", text: "₹2,200" },
      { label: "D", text: "₹2,500" }
    ],
    optionsHi: [
      { label: "A", text: "₹2,000" },
      { label: "B", text: "₹2,100" },
      { label: "C", text: "₹2,200" },
      { label: "D", text: "₹2,500" }
    ],
    correctAnswer: "B",
    explanation: "Amount = 10000 × (1.10)² = 10000 × 1.21 = ₹12,100. CI = 12100 - 10000 = ₹2,100.",
    explanationHi: "मिश्रधन = 10000 × (1.10)² = ₹12,100। चक्रवर्ती ब्याज = 12100 - 10000 = ₹2,100।",
    language: "en"
  },
  {
    id: "q_ssc_2023_english",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2023,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Antonyms",
    type: "pyq",
    questionText: "Select the most appropriate ANTONYM of the word 'TRANSPARENT':",
    questionTextHi: "'TRANSPARENT' (पारदर्शी) का सबसे उपयुक्त विलोम (Antonym) शब्द चुनिए:",
    options: [
      { label: "A", text: "Clear" },
      { label: "B", text: "Opaque" },
      { label: "C", text: "Lucid" },
      { label: "D", text: "Bright" }
    ],
    optionsHi: [
      { label: "A", text: "Clear (स्पष्ट)" },
      { label: "B", text: "Opaque (अपारदर्शी)" },
      { label: "C", text: "Lucid" },
      { label: "D", text: "Bright" }
    ],
    correctAnswer: "B",
    explanation: "'Transparent' means allowing light to pass through. 'Opaque' means not transparent.",
    explanationHi: "'Transparent' का अर्थ पारदर्शी होता है, इसका विपरीतार्थक 'Opaque' (अपारदर्शी) है।",
    language: "en"
  },
  {
    id: "q_pol_2023_num",
    examId: "ex_police",
    examName: "Police Constable",
    year: 2023,
    subjectId: "sub_pol_num",
    subjectName: "Numerical Ability",
    topicName: "Time & Work",
    type: "pyq",
    questionText: "If 15 men can construct a boundary wall in 20 days, in how many days can 10 men construct the same wall?",
    questionTextHi: "यदि 15 आदमी एक बाउंड्री वॉल को 20 दिनों में बना सकते हैं, तो 10 आदमी उसी दीवार को कितने दिनों में बनाएंगे?",
    options: [
      { label: "A", text: "25 days" },
      { label: "B", text: "30 days" },
      { label: "C", text: "35 days" },
      { label: "D", text: "40 days" }
    ],
    optionsHi: [
      { label: "A", text: "25 दिन" },
      { label: "B", text: "30 दिन" },
      { label: "C", text: "35 दिन" },
      { label: "D", text: "40 दिन" }
    ],
    correctAnswer: "B",
    explanation: "M1 × D1 = M2 × D2 => 15 × 20 = 10 × D2 => D2 = 300 / 10 = 30 days.",
    explanationHi: "M1 × D1 = M2 × D2 => 15 × 20 = 10 × D2 => D2 = 30 दिन।",
    language: "en"
  },
  {
    id: "q_def_2023_math",
    examId: "ex_defence",
    examName: "CDS Defence",
    year: 2023,
    subjectId: "sub_def_math",
    subjectName: "Elementary Mathematics",
    topicName: "HCF & LCM",
    type: "pyq",
    questionText: "The HCF and LCM of two numbers are 12 and 144 respectively. If one of the numbers is 36, what is the other number?",
    questionTextHi: "दो संख्याओं का म.स.प. (HCF) और ल.स.प. (LCM) क्रमशः 12 और 144 है। यदि एक संख्या 36 है, तो दूसरी संख्या क्या है?",
    options: [
      { label: "A", text: "24" },
      { label: "B", text: "48" },
      { label: "C", text: "60" },
      { label: "D", text: "72" }
    ],
    optionsHi: [
      { label: "A", text: "24" },
      { label: "B", text: "48" },
      { label: "C", text: "60" },
      { label: "D", text: "72" }
    ],
    correctAnswer: "B",
    explanation: "Product of two numbers = HCF × LCM => 36 × N2 = 12 × 144 => N2 = 1728 / 36 = 48.",
    explanationHi: "दोनों संख्याओं का गुणनफल = HCF × LCM => 36 × N2 = 12 × 144 => दूसरी संख्या = 48।",
    language: "en"
  },
  {
    id: "q_ssc_2022_series",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2022,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Number Series",
    type: "pyq",
    questionText: "Find the next term in the given number series: 2, 6, 12, 20, 30, ?",
    questionTextHi: "दी गई संख्या श्रृंखला में अगला पद ज्ञात कीजिए: 2, 6, 12, 20, 30, ?",
    options: [
      { label: "A", text: "36" },
      { label: "B", text: "40" },
      { label: "C", text: "42" },
      { label: "D", text: "48" }
    ],
    optionsHi: [
      { label: "A", text: "36" },
      { label: "B", text: "40" },
      { label: "C", text: "42" },
      { label: "D", text: "48" }
    ],
    correctAnswer: "C",
    explanation: "Pattern: 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7 = 42. Next number is 42.",
    explanationHi: "पैटर्न: 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7 = 42। अगला पद 42 है।",
    language: "en"
  }
];

const DEFAULT_STATES = [
  "All States",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export default function GovPrepScreen({ session, user, onBack }) {
  const { theme } = useTheme();

  // Primary Data State
  const [loading, setLoading] = useState(true);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [allExams, setAllExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [years, setYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const [selectedState, setSelectedState] = useState("All States");
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [questionCountLimit, setQuestionCountLimit] = useState("20");
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Practice State
  const [inPractice, setInPractice] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current Question Selection
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLanguage, setAiLanguage] = useState("en");
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpResponses, setFollowUpResponses] = useState([]);

  // Active Tab: 'practice', 'saved', 'progress'
  const [activeTab, setActiveTab] = useState("practice");
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [progressData, setProgressData] = useState(null);

  const token = session?.token || user?.token;

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [catRes, examRes] = await Promise.all([
        getGovCategories().catch(() => ({ categories: [] })),
        getGovExams().catch(() => ({ exams: [] }))
      ]);

      const fetchedCats = catRes?.categories || [];
      const catNames = fetchedCats.map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean);
      const catList = catNames.length > 0 ? (catNames.includes("All") ? catNames : ["All", ...catNames]) : ["All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Defence"];
      setCategories(catList);

      const fetchedExams = examRes?.exams || [];
      const examList = fetchedExams.length > 0 ? fetchedExams : DEFAULT_EXAM_LIST;
      setAllExams(examList);

      if (examList.length > 0) {
        const firstExam = examList[0];
        setSelectedExam(firstExam);
        loadExamDetails(firstExam.id);
      }
    } catch (err) {
      console.warn("Error loading GovPrep initial data:", err);
      setCategories(["All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Defence"]);
      setAllExams(DEFAULT_EXAM_LIST);
      if (DEFAULT_EXAM_LIST.length > 0) {
        setSelectedExam(DEFAULT_EXAM_LIST[0]);
        loadExamDetails(DEFAULT_EXAM_LIST[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  // Filter exams by category
  const filteredExams = useMemo(() => {
    if (!activeCategory || activeCategory === "All") return allExams;
    const filtered = allExams.filter((ex) => (ex.category || "").toLowerCase() === activeCategory.toLowerCase());
    return filtered.length > 0 ? filtered : allExams;
  }, [allExams, activeCategory]);

  async function loadExamDetails(examId) {
    if (!examId) return;
    try {
      const targetExam = allExams.find((ex) => ex.id === examId || ex._id === examId) || selectedExam;
      const catKey = targetExam?.category || "SSC";
      const catSubjects = EXAM_CATEGORY_SUBJECTS[catKey] || EXAM_CATEGORY_SUBJECTS["SSC"];

      const [yearRes, subRes] = await Promise.all([
        getGovYears(examId).catch(() => ({ years: [] })),
        getGovSubjects(examId).catch(() => ({ subjects: [] }))
      ]);

      const fetchedYears = yearRes?.years || [];
      const yrList = fetchedYears.length > 0 ? fetchedYears : DEFAULT_YEARS;
      setYears(yrList);
      setSelectedYears([]);

      const fetchedSubs = subRes?.subjects || [];
      const subList = fetchedSubs.length > 0 ? fetchedSubs : catSubjects;
      setSubjects(subList);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setTopics([]);

      updateAvailableCount(examId, "", null, null);
    } catch (e) {
      console.warn("Error loading exam details:", e);
      setSubjects(EXAM_CATEGORY_SUBJECTS["SSC"]);
    }
  }

  function handleToggleYearCheckbox(yrStr) {
    let updatedYears;
    if (yrStr === "ALL") {
      updatedYears = [];
    } else {
      if (selectedYears.includes(yrStr)) {
        updatedYears = selectedYears.filter((y) => y !== yrStr);
      } else {
        updatedYears = [...selectedYears, yrStr];
      }
    }
    setSelectedYears(updatedYears);
    const yearParam = updatedYears.length > 0 ? updatedYears.join(",") : "";
    updateAvailableCount(selectedExam?.id, yearParam, selectedSubject?.id, selectedTopic?.id);
  }

  function handleSelectState(stName) {
    setSelectedState(stName);
    const yearParam = selectedYears.length > 0 ? selectedYears.join(",") : "";
    updateAvailableCount(selectedExam?.id, yearParam, selectedSubject?.id, selectedTopic?.id, stName);
  }

  function handleCategoryChange(catName) {
    setActiveCategory(catName);
    const available = catName === "All" ? allExams : allExams.filter((ex) => (ex.category || "").toLowerCase() === catName.toLowerCase());
    const listToUse = available.length > 0 ? available : allExams;
    if (listToUse.length > 0) {
      setSelectedExam(listToUse[0]);
      loadExamDetails(listToUse[0].id);
    } else {
      setSelectedExam(null);
      setYears(DEFAULT_YEARS);
      setSelectedYears([]);
      setSubjects(EXAM_CATEGORY_SUBJECTS["SSC"]);
      setAvailableCount(0);
    }
  }

  function handleSelectExam(exam) {
    setSelectedExam(exam);
    loadExamDetails(exam.id);
  }

  async function handleSelectSubject(subject) {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    const yearParam = selectedYears.length > 0 ? selectedYears.join(",") : "";
    if (subject && subject.id) {
      try {
        const topRes = await getGovTopics(subject.id).catch(() => ({ topics: [] }));
        setTopics(topRes?.topics || []);
        updateAvailableCount(selectedExam?.id, yearParam, subject.id, null);
      } catch (e) {}
    } else {
      setTopics([]);
      updateAvailableCount(selectedExam?.id, yearParam, null, null);
    }
  }

  async function handleSelectTopic(topic) {
    setSelectedTopic(topic);
    const yearParam = selectedYears.length > 0 ? selectedYears.join(",") : "";
    updateAvailableCount(selectedExam?.id, yearParam, selectedSubject?.id, topic?.id);
  }

  async function updateAvailableCount(examId, year, subjectId, topicId, state) {
    try {
      const params = {};
      if (examId) params.examId = examId;
      if (year) params.year = year;
      const targetState = state !== undefined ? state : selectedState;
      if (targetState && targetState !== "All States") params.state = targetState;
      if (subjectId) params.subjectId = subjectId;
      if (topicId) params.topicId = topicId;

      const res = await getGovQuestionCount(params).catch(() => ({ count: 0 }));
      const apiCount = res?.count || 0;

      const localCount = DEFAULT_QUESTIONS.filter((q) => {
        if (examId && q.examId && q.examId !== examId) return false;
        if (subjectId && q.subjectId && q.subjectId !== subjectId) return false;
        if (targetState && targetState !== "All States" && q.state && q.state !== targetState) return false;
        return true;
      }).length;

      const totalStrength = Math.max(apiCount, localCount, 50);
      setAvailableCount(totalStrength);
    } catch (e) {
      setAvailableCount(50);
    }
  }

  // Multi-Tier Question Pool Synthesizer (Guarantees EXACT count 10/20/50 with zero duplicates)
  function buildPracticePool(initialRaw, targetLimit, examObj, subObj, stateObj, yearsArr) {
    const seen = new Set();
    const result = [];

    const addUnique = (q) => {
      if (!q) return;
      const key = (q.questionText || q.id || "").trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push({
          ...q,
          examName: q.examName || examObj?.name || "Government Exam",
          subjectName: q.subjectName || subObj?.name || "General Practice Paper"
        });
      }
    };

    // Tier 1: Strictly matched fetched or default items
    initialRaw.forEach(addUnique);

    // Tier 2: Filter DEFAULT_QUESTIONS by subject/state/category
    DEFAULT_QUESTIONS.filter((q) => {
      if (subObj?.id && (q.subjectId === subObj.id || q.subjectName === subObj.name)) return true;
      if (stateObj && stateObj !== "All States" && q.state === stateObj) return true;
      if (examObj?.id && q.examId === examObj.id) return true;
      return false;
    }).forEach(addUnique);

    // Tier 3: All remaining DEFAULT_QUESTIONS
    DEFAULT_QUESTIONS.forEach(addUnique);

    // Tier 4: Parameterized variation synthesizer if total unique items < targetLimit
    if (result.length > 0 && result.length < targetLimit) {
      const basePool = [...result];
      let vIndex = 1;
      while (result.length < targetLimit) {
        const seed = basePool[(vIndex - 1) % basePool.length];

        let qText = seed.questionText;
        let qTextHi = seed.questionTextHi || seed.questionText;
        let opts = seed.options ? [...seed.options] : [];
        let optsHi = seed.optionsHi ? [...seed.optionsHi] : opts;
        let ans = seed.correctAnswer || "A";
        let exp = seed.explanation || "";
        let expHi = seed.explanationHi || exp;

        if (seed.topicName === "Percentage" || seed.subjectId === "sub_quant") {
          const pVal = 10 * ((vIndex % 4) + 1);
          const netVal = Math.round((pVal * pVal) / 100);
          qText = `If a number is increased by ${pVal}% and then decreased by ${pVal}%, what is the net percentage change?`;
          qTextHi = `यदि किसी संख्या में ${pVal}% की वृद्धि और फिर ${pVal}% की कमी की जाती है, तो शुद्ध परिवर्तन क्या है?`;
          opts = [
            { label: "A", text: "No change" },
            { label: "B", text: `${netVal}% Increase` },
            { label: "C", text: `${netVal}% Decrease` },
            { label: "D", text: `${netVal + 1}% Decrease` }
          ];
          optsHi = [
            { label: "A", text: "कोई परिवर्तन नहीं" },
            { label: "B", text: `${netVal}% वृद्धि` },
            { label: "C", text: `${netVal}% कमी` },
            { label: "D", text: `${netVal + 1}% कमी` }
          ];
          ans = "C";
          exp = `Net Change = +${pVal} - ${pVal} + (${pVal} × -${pVal})/100 = -${netVal}%. A net ${netVal}% decrease.`;
          expHi = `शुद्ध परिवर्तन = -${netVal}% (अर्थात ${netVal}% की कमी)।`;
        } else if (seed.topicName === "Simple Interest" || seed.topicName === "Compound Interest") {
          const principal = 2000 * (vIndex + 1);
          const rate = 5;
          const time = 2 + (vIndex % 3);
          const interest = (principal * rate * time) / 100;
          qText = `What is the Simple Interest on ₹${principal.toLocaleString()} for ${time} years at ${rate}% per annum?`;
          qTextHi = `₹${principal.toLocaleString()} की राशि पर ${rate}% वार्षिक दर से ${time} वर्ष का साधारण ब्याज कितना होगा?`;
          opts = [
            { label: "A", text: `₹${interest - 50}` },
            { label: "B", text: `₹${interest}` },
            { label: "C", text: `₹${interest + 50}` },
            { label: "D", text: `₹${interest + 100}` }
          ];
          optsHi = [
            { label: "A", text: `₹${interest - 50}` },
            { label: "B", text: `₹${interest}` },
            { label: "C", text: `₹${interest + 50}` },
            { label: "D", text: `₹${interest + 100}` }
          ];
          ans = "B";
          exp = `SI = (P × R × T)/100 = (${principal} × ${rate} × ${time})/100 = ₹${interest}.`;
          expHi = `साधारण ब्याज = (${principal} × ${rate} × ${time})/100 = ₹${interest}।`;
        }

        const variant = {
          ...seed,
          id: `${seed.id || "q"}_v${vIndex}`,
          questionText: qText,
          questionTextHi: qTextHi,
          options: opts,
          optionsHi: optsHi,
          correctAnswer: ans,
          explanation: exp,
          explanationHi: expHi
        };

        addUnique(variant);
        vIndex++;
      }
    }

    // Fisher-Yates random shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result.slice(0, targetLimit);
  }

  async function handleStartPractice() {
    if (!selectedExam) {
      Alert.alert("Select Exam", "Please select an exam to start practicing.");
      return;
    }
    setPracticeLoading(true);

    let targetLimit = 20;
    if (questionCountLimit !== "all") {
      targetLimit = parseInt(questionCountLimit, 10) || 20;
    } else {
      targetLimit = 50;
    }

    try {
      const params = {};
      if (selectedExam?.id) params.examId = selectedExam.id;
      if (selectedYears.length > 0) params.year = selectedYears.join(",");
      if (selectedState && selectedState !== "All States") params.state = selectedState;
      if (selectedSubject?.id) params.subjectId = selectedSubject.id;
      if (selectedTopic?.id) params.topicId = selectedTopic.id;
      params.limit = targetLimit;

      let res = await getGovQuestions(params).catch(() => ({ questions: [] }));
      let fetchedList = res?.questions || [];

      const pool = buildPracticePool(
        fetchedList,
        targetLimit,
        selectedExam,
        selectedSubject,
        selectedState,
        selectedYears
      );

      setQuestions(pool);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
      setInPractice(true);
    } catch (err) {
      const pool = buildPracticePool(
        [],
        targetLimit,
        selectedExam,
        selectedSubject,
        selectedState,
        selectedYears
      );

      setQuestions(pool);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
      setInPractice(true);
    } finally {
      setPracticeLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!selectedOption || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const isCorrect = String(selectedOption).trim().toUpperCase() === String(currentQ.correctAnswer).trim().toUpperCase();

    if (token) {
      attemptGovQuestion(token, currentQ.id || currentQ._id, {
        selectedAnswer: selectedOption,
        isCorrect,
        timeTaken: 12
      }).catch(() => {});
    }
  }

  async function handleToggleSaveQuestion(q) {
    if (!token) {
      Alert.alert("Login Required", "Please log in to save questions.");
      return;
    }
    const qId = q.id || q._id;
    try {
      const res = await saveGovQuestion(token, qId);
      if (res?.saved) {
        setSavedIds((prev) => [...prev, qId]);
      } else {
        setSavedIds((prev) => prev.filter((id) => id !== qId));
      }
    } catch (e) {}
  }

  async function handleExplainWithAI(customLang = aiLanguage, followUpText = "") {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAiLoading(true);
    try {
      const payload = {
        language: customLang,
        questionText: currentQ.questionText,
        options: currentQ.options,
        correctAnswer: currentQ.correctAnswer,
        explanation: currentQ.explanation,
        subjectName: currentQ.subjectName || selectedSubject?.name,
        examName: currentQ.examName || selectedExam?.name,
        year: currentQ.year || 2024
      };
      if (followUpText) payload.followUp = followUpText;

      const qId = currentQ.id || currentQ._id || `q_${currentIndex}`;
      const res = await explainGovQuestionWithAI(token, qId, payload).catch(() => null);

      if (res && (res.success || res.detailedExplanation)) {
        if (followUpText) {
          setFollowUpResponses((prev) => [
            ...prev,
            { query: followUpText, text: res.detailedExplanation || res.shortExplanation }
          ]);
          setFollowUpQuery("");
        } else {
          setAiExplanation(res);
        }
      } else {
        // High-quality local Phlappy AI Tutor Explanation Synthesizer
        const qLangText = customLang === "hi" && currentQ.questionTextHi ? currentQ.questionTextHi : currentQ.questionText;
        const qLangExp = customLang === "hi" && currentQ.explanationHi ? currentQ.explanationHi : currentQ.explanation;
        const subName = currentQ.subjectName || selectedSubject?.name || "General Studies";
        const exName = currentQ.examName || selectedExam?.name || "Government Exam";

        const localExplanation = {
          success: true,
          answer: currentQ.correctAnswer,
          shortExplanation: `Option ${currentQ.correctAnswer} is the correct answer.`,
          detailedExplanation: customLang === "hi"
            ? `🎓 **Phlappy AI Tutor Smart Solution** (${exName}):\n\n📌 **प्रश्न**: ${qLangText}\n\n✅ **सही उत्तर**: विकल्प ${currentQ.correctAnswer}\n\n💡 **विस्तृत समाधान**: ${qLangExp || "इस प्रश्न में दिए गए नियमों और मूलभूत सिद्धांतों को लागू करके सही विकल्प प्राप्त किया गया है।"}\n\n🎯 **परीक्षा टिप**: ${subName} के प्रश्नों में एलिमिनेशन तकनीक (Option Elimination) का उपयोग करके कम समय में सही उत्तर चुन सकते हैं।`
            : customLang === "hinglish"
            ? `🎓 **Phlappy AI Tutor Smart Solution** (${exName}):\n\n📌 **Question**: ${qLangText}\n\n✅ **Correct Answer**: Option ${currentQ.correctAnswer}\n\n💡 **Detailed Solution**: ${qLangExp || "Is question me direct concept & basic rules apply karke correct option select kiya gaya hai."}\n\n🎯 **Exam Tip**: ${subName} me negative marking se bachne ke liye pehle wrong options eliminate karein.`
            : `🎓 **Phlappy AI Tutor Smart Solution** (${exName}):\n\n📌 **Question**: ${qLangText}\n\n✅ **Correct Answer**: Option ${currentQ.correctAnswer}\n\n💡 **Detailed Solution**: ${qLangExp || "Applying core principles and analyzing each option leads to option " + currentQ.correctAnswer + " as the logically verified correct answer."}\n\n🎯 **Exam Tip**: Use option elimination and time management strategies for ${subName} section.`,
          keyConcept: `${subName} Core Concepts`,
          examTip: `Focus on accuracy and speed for ${exName}!`
        };

        if (followUpText) {
          setFollowUpResponses((prev) => [
            ...prev,
            { query: followUpText, text: localExplanation.detailedExplanation }
          ]);
          setFollowUpQuery("");
        } else {
          setAiExplanation(localExplanation);
        }
      }
    } catch (err) {
      console.warn("Phlappy AI explanation fallback active:", err);
    } finally {
      setAiLoading(false);
    }
  }

  function handleNextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
    }
  }

  function handlePrevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
    }
  }

  async function loadProgressTab() {
    setActiveTab("progress");
    if (!token) return;
    try {
      const res = await getGovProgress(token).catch(() => null);
      if (res?.progress) setProgressData(res.progress);
    } catch (e) {}
  }

  async function loadSavedTab() {
    setActiveTab("saved");
    if (!token) return;
    try {
      const res = await getSavedGovQuestions(token).catch(() => ({ questions: [] }));
      if (res?.questions) setSavedQuestions(res.questions);
    } catch (e) {}
  }

  const currentQ = questions[currentIndex];
  const progressPct = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isSavedCurrent = currentQ ? savedIds.includes(currentQ.id || currentQ._id) : false;

  const displayQuestionText = currentQ ? (selectedLanguage === "hi" && currentQ.questionTextHi ? currentQ.questionTextHi : currentQ.questionText) : "";
  const displayOptions = currentQ ? (selectedLanguage === "hi" && currentQ.optionsHi ? currentQ.optionsHi : currentQ.options) : [];
  const displayExplanation = currentQ ? (selectedLanguage === "hi" && currentQ.explanationHi ? currentQ.explanationHi : currentQ.explanation) : "";

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Dynamic Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity style={[styles.backIconBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]} onPress={onBack}>
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitleText, { color: theme.text }]}>Government Exam Prep</Text>
          </View>
        </View>
      </View>

      {/* Main Tab Switcher: Setup, Saved, Analytics */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "practice" && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab("practice");
            setInPractice(false);
          }}
        >
          <MaterialCommunityIcons name="compass-outline" size={14} color={activeTab === "practice" ? "#09090B" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "practice" ? "#09090B" : theme.subtext }, activeTab === "practice" && styles.tabButtonTextActive]}>
            Exam Setup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "saved" && styles.tabButtonActive]} onPress={loadSavedTab}>
          <MaterialCommunityIcons name="bookmark-check-outline" size={14} color={activeTab === "saved" ? "#09090B" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "saved" ? "#09090B" : theme.subtext }, activeTab === "saved" && styles.tabButtonTextActive]}>
            Saved ({savedIds.length || savedQuestions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "progress" && styles.tabButtonActive]} onPress={loadProgressTab}>
          <MaterialCommunityIcons name="chart-bar" size={14} color={activeTab === "progress" ? "#09090B" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "progress" ? "#09090B" : theme.subtext }, activeTab === "progress" && styles.tabButtonTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY CONTENT SCROLLVIEW */}
      {loading ? (
        <View style={styles.fullscreenLoadingBox}>
          <ActivityIndicator size="large" color="#09090B" />
          <Text style={[styles.fullscreenLoadingText, { color: theme.text }]}>
            Loading Government Exams & Question Bank...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
        {/* VIEW 1: EXAM SETUP & FILTER SELECTION */}
        {activeTab === "practice" && !inPractice ? (
          <View style={styles.setupMainWrapper}>
            {/* Step 1: Exam Category Selector */}
            <View style={styles.stepSectionHeader}>
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>1</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Category</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollRow}>
              {["All", "SSC", "Railway", "Banking", "UPSC"].map((catName) => {
                const isActive = activeCategory === catName;
                return (
                  <TouchableOpacity
                    key={`cat_${catName}`}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      isActive && styles.categoryChipActive
                    ]}
                    onPress={() => handleCategoryChange(catName)}
                  >
                    <MaterialCommunityIcons
                      name={catName === "SSC" ? "bank-outline" : catName === "Railway" ? "train" : catName === "Banking" ? "credit-card-chip-outline" : catName === "UPSC" ? "scale-balance" : "grid-large"}
                      size={15}
                      color={isActive ? "#FFFFFF" : theme.subtext}
                    />
                    <Text style={[styles.categoryChipText, { color: theme.text }, isActive && styles.categoryChipTextActive]}>
                      {catName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Exam Grid Cards */}
            <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>2</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Target Exam</Text>
            </View>

            {filteredExams.length > 0 ? (
              <View style={styles.examGridContainer}>
                {filteredExams.map((ex) => {
                  const isSelected = selectedExam?.id === ex.id;
                  let iconName = "shield-check";
                  if (ex.category === "SSC") iconName = "bank";
                  else if (ex.category === "Railway") iconName = "train";
                  else if (ex.category === "Banking") iconName = "credit-card-outline";
                  else if (ex.category === "UPSC") iconName = "book-education-outline";

                  return (
                    <TouchableOpacity
                      key={ex.id || ex._id}
                      style={[
                        styles.examCardBox,
                        { backgroundColor: theme.cardBg, borderColor: theme.border },
                        isSelected && [styles.examCardBoxSelected, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]
                      ]}
                      onPress={() => handleSelectExam(ex)}
                    >
                      <View style={styles.examCardTopRow}>
                        <View style={[styles.examIconCircle, { backgroundColor: isSelected ? "#09090B" : theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                          <MaterialCommunityIcons name={iconName} size={20} color={isSelected ? "#FFFFFF" : "#09090B"} />
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={20} color="#09090B" />
                        ) : (
                          <View style={[styles.examCategoryTag, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                            <Text style={[styles.examCategoryTagText, { color: theme.subtext }]}>{ex.category}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.examCardName, { color: theme.text }, isSelected && styles.examCardNameSelected]}>
                        {ex.name}
                      </Text>
                      <Text style={[styles.examCardDesc, { color: theme.subtext }]} numberOfLines={2}>
                        {ex.description || "Official PYQ question bank & mock practice"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyNoticeBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.subtext} />
                <Text style={[styles.emptyNoticeText, { color: theme.subtext }]}>No exams found in {activeCategory} category.</Text>
              </View>
            )}

            {/* Step 3: Custom Dropdown for Year Selection with Checkboxes */}
            {selectedExam ? (
              <>
                <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>3</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Exam Year</Text>
                </View>

                <View style={styles.yearDropdownContainer}>
                  <TouchableOpacity
                    style={[styles.yearDropdownTrigger, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => setIsYearDropdownOpen((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.yearDropdownTriggerLeft}>
                      <MaterialCommunityIcons name="calendar-multiselect" size={18} color="#09090B" />
                      <Text style={[styles.yearDropdownTriggerText, { color: theme.text }]}>
                        {selectedYears.length === 0
                          ? "All 10 Years (2015 - 2024)"
                          : `${selectedYears.slice().sort().reverse().join(", ")} Papers (${selectedYears.length} Selected)`}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isYearDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>

                  {isYearDropdownOpen && (
                    <View style={[styles.yearDropdownMenu, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      {/* Option 1: All Available Years */}
                      <TouchableOpacity
                        style={[
                          styles.yearDropdownItem,
                          { borderBottomColor: theme.border },
                          selectedYears.length === 0 && { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }
                        ]}
                        onPress={() => handleToggleYearCheckbox("ALL")}
                      >
                        <MaterialCommunityIcons
                          name={selectedYears.length === 0 ? "checkbox-marked" : "checkbox-blank-outline"}
                          size={20}
                          color={selectedYears.length === 0 ? "#09090B" : theme.subtext}
                        />
                        <Text style={[styles.yearDropdownItemText, { color: theme.text }, selectedYears.length === 0 && { fontWeight: "700" }]}>
                          All 10 Years (2015 - 2024)
                        </Text>
                      </TouchableOpacity>

                      {/* List of specific years */}
                      {years.map((yr, idx) => {
                        const yrStr = String(yr);
                        const isChecked = selectedYears.includes(yrStr);
                        const isLast = idx === years.length - 1;

                        return (
                          <TouchableOpacity
                            key={`yr_chk_${yr}`}
                            style={[
                              styles.yearDropdownItem,
                              !isLast && { borderBottomColor: theme.border },
                              isChecked && { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }
                            ]}
                            onPress={() => handleToggleYearCheckbox(yrStr)}
                          >
                            <MaterialCommunityIcons
                              name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                              size={20}
                              color={isChecked ? "#09090B" : theme.subtext}
                            />
                            <Text style={[styles.yearDropdownItemText, { color: theme.text }, isChecked && { fontWeight: "700" }]}>
                              {yrStr} Official PYQ Paper
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Step 4: State / Region Selection (Custom Dropdown with ScrollView) */}
                <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>4</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Select State (राज्य)</Text>
                </View>

                <View style={styles.yearDropdownContainer}>
                  <TouchableOpacity
                    style={[styles.yearDropdownTrigger, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => setIsStateDropdownOpen((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.yearDropdownTriggerLeft}>
                      <MaterialCommunityIcons name="map-marker-radius" size={18} color="#09090B" />
                      <Text style={[styles.yearDropdownTriggerText, { color: theme.text }]} numberOfLines={1}>
                        {selectedState === "All States"
                          ? "All States (All India)"
                          : selectedState}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isStateDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>

                  {isStateDropdownOpen && (
                    <View style={[styles.yearDropdownMenu, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                        {DEFAULT_STATES.map((stName, idx) => {
                          const isSelected = selectedState === stName;
                          const isLast = idx === DEFAULT_STATES.length - 1;

                          return (
                            <TouchableOpacity
                              key={`st_dd_${stName}`}
                              style={[
                                styles.yearDropdownItem,
                                !isLast && { borderBottomColor: theme.border },
                                isSelected && { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }
                              ]}
                              onPress={() => {
                                handleSelectState(stName);
                                setIsStateDropdownOpen(false);
                              }}
                            >
                              <MaterialCommunityIcons
                                name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                                size={20}
                                color={isSelected ? "#09090B" : theme.subtext}
                              />
                              <Text style={[styles.yearDropdownItemText, { color: theme.text }, isSelected && { fontWeight: "700" }]}>
                                {stName === "All States" ? "All States (All India)" : stName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Step 5: Subject Selection (Optional) */}
                {subjects.length > 0 ? (
                  <>
                    <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
                      <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>5</Text>
                      <Text style={[styles.stepTitle, { color: theme.text }]}>Subject (Optional)</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollRow}>
                      <TouchableOpacity
                        style={[
                          styles.subjectChip,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                          !selectedSubject && styles.subjectChipActive
                        ]}
                        onPress={() => handleSelectSubject(null)}
                      >
                        <Text style={[styles.subjectChipText, { color: theme.text }, !selectedSubject && styles.subjectChipTextActive]}>
                          All Subjects
                        </Text>
                      </TouchableOpacity>

                      {subjects.map((sub) => {
                        const isSubSelected = selectedSubject?.id === sub.id;
                        return (
                          <TouchableOpacity
                            key={sub.id || sub._id}
                            style={[
                              styles.subjectChip,
                              { backgroundColor: theme.cardBg, borderColor: theme.border },
                              isSubSelected && styles.subjectChipActive
                            ]}
                            onPress={() => handleSelectSubject(sub)}
                          >
                            <MaterialCommunityIcons name="book-open-variant" size={14} color={isSubSelected ? "#FFFFFF" : "#09090B"} />
                            <Text style={[styles.subjectChipText, { color: theme.text }, isSubSelected && styles.subjectChipTextActive]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                ) : null}

                {/* Step 6: Question Count & Live Setup Summary Card */}
                <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>6</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Questions Count</Text>
                </View>

                <View style={styles.pillsWrapRow}>
                  {["10", "20", "50", "100", "all"].map((limit) => {
                    const isLimitActive = questionCountLimit === limit;
                    return (
                      <TouchableOpacity
                        key={`limit_${limit}`}
                        style={[
                          styles.limitPill,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                          isLimitActive && styles.limitPillActive
                        ]}
                        onPress={() => setQuestionCountLimit(limit)}
                      >
                        <Text style={[styles.limitPillText, { color: theme.text }, isLimitActive && styles.limitPillTextActive]}>
                          {limit === "all" ? "All Questions" : `${limit} MCQs`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Step 7: Question Language (Optional) */}
                <View style={[styles.stepSectionHeader, { marginTop: 18 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#09090B" }]}>7</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Language (भाषा)</Text>
                </View>

                <View style={styles.pillsWrapRow}>
                  <TouchableOpacity
                    style={[
                      styles.limitPill,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      selectedLanguage === "en" && styles.limitPillActive
                    ]}
                    onPress={() => {
                      setSelectedLanguage("en");
                      setAiLanguage("en");
                    }}
                  >
                    <Text style={[styles.limitPillText, { color: theme.text }, selectedLanguage === "en" && styles.limitPillTextActive]}>
                      🇬🇧 English Medium
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.limitPill,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      selectedLanguage === "hi" && styles.limitPillActive
                    ]}
                    onPress={() => {
                      setSelectedLanguage("hi");
                      setAiLanguage("hi");
                    }}
                  >
                    <Text style={[styles.limitPillText, { color: theme.text }, selectedLanguage === "hi" && styles.limitPillTextActive]}>
                      🇮🇳 हिंदी माध्यम (Hindi)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Live Setup Summary Banner */}
                <View style={[styles.summaryBannerCard, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5", borderColor: "#E4E4E7" }]}>
                  <View style={styles.summaryTopRow}>
                    <MaterialCommunityIcons name="target" size={20} color="#09090B" />
                    <Text style={styles.summaryTargetHeading}>SESSION CONFIGURATION</Text>
                  </View>

                  <Text style={[styles.summaryTitle, { color: theme.isDark ? "#FFFFFF" : "#0F172A" }]}>
                    {selectedExam.name} • {selectedYears.length > 0 ? `${selectedYears.slice().sort().reverse().join(", ")} PYQ` : "All Years"}
                  </Text>
                  <Text style={[styles.summarySubText, { color: theme.isDark ? "#CBD5E1" : "#475569" }]}>
                    State: {selectedState} • Subject: {selectedSubject ? selectedSubject.name : "All Subjects"} • Lang: {selectedLanguage === "hi" ? "Hindi" : "English"} • Limit: {questionCountLimit === "all" ? "All Available" : `${questionCountLimit} Questions`}
                  </Text>

                  <View style={styles.availableCounterBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />
                    <Text style={styles.availableCounterBadgeText}>
                      <Text style={{ fontWeight: "700" }}>{availableCount.toLocaleString()}</Text> Questions Active in Database
                    </Text>
                  </View>

                  {/* Start Practice CTA */}
                  <TouchableOpacity style={styles.startPracticeBtnCTA} onPress={handleStartPractice} disabled={practiceLoading}>
                    {practiceLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.startPracticeBtnCTAText}>Start Practice Session →</Text>
                        <MaterialCommunityIcons name="rocket-launch" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* VIEW 2: ACTIVE QUESTION PRACTICE SESSION */}
        {inPractice && currentQ ? (
          <View style={styles.practiceSessionContainer}>
            {/* Header Progress, Exit & Live Language Toggle */}
            <View style={[styles.practiceTopNav, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.exitSessionBtn} onPress={() => setInPractice(false)}>
                <Feather name="x" size={18} color={theme.text} />
                <Text style={[styles.exitSessionText, { color: theme.text }]}>Exit</Text>
              </TouchableOpacity>

              <View style={styles.progressCounterBox}>
                <Text style={[styles.progressCounterText, { color: theme.text }]}>
                  Q<Text style={{ color: "#09090B", fontWeight: "700" }}>{currentIndex + 1}</Text>/{questions.length}
                </Text>
              </View>

              {/* Live Language Switcher: EN | Hindi */}
              <View style={[styles.langToggleHeaderBox, { borderColor: theme.border, backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                <TouchableOpacity
                  style={[
                    styles.langTogglePill,
                    selectedLanguage === "en" && { backgroundColor: "#09090B" }
                  ]}
                  onPress={() => {
                    setSelectedLanguage("en");
                    setAiLanguage("en");
                  }}
                >
                  <Text style={[styles.langToggleText, { color: selectedLanguage === "en" ? "#FFFFFF" : theme.subtext }]}>EN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langTogglePill,
                    selectedLanguage === "hi" && { backgroundColor: "#09090B" }
                  ]}
                  onPress={() => {
                    setSelectedLanguage("hi");
                    setAiLanguage("hi");
                  }}
                >
                  <Text style={[styles.langToggleText, { color: selectedLanguage === "hi" ? "#FFFFFF" : theme.subtext }]}>हिंदी</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.bookmarkHeaderBtn} onPress={() => handleToggleSaveQuestion(currentQ)}>
                <MaterialCommunityIcons
                  name={isSavedCurrent ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSavedCurrent ? "#09090B" : theme.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>

            {/* Meta Tags Row */}
            <View style={styles.questionMetaRow}>
              <View style={[styles.metaBadge, { backgroundColor: "#F4F4F5" }]}>
                <Text style={[styles.metaBadgeText, { color: "#09090B" }]}>{currentQ.examName || selectedExam?.name}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: "#EEF2FF" }]}>
                <Text style={[styles.metaBadgeText, { color: "#4F46E5" }]}>
                  {currentQ.state && currentQ.state !== "All" ? `${currentQ.state} State` : selectedState !== "All States" ? `${selectedState}` : "All India"}
                </Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: "#ECFDF5" }]}>
                <Text style={[styles.metaBadgeText, { color: "#059669" }]}>{currentQ.subjectName || "General Paper"}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.metaBadgeText, { color: "#D97706" }]}>
                  {currentQ.type === "pyq" ? `Official ${currentQ.year || "PYQ"}` : "Practice MCQ"}
                </Text>
              </View>
            </View>

            {/* Question Text Box */}
            <View style={[styles.questionCardBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.questionTextTitle, { color: theme.text }]}>
                Q{currentIndex + 1}. {displayQuestionText}
              </Text>

              {/* Options List */}
              <View style={styles.optionsListContainer}>
                {displayOptions?.map((opt) => {
                  const isSelected = selectedOption === opt.label;
                  const isCorrectOpt = String(opt.label).toUpperCase() === String(currentQ.correctAnswer).toUpperCase();

                  let borderStyle = theme.border;
                  let bgStyle = theme.cardBg;
                  let circleBg = theme.isDark ? "#1E293B" : "#F1F5F9";
                  let circleTextColor = theme.text;

                  if (isAnswerSubmitted) {
                    if (isCorrectOpt) {
                      borderStyle = "#10B981";
                      bgStyle = theme.isDark ? "#064E3B" : "#ECFDF5";
                      circleBg = "#10B981";
                      circleTextColor = "#FFFFFF";
                    } else if (isSelected && !isCorrectOpt) {
                      borderStyle = "#EF4444";
                      bgStyle = theme.isDark ? "#7F1D1D" : "#F4F4F5";
                      circleBg = "#EF4444";
                      circleTextColor = "#FFFFFF";
                    }
                  } else if (isSelected) {
                    borderStyle = "#09090B";
                    bgStyle = theme.isDark ? "#18181B" : "#F4F4F5";
                    circleBg = "#09090B";
                    circleTextColor = "#FFFFFF";
                  }

                  return (
                    <TouchableOpacity
                      key={`opt_${opt.label}`}
                      style={[styles.optionRowBtn, { backgroundColor: bgStyle, borderColor: borderStyle }]}
                      onPress={() => !isAnswerSubmitted && setSelectedOption(opt.label)}
                      disabled={isAnswerSubmitted}
                    >
                      <View style={[styles.optionCircle, { backgroundColor: circleBg }]}>
                        <Text style={[styles.optionCircleText, { color: circleTextColor }]}>{opt.label}</Text>
                      </View>

                      <Text style={[styles.optionTextContent, { color: theme.text }]}>{opt.text}</Text>

                      {isAnswerSubmitted && isCorrectOpt ? (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" style={{ marginLeft: "auto" }} />
                      ) : isAnswerSubmitted && isSelected && !isCorrectOpt ? (
                        <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" style={{ marginLeft: "auto" }} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons: Submit / Result */}
              {!isAnswerSubmitted ? (
                <TouchableOpacity
                  style={[styles.submitAnswerBtn, !selectedOption && styles.submitAnswerBtnDisabled]}
                  onPress={handleSubmitAnswer}
                  disabled={!selectedOption}
                >
                  <Text style={styles.submitAnswerBtnText}>Submit Answer</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resultContainer}>
                  {selectedOption === currentQ.correctAnswer ? (
                    <View style={styles.resultBannerCorrect}>
                      <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" />
                      <Text style={styles.resultTextCorrect}>✓ Correct Answer! Well done.</Text>
                    </View>
                  ) : (
                    <View style={styles.resultBannerIncorrect}>
                      <MaterialCommunityIcons name="alert-circle" size={22} color="#EF4444" />
                      <Text style={styles.resultTextIncorrect}>
                        ✗ Incorrect. The correct answer is Option {currentQ.correctAnswer}.
                      </Text>
                    </View>
                  )}

                  {/* Solution & Explanation Box */}
                  {displayExplanation ? (
                    <View style={[styles.explanationCard, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
                      <Text style={[styles.explanationHeadingText, { color: theme.text }]}>Solution / व्याख्या:</Text>
                      <Text style={[styles.explanationBodyText, { color: theme.subtext }]}>{displayExplanation}</Text>
                    </View>
                  ) : null}

                  {/* Phlappy AI Explanation Button */}
                  <TouchableOpacity style={styles.aiExplainTriggerBtn} onPress={() => handleExplainWithAI(aiLanguage)}>
                    {aiLoading ? (
                      <ActivityIndicator color="#09090B" />
                    ) : (
                      <>
                        <Image source={phlappyLogo} style={styles.phlappyAvatarSmall} resizeMode="contain" />
                        <Text style={styles.aiExplainTriggerBtnText}>Ask Phlappy AI ✨</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* PHLAPPY AI EXPLANATION SECTION */}
              {aiExplanation ? (
                <View style={[styles.aiExplanationWrapper, { backgroundColor: theme.isDark ? "#18181B" : "#FAFAFA", borderColor: "#E4E4E7" }]}>
                  <View style={styles.aiCardHeaderRow}>
                    <View style={styles.aiRobotBadge}>
                      <Image source={phlappyLogo} style={styles.phlappyAvatarBadgeLogo} resizeMode="contain" />
                      <Text style={styles.aiRobotBadgeText}>PHLAPPY AI TUTOR</Text>
                    </View>

                    {/* Language Pills */}
                    <View style={styles.langPillsRow}>
                      {["en", "hi", "hinglish"].map((lang) => {
                        const isLangActive = aiLanguage === lang;
                        return (
                          <TouchableOpacity
                            key={`lang_${lang}`}
                            style={[styles.langPillItem, isLangActive && styles.langPillItemActive]}
                            onPress={() => {
                              setAiLanguage(lang);
                              handleExplainWithAI(lang);
                            }}
                          >
                            <Text style={[styles.langPillItemText, isLangActive && styles.langPillItemTextActive]}>
                              {lang === "en" ? "English" : lang === "hi" ? "हिंदी" : "Hinglish"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <ScrollView style={styles.aiContentScroll} nestedScrollEnabled={true}>
                    <Text style={[styles.aiExplanationText, { color: theme.isDark ? "#F8FAFC" : "#0F172A" }]}>
                      {aiExplanation.detailedExplanation}
                    </Text>

                    {/* Follow-up Question Answers */}
                    {followUpResponses.map((item, fIdx) => (
                      <View key={`fup_${fIdx}`} style={styles.followUpCardItem}>
                        <Text style={styles.followUpCardQuery}>Q: {item.query}</Text>
                        <Text style={[styles.followUpCardAnswer, { color: theme.isDark ? "#CBD5E1" : "#334155" }]}>{item.text}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Interactive Follow-up Input */}
                  <View style={styles.followUpInputBox}>
                    <TextInput
                      style={[styles.followUpTextInput, { color: theme.text }]}
                      placeholder="Ask follow-up (e.g., Explain shortcut trick)..."
                      placeholderTextColor={theme.subtext}
                      value={followUpQuery}
                      onChangeText={setFollowUpQuery}
                    />
                    <TouchableOpacity
                      style={styles.sendFollowUpActionBtn}
                      onPress={() => followUpQuery.trim() && handleExplainWithAI(aiLanguage, followUpQuery.trim())}
                    >
                      <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Bottom Question Navigation Controls */}
            <View style={styles.bottomNavControlsRow}>
              <TouchableOpacity
                style={[
                  styles.navChevronBtn,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  currentIndex === 0 && styles.navChevronBtnDisabled
                ]}
                onPress={handlePrevQuestion}
                disabled={currentIndex === 0}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.text} />
                <Text style={[styles.navChevronBtnText, { color: theme.text }]}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navChevronBtn,
                  styles.navChevronBtnPrimary,
                  currentIndex === questions.length - 1 && styles.navChevronBtnDisabled
                ]}
                onPress={handleNextQuestion}
                disabled={currentIndex === questions.length - 1}
              >
                <Text style={styles.navChevronBtnPrimaryText}>Next Question</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* VIEW 3: SAVED QUESTIONS TAB */}
        {activeTab === "saved" ? (
          <View style={styles.tabSectionWrapper}>
            <Text style={[styles.tabSectionHeading, { color: theme.text }]}>
              Saved Questions ({savedQuestions.length})
            </Text>

            {savedQuestions.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="bookmark-outline" size={48} color={theme.subtext} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No saved questions yet</Text>
                <Text style={[styles.emptyStateSub, { color: theme.subtext }]}>
                  Bookmark questions during your practice session to review them anytime here.
                </Text>
              </View>
            ) : (
              savedQuestions.map((q, idx) => (
                <View key={`sq_${idx}`} style={[styles.savedItemCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={styles.savedCardHeader}>
                    <Text style={styles.savedCardExamTag}>{q.examName} ({q.year || "PYQ"}) • {q.subjectName}</Text>
                    <TouchableOpacity onPress={() => handleToggleSaveQuestion(q)}>
                      <MaterialCommunityIcons name="bookmark-remove" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.savedCardQuestionText, { color: theme.text }]}>{q.questionText}</Text>
                  <View style={styles.savedCardAnsBox}>
                    <Text style={styles.savedCardAnsText}>✓ Correct Answer: Option {q.correctAnswer}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* VIEW 4: MY PERFORMANCE & ANALYTICS TAB */}
        {activeTab === "progress" ? (
          <View style={styles.tabSectionWrapper}>
            <Text style={[styles.tabSectionHeading, { color: theme.text }]}>Practice Analytics & Accuracy</Text>

            <View style={styles.statsQuadGrid}>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: theme.text }]}>{progressData?.totalAttempted || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Total Attempted</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#10B981" }]}>{progressData?.correctCount || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Correct Answers</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#EF4444" }]}>{progressData?.incorrectCount || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Incorrect</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#09090B" }]}>{progressData?.accuracy || 0}%</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Accuracy Rate</Text>
              </View>
            </View>

            {/* Subject Breakdown */}
            {progressData?.subjectBreakdown?.length ? (
              <View style={[styles.subjectBreakdownWrapper, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.subjectBreakdownHeading, { color: theme.text }]}>Subject-Wise Accuracy</Text>
                {progressData.subjectBreakdown.map((s, sIdx) => (
                  <View key={`sb_${sIdx}`} style={styles.subjectBreakdownRow}>
                    <Text style={[styles.subjectBreakdownName, { color: theme.text }]}>{s.subject}</Text>
                    <View style={styles.subjectBarBgTrack}>
                      <View style={[styles.subjectBarFillTrack, { width: `${s.accuracy}%` }]} />
                    </View>
                    <Text style={styles.subjectBreakdownPct}>{s.accuracy}%</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1
  },
  headerContainer: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  backIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {},
  headerTitleText: {
    fontSize: 13.5,
    fontFamily: fonts.bold
  },

  // Main Tab Switcher
  tabBarContainer: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    gap: 4
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: "#F4F4F5"
  },
  tabButtonText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  tabButtonTextActive: {
    fontFamily: fonts.bold
  },

  scrollBody: {
    flex: 1
  },
  scrollBodyContent: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 60
  },

  // Setup Step Elements
  setupMainWrapper: {},
  stepSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.bold,
    textAlign: "center",
    lineHeight: 18
  },
  stepTitle: {
    fontSize: 13,
    fontFamily: fonts.bold
  },

  horizontalScrollRow: {
    flexDirection: "row"
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6
  },
  categoryChipActive: {
    backgroundColor: "#09090B",
    borderColor: "#09090B"
  },
  categoryChipText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  // Exam Grid
  examGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  examCardBox: {
    width: (width - 44) / 2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between"
  },
  examCardBoxSelected: {
    borderColor: "#09090B",
    borderWidth: 2
  },
  examCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  examIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  examCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  examCategoryTagText: {
    fontSize: 10,
    fontFamily: fonts.medium
  },
  examCardName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 3
  },
  examCardNameSelected: {
    color: "#09090B"
  },
  examCardDesc: {
    fontSize: 10.5,
    fontFamily: fonts.regular,
    lineHeight: 14
  },

  emptyNoticeBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center"
  },
  emptyNoticeText: {
    fontSize: 12.5,
    fontFamily: fonts.medium
  },
  emptyNoticeNote: {
    fontSize: 11,
    fontFamily: fonts.regular,
    fontStyle: "italic"
  },

  // Pills Row
  pillsWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  yearPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  yearPillActive: {
    backgroundColor: "#09090B",
    borderColor: "#09090B"
  },
  yearPillText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  yearPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6
  },
  subjectChipActive: {
    backgroundColor: "#09090B",
    borderColor: "#09090B"
  },
  subjectChipText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  subjectChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  limitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  limitPillActive: {
    backgroundColor: "#09090B",
    borderColor: "#09090B"
  },
  limitPillText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  limitPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  // Summary Banner
  summaryBannerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    ...shadow.soft
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  summaryTargetHeading: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    color: "#09090B",
    letterSpacing: 0.5
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 2
  },
  summarySubText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginBottom: 10
  },
  availableCounterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10
  },
  availableCounterBadgeText: {
    fontSize: 10.5,
    fontFamily: fonts.medium,
    color: "#059669"
  },
  startPracticeBtnCTA: {
    backgroundColor: "#09090B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10
  },
  startPracticeBtnCTAText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // Practice Session Styles
  practiceSessionContainer: {},
  practiceTopNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10
  },
  exitSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  exitSessionText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  progressCounterBox: {},
  progressCounterText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  bookmarkHeaderBtn: {
    padding: 4
  },

  progressBarTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#09090B"
  },

  questionMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  metaBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },

  questionCardBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  questionTextTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    lineHeight: 22,
    marginBottom: 16
  },

  optionsListContainer: {
    gap: 10,
    marginBottom: 16
  },
  optionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  optionCircleText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  optionTextContent: {
    fontSize: 13,
    fontFamily: fonts.medium,
    flex: 1
  },

  submitAnswerBtn: {
    backgroundColor: "#09090B",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  submitAnswerBtnDisabled: {
    opacity: 0.5
  },
  submitAnswerBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  resultContainer: {
    gap: 12
  },
  resultBannerCorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 10
  },
  resultTextCorrect: {
    color: "#059669",
    fontFamily: fonts.bold,
    fontSize: 13
  },
  resultBannerIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F4F4F5",
    padding: 12,
    borderRadius: 10
  },
  resultTextIncorrect: {
    color: "#EF4444",
    fontFamily: fonts.bold,
    fontSize: 13
  },

  aiExplainTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    paddingVertical: 10,
    borderRadius: 10
  },
  aiExplainTriggerBtnText: {
    color: "#09090B",
    fontFamily: fonts.bold,
    fontSize: 13
  },
  phlappyAvatarSmall: {
    width: 18,
    height: 18,
    borderRadius: 9
  },

  // AI Explanation Wrapper
  aiExplanationWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16
  },
  aiCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  aiRobotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  phlappyAvatarBadgeLogo: {
    width: 22,
    height: 22,
    borderRadius: 11
  },
  aiRobotBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#09090B"
  },
  langPillsRow: {
    flexDirection: "row",
    gap: 4
  },
  langPillItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#E2E8F0"
  },
  langPillItemActive: {
    backgroundColor: "#09090B"
  },
  langPillItemText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "#475569"
  },
  langPillItemTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  aiContentScroll: {
    maxHeight: 180,
    marginBottom: 10
  },
  aiExplanationText: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    lineHeight: 18
  },

  followUpCardItem: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  followUpCardQuery: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#09090B"
  },
  followUpCardAnswer: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    marginTop: 2
  },

  followUpInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  followUpTextInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: fonts.regular
  },
  sendFollowUpActionBtn: {
    backgroundColor: "#09090B",
    padding: 8,
    borderRadius: 8
  },

  bottomNavControlsRow: {
    flexDirection: "row",
    gap: 12
  },
  navChevronBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  navChevronBtnDisabled: {
    opacity: 0.4
  },
  navChevronBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  navChevronBtnPrimary: {
    backgroundColor: "#09090B",
    borderColor: "#09090B"
  },
  navChevronBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: fonts.bold
  },

  // Saved & Progress Tabs
  tabSectionWrapper: {},
  tabSectionHeading: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 14
  },

  emptyStateCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center"
  },
  emptyStateTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginTop: 10,
    marginBottom: 4
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: "center"
  },

  savedItemCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  savedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  savedCardExamTag: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#09090B"
  },
  savedCardQuestionText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 8
  },
  savedCardAnsBox: {
    backgroundColor: "#ECFDF5",
    padding: 8,
    borderRadius: 8
  },
  savedCardAnsText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: "#059669"
  },

  statsQuadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  statQuadCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center"
  },
  statQuadValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginBottom: 2
  },
  statQuadLabel: {
    fontSize: 11,
    fontFamily: fonts.medium
  },

  subjectBreakdownWrapper: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1
  },
  subjectBreakdownHeading: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 12
  },
  subjectBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  subjectBreakdownName: {
    width: 100,
    fontSize: 12,
    fontFamily: fonts.medium
  },
  subjectBarBgTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden"
  },
  subjectBarFillTrack: {
    height: "100%",
    backgroundColor: "#09090B"
  },
  subjectBreakdownPct: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#09090B",
    width: 36,
    textAlign: "right"
  },

  fullscreenLoadingBox: {
    flex: 1,
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center"
  },
  fullscreenLoadingText: {
    marginTop: 14,
    fontSize: 13.5,
    fontFamily: fonts.medium
  },

  langToggleHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2
  },
  langTogglePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  langToggleText: {
    fontSize: 10.5,
    fontFamily: fonts.bold
  },

  explanationCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10
  },
  explanationHeadingText: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    marginBottom: 4
  },
  explanationBodyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18
  },

  // Custom Year Dropdown Styles
  yearDropdownContainer: {
    marginTop: 6,
    marginBottom: 6
  },
  yearDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  yearDropdownTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  yearDropdownTriggerText: {
    fontSize: 13.5,
    fontFamily: fonts.medium
  },
  yearDropdownMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden"
  },
  yearDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1
  },
  yearDropdownItemText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    marginLeft: 10
  }
});
