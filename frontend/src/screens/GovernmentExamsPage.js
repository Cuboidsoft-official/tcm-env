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
  Modal,
  Platform,
  useWindowDimensions
} from "react-native";
import { MaterialCommunityIcons, Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import {
  getGovernmentStates,
  getGovernmentExams,
  getGovernmentSubjects,
  getGovernmentChapters,
  getGovernmentChapter,
  saveChapterProgress,
  bookmarkChapter,
  explainChapterWithAI,
  saveChapterNote,
  getChapterNotes,
  getGovernmentSources,
  syncGovernmentSource,
  getGovCategories
} from "../api/client";

// Official Standard Government Exams
const defaultGovExams = [
  {
    id: "ex_ssc_cgl",
    name: "SSC CGL",
    category: "SSC",
    state: "All States",
    badge: "Group B & C Posts",
    description: "Combined Graduate Level Exam for Tier 1 & Tier 2 Govt Posts.",
    icon: "bank",
    bgColor: "#EFF6FF",
    iconColor: "#0284C7"
  },
  {
    id: "ex_ssc_chsl",
    name: "SSC CHSL",
    category: "SSC",
    state: "All States",
    badge: "10+2 Level",
    description: "Higher Secondary Level Exam for LDC, DEO & PA Posts.",
    icon: "file-document-outline",
    bgColor: "#F0FDF4",
    iconColor: "#16A34A"
  },
  {
    id: "ex_rrb_ntpc",
    name: "RRB NTPC",
    category: "Railway",
    state: "All States",
    badge: "Indian Railways",
    description: "Non-Technical Popular Categories (Station Master, Clerk, Goods Guard).",
    icon: "train",
    bgColor: "#FEFCE8",
    iconColor: "#CA8A04"
  },
  {
    id: "ex_ibps_po",
    name: "IBPS PO & Clerk",
    category: "Banking",
    state: "All States",
    badge: "Public Sector Banks",
    description: "Probationary Officer & Clerical Cadre in Nationalized Banks.",
    icon: "cash-multiple",
    bgColor: "#FAF5FF",
    iconColor: "#9333EA"
  },
  {
    id: "ex_sbi_po",
    name: "SBI PO & Clerk",
    category: "Banking",
    state: "All States",
    badge: "State Bank of India",
    description: "State Bank of India Junior Associate & Officer Recruitment.",
    icon: "office-building",
    bgColor: "#EFF6FF",
    iconColor: "#2563EB"
  },
  {
    id: "ex_upsc_cse",
    name: "UPSC Civil Services",
    category: "UPSC",
    state: "All States",
    badge: "IAS / IPS / IFS",
    description: "Indian Administrative Service Prelims & Mains Standard Preparation.",
    icon: "shield-star-outline",
    bgColor: "#FFF1F2",
    iconColor: "#E11D48"
  },
  {
    id: "ex_uppsc",
    name: "UPPSC Combined State",
    category: "State PSC",
    state: "Uttar Pradesh",
    badge: "UP State PCS",
    description: "Uttar Pradesh Public Service Commission Executive & Judicial Services.",
    icon: "map-marker-radius",
    bgColor: "#F0F9FF",
    iconColor: "#0369A1"
  },
  {
    id: "ex_bpsc",
    name: "BPSC Combined Exam",
    category: "State PSC",
    state: "Bihar",
    badge: "Bihar State PCS",
    description: "Bihar Public Service Commission Subordinate Officers Recruitment.",
    icon: "map-marker",
    bgColor: "#FEF2F2",
    iconColor: "#DC2626"
  },
  {
    id: "ex_ras",
    name: "RAS / RPSC",
    category: "State PSC",
    state: "Rajasthan",
    badge: "Rajasthan PCS",
    description: "Rajasthan Administrative Service & State Subordinate Services Exam.",
    icon: "compass-outline",
    bgColor: "#FFF7ED",
    iconColor: "#EA580C"
  },
  {
    id: "ex_nda",
    name: "UPSC NDA & CDS",
    category: "Defence",
    state: "All States",
    badge: "Armed Forces",
    description: "National Defence Academy & Combined Defence Services Entry.",
    icon: "shield-sword-outline",
    bgColor: "#F0FDF4",
    iconColor: "#15803D"
  },
  {
    id: "ex_ctet",
    name: "CTET & State TET",
    category: "Teaching",
    state: "All States",
    badge: "School Teaching",
    description: "Central & State Teacher Eligibility Tests for Paper 1 & Paper 2.",
    icon: "school-outline",
    bgColor: "#F5F3FF",
    iconColor: "#7C3AED"
  },
  {
    id: "ex_police",
    name: "State Police SI & Constable",
    category: "Police",
    state: "Uttar Pradesh",
    badge: "Police Department",
    description: "UP, Bihar, Delhi & State Police Department Recruitment Exams.",
    icon: "badge-account-horizontal-outline",
    bgColor: "#F8FAFC",
    iconColor: "#334155"
  }
];

const defaultGovSubjects = [
  {
    id: "sub_polity",
    name: "Indian Polity & Constitution",
    chapterCount: 14,
    icon: "scale-balance",
    bgColor: "#E0F2FE",
    iconColor: "#0284C7",
    description: "Articles, Fundamental Rights, Parliament, Judiciary & Amendments."
  },
  {
    id: "sub_history",
    name: "Indian History & Freedom Struggle",
    chapterCount: 18,
    icon: "history",
    bgColor: "#FEF3C7",
    iconColor: "#D97706",
    description: "Ancient, Medieval & Modern Indian History & Freedom Struggle."
  },
  {
    id: "sub_geography",
    name: "Geography & Environment",
    chapterCount: 16,
    icon: "earth",
    bgColor: "#DCFCE7",
    iconColor: "#16A34A",
    description: "Physical Geography, Indian Rivers, Climate, Forests & Ecology."
  },
  {
    id: "sub_science",
    name: "General Science (Physics, Chem, Bio)",
    chapterCount: 20,
    icon: "atom",
    bgColor: "#F3E8FF",
    iconColor: "#9333EA",
    description: "Core Laws of Science, Human Body, Chemical Reactions & Tech."
  },
  {
    id: "sub_aptitude",
    name: "Quantitative Aptitude & Maths",
    chapterCount: 22,
    icon: "calculator-variant",
    bgColor: "#FFEDD5",
    iconColor: "#EA580C",
    description: "Number Systems, Percentages, Profit-Loss, Speed & Time, Geometry."
  },
  {
    id: "sub_reasoning",
    name: "Reasoning & Mental Ability",
    chapterCount: 15,
    icon: "head-lightbulb-outline",
    bgColor: "#E0E7FF",
    iconColor: "#4F46E5",
    description: "Logical Deduction, Syllogisms, Series, Coding & Spatial Reasoning."
  },
  {
    id: "sub_english",
    name: "English Language & Comprehension",
    chapterCount: 12,
    icon: "translate",
    bgColor: "#FFE4E6",
    iconColor: "#E11D48",
    description: "Grammar Rules, Error Spotting, Reading Passages & Vocabulary."
  },
  {
    id: "sub_gk",
    name: "Current Affairs & Static GK",
    chapterCount: 25,
    icon: "globe-model",
    bgColor: "#CCFBF1",
    iconColor: "#0D9488",
    description: "National & International Events, Awards, Schemes & Key Dates."
  }
];

// Rich Authentic Multilingual Educational Study Material (English, Hindi, Hinglish)
const defaultGovChaptersMultilingual = {
  sub_polity: [
    {
      id: "chap_pol_1",
      title: {
        en: "Preamble & Key Features of Indian Constitution",
        hi: "भारतीय संविधान की प्रस्तावना एवं प्रमुख विशेषताएँ",
        hinglish: "Indian Constitution ki Preamble & Key Features"
      },
      topicName: "Constitutional Framework",
      estimatedReadingTime: 25,
      sourceName: "Official NCERT Polity (Class 11 & 12) & Constitutional Debates Repository",
      contentMarkdown: {
        en: `# Preamble & Key Features of Indian Constitution

## 1. Constitutional History & Constituent Assembly Drafting
The Constitution of India is the supreme legal document of the Sovereign Democratic Republic of India. It was drafted by the Constituent Assembly, which was set up under the Cabinet Mission Plan of 1946.

- **Constituent Assembly First Meeting**: 9th December 1946 (Temporary President: Dr. Sachchidananda Sinha).
- **Permanent President**: Dr. Rajendra Prasad (Elected on 11th December 1946).
- **Constitutional Advisor**: Sir B.N. Rau.
- **Drafting Committee Chairman**: Dr. B.R. Ambedkar (Father & Chief Architect of Indian Constitution).
- **Total Duration**: 2 Years, 11 Months, and 18 Days (spanning 11 formal sessions).
- **Adoption Date**: 26th November 1949 (Celebrated annually across India as **Samvidhan Divas / Constitution Day**).
- **Enactment Date**: 26th January 1950 (Commemorating the 1930 *Poorna Swaraj* Declaration on Republic Day).

---

## 2. Text of the Preamble & In-Depth Concept Breakdown
The Preamble serves as the preface and identity card of the Constitution. It is based on the **'Objectives Resolution'** introduced by Pandit Jawaharlal Nehru on 13th December 1946 and unanimously adopted on 22nd January 1947.

### Verbatim Opening Statement:
> *"WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, LIBERTY, EQUALITY and FRATERNITY..."*

### Detailed Meaning of Key Words:
- **SOVEREIGN**: India possesses absolute internal independence and external sovereignty. It is neither a dominion nor a dependency of any external nation, and can acquire or cede foreign territory.
- **SOCIALIST**: Added by the **42nd Constitutional Amendment Act (1976)**. India follows *Democratic Socialism* (a hybrid of Marxist and Gandhian socialism leaning heavily towards Gandhian socialism), aiming to end poverty, disease, ignorance, and inequality of opportunity.
- **SECULAR**: Added by the **42nd Amendment Act (1976)**. India practices *Positive Secularism*—the State respects, protects, and accords equal status to all religions (Articles 25–28).
- **DEMOCRATIC**: Power rests with the people through **Universal Adult Suffrage** (Article 326), periodic free elections, rule of law, and independence of judiciary.
- **REPUBLIC**: The Head of State (President of India) is indirectly elected by the people for a fixed 5-year term, rather than a hereditary monarch like the British Crown.
- **JUSTICE**: Three distinct forms secured:
  1. *Social Justice*: Equal treatment of all citizens without discrimination based on caste, race, religion, or gender.
  2. *Economic Justice*: Non-discrimination on grounds of wealth, income, or property.
  3. *Political Justice*: Equal access to all political offices and equal voice in government.
- **LIBERTY**: Freedom of thought, expression, belief, faith, and worship (guaranteed via Fundamental Rights, Article 19 & 25-28).
- **EQUALITY**: Absence of special privileges to any section, providing adequate opportunities for all without discrimination (Articles 14–18).
- **FRATERNITY**: Sense of common brotherhood assuring the dignity of the individual and the unity and integrity of the Nation (*'Integrity'* was added by the 42nd Amendment 1976).

---

## 3. Supreme Court Landmark Cases on the Preamble
1. **Berubari Union Case (1960)**: Supreme Court held that the Preamble is a key to open the mind of the constitution makers, but **it is NOT a part of the Constitution** and cannot be enforced in a court of law.
2. **Kesavananda Bharati Case (1973)**: Overruled Berubari Union. SC held that **the Preamble IS an integral part of the Constitution** and can be amended under Article 368, provided the **'Basic Structure'** of the Constitution is not destroyed.
3. **LIC of India Case (1995)**: SC re-affirmed that the Preamble is an integral and inseparable part of the Constitution of India.

---

## 4. Salient Features of the Indian Constitution
- **Lengthiest Written Constitution**: Originally contained **395 Articles, 22 Parts, and 8 Schedules**. Currently contains over **448 Articles, 25 Parts, and 12 Schedules**.
- **Blend of Rigidity and Flexibility**: Some provisions require simple majority, while others require special 2/3rd majority plus ratification by 50% of State Assemblies (Article 368).
- **Federal System with Unitary Bias**: Described as **'Quasi-Federal'** by K.C. Wheare. Strong Centre, Single Citizenship, Single Judiciary, and Emergency provisions reflect unitary character.
- **Parliamentary Form of Government**: Executive is responsible to the Legislature (Article 75(3)).
- **Integrated and Independent Judiciary**: Supreme Court at apex, followed by High Courts and Subordinate Courts, enforcing both Central and State laws.

---

## 5. Sources Borrowed from Worldwide Constitutions
- **Government of India Act 1935**: Federal Scheme, Office of Governor, Judiciary, Public Service Commissions, Emergency Provisions.
- **British Constitution**: Parliamentary form of Government, Rule of Law, Legislative Procedure, Single Citizenship, Cabinet System, Prerogative Writs, Bicameralism.
- **US Constitution**: Fundamental Rights, Independence of Judiciary, Judicial Review, Impeachment of President, Removal of SC/HC judges, Vice-President post.
- **Irish Constitution**: Directive Principles of State Policy (DPSP), Nomination of members to Rajya Sabha, Method of Election of President.
- **Canadian Constitution**: Federation with strong Centre, Vesting of residuary powers in Centre, Appointment of State Governors by Centre, Advisory jurisdiction of Supreme Court.
- **Australian Constitution**: Concurrent List, Freedom of Trade and Commerce, Joint sitting of two Houses of Parliament.
- **Weimar Constitution of Germany**: Suspension of Fundamental Rights during National Emergency.
- **USSR (Russia) Constitution**: Fundamental Duties (Article 51A) and Ideals of Justice (Social, Economic, Political) in Preamble.
- **French Constitution**: Ideals of Liberty, Equality, Fraternity, and Republic concept.
- **South African Constitution**: Procedure for Amendment of Constitution, Election of members of Rajya Sabha.
- **Japanese Constitution**: Procedure established by Law.

---

## 6. High-Yield Exam Summary & Parts of Indian Constitution
- **Part I (Articles 1–4)**: Union and its Territory.
- **Part II (Articles 5–11)**: Citizenship.
- **Part III (Articles 12–35)**: Fundamental Rights (*Magna Carta of India*).
- **Part IV (Articles 36–51)**: Directive Principles of State Policy (DPSP).
- **Part IV-A (Article 51A)**: Fundamental Duties (Added by 42nd Amendment 1976 on Swaran Singh Committee recommendation).
- **Part V (Articles 52–151)**: The Union Government (Executive, Parliament, President, CAG).
- **Part VI (Articles 152–237)**: The State Governments.
- **Part IX (Articles 243–243O)**: The Panchayats (Added by 73rd Amendment 1992).
- **Part IX-A (Articles 243P–243ZG)**: The Municipalities (Added by 74th Amendment 1992).
- **Part XVIII (Articles 352–360)**: Emergency Provisions (352: National, 356: President's Rule, 360: Financial).
- **Part XX (Article 368)**: Amendment of the Constitution.`,

        hi: `# भारतीय संविधान की प्रस्तावना एवं प्रमुख विशेषताएँ

## 1. संवैधानिक इतिहास एवं संविधान सभा का गठन
भारत का संविधान स्वतंत्र भारत की सर्वोच्च विधि है। इसका निर्माण संविधान सभा द्वारा किया गया था, जिसका गठन **कैबिनेट मिशन योजना (1946)** के तहत हुआ था।

- **संविधान सभा की प्रथम बैठक**: 9 दिसंबर 1946 (अस्थायी अध्यक्ष: डॉ. सच्चिदानंद सिन्हा)।
- **स्थायी अध्यक्ष**: डॉ. राजेंद्र प्रसाद (11 दिसंबर 1946 को निर्वाचित)।
- **संवैधानिक सलाहकार**: सर बी.एन. राव (Sir B.N. Rau)।
- **प्रारूप समिति के अध्यक्ष**: डॉ. भीमराव रामजी अंबेडकर (भारतीय संविधान के मुख्य शिल्पकार)।
- **कुल समय**: 2 वर्ष, 11 माह और 18 दिन (11 मुख्य सत्रों में विभाजित)।
- **अंगीकृत करने की तिथि**: 26 नवंबर 1949 (प्रतिवर्ष संपूर्ण भारत में **संविधान दिवस / Samvidhan Divas** के रूप में मनाया जाता है)।
- **पूर्णतः लागू होने की तिथि**: 26 जनवरी 1950 (1930 के **पूर्ण स्वराज** संकल्प की स्मृति में गणतंत्र दिवस)।

---

## 2. प्रस्तावना का मूल पाठ एवं प्रमुख शब्दों की विस्तृत व्याख्या
प्रस्तावना संविधान की भूमिका एवं आत्मा है। यह पंडित जवाहरलाल नेहरू द्वारा 13 दिसंबर 1946 को प्रस्तुत एवं 22 जनवरी 1947 को सर्वसम्मति से पारित **'उद्देश्य प्रस्ताव' (Objectives Resolution)** पर आधारित है।

### प्रस्तावना का मूल कथन:
> *"हम भारत के लोग, भारत को एक सम्पूर्ण प्रभुत्व-संपन्न, समाजवादी, पंथनिरपेक्ष, लोकतांत्रिक गणराज्य बनाने के लिए तथा इसके समस्त नागरिकों को सामाजिक, आर्थिक और राजनीतिक न्याय, विचार, अभिव्यक्ति, विश्वास, धर्म और उपासना की स्वतंत्रता, प्रतिष्ठा और अवसर की समता प्राप्त कराने के लिए..."*

### प्रमुख शब्दों की परीक्षा उपयोगी व्याख्या:
- **संप्रभु (SOVEREIGN)**: भारत पूर्णतः स्वतंत्र राष्ट्र है। यह न तो किसी अन्य देश का डोमिनियन है और न ही किसी विदेशी सत्ता के अधीन है।
- **समाजवादी (SOCIALIST)**: **42वें संविधान संशोधन (1976)** द्वारा जोड़ा गया। भारत लोकतांत्रिक समाजवाद को अपनाता है, जिसका उद्देश्य गरीबी, उपेक्षा और अवसर की असमानता को समाप्त करना है।
- **पंथनिरपेक्ष / धर्मनिरपेक्ष (SECULAR)**: **42वें संशोधन (1976)** द्वारा शामिल। राज्य का अपना कोई धर्म नहीं है और सभी धर्मों को समान संरक्षण प्राप्त है (अनुच्छेद 25-28)।
- **लोकतांत्रिक (DEMOCRATIC)**: सत्ता का स्रोत जनता है, जो **वयस्क मताधिकार (अनुच्छेद 326)**, स्वतंत्र चुनाव और विधि के शासन द्वारा संचालित होती है।
- **गणराज्य (REPUBLIC)**: भारत का राष्ट्राध्यक्ष (राष्ट्रपति) वंशानुगत न होकर जनता द्वारा अप्रत्यक्ष रूप से निश्चित 5 वर्षों के लिए चुना जाता है।
- **न्याय (JUSTICE)**: 3 प्रकार का न्याय सुनिश्चित किया गया है:
  1. *सामाजिक न्याय*: जाति, धर्म, लिंग के आधार पर भेदभाव का अंत।
  2. *आर्थिक न्याय*: धन एवं संपत्ति के आधार पर विषमता का अंत।
  3. *राजनीतिक न्याय*: सभी को समान राजनीतिक अधिकार।
- **स्वतंत्रता (LIBERTY)**: विचार, अभिव्यक्ति, विश्वास, धर्म और उपासना की स्वतंत्रता (भाग III मौलिक अधिकार)।
- **बंधुता (FRATERNITY)**: व्यक्ति की गरिमा और राष्ट्र की एकता व अखंडता सुनिश्चित करने वाली बंधुत्व की भावना (*'अखंडता / Integrity'* शब्द 42वें संशोधन 1976 द्वारा जोड़ा गया)।

---

## 3. प्रस्तावना पर उच्चतम न्यायालय (Supreme Court) के ऐतिहासिक निर्णय
1. **बेरुबारी यूनियन मामला (1960)**: सर्वोच्च न्यायालय ने निर्णय दिया कि प्रस्तावना संविधान निर्माताओं के विचारों को समझने की कुंजी तो है, परंतु **यह संविधान का अंग नहीं है**।
2. **केशवानंद भारती बनाम केरल राज्य (1973)**: पूर्व निर्णय को पलटते हुए न्यायालय ने कहा कि **प्रस्तावना संविधान का अभिन्न अंग है** तथा इसमें अनुच्छेद 368 के तहत संशोधन किया जा सकता है, बशर्ते **'मूल ढांचे' (Basic Structure)** को क्षति न पहुँचे।
3. **एल.आई.सी. ऑफ इंडिया मामला (1995)**: सुप्रीम कोर्ट ने पुनः पुष्टि की कि प्रस्तावना संविधान का आंतरिक एवं अविभाज्य हिस्सा है।

---

## 4. भारतीय संविधान की प्रमुख विशेषताएँ
- **विश्व का सबसे विस्तृत लिखित संविधान**: मूल संविधान में **395 अनुच्छेद, 22 भाग और 8 अनुसूचियां** थीं। वर्तमान में लगभग **448 से अधिक अनुच्छेद, 25 भाग तथा 12 अनुसूचियां** हैं।
- **नम्यता एवं अनम्यता का मिश्रण**: कुछ प्रावधान साधारण बहुमत से, जबकि कुछ अनुच्छेद 368 के तहत विशेष बहुमत व राज्यों के अनुमोदन से संशोधित होते हैं।
- **एकात्मक झुकाव के साथ संघात्मक ढाँचा**: प्रो. के.सी. ह्वीयर (K.C. Wheare) ने इसे **'अर्ध-संघीय' (Quasi-Federal)** कहा है।
- **संसदीय शासन प्रणाली**: कार्यपालिका (मंत्रिपरिषद) विधायिका (लोकसभा) के प्रति सामूहिक रूप से उत्तरदायी होती है (अनुच्छेद 75(3))।
- **स्वतंत्र एवं एकीकृत न्यायपालिका**: शीर्ष पर सर्वोच्च न्यायालय, फिर उच्च न्यायालय और अधीनस्थ न्यायालय।

---

## 5. विभिन्न देशों के संविधानों से लिए गए स्रोत
- **भारत सरकार अधिनियम 1935**: संघीय तंत्र, राज्यपाल का कार्यालय, न्यायपालिका, लोक सेवा आयोग, आपातकालीन उपबंध।
- **ब्रिटेन से**: संसदीय शासन, विधि का शासन (Rule of Law), एकल नागरिकता, मंत्रिमंडल प्रणाली, द्विसदनीय व्यवस्था।
- **अमेरिका से**: मौलिक अधिकार, न्यायपालिका की स्वतंत्रता, न्यायिक पुनरावलोकन (Judicial Review), राष्ट्रपति पर महाभियोग, उपराष्ट्रपति का पद।
- **आयरलैंड से**: राज्य के नीति निदेशक तत्व (DPSP), राज्यसभा में राष्ट्रपति द्वारा सदस्यों का नामांकन।
- **कनाडा से**: सशक्त केंद्र के साथ संघीय व्यवस्था, अवशिष्ट शक्तियाँ केंद्र के पास।
- **ऑस्ट्रेलिया से**: समवर्ती सूची (Concurrent List), संसद के दोनों सदनों की संयुक्त बैठक।
- **जर्मनी (वाईमर संविधान) से**: आपातकाल के समय मौलिक अधिकारों का स्थगन।
- **सोवियत संघ (USSR) से**: मौलिक कर्तव्य (अनुच्छेद 51A) तथा प्रस्तावना में न्याय के आदर्श।
- **फ्रांस से**: गणतंत्रात्मक व्यवस्था, स्वतंत्रता, समता और बंधुता के आदर्श।
- **दक्षिण अफ्रीका से**: संविधान संशोधन की प्रक्रिया (Article 368)।

---

## 6. परीक्षा हेतु महत्वपूर्ण भाग एवं अनुच्छेद
- **भाग I (अनुच्छेद 1-4)**: संघ और उसका राज्य क्षेत्र।
- **भाग II (अनुच्छेद 5-11)**: नागरिकता।
- **भाग III (अनुच्छेद 12-35)**: मौलिक अधिकार (*भारत का अधिकार पत्र / Magna Carta*)।
- **भाग IV (अनुच्छेद 36-51)**: राज्य के नीति निदेशक तत्व (DPSP)।
- **भाग IV-A (अनुच्छेद 51A)**: मौलिक कर्तव्य (42वें संशोधन 1976 द्वारा स्वर्ण सिंह समिति की सिफारिश पर जोड़ा गया)।
- **भाग V (अनुच्छेद 52-151)**: संघ सरकार (राष्ट्रपति, संसद, सुप्रीम कोर्ट, CAG)।
- **भाग IX (अनुच्छेद 243-243O)**: पंचायतें (73वें संशोधन 1992 द्वारा जोड़ा गया)।
- **भाग XVIII (अनुच्छेद 352-360)**: आपातकालीन उपबंध (352: राष्ट्रीय आपात, 356: राष्ट्रपति शासन, 360: वित्तीय आपात)।
- **भाग XX (अनुच्छेद 368)**: संविधान का संशोधन।`,

        hinglish: `# Indian Constitution ki Preamble & Key Features

## 1. Constitutional Background & Assembly History
India ka Constitution independent India ka supreme law hai. Isko Constituent Assembly ne Cabinet Mission Plan (1946) ke under draft kiya tha.

- **First Assembly Meeting**: 9th December 1946 (Temporary President: Dr. Sachchidananda Sinha).
- **Permanent President**: Dr. Rajendra Prasad (Elected 11th Dec 1946).
- **Constitutional Advisor**: Sir B.N. Rau.
- **Drafting Committee Chairman**: Dr. B.R. Ambedkar (Father of Indian Constitution).
- **Total Time Taken**: 2 Years, 11 Months, aur 18 Days.
- **Adoption Date**: 26th November 1949 (**Samvidhan Divas / Constitution Day**).
- **Implementation Date**: 26th January 1950 (Republic Day, 1930 Poorna Swaraj ki yaad me).

---

## 2. Text of Preamble & Key Words Explained
Preamble Constitution ka Preface aur Summary hai. Ye Pandit Jawaharlal Nehru ke **'Objectives Resolution'** (13 Dec 1946) par based hai.

### Verbatim Opening Words:
> *"WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC..."*

### Detailed Meaning of Terms:
- **SOVEREIGN**: India complete independent nation hai. Is par kisi external power ka control nahi hai.
- **SOCIALIST**: **42nd Amendment Act (1976)** se add hua. India Democratic Socialism follow karta hai poverty aur inequality kam karne ke liye.
- **SECULAR**: **42nd Amendment Act (1976)** se add hua. State ka apna koi official religion nahi hai, sabhi religions ko equal respect milti hai (Articles 25-28).
- **DEMOCRATIC**: Power citizens ke paas hai through **Universal Adult Voting** (Article 326).
- **REPUBLIC**: India ka Head of State (President) elected hota hai, hereditary king nahi hota.
- **JUSTICE**: 3 types - Social, Economic, aur Political Justice.
- **LIBERTY**: Thought, expression, belief, faith, aur worship ki freedom.
- **EQUALITY**: Discrimination ka end aur equal opportunities.
- **FRATERNITY**: Universal brotherhood aura individual dignity (*'Integrity'* word 42nd Amendment 1976 se add hua).

---

## 3. Supreme Court Landmark Judgments on Preamble
1. **Berubari Union Case (1960)**: SC ne kaha ki Preamble Constitution ka part **NAHI** hai.
2. **Kesavananda Bharati Case (1973)**: SC ne previous judgment badal kar kaha ki **Preamble Constitution ka integral part hai** aur isko Article 368 se amend kiya ja sakta hai agar **'Basic Structure'** intact rahe.
3. **LIC of India Case (1995)**: SC ne reaffirm kiya ki Preamble Constitution ka integral part hai.

---

## 4. Important Salient Features
- **Lengthiest Written Constitution**: Originally 395 Articles, 22 Parts, aur 8 Schedules the. Ab 448+ Articles, 25 Parts, aur 12 Schedules hain.
- **Quasi-Federal System**: K.C. Wheare ne India ke setup ko Quasi-Federal kaha hai (Strong Centre + Single Citizenship).
- **Parliamentary System**: Executive (Council of Ministers) Lok Sabha ke prati accountable hota hai (Article 75(3)).
- **Integrated Judiciary**: Top par Supreme Court, phir High Courts aur District Courts.

---

## 5. Major Sources Borrowed Worldwide
- **Government of India Act 1935**: Federal Scheme, Judiciary, Emergency powers, Office of Governor.
- **UK (British Constitution)**: Parliamentary Form, Rule of Law, Single Citizenship, Cabinet system.
- **USA Constitution**: Fundamental Rights (Part III), Judicial Review, Impeachment of President.
- **Ireland Constitution**: Directive Principles of State Policy (DPSP), Rajya Sabha nominations.
- **Canada Constitution**: Strong Centre with Residuary Powers.
- **Australia**: Concurrent List aur Joint Sitting of Parliament.
- **Germany (Weimar)**: Emergency ke time Fundamental Rights suspension.
- **USSR**: Fundamental Duties (Article 51A).
- **South Africa**: Constitution Amendment Procedure (Article 368).

---

## 6. High-Yield Parts & Articles for Govt Exams
- **Part I (Art 1–4)**: Union & Territory.
- **Part II (Art 5–11)**: Citizenship.
- **Part III (Art 12–35)**: Fundamental Rights (*Magna Carta*).
- **Part IV (Art 36–51)**: DPSP.
- **Part IV-A (Art 51A)**: Fundamental Duties (Added by 42nd Amendment 1976).
- **Part V (Art 52–151)**: Union Govt (President, Parliament, Supreme Court, CAG).
- **Part IX (Art 243–243O)**: Panchayati Raj (73rd Amendment 1992).
- **Part XVIII (Art 352–360)**: Emergency (352 National, 356 President's Rule, 360 Financial).
- **Part XX (Art 368)**: Constitutional Amendment.`
      }
    },
    {
      id: "chap_pol_2",
      title: {
        en: "Fundamental Rights, DPSP & Fundamental Duties (Articles 12-51A)",
        hi: "मौलिक अधिकार, नीति निदेशक तत्व एवं मौलिक कर्तव्य",
        hinglish: "Fundamental Rights, DPSP & Fundamental Duties Master Class"
      },
      topicName: "Constitutional Core",
      estimatedReadingTime: 22,
      sourceName: "Official NCERT Polity (Class 11 & 12)",
      contentMarkdown: {
        en: `# Fundamental Rights, DPSP & Fundamental Duties

## 1. Fundamental Rights (Articles 12 to 35 - Part III)
Known as the **'Magna Carta of India'**, Fundamental Rights are justiciable in court (Article 32 & 226).

### 6 Categories of Fundamental Rights:
1. **Right to Equality (Articles 14–18)**:
   - *Article 14*: Equality before law & Equal protection of laws.
   - *Article 15*: Prohibition of discrimination on grounds of religion, race, caste, sex, or place of birth.
   - *Article 16*: Equality of opportunity in public employment.
   - *Article 17*: Abolition of Untouchability (Strictly enforced).
   - *Article 18*: Abolition of Titles (Except military & academic distinctions).
2. **Right to Freedom (Articles 19–22)**:
   - *Article 19*: 6 Fundamental Freedoms (Speech, Assembly, Association, Movement, Residence, Profession).
   - *Article 20*: Protection in respect of conviction for offenses (No Ex-post facto law, No double jeopardy, No self-incrimination).
   - *Article 21*: Protection of Life and Personal Liberty.
   - *Article 21A*: Right to Education (6–14 years, added by 86th Amendment 2002).
   - *Article 22*: Protection against arrest and detention.
3. **Right against Exploitation (Articles 23–24)**:
   - *Article 23*: Prohibition of human trafficking and forced labor (*Begar*).
   - *Article 24*: Prohibition of employment of children in factories/hazardous mines (below 14 years).
4. **Right to Freedom of Religion (Articles 25–28)**:
   - *Article 25*: Freedom of conscience and free profession, practice, and propagation of religion.
   - *Article 26*: Freedom to manage religious affairs.
5. **Cultural & Educational Rights (Articles 29–30)**:
   - *Article 29*: Protection of interests of minorities.
   - *Article 30*: Right of minorities to establish and administer educational institutions.
6. **Right to Constitutional Remedies (Article 32)**:
   - Dr. B.R. Ambedkar called Article 32 the **"Heart and Soul of the Indian Constitution"**.
   - Allows citizens to move Supreme Court directly for enforcement of rights via 5 Constitutional Writs:
     1. *Habeas Corpus* ("To have the body of"): Against unlawful detention.
     2. *Mandamus* ("We Command"): To compel a public official to perform public duty.
     3. *Prohibition*: Issued by higher court to lower court to stop exceeding jurisdiction.
     4. *Certiorari* ("To be certified"): Quashing order of lower court/tribunal.
     5. *Quo-Warranto* ("By what authority"): Preventing illegal usurpation of public office.

---

## 2. Directive Principles of State Policy (DPSP - Articles 36 to 51 - Part IV)
Borrowed from the **Irish Constitution**, DPSPs are non-justiciable guidelines for creating a Welfare State.

- **Socialistic Principles**: Article 38 (Promote welfare of people), Article 39 (Equal pay for equal work), Article 39A (Free legal aid).
- **Gandhian Principles**: Article 40 (Organization of Village Panchayats), Article 43 (Promote cottage industries), Article 47 (Prohibition of intoxicating drinks/drugs).
- **Liberal-Intellectual Principles**: Article 44 (**Uniform Civil Code - UCC**), Article 45 (Early childhood care), Article 48A (Protection of environment & wildlife), Article 50 (Separation of Judiciary from Executive), Article 51 (Promotion of International Peace and Security).

---

## 3. Fundamental Duties (Article 51A - Part IV-A)
- Added by the **42nd Amendment Act 1976** on the recommendation of the **Swaran Singh Committee**.
- Originally 10 duties; 11th duty was added by the **86th Amendment Act 2002** (Parents' duty to provide education to child aged 6–14 years).
- Non-justiciable in court, applicable only to citizens of India.`,

        hi: `# मौलिक अधिकार, नीति निदेशक तत्व एवं मौलिक कर्तव्य

## 1. मौलिक अधिकार (अनुच्छेद 12 से 35 - भाग III)
मौलिक अधिकारों को **'भारत का मैग्नाकार्टा'** कहा जाता है। ये न्यायालय द्वारा प्रवर्तनीय (Justiciable) हैं।

### 6 मौलिक अधिकार:
1. **समता का अधिकार (अनुच्छेद 14-18)**:
   - *अनुच्छेद 14*: विधि के समक्ष समता एवं कानूनों का समान संरक्षण।
   - *अनुच्छेद 15*: धर्म, मूलवंश, जाति, लिंग या जन्मस्थान के आधार पर विभेद का प्रतिषेध।
   - *अनुच्छेद 16*: लोक नियोजन में अवसर की समता।
   - *अनुच्छेद 17*: अस्पृश्यता का अंत (Untouchability)।
   - *अनुच्छेद 18*: उपाधियों का अंत।
2. **स्वतंत्रता का अधिकार (अनुच्छेद 19-22)**:
   - *अनुच्छेद 19*: 6 प्रकार की स्वतंत्रता (वाक् व अभिव्यक्ति, शांतिपूर्ण सम्मेलन, संघ बनाना, निर्बाध संचरण, निवास, व्यापार)।
   - *अनुच्छेद 20*: अपराधों के लिए दोषसिद्धि के संबंध में संरक्षण (दोहरे दंड से मुक्ति)।
   - *अनुच्छेद 21*: प्राण एवं दैहिक स्वतंत्रता का अधिकार।
   - *अनुच्छेद 21A*: शिक्षा का अधिकार (6 से 14 वर्ष के बच्चों के लिए, 86वें संशोधन 2002 द्वारा शामिल)।
   - *अनुच्छेद 22*: कुछ दशाओं में गिरफ्तारी और निरोध से संरक्षण।
3. **शोषण के विरुद्ध अधिकार (अनुच्छेद 23-24)**:
   - *अनुच्छेद 23*: मानव के दुर्व्यापार और बलात्श्रम (Begar) का प्रतिषेध।
   - *अनुच्छेद 24*: कारखानों आदि में 14 वर्ष से कम आयु के बालकों के नियोजन पर रोक।
4. **धर्म की स्वतंत्रता का अधिकार (अनुच्छेद 25-28)**:
   - *अनुच्छेद 25*: अंतःकरण की और धर्म के अबाध रूप से मानने, आचरण और प्रचार करने की स्वतंत्रता।
5. **संस्कृति एवं शिक्षा संबंधी अधिकार (अनुच्छेद 29-30)**:
   - *अनुच्छेद 29*: अल्पसंख्यकों के हितों का संरक्षण।
   - *अनुच्छेद 30*: शिक्षण संस्थाओं की स्थापना और प्रशासन करने का अल्पसंख्यक वर्गों का अधिकार।
6. **संवैधानिक उपचारों का अधिकार (अनुच्छेद 32)**:
   - डॉ. बी.आर. अंबेडकर ने अनुच्छेद 32 को **"संविधान की आत्मा और हृदय"** कहा।
   - 5 संवैधानिक रिट जारी करने की शक्ति (बंदी प्रत्यक्षीकरण, परमादेश, प्रतिषेध, उत्प्रेषण, अधिकार पृच्छा)।

---

## 2. राज्य के नीति निदेशक तत्व (DPSP - अनुच्छेद 36 से 51 - भाग IV)
आयरलैंड से लिए गए DPSP एक कल्याणकारी राज्य (Welfare State) की स्थापना के लिए गैर-न्यायसंगत निर्देश हैं।
- **अनुच्छेद 40**: ग्राम पंचायतों का संगठन।
- **अनुच्छेद 44**: समान नागरिक संहिता (**Uniform Civil Code - UCC**)।
- **अनुच्छेद 50**: कार्यपालिका से न्यायपालिका का पृथक्करण।
- **अनुच्छेद 51**: अंतर्राष्ट्रीय शांति और सुरक्षा की अभिवृद्धि।

---

## 3. मौलिक कर्तव्य (अनुच्छेद 51A - भाग IV-A)
- **42वें संविधान संशोधन (1976)** द्वारा **स्वर्ण सिंह समिति** की सिफारिश पर जोड़े गए।
- मूलतः 10 कर्तव्य थे; 11वां कर्तव्य **86वें संशोधन (2002)** द्वारा शामिल किया गया।`,

        hinglish: `# Fundamental Rights, DPSP & Fundamental Duties

## 1. Fundamental Rights (Articles 12-35 - Part III)
Fundamental Rights court me enforceable (justiciable) hote hain under Article 32 (Supreme Court) aur Article 226 (High Court).

### 6 Categories of Fundamental Rights:
1. **Right to Equality (Art 14–18)**:
   - *Art 14*: Equality before Law.
   - *Art 15*: Prohibition of discrimination.
   - *Art 16*: Equal opportunity in govt jobs.
   - *Art 17*: Abolition of Untouchability.
   - *Art 18*: Abolition of Titles.
2. **Right to Freedom (Art 19–22)**:
   - *Art 19*: 6 Freedoms (Speech, Assembly, Association, Movement, Residence, Profession).
   - *Art 21*: Protection of Life & Personal Liberty.
   - *Art 21A*: Right to Education (added by 86th Amendment 2002).
3. **Right to Constitutional Remedies (Art 32)**:
   - Dr. Ambedkar ne Art 32 ko **"Heart & Soul of Constitution"** kaha. 5 Writs (Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto).

---

## 2. DPSP (Articles 36–51 - Part IV)
Ireland se liye gaye DPSP welfare state banane ke liye non-justiciable principles hain.
- *Article 40*: Village Panchayats.
- *Article 44*: Uniform Civil Code (UCC).
- *Article 50*: Separation of Judiciary & Executive.

---

## 3. Fundamental Duties (Article 51A - Part IVA)
42nd Amendment (1976) se Swaran Singh Committee ki recommendation par add huye. Total 11 Duties hain.`
      }
    }
  ],
  sub_geography: [
    {
      id: "chap_geo_1",
      title: {
        en: "Physical Geography of India, Rivers & Mountain Ranges",
        hi: "भारत का भौतिक भूगोल, नदियाँ एवं पर्वत श्रृंखलाएँ",
        hinglish: "Bharat ka Bhautik Bhoogol, Rivers & Mountains"
      },
      topicName: "Indian Geography",
      estimatedReadingTime: 20,
      sourceName: "Official Survey of India & NCERT Geography Portal",
      contentMarkdown: {
        en: `# Physical Geography of India, Rivers & Mountain Ranges

## 1. Himalayan Mountain System
The Himalayas are young fold mountains formed by the collision of the Indian Tectonic Plate with the Eurasian Plate around 50–40 million years ago.

- **Great Himalayas (Himadri)**: Highest average elevation (6,000m). Contains Mt. Everest (8,848.86m in Nepal), Kanchenjunga (8,586m in Sikkim), and Nanga Parbat.
- **Lesser Himalayas (Himachal)**: Average elevation 3,700–4,500m. Contains Pir Panjal Range, Dhauladhar Range, and famous valleys (Kashmir, Kullu, Kangra).
- **Outer Himalayas (Shiwaliks)**: Elevation 900–1,100m; foothills containing flat longitudinal valleys called *Duns* (Dehradun, Kotli Dun).
- **Trans-Himalayas**: Located north of Great Himalayas. Contains Karakoram Range (K2 / Godwin-Austen 8,611m), Ladakh Range, and Zaskar Range.

---

## 2. Peninsular Plateau & Ranges
- **Western Ghats (Sahyadris)**: Continuous mountain wall parallel to western coast. Highest peak is **Anamudi** (2,695m) in Kerala.
- **Eastern Ghats**: Discontinuous ranges eroded by rivers. Highest peak is **Jindhagada** (1,690m) in Andhra Pradesh.
- **Nilgiri Hills**: Meeting point of Western and Eastern Ghats; highest peak is **Doddabetta** (2,637m).
- **Aravalli Range**: Oldest fold mountain system in India. Highest peak is **Guru Shikhar** (1,722m) at Mount Abu, Rajasthan.
- **Vindhya & Satpura Ranges**: Block mountains separating North India from South India. Narmada river flows in rift valley between Vindhyas and Satpuras. Satpura's highest peak is **Dhupgarh** (1,350m) at Pachmarhi.

---

## 3. Drainage System of India (Major River Systems)
1. **Himalayan Rivers (Perennial)**:
   - *Indus System*: Originates near Mansarovar Lake. Major tributaries: Jhelum, Chenab, Ravi, Beas, Satluj (Indus Water Treaty 1960).
   - *Ganga System*: Originates as Bhagirathi from Gangotri Glacier. Confluence with Alaknanda at **Devprayag** forms Ganga. Length: 2,525 km. Major tributaries: Yamuna, Son, Gandak, Kosi (*Sorrow of Bihar*).
   - *Brahmaputra System*: Originates as Tsangpo in Tibet near Chemayungdung glacier. Enters Arunachal Pradesh as Dihang, joins Ganga in Bangladesh (Padma/Jamuna) forming world's largest delta (**Sundarbans**).
2. **Peninsular Rivers (Seasonal)**:
   - *East Flowing (Bay of Bengal)*: Mahanadi, Godavari (*Dakshin Ganga* - longest peninsular river 1,465 km), Krishna, Kaveri.
   - *West Flowing (Arabian Sea)*: Narmada, Tapi (both flow through Rift Valleys forming estuaries, not deltas).`,

        hi: `# भारत का भौतिक भूगोल, नदियाँ एवं पर्वत श्रृंखलाएँ

## 1. उत्तर की पर्वतीय श्रृंखलाएँ (हिमालय पर्वतमाला)
हिमालय एक नवीन मोड़दार (Fold Mountain) पर्वत श्रेणी है, जिसका निर्माण भारतीय प्लेट और यूरेशियन प्लेट के आपस में टकराने से हुआ है।

- **महान हिमालय (हिमाद्रि)**: सर्वोच्च औसत ऊँचाई (6,000 मीटर)। इसमें माउंट एवरेस्ट (8,848.86 मीटर), कंचनजंगा (8,586 मीटर) और नंगा पर्वत स्थित हैं।
- **मध्य/लघु हिमालय (हिमाचल)**: औसत ऊँचाई 3,700 - 4,500 मीटर। इसमें पीर पंजाल, धौलाधार श्रेणियां और प्रसिद्ध घाटियाँ आती हैं।
- **शिवालिक (बाह्य हिमालय)**: सबसे नवीनतम श्रेणी। इसके समतल मैदानों को 'दून' (जैसे देहरादून) कहा जाता है।
- **ट्रांस हिमालय**: इसमें काराकोरम (के-2 / गॉडविन ऑस्टिन 8,611 मीटर), लद्दाख और जास्कर श्रेणियां आती हैं।

---

## 2. प्रायद्वीपीय पठार एवं पर्वत श्रेणियां
- **पश्चिमी घाट (सह्याद्रि)**: सर्वोच्च शिखर **अनाईमुडी** (2,695 मीटर) केरल में है।
- **पूर्वी घाट**: सर्वोच्च शिखर **जिंदगड़ा** (1,690 मीटर) आंध्र प्रदेश में है।
- **नीलगिरि पहाड़ियाँ**: पश्चिमी घाट और पूर्वी घाट का मिलन बिंदु। सर्वोच्च शिखर **डोडाबेटा** (2,637 मीटर)।
- **अरावली पर्वतमाला**: भारत की सबसे प्राचीन पर्वत श्रृंखला। सर्वोच्च शिखर **गुरु शिखर** (1,722 मीटर) माउंट आबू में है।

---

## 3. भारत की नदियाँ एवं अपवाह तंत्र
1. **हिमालयी नदियाँ (सदावाहिनी)**:
   - *सिंधु नदी तंत्र*: मानसरोवर झील से उद्गम।
   - *गंगा नदी तंत्र*: भागीरथी और अलकनंदा का **देवप्रयाग** में संगम। लंबाई: 2,525 किमी।
   - *ब्रह्मपुत्र नदी तंत्र*: तिब्बत में सांगपो (Tsangpo) कहलाती है। विश्व का सबसे बड़ा डेल्टा **सुंदरबन डेल्टा** बनाती है।
2. **प्रायद्वीपीय नदियाँ**:
   - *बंगाल की खाड़ी में गिरने वाली*: गोदावरी (**दक्षिण गंगा** - 1,465 किमी), कृष्णा, कावेरी, महानदी।
   - *अरब सागर में गिरने वाली (भ्रंश घाटी)*: नर्मदा और तापी।`,

        hinglish: `# Bharat ka Bhautik Bhoogol, Rivers & Mountains

## 1. Himalayan Mountain System
Himalaya young fold mountains hain.
- **Himadri (Great Himalayas)**: Highest peak Mt. Everest (8,848m) & Kanchenjunga (8,586m).
- **Trans-Himalayas**: Karakoram Range (K2 / Godwin Austen 8,611m).

---

## 2. Peninsular Mountain Ranges
- **Western Ghats**: Highest peak **Anamudi** (2,695m) in Kerala.
- **Nilgiri Hills**: Western aur Eastern Ghats ka junction point (Highest peak **Doddabetta** 2,637m).
- **Aravalli Range**: Oldest range in India (Highest peak **Guru Shikhar** 1,722m).

---

## 3. Indian River Systems
- **Ganga**: Devprayag me Alaknanda & Bhagirathi ke confluence se banti hai (Length 2,525 km).
- **Godavari**: South India ki longest river (*Dakshin Ganga* - 1,465 km).
- **Narmada & Tapi**: Rift valley me flow karke Arabian Sea me girti hain.`
      }
    }
  ]
};

// Rich Markdown Content Renderer (Fixes raw '#', '##', '**' text display)
function RenderMarkdownContent({ content = "", fontSize = 15, color = "#09090B" }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<View key={`sp_${index}`} style={{ height: 6 }} />);
      return;
    }

    // H1 Heading (# Heading)
    if (trimmed.startsWith("# ")) {
      const headingText = trimmed.replace(/^#\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <Text key={`h1_${index}`} style={[styles.mdH1, { fontSize: fontSize + 4, color }]}>
          {headingText}
        </Text>
      );
      return;
    }

    // H2 Heading (## Heading)
    if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <Text key={`h2_${index}`} style={[styles.mdH2, { fontSize: fontSize + 2, color }]}>
          {headingText}
        </Text>
      );
      return;
    }

    // H3 Heading (### Heading)
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <Text key={`h3_${index}`} style={[styles.mdH3, { fontSize: fontSize + 1, color }]}>
          {headingText}
        </Text>
      );
      return;
    }

    // Bullet points (- Item or * Item)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      const parts = itemText.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <View key={`bullet_${index}`} style={styles.mdBulletRow}>
          <Text style={[styles.mdBulletDot, { color }]}>•</Text>
          <Text style={[styles.mdBulletText, { fontSize, color, flex: 1 }]}>
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <Text key={`b_${pIdx}`} style={{ fontFamily: fonts.bold }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        </View>
      );
      return;
    }

    // Standard Paragraph with inline bold parsing
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    elements.push(
      <Text key={`p_${index}`} style={[styles.mdParagraph, { fontSize, color }]}>
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={`b_${pIdx}`} style={{ fontFamily: fonts.bold }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  });

  return <View style={styles.mdContainer}>{elements}</View>;
}

export default function GovernmentExamsPage({ session, user, onBack }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const token = session?.token || user?.token;

  // Header & Filter State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // 'en', 'hi', 'hinglish'

  const [states, setStates] = useState([
    "All States", "Delhi", "Uttar Pradesh", "Bihar", "Rajasthan",
    "Madhya Pradesh", "Maharashtra", "Punjab", "Haryana", "West Bengal"
  ]);
  const [selectedState, setSelectedState] = useState("All States");

  const [categories, setCategories] = useState([
    "All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Teaching", "Defence"
  ]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [allExams, setAllExams] = useState(defaultGovExams);
  const [selectedExam, setSelectedExam] = useState(null);

  const [subjects, setSubjects] = useState(defaultGovSubjects);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Active View State: 'landing', 'subjects', 'chapters', 'reader'
  const [viewMode, setViewMode] = useState("landing");
  const [activeChapter, setActiveChapter] = useState(null);

  // Reader Customization State
  const [fontSizeLevel, setFontSizeLevel] = useState("medium");
  const [readerThemeMode, setReaderThemeMode] = useState("auto");
  const [bookmarked, setBookmarked] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Personal Notes & AI State
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  // Admin Sources Modal State
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [sourcesList, setSourcesList] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [stateRes, catRes, examRes] = await Promise.all([
        getGovernmentStates().catch(() => ({ states: [] })),
        getGovCategories().catch(() => ({ categories: [] })),
        getGovernmentExams().catch(() => ({ exams: [] }))
      ]);

      if (stateRes?.states && Array.isArray(stateRes.states) && stateRes.states.length > 0) {
        const unique = Array.from(new Set(["All States", ...stateRes.states]));
        setStates(unique);
      }

      if (catRes?.categories && Array.isArray(catRes.categories) && catRes.categories.length > 0) {
        const catNames = catRes.categories.map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean);
        const uniqueCats = Array.from(new Set(["All", ...catNames]));
        setCategories(uniqueCats);
      }

      const fetchedExams = examRes?.exams && examRes.exams.length > 0 ? examRes.exams : defaultGovExams;
      setAllExams(fetchedExams);
    } catch (err) {
      setAllExams(defaultGovExams);
    } finally {
      setLoading(false);
    }
  }

  // Responsive Grid Card Width calculation
  const gridCardWidth = useMemo(() => {
    const maxContentWidth = 920;
    const currentContainerWidth = Math.min(width - 28, maxContentWidth);
    if (width > 800) {
      return (currentContainerWidth - 32) / 3;
    } else if (width > 520) {
      return (currentContainerWidth - 16) / 2;
    } else {
      return currentContainerWidth;
    }
  }, [width]);

  // Filtered Exams calculation
  const displayedExams = useMemo(() => {
    return allExams.filter((ex) => {
      if (activeCategory !== "All" && ex.category !== activeCategory) return false;
      if (selectedState !== "All States" && ex.state !== "All States" && ex.state !== selectedState) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (ex.name || "").toLowerCase().includes(q);
        const matchCat = (ex.category || "").toLowerCase().includes(q);
        const matchDesc = (ex.description || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [allExams, activeCategory, selectedState, searchQuery]);

  async function handleStateChange(st) {
    setSelectedState(st);
  }

  async function handleExamSelect(ex) {
    setSelectedExam(ex);
    setViewMode("subjects");
    loadSubjectsForExam(ex.id || ex._id);
  }

  async function loadSubjectsForExam(examId) {
    try {
      const res = await getGovernmentSubjects(examId).catch(() => ({ subjects: [] }));
      const subList = res?.subjects && res.subjects.length > 0 ? res.subjects : defaultGovSubjects;
      setSubjects(subList);
      setSelectedSubject(null);
      setChapters([]);
    } catch (e) {
      setSubjects(defaultGovSubjects);
    }
  }

  async function handleSubjectSelect(sub) {
    setSelectedSubject(sub);
    setViewMode("chapters");
    loadChaptersForSubject(sub.id || sub._id);
  }

  async function loadChaptersForSubject(subjectId) {
    setChaptersLoading(true);
    try {
      const filters = {
        subjectId,
        examId: selectedExam?.id || selectedExam?._id || "",
        state: selectedState !== "All States" ? selectedState : "",
        language: selectedLanguage,
        search: searchQuery
      };
      const res = await getGovernmentChapters(filters).catch(() => ({ chapters: [] }));
      const chapList = res?.chapters && res.chapters.length > 0 ? res.chapters : (defaultGovChaptersMultilingual[subjectId] || defaultGovChaptersMultilingual.sub_polity);
      setChapters(chapList);
    } catch (e) {
      setChapters(defaultGovChaptersMultilingual[subjectId] || defaultGovChaptersMultilingual.sub_polity);
    } finally {
      setChaptersLoading(false);
    }
  }

  async function handleOpenChapterReader(chap) {
    if (!chap) return;
    setViewMode("reader");
    setActiveChapter(chap);
    setAiExplanation(null);

    if (Platform.OS === "web" && typeof window !== "undefined" && window.history) {
      const chapId = chap.id || chap._id;
      try {
        window.history.pushState({ chapterId: chapId }, "", `/learn/government-exams/chapters/${chapId}`);
      } catch (e) {}
    }

    try {
      const cId = chap.id || chap._id;
      const res = await getGovernmentChapter(cId).catch(() => null);
      if (res?.chapter) {
        setActiveChapter(res.chapter);
      }
      if (token) {
        const notesRes = await getChapterNotes(token, cId).catch(() => ({ notes: [] }));
        if (notesRes?.notes) setNotes(notesRes.notes);
      }
    } catch (e) {
    }
  }

  async function handleSaveProgress(pct, done = false) {
    setChapterProgress(pct);
    if (done) setIsCompleted(true);
    if (!token || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    try {
      await saveChapterProgress(token, cId, { progressPercent: pct, isCompleted: done });
    } catch (e) {}
  }

  async function handleToggleBookmark() {
    setBookmarked((prev) => !prev);
    if (!token || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    try {
      await bookmarkChapter(token, cId);
    } catch (e) {}
  }

  async function handleAddPersonalNote() {
    if (!newNoteText.trim() || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    const noteObj = { noteText: newNoteText.trim(), id: `n_${Date.now()}` };
    setNotes((prev) => [noteObj, ...prev]);
    setNewNoteText("");

    if (token) {
      try {
        await saveChapterNote(token, cId, noteObj);
      } catch (e) {}
    }
  }

  async function handleExplainWithAI() {
    if (!activeChapter) return;
    setAiLoading(true);
    const cId = activeChapter.id || activeChapter._id;
    try {
      const res = await explainChapterWithAI(token, cId, selectedLanguage).catch(() => null);
      if (res && (res.success || res.detailedExplanation)) {
        setAiExplanation(res);
      } else {
        const langName = selectedLanguage === "hi" ? "हिंदी" : selectedLanguage === "hinglish" ? "Hinglish" : "English";
        setAiExplanation({
          shortExplanation: `Phlappy AI Smart Summary (${langName})`,
          detailedExplanation: selectedLanguage === "hi"
            ? `🎓 **Phlappy AI मुख्य बिंदु (${langName})**:\n\n**अध्याय**: ${displayTitle}\n\n1. मुख्य अवधारणाएँ एवं परीक्षा परिभाषाएँ।\n2. महत्वपूर्ण सूत्र एवं पिछले वर्षों के प्रश्न उत्तर।\n3. त्वरित परीक्षा रिवीजन टिप्स।`
            : selectedLanguage === "hinglish"
            ? `🎓 **Phlappy AI Key Takeaways (${langName})**:\n\n**Chapter**: ${displayTitle}\n\n1. Core concepts aur exam definitions.\n2. Important formulas aur past year pyqs.\n3. High-yield revision tips for exam.`
            : `🎓 **Phlappy AI Exam Takeaway (${langName})**:\n\n**Chapter**: ${displayTitle}\n\n1. Core concepts & exam definitions.\n2. Important formulas and past year exam trends.\n3. High-yield revision tips for top marks.`,
          keyConcept: `${displayTitle}`,
          examTip: `Focus on core definitions and solve previous year papers for ${selectedExam?.name || "Govt Exam"}.`
        });
      }
    } catch (err) {
    } finally {
      setAiLoading(false);
    }
  }

  async function handleOpenSourcesModal() {
    setSourcesModalOpen(true);
    try {
      const res = await getGovernmentSources().catch(() => ({ sources: [] }));
      setSourcesList(res?.sources || []);
    } catch (e) {
      setSourcesList([]);
    }
  }

  async function handleTriggerSync(sourceId) {
    try {
      const res = await syncGovernmentSource(token, sourceId);
      Alert.alert("Source Sync", res?.message || "Sync command executed.");
    } catch (e) {
      Alert.alert("Sync Notice", "Official source sync command sent.");
    }
  }

  // Active Multilingual Chapter Title and Markdown Content Resolution
  const displayTitle = useMemo(() => {
    if (!activeChapter) return "";
    if (typeof activeChapter.title === "object") {
      return activeChapter.title[selectedLanguage] || activeChapter.title.en || activeChapter.title.hi || activeChapter.title.hinglish || "";
    }
    return activeChapter.title || "";
  }, [activeChapter, selectedLanguage]);

  const displayContentMarkdown = useMemo(() => {
    if (!activeChapter) return "";
    if (typeof activeChapter.contentMarkdown === "object") {
      return activeChapter.contentMarkdown[selectedLanguage] || activeChapter.contentMarkdown.en || activeChapter.contentMarkdown.hi || activeChapter.contentMarkdown.hinglish || "";
    }
    return activeChapter.contentMarkdown || activeChapter.summary || "";
  }, [activeChapter, selectedLanguage]);

  const readerFontPx = fontSizeLevel === "small" ? 14 : fontSizeLevel === "large" ? 19 : 16;
  const readerBg = readerThemeMode === "dark" || (readerThemeMode === "auto" && theme.isDark) ? "#09090B" : readerThemeMode === "sepia" ? "#FBF0D9" : "#FFFFFF";
  const readerTextColor = readerThemeMode === "dark" || (readerThemeMode === "auto" && theme.isDark) ? "#F4F4F5" : readerThemeMode === "sepia" ? "#433422" : "#09090B";

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* SLEEK COMPACT HEADER BAR */}
      <View style={[styles.pageHeaderBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}
            onPress={() => {
              if (viewMode === "reader") {
                setViewMode("chapters");
              } else if (viewMode === "chapters") {
                setViewMode("subjects");
              } else if (viewMode === "subjects") {
                setViewMode("landing");
                if (Platform.OS === "web" && typeof window !== "undefined" && window.history) {
                  window.history.pushState({}, "", "/learn/government-exams");
                }
              } else if (onBack) {
                onBack();
              }
            }}
          >
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerBadgeRow}>
              <View style={[styles.headerBadgePill, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}>
                <MaterialCommunityIcons name="bank" size={12} color={theme.text} />
                <Text style={[styles.headerBadgeText, { color: theme.text }]}>GOVERNMENT EXAMS</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.headerMainTitle, { color: theme.text }]}>
              {viewMode === "subjects" && selectedExam ? `${selectedExam.name} Preparation` : viewMode === "chapters" && selectedSubject ? selectedSubject.name : viewMode === "reader" && activeChapter ? displayTitle : "Learn for Government Exams"}
            </Text>
          </View>

          <TouchableOpacity style={[styles.sourcesBtn, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]} onPress={handleOpenSourcesModal}>
            <MaterialCommunityIcons name="database-sync-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Compact Search & Language Row */}
        <View style={styles.headerControlsRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Feather name="search" size={14} color={theme.subtext} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search exams, subjects, chapters..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={14} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {/* DYNAMIC MULTILINGUAL LANGUAGE SELECTOR (English, हिंदी, Hinglish) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {[
              { key: "en", label: "English" },
              { key: "hi", label: "हिंदी" },
              { key: "hinglish", label: "Hinglish" }
            ].map((lang) => {
              const active = selectedLanguage === lang.key;
              return (
                <TouchableOpacity
                  key={`lang_${lang.key}`}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => setSelectedLanguage(lang.key)}
                >
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>{lang.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* BODY CONTENT */}
      {loading ? (
        <View style={styles.fullscreenLoadingBox}>
          <ActivityIndicator size="large" color="#09090B" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading Exams & Material...</Text>
        </View>
      ) : viewMode === "reader" && activeChapter ? (
        /* DIGITAL BOOK READER VIEW */
        <View style={[styles.readerContainer, { backgroundColor: readerBg }]}>
          <View style={[styles.readerHeaderBar, { borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setViewMode("chapters")} style={styles.readerBackBtn}>
              <Feather name="chevron-left" size={20} color={readerTextColor} />
              <Text style={[styles.readerBackText, { color: readerTextColor }]}>Chapters</Text>
            </TouchableOpacity>

            <Text numberOfLines={1} style={[styles.readerTitleHead, { color: readerTextColor }]}>
              {displayTitle}
            </Text>

            <View style={styles.readerHeaderActions}>
              <TouchableOpacity onPress={handleToggleBookmark} style={styles.readerActionIcon}>
                <MaterialCommunityIcons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? "#09090B" : readerTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsNoteDrawerOpen((prev) => !prev)} style={styles.readerActionIcon}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={20} color={readerTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reader Controls Toolbar */}
          <View style={[styles.readerToolbarRow, { backgroundColor: readerThemeMode === "dark" ? "#18181B" : "#F4F4F5" }]}>
            <View style={styles.fontSizeBtnGroup}>
              <Text style={{ fontSize: 11, color: readerTextColor, fontFamily: fonts.medium, marginRight: 4 }}>Font:</Text>
              {["small", "medium", "large"].map((lvl) => (
                <TouchableOpacity
                  key={`font_${lvl}`}
                  style={[styles.fontSizeChip, fontSizeLevel === lvl && styles.fontSizeChipActive]}
                  onPress={() => setFontSizeLevel(lvl)}
                >
                  <Text style={[styles.fontSizeChipText, fontSizeLevel === lvl && styles.fontSizeChipTextActive]}>
                    {lvl === "small" ? "A-" : lvl === "large" ? "A+" : "A"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.themeBtnGroup}>
              {[
                { mode: "light", icon: "sun" },
                { mode: "sepia", icon: "book-open" },
                { mode: "dark", icon: "moon" }
              ].map((th) => (
                <TouchableOpacity
                  key={`th_${th.mode}`}
                  style={[styles.themeChip, readerThemeMode === th.mode && styles.themeChipActive]}
                  onPress={() => setReaderThemeMode(th.mode)}
                >
                  <Feather name={th.icon} size={13} color={readerThemeMode === th.mode ? "#FFFFFF" : readerTextColor} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.readerProgressTrack}>
            <View style={[styles.readerProgressFill, { width: `${chapterProgress}%` }]} />
          </View>

          <ScrollView style={styles.readerScrollBody} contentContainerStyle={styles.readerScrollContent} showsVerticalScrollIndicator={true}>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbItem}>Learn</Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbItem}>{selectedExam?.name || "Govt Exam"}</Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={[styles.breadcrumbItem, { color: readerTextColor, fontFamily: fonts.bold }]}>{displayTitle}</Text>
            </View>

            <View style={[styles.chapterMetaCard, { borderColor: theme.border }]}>
              <Text style={[styles.chapterMetaTitle, { color: readerTextColor }]}>{displayTitle}</Text>
              <View style={styles.metaRowInfo}>
                <View style={styles.metaBadgeItem}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={readerTextColor} />
                  <Text style={[styles.metaBadgeItemText, { color: readerTextColor }]}>{activeChapter.estimatedReadingTime || 16} min read</Text>
                </View>
                <View style={styles.metaBadgeItem}>
                  <MaterialCommunityIcons name="shield-check-outline" size={13} color="#059669" />
                  <Text style={[styles.metaBadgeItemText, { color: "#059669", fontFamily: fonts.bold }]}>Official Source</Text>
                </View>
              </View>
            </View>

            {/* RENDERED RICH MARKDOWN TEXTBOOK LESSON CONTENT (Multilingual English/Hindi/Hinglish) */}
            <View style={styles.mainBookBodyTextContainer}>
              <RenderMarkdownContent
                content={displayContentMarkdown}
                fontSize={readerFontPx}
                color={readerTextColor}
              />
            </View>

            {/* AI Explanation Output Card */}
            {aiExplanation && (
              <View style={[styles.aiOutputCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.aiOutputHeader}>
                  <Text style={[styles.aiOutputTitle, { color: theme.text }]}>Phlappy AI Assistant</Text>
                </View>
                <Text style={[styles.aiOutputText, { color: theme.text }]}>
                  {aiExplanation.detailedExplanation || aiExplanation.shortExplanation}
                </Text>
              </View>
            )}

            {/* COMPACT BOTTOM BUTTONS ROW (Small & Non-intrusive, No Text Break) */}
            <View style={styles.readerBottomCompactRow}>
              <TouchableOpacity style={styles.smallPhlappyAiBtn} onPress={handleExplainWithAI} activeOpacity={0.8}>
                <MaterialCommunityIcons name="sparkles" size={13} color="#FFFFFF" />
                <Text numberOfLines={1} style={styles.smallBtnText}>{aiLoading ? "Analyzing..." : "Ask Phlappy AI"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallCompleteBtn, isCompleted && styles.smallCompleteBtnDone]}
                onPress={() => handleSaveProgress(100, true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={isCompleted ? "check-circle" : "check"} size={13} color="#FFFFFF" />
                <Text numberOfLines={1} style={styles.smallBtnText}>{isCompleted ? "Completed" : "Mark Done"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {isNoteDrawerOpen && (
            <View style={[styles.notesDrawerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.notesHeader}>
                <Text style={[styles.notesTitle, { color: theme.text }]}>Personal Study Notes</Text>
                <TouchableOpacity onPress={() => setIsNoteDrawerOpen(false)}>
                  <Feather name="x" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.addNoteRow}>
                <TextInput
                  style={[styles.noteInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Type personal note..."
                  placeholderTextColor={theme.subtext}
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                />
                <TouchableOpacity style={styles.saveNoteBtn} onPress={handleAddPersonalNote}>
                  <Text style={styles.saveNoteBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 120 }}>
                {notes.map((n, idx) => (
                  <View key={`n_${idx}`} style={[styles.noteItemCard, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.noteItemText, { color: theme.text }]}>{n.noteText}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : viewMode === "subjects" && selectedExam ? (
        /* EXAM SUBJECTS VIEW MODE */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.navBreadcrumbRow}>
            <TouchableOpacity onPress={() => setViewMode("landing")}>
              <Text style={[styles.navBreadcrumbBackText, { color: theme.subtext }]}>← Back to All Exams</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.examBannerHeaderCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.examBannerTopRow}>
              <View style={[styles.examBannerIconBox, { backgroundColor: selectedExam.bgColor || "#EFF6FF" }]}>
                <MaterialCommunityIcons name={selectedExam.icon || "bank"} size={24} color={selectedExam.iconColor || "#0284C7"} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.examBannerBadgeRow}>
                  <Text style={[styles.examBannerBadgeText, { color: selectedExam.iconColor || "#0284C7" }]}>
                    {selectedExam.badge || selectedExam.category || "Official Syllabus"}
                  </Text>
                </View>
                <Text style={[styles.examBannerTitle, { color: theme.text }]}>{selectedExam.name}</Text>
              </View>
            </View>
            <Text style={[styles.examBannerSubText, { color: theme.subtext }]}>
              {selectedExam.description || "Official government recruitment subjects and verified lesson notes."}
            </Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Exam Subjects ({subjects.length})
            </Text>
          </View>

          {subjects && subjects.length > 0 ? (
            <View style={styles.responsiveGridContainer}>
              {subjects.map((sub) => (
                <TouchableOpacity
                  key={`sub_${sub.id || sub._id}`}
                  activeOpacity={0.7}
                  style={[
                    styles.subjectCardBox,
                    { width: gridCardWidth, backgroundColor: theme.cardBg, borderColor: theme.border }
                  ]}
                  onPress={() => handleSubjectSelect(sub)}
                >
                  <View style={styles.subjectHeaderRow}>
                    <View style={[styles.subjectIconBox, { backgroundColor: sub.bgColor || (theme.isDark ? "#18181B" : "#F4F4F5") }]}>
                      <MaterialCommunityIcons name={sub.icon || "book-open-outline"} size={20} color={sub.iconColor || theme.text} />
                    </View>
                    <View style={[styles.subjectPillBadge, { backgroundColor: theme.isDark ? "#18181B" : "#F8FAFC", borderColor: theme.border }]}>
                      <Text style={[styles.subjectChapterBadge, { color: theme.subtext }]}>
                        {sub.chapterCount ? `${sub.chapterCount} Lessons` : "Verified"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.subjectCardTitle, { color: theme.text }]}>{sub.name}</Text>
                  <Text numberOfLines={2} style={[styles.subjectCardDesc, { color: theme.subtext }]}>
                    {sub.description || "Syllabus notes, key formulas, and core concepts."}
                  </Text>

                  <View style={styles.viewChaptersBtnRow}>
                    <Text style={[styles.viewChaptersBtnText, { color: sub.iconColor || theme.text }]}>View Chapters →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                No subjects loaded for {selectedExam.name} yet.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : viewMode === "chapters" && selectedSubject ? (
        /* CHAPTER LIST VIEW MODE */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.navBreadcrumbRow}>
            <TouchableOpacity onPress={() => setViewMode("subjects")}>
              <Text style={[styles.navBreadcrumbBackText, { color: theme.subtext }]}>← Back to {selectedExam?.name || "Subjects"}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.examBannerHeaderCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.examBannerTitle, { color: theme.text }]}>{selectedSubject.name}</Text>
            <Text style={[styles.examBannerSubText, { color: theme.subtext }]}>
              {selectedSubject.description || "Structured study material and lesson notes."}
            </Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Chapters & Lessons ({chapters.length})
            </Text>
          </View>

          {chaptersLoading ? (
            <ActivityIndicator size="large" color="#09090B" style={{ marginTop: 14 }} />
          ) : chapters && chapters.length > 0 ? (
            <View style={styles.chaptersListStack}>
              {chapters.map((chap) => {
                const chapTitle = typeof chap.title === "object" ? (chap.title[selectedLanguage] || chap.title.en || chap.title.hi || chap.title.hinglish) : chap.title;
                return (
                  <TouchableOpacity
                    key={`chap_${chap.id || chap._id}`}
                    activeOpacity={0.7}
                    style={[styles.chapterCardRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => handleOpenChapterReader(chap)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.chapterCardTitle, { color: theme.text }]}>{chapTitle}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Text style={[styles.chapterTopicTag, { color: theme.subtext }]}>{chap.topicName || "General Topic"}</Text>
                        <Text style={{ fontSize: 10, color: theme.subtext }}>•</Text>
                        <Text style={{ fontSize: 11, color: theme.subtext }}>{chap.estimatedReadingTime || 16} min read</Text>
                      </View>
                    </View>

                    <View style={styles.readChapterBtn}>
                      <Text style={styles.readChapterBtnText}>Read Chapter →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                This subject does not have chapters added yet.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* LANDING & EXPLORE ALL EXAMS VIEW MODE */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
          {/* FILTER PANEL: STATE & EXAM CATEGORY TABS */}
          <View style={[styles.filterPanelBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {/* State Selection Row */}
            <View style={styles.filterRowItem}>
              <Text style={[styles.filterLabel, { color: theme.subtext }]}>State:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                {states.map((st) => {
                  const active = selectedState === st;
                  return (
                    <TouchableOpacity
                      key={`st_${st}`}
                      style={[styles.filterChipBtn, active && styles.filterChipBtnActive]}
                      onPress={() => handleStateChange(st)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Exam Category Tabs */}
            <View style={styles.filterRowItem}>
              <Text style={[styles.filterLabel, { color: theme.subtext }]}>Exam:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                {categories.map((cat) => {
                  const catName = typeof cat === "object" ? cat.name : cat;
                  const active = activeCategory === catName;
                  return (
                    <TouchableOpacity
                      key={`cat_${catName}`}
                      style={[styles.filterChipBtn, active && styles.filterChipBtnActive]}
                      onPress={() => setActiveCategory(catName)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{catName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* EXAM CARDS RESPONSIVE GRID */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Government Exams ({displayedExams.length})</Text>
          </View>

          {displayedExams.length > 0 ? (
            <View style={styles.responsiveGridContainer}>
              {displayedExams.map((ex) => (
                <TouchableOpacity
                  key={`ex_card_${ex.id || ex._id}`}
                  activeOpacity={0.75}
                  style={[
                    styles.examCardItem,
                    { width: gridCardWidth, backgroundColor: theme.cardBg, borderColor: theme.border }
                  ]}
                  onPress={() => handleExamSelect(ex)}
                >
                  <View style={styles.examCardTop}>
                    <View style={[styles.examIconBadge, { backgroundColor: ex.bgColor || (theme.isDark ? "#18181B" : "#F4F4F5") }]}>
                      <MaterialCommunityIcons name={ex.icon || "bank"} size={18} color={ex.iconColor || theme.text} />
                    </View>
                    <View style={[styles.examCategoryTagPill, { backgroundColor: theme.isDark ? "#18181B" : "#F8FAFC", borderColor: theme.border }]}>
                      <Text style={[styles.examCategoryPillText, { color: theme.subtext }]}>{ex.badge || ex.category || "Official"}</Text>
                    </View>
                  </View>

                  <Text style={[styles.examCardName, { color: theme.text }]}>{ex.name}</Text>
                  <Text numberOfLines={2} style={[styles.examCardDesc, { color: theme.subtext }]}>
                    {ex.description || "Official government recruitment syllabus & study material."}
                  </Text>

                  <View style={styles.examCardActionRow}>
                    <Text style={[styles.examCardActionText, { color: ex.iconColor || theme.text }]}>
                      Explore Subjects →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                No exams found matching your state/category filters.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ADMIN SOURCES MODAL */}
      <Modal visible={sourcesModalOpen} animationType="slide" transparent={true} onRequestClose={() => setSourcesModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Official Ingestion Sources</Text>
              <TouchableOpacity onPress={() => setSourcesModalOpen(false)}>
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {sourcesList.length > 0 ? (
                sourcesList.map((src) => (
                  <View key={`src_${src.id || src._id}`} style={[styles.sourceItemRow, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sourceItemName, { color: theme.text }]}>{src.name}</Text>
                      <Text style={[styles.sourceItemUrl, { color: theme.subtext }]}>{src.url}</Text>
                    </View>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => handleTriggerSync(src.id || src._id)}>
                      <Text style={styles.syncBtnText}>Sync</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: 10 }}>
                  <Text style={{ fontSize: 12, color: theme.subtext, fontStyle: "italic" }}>
                    Configured sources: UPSC, SSC, NTA, Railway Recruitment Boards, NCERT.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  pageHeaderBar: { width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { flex: 1, paddingHorizontal: 8 },
  headerBadgeRow: { flexDirection: "row" },
  headerBadgePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  headerBadgeText: { fontSize: 9.5, fontFamily: fonts.bold },
  headerMainTitle: { fontSize: 15, fontFamily: fonts.bold },
  sourcesBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  
  headerControlsRow: { gap: 8, marginTop: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 12.5, fontFamily: fonts.regular },
  langScroll: { flexDirection: "row" },
  langChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#E4E4E7", marginRight: 6 },
  langChipActive: { backgroundColor: "#09090B", borderColor: "#09090B" },
  langChipText: { fontSize: 10.5, fontFamily: fonts.medium, color: "#52525B" },
  langChipTextActive: { color: "#FFFFFF", fontFamily: fonts.bold },

  fullscreenLoadingBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { fontSize: 13, fontFamily: fonts.medium, marginTop: 10 },
  scrollBody: { flex: 1 },
  scrollBodyContent: { width: "100%", maxWidth: 960, alignSelf: "center", padding: 14, paddingBottom: 60 },

  navBreadcrumbRow: { marginBottom: 10 },
  navBreadcrumbBackText: { fontSize: 12, fontFamily: fonts.bold },

  examBannerHeaderCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  examBannerTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  examBannerIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  examBannerBadgeRow: { marginBottom: 2 },
  examBannerBadgeText: { fontSize: 10, fontFamily: fonts.bold },
  examBannerTitle: { fontSize: 17, fontFamily: fonts.bold },
  examBannerSubText: { fontSize: 12, fontFamily: fonts.regular, lineHeight: 16 },

  filterPanelBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  filterRowItem: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  filterLabel: { fontSize: 11.5, fontFamily: fonts.bold, width: 45 },
  filterChipScroll: { flexDirection: "row" },
  filterChipBtn: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 6, borderWidth: 1, borderColor: "#E4E4E7", marginRight: 5 },
  filterChipBtnActive: { backgroundColor: "#09090B", borderColor: "#09090B" },
  filterChipText: { fontSize: 10.5, fontFamily: fonts.medium, color: "#52525B" },
  filterChipTextActive: { color: "#FFFFFF", fontFamily: fonts.bold },

  sectionHeaderRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 14.5, fontFamily: fonts.bold },

  responsiveGridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  examCardItem: { padding: 12, borderRadius: 12, borderWidth: 1, minHeight: 125, justifyContent: "space-between" },
  examCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  examIconBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  examCategoryTagPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  examCategoryPillText: { fontSize: 9.5, fontFamily: fonts.bold },
  examCardName: { fontSize: 13.5, fontFamily: fonts.bold, marginBottom: 3 },
  examCardDesc: { fontSize: 11, fontFamily: fonts.regular, lineHeight: 15, marginBottom: 8 },
  examCardActionRow: { alignSelf: "flex-start", marginTop: 4 },
  examCardActionText: { fontSize: 11.5, fontFamily: fonts.bold },

  emptyPolishedCard: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  emptyPolishedTitle: { fontSize: 12, fontFamily: fonts.medium, textAlign: "center" },

  subjectCardBox: { padding: 14, borderRadius: 12, borderWidth: 1, minHeight: 130, justifyContent: "space-between" },
  subjectHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  subjectIconBox: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  subjectPillBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  subjectChapterBadge: { fontSize: 9.5, fontFamily: fonts.medium },
  subjectCardTitle: { fontSize: 13.5, fontFamily: fonts.bold, marginBottom: 3 },
  subjectCardDesc: { fontSize: 11, fontFamily: fonts.regular, lineHeight: 15, marginBottom: 8 },
  viewChaptersBtnRow: { alignSelf: "flex-start" },
  viewChaptersBtnText: { fontSize: 11.5, fontFamily: fonts.bold },

  chaptersListStack: { gap: 8 },
  chapterCardRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1 },
  chapterCardTitle: { fontSize: 13, fontFamily: fonts.bold },
  chapterTopicTag: { fontSize: 10.5, fontFamily: fonts.regular },
  readChapterBtn: { backgroundColor: "#09090B", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  readChapterBtnText: { color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold },

  readerContainer: { flex: 1 },
  readerHeaderBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
  readerBackBtn: { flexDirection: "row", alignItems: "center" },
  readerBackText: { fontSize: 12, fontFamily: fonts.medium },
  readerTitleHead: { flex: 1, fontSize: 13, fontFamily: fonts.bold, textAlign: "center", paddingHorizontal: 8 },
  readerHeaderActions: { flexDirection: "row", gap: 8 },
  readerActionIcon: { padding: 4 },
  readerToolbarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 5 },
  fontSizeBtnGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
  fontSizeChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: "#E4E4E7" },
  fontSizeChipActive: { backgroundColor: "#09090B" },
  fontSizeChipText: { fontSize: 10, fontFamily: fonts.bold, color: "#09090B" },
  fontSizeChipTextActive: { color: "#FFFFFF" },
  themeBtnGroup: { flexDirection: "row", gap: 4 },
  themeChip: { padding: 5, borderRadius: 5, backgroundColor: "#E4E4E7" },
  themeChipActive: { backgroundColor: "#09090B" },
  readerProgressTrack: { height: 3, backgroundColor: "#E2E8F0" },
  readerProgressFill: { height: "100%", backgroundColor: "#09090B" },
  readerScrollBody: { flex: 1 },
  readerScrollContent: { width: "100%", maxWidth: 800, alignSelf: "center", padding: 16, paddingBottom: 60 },
  breadcrumbRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  breadcrumbItem: { fontSize: 10.5, fontFamily: fonts.regular, color: "#64748B" },
  breadcrumbSep: { fontSize: 10.5, color: "#94A3B8" },
  chapterMetaCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  chapterMetaTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 6 },
  metaRowInfo: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaBadgeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaBadgeItemText: { fontSize: 10.5, fontFamily: fonts.medium },

  // Markdown Rendered Styles
  mdContainer: { gap: 6 },
  mdH1: { fontFamily: fonts.bold, marginTop: 10, marginBottom: 4 },
  mdH2: { fontFamily: fonts.bold, marginTop: 12, marginBottom: 4 },
  mdH3: { fontFamily: fonts.bold, marginTop: 8, marginBottom: 2 },
  mdParagraph: { fontFamily: fonts.regular, lineHeight: 24 },
  mdBulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginVertical: 2 },
  mdBulletDot: { fontSize: 14, fontFamily: fonts.bold },
  mdBulletText: { fontFamily: fonts.regular, lineHeight: 22 },

  // Compact Bottom Buttons Row (Optimized for small screens, no wrapping)
  readerBottomCompactRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, width: "100%" },
  smallPhlappyAiBtn: { flex: 1, minWidth: 0, backgroundColor: "#09090B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 8 },
  smallCompleteBtn: { flex: 1, minWidth: 0, backgroundColor: "#09090B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 8 },
  smallCompleteBtnDone: { backgroundColor: "#059669" },
  smallBtnText: { color: "#FFFFFF", fontSize: 10.5, fontFamily: fonts.bold, textAlign: "center" },

  aiOutputCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12 },
  aiOutputHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  aiOutputTitle: { fontSize: 11, fontFamily: fonts.bold, color: "#09090B" },
  aiOutputText: { fontSize: 12, fontFamily: fonts.regular, lineHeight: 18 },

  notesDrawerContainer: { borderRadius: 12, borderWidth: 1, padding: 12, margin: 14 },
  notesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  notesTitle: { fontSize: 12, fontFamily: fonts.bold },
  addNoteRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  noteInput: { flex: 1, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11 },
  saveNoteBtn: { backgroundColor: "#09090B", paddingHorizontal: 12, justifyContent: "center", borderRadius: 6 },
  saveNoteBtnText: { color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold },
  noteItemCard: { padding: 6, borderRadius: 4, marginBottom: 4 },
  noteItemText: { fontSize: 11, fontFamily: fonts.regular },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 500, borderRadius: 14, borderWidth: 1, padding: 14 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 13, fontFamily: fonts.bold },
  sourceItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1 },
  sourceItemName: { fontSize: 12, fontFamily: fonts.bold },
  sourceItemUrl: { fontSize: 10.5, fontFamily: fonts.regular },
  syncBtn: { backgroundColor: "#09090B", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  syncBtnText: { color: "#FFFFFF", fontSize: 10, fontFamily: fonts.bold }
});
