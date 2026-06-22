# app/data/corpus.py
# Reference corpus for direct + semantic plagiarism detection.
# In production this would be an Elasticsearch / vector-DB index with millions
# of documents. Add entries here to increase coverage during development.

REFERENCE_CORPUS = [
    # ── Academic integrity ──────────────────────────────────────────────────────
    {
        "id": "ref-001",
        "source": "Journal of Academic Integrity, 2024, p.12",
        "text": (
            "Numerous studies have demonstrated that traditional detection mechanisms "
            "are insufficient for the modern landscape of generative text."
        ),
    },
    {
        "id": "ref-002",
        "source": "Open Encyclopedia — Plagiarism (2023)",
        "text": (
            "Plagiarism is the representation of another author's language thoughts "
            "ideas or expressions as one's own original work."
        ),
    },
    {
        "id": "ref-006",
        "source": "Nature — Scientific Writing Guide (2021)",
        "text": (
            "Academic writing requires clear attribution of sources. Failure to "
            "credit original authors constitutes a serious breach of scholarly ethics "
            "and may result in retraction or academic sanction."
        ),
    },
    {
        "id": "ref-007",
        "source": "IEEE Transactions on Education, 2023",
        "text": (
            "Authorship verification systems compare stylometric fingerprints derived "
            "from sentence length, vocabulary richness, and punctuation density to "
            "establish whether a submission matches a known author baseline."
        ),
    },
    {
        "id": "ref-009",
        "source": "UNESCO — Academic Integrity Framework (2023)",
        "text": (
            "Cross-language plagiarism occurs when an author translates content from "
            "a foreign-language source without citation, then presents it as original "
            "work in the submission language."
        ),
    },
    {
        "id": "ref-010",
        "source": "arXiv:2301.00001 — AI Detection Survey",
        "text": (
            "Detecting AI-generated text requires moving beyond perplexity measures "
            "to multi-feature classifiers that capture syntactic uniformity, "
            "semantic coherence patterns, and discourse structure."
        ),
    },
    # ── Machine learning / NLP ──────────────────────────────────────────────────
    {
        "id": "ref-003",
        "source": "Intro to Machine Learning, MIT OCW",
        "text": (
            "A neural network is a series of algorithms that endeavors to recognize "
            "underlying relationships in a set of data through a process that mimics "
            "the way the human brain operates."
        ),
    },
    {
        "id": "ref-004",
        "source": "AI Ethics Review, 2023",
        "text": (
            "The proliferation of large language models has fundamentally reshaped "
            "the threat surface of academic integrity systems worldwide."
        ),
    },
    {
        "id": "ref-005",
        "source": "Stanford NLP Group — Language Models (2022)",
        "text": (
            "Large language models are trained on massive corpora of text and learn "
            "to predict the next token, enabling them to generate coherent and "
            "contextually appropriate prose."
        ),
    },
    {
        "id": "ref-008",
        "source": "ACL Anthology — Semantic Similarity (2022)",
        "text": (
            "Sentence embeddings encode semantic meaning into dense vector "
            "representations. Cosine similarity between embeddings measures "
            "conceptual overlap independent of surface word choice."
        ),
    },
    {
        "id": "ref-011",
        "source": "DeepMind Technical Report (2023)",
        "text": (
            "Transformer architectures rely on self-attention mechanisms that allow "
            "the model to weigh the relevance of each token in a sequence relative "
            "to every other token, enabling long-range dependency capture."
        ),
    },
    {
        "id": "ref-012",
        "source": "OpenAI — GPT-4 Technical Report (2023)",
        "text": (
            "The model demonstrates human-level performance on a variety of "
            "professional and academic benchmarks, including the bar exam and "
            "medical licensing examination."
        ),
    },
    # ── Social sciences / humanities ────────────────────────────────────────────
    {
        "id": "ref-013",
        "source": "Annual Review of Sociology, 2022",
        "text": (
            "Social media platforms have fundamentally altered the way information "
            "spreads through society. The speed and reach of viral content create "
            "new challenges for misinformation detection and public discourse."
        ),
    },
    {
        "id": "ref-014",
        "source": "Harvard Educational Review, 2023",
        "text": (
            "Critical thinking skills are increasingly valued in higher education. "
            "Students who can evaluate evidence, identify logical fallacies, and "
            "construct well-reasoned arguments are better prepared for professional life."
        ),
    },
    {
        "id": "ref-015",
        "source": "Journal of Environmental Studies, 2022",
        "text": (
            "Climate change poses an existential threat to global biodiversity. "
            "Rising sea levels, extreme weather events, and shifting precipitation "
            "patterns are already affecting ecosystems across every continent."
        ),
    },
    # ── Economics / business ────────────────────────────────────────────────────
    {
        "id": "ref-016",
        "source": "IMF World Economic Outlook, 2024",
        "text": (
            "Global economic growth is projected to remain below historical averages "
            "as monetary tightening, geopolitical fragmentation, and reduced trade "
            "volumes weigh on productivity across major economies."
        ),
    },
    {
        "id": "ref-017",
        "source": "McKinsey Global Institute — AI Economics (2023)",
        "text": (
            "Artificial intelligence could contribute up to thirteen trillion dollars "
            "to the global economy by 2030, with automation of repetitive tasks "
            "driving the majority of productivity gains."
        ),
    },
    {
        "id": "ref-018",
        "source": "Journal of Finance, 2023",
        "text": (
            "Portfolio diversification reduces unsystematic risk by combining assets "
            "whose returns are not perfectly correlated. The efficient frontier "
            "represents the set of optimal portfolios offering maximum expected return "
            "for a given level of risk."
        ),
    },
    # ── Life sciences / medicine ────────────────────────────────────────────────
    {
        "id": "ref-019",
        "source": "New England Journal of Medicine, 2023",
        "text": (
            "Randomized controlled trials remain the gold standard for evaluating "
            "the efficacy and safety of pharmacological interventions. Double-blind "
            "placebo-controlled designs minimize both selection bias and observer bias."
        ),
    },
    {
        "id": "ref-020",
        "source": "Cell — CRISPR Review (2022)",
        "text": (
            "CRISPR-Cas9 gene editing technology allows researchers to precisely "
            "modify DNA sequences in living organisms. The system uses a guide RNA "
            "to direct the Cas9 enzyme to the target genomic location."
        ),
    },
    # ── History / political science ─────────────────────────────────────────────
    {
        "id": "ref-021",
        "source": "American Historical Review, 2022",
        "text": (
            "The Industrial Revolution transformed Western economies through "
            "mechanization of production, urbanization of labour, and the emergence "
            "of new social classes. These structural changes had lasting effects on "
            "political institutions and cultural norms."
        ),
    },
    {
        "id": "ref-022",
        "source": "International Security Journal, 2023",
        "text": (
            "Democratic backsliding refers to the gradual erosion of democratic norms, "
            "institutions, and practices by elected governments. Unlike coups, this "
            "process occurs incrementally and often within the formal bounds of law."
        ),
    },
    # ── AI-boilerplate patterns (for direct-match detection) ────────────────────
    {
        "id": "ref-023",
        "source": "GPT-4 boilerplate — Conclusion pattern",
        "text": (
            "In conclusion, artificial intelligence represents a transformative force "
            "that will continue to fundamentally reshape virtually every aspect of "
            "modern society and the global economy."
        ),
    },
    {
        "id": "ref-024",
        "source": "LLM boilerplate — Introduction pattern",
        "text": (
            "In today's rapidly evolving technological landscape, artificial "
            "intelligence has emerged as one of the most significant and far-reaching "
            "developments in human history. Its impact spans across multiple "
            "interconnected domains and generates substantial opportunities."
        ),
    },
    {
        "id": "ref-025",
        "source": "LLM boilerplate — Paragraph transition pattern",
        "text": (
            "Furthermore, it is important to note that the economic implications "
            "of this development are substantial and far-reaching. Moreover, the "
            "proliferation of these systems has fundamentally altered the way we "
            "approach complex problems across various domains."
        ),
    },
]
