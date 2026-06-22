# app/services/text_features.py
# Real text-processing helpers. These are genuine computations (no fakery):
# they extract measurable features that the detection logic uses.

import re
import math


def words(text):
    return re.findall(r"[a-z']+", text.lower())


def sentences(text):
    return [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]


def avg_sentence_length(text):
    s = sentences(text)
    if not s:
        return 0.0
    return len(words(text)) / len(s)


def burstiness(text):
    """Std-dev of sentence lengths. Human writing varies a lot; machine
    paraphrase is often unnaturally uniform (low burstiness)."""
    lens = [len(words(s)) for s in sentences(text)]
    if len(lens) < 2:
        return 0.0
    mean = sum(lens) / len(lens)
    variance = sum((x - mean) ** 2 for x in lens) / len(lens)
    return math.sqrt(variance)


def vocabulary_richness(text):
    """Type-Token Ratio = unique words / total words."""
    w = words(text)
    if not w:
        return 0.0
    return len(set(w)) / len(w)


def avg_word_length(text):
    w = words(text)
    if not w:
        return 0.0
    return sum(len(x) for x in w) / len(w)


def punctuation_density(text):
    """Punctuation marks per 100 characters."""
    if not text:
        return 0.0
    marks = len(re.findall(r"[,;:\"'()\-—]", text))
    return (marks / len(text)) * 100


def ngrams(text, n=4):
    """Overlapping word n-grams (shingles) as a set."""
    w = words(text)
    return {" ".join(w[i:i + n]) for i in range(len(w) - n + 1)}


def jaccard(set_a, set_b):
    if not set_a or not set_b:
        return 0.0
    inter = len(set_a & set_b)
    return inter / (len(set_a) + len(set_b) - inter)


def pct(x):
    return max(0, min(100, round(x)))


def count_syllables(word: str) -> int:
    word = word.lower().strip(".,;:!?\"'")
    if not word:
        return 0
    count = len(re.findall(r"[aeiou]+", word))
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def flesch_reading_ease(text: str) -> float:
    """Higher = easier to read (human norm ~60-70; AI text tends higher)."""
    sents = sentences(text)
    ws = words(text)
    if not sents or not ws:
        return 50.0
    asl = len(ws) / len(sents)
    asw = sum(count_syllables(w) for w in ws) / len(ws)
    return round(206.835 - 1.015 * asl - 84.6 * asw, 2)


def hapax_ratio(text: str) -> float:
    """Fraction of words appearing only once — proxy for lexical creativity."""
    ws = words(text)
    if not ws:
        return 0.0
    from collections import Counter
    freq = Counter(ws)
    return len([w for w, c in freq.items() if c == 1]) / len(freq)


def function_word_ratio(text: str) -> float:
    """Ratio of function words to total words."""
    FUNCTION = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does", "did",
        "will", "would", "could", "should", "may", "might", "shall", "can",
        "this", "that", "these", "those", "it", "its", "they", "them",
        "their", "he", "she", "we", "you", "i", "my", "your", "our",
    }
    ws = words(text)
    if not ws:
        return 0.0
    return sum(1 for w in ws if w in FUNCTION) / len(ws)
