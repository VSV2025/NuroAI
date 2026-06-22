export const overviewStats = [
  { label: "Documents Processed", value: "48,217", delta: "+12.4%", up: true },
  { label: "Risk Alerts", value: "1,309", delta: "+3.1%", up: true },
  { label: "AI-Laundering Detections", value: "612", delta: "+18.7%", up: true },
  { label: "Authorship Violations", value: "274", delta: "-4.2%", up: false },
];

export const detectionTrends = [
  { week: "W1", direct: 120, ai: 64, crossLang: 22, idea: 31 },
  { week: "W2", direct: 132, ai: 78, crossLang: 28, idea: 35 },
  { week: "W3", direct: 101, ai: 96, crossLang: 31, idea: 44 },
  { week: "W4", direct: 145, ai: 121, crossLang: 39, idea: 52 },
  { week: "W5", direct: 138, ai: 150, crossLang: 44, idea: 61 },
  { week: "W6", direct: 162, ai: 188, crossLang: 51, idea: 70 },
  { week: "W7", direct: 154, ai: 214, crossLang: 58, idea: 83 },
  { week: "W8", direct: 178, ai: 247, crossLang: 64, idea: 96 },
];

export const threatDistribution = [
  { name: "AI-Laundered", value: 34, color: "#FF1E1E" },
  { name: "Direct Copy", value: 26, color: "#DC2626" },
  { name: "Cross-Language", value: 18, color: "#f59e0b" },
  { name: "Idea Theft", value: 14, color: "#a78bfa" },
  { name: "Code Reuse", value: 8, color: "#38bdf8" },
];

export const plagiarismCategories = [
  { category: "Essays", flagged: 412, clean: 1880 },
  { category: "Theses", flagged: 156, clean: 920 },
  { category: "Code", flagged: 233, clean: 740 },
  { category: "Reports", flagged: 318, clean: 1510 },
  { category: "Articles", flagged: 142, clean: 1102 },
];

export const languageAnalysis = [
  { lang: "EN", docs: 21400 },
  { lang: "ES", docs: 6120 },
  { lang: "ZH", docs: 4980 },
  { lang: "FR", docs: 3110 },
  { lang: "DE", docs: 2740 },
  { lang: "AR", docs: 1980 },
  { lang: "HI", docs: 1640 },
];

export type Detection = {
  key: string;
  label: string;
  score: number;
  confidence: number;
  evidence: string;
  reasoning: string;
};

export const detections: Detection[] = [
  {
    key: "direct",
    label: "Direct Plagiarism",
    score: 18,
    confidence: 99,
    evidence: "2 fragments match an indexed 2021 conference paper (DOI 10.1109/abc).",
    reasoning: "Verbatim n-gram overlap above the 12-token threshold across two passages.",
  },
  {
    key: "ai",
    label: "AI Paraphrasing",
    score: 81,
    confidence: 94,
    evidence: "Perplexity and burstiness curves match large-model output across §2–§4.",
    reasoning: "Token-level entropy is unusually uniform; phrasing was rewritten but structure preserved.",
  },
  {
    key: "cross",
    label: "Cross-Language",
    score: 63,
    confidence: 88,
    evidence: "High semantic alignment to a Spanish-language source after back-translation.",
    reasoning: "Embedding cosine similarity 0.91 once normalized across languages.",
  },
  {
    key: "idea",
    label: "Idea Plagiarism",
    score: 54,
    confidence: 79,
    evidence: "Argument scaffold mirrors an uncited 2019 dissertation chapter.",
    reasoning: "Concept graph overlap detected without lexical similarity — a paraphrase of reasoning.",
  },
  {
    key: "code",
    label: "Code Similarity",
    score: 27,
    confidence: 91,
    evidence: "One helper function shares an AST shape with a public repository.",
    reasoning: "Variables renamed but control flow and structure are identical.",
  },
  {
    key: "author",
    label: "Authorship Risk",
    score: 72,
    confidence: 86,
    evidence: "Writing style diverges sharply from the author's 14 prior submissions.",
    reasoning: "Stylometric distance exceeds the author's historical variance by 3.4σ.",
  },
];

// Authorship "Writing DNA" radar
export const writingDNA = [
  { trait: "Rhythm", author: 78, sample: 41 },
  { trait: "Vocabulary", author: 64, sample: 92 },
  { trait: "Sentence Struct.", author: 70, sample: 38 },
  { trait: "Consistency", author: 82, sample: 47 },
  { trait: "Punctuation", author: 60, sample: 88 },
  { trait: "Cadence", author: 74, sample: 35 },
];

export const explainableSections = [
  {
    id: "s1",
    text: "The proliferation of generative models has fundamentally reshaped the threat surface of academic integrity systems.",
    risk: 86,
    type: "AI Paraphrasing",
    reason: "Uniform token entropy and templated transition phrasing typical of model output.",
    sources: ["model-fingerprint-db", "perplexity-curve"],
  },
  {
    id: "s2",
    text: "Prior detection approaches relied almost exclusively on surface-level lexical overlap.",
    risk: 22,
    type: "Original",
    reason: "Consistent with the author's historical style; no external match.",
    sources: [],
  },
  {
    id: "s3",
    text: "We argue that authenticity must be evaluated across semantic, stylometric and structural dimensions simultaneously.",
    risk: 58,
    type: "Idea Plagiarism",
    reason: "Concept structure aligns with an uncited 2019 source after embedding comparison.",
    sources: ["concept-graph", "dissertation-2019"],
  },
];

export const codeBlocks = {
  left: `def merge(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i]); i += 1
        else:
            result.append(b[j]); j += 1
    return result + a[i:] + b[j:]`,
  right: `def combine(x, y):
    out = []
    p = q = 0
    while p < len(x) and q < len(y):
        if x[p] <= y[q]:
            out.append(x[p]); p += 1
        else:
            out.append(y[q]); q += 1
    return out + x[p:] + y[q:]`,
};

export const recentDocs = [
  { id: "DOC-9183", name: "thesis_final_v3.docx", risk: 81, status: "AI-Laundered", lang: "EN" },
  { id: "DOC-9180", name: "essay_history.pdf", risk: 34, status: "Low Risk", lang: "EN" },
  { id: "DOC-9178", name: "ensayo_clima.docx", risk: 63, status: "Cross-Language", lang: "ES" },
  { id: "DOC-9175", name: "sorting_lib.zip", risk: 27, status: "Code Reuse", lang: "—" },
  { id: "DOC-9171", name: "literature_review.pdf", risk: 92, status: "High Risk", lang: "EN" },
];
