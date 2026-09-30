# College Fees & Scholarships FAQ Chatbot

A local FAQ retrieval chatbot built with Python, NLTK and scikit-learn. It answers
questions about college fees and scholarships using **TF-IDF** and **Cosine Similarity**.
No cloud AI service or external API is used.

## Features
- 23 FAQ question-answer pairs in `faqs.json`
- Text preprocessing (lowercase, tokenisation, stop-word removal, simple synonym mapping)
- Similarity threshold of 0.25 with a fallback reply
- Web chat interface (HTML, CSS, JavaScript) and terminal CLI mode
- Browser-side TF-IDF fallback if the Python server is not running

## Setup
```
pip install -r requirements.txt
```
(Optional, for best NLTK results: `python -m nltk.downloader punkt punkt_tab stopwords`)

## Run
```
python chatbot.py            # web app at http://127.0.0.1:8000
python chatbot.py --cli      # terminal mode
python chatbot.py --port 9000
```
On Windows you can also double-click `run_web_app.bat`.

## Files
| File | Purpose |
|---|---|
| chatbot.py | NLP engine, HTTP server, CLI |
| faqs.json | FAQ knowledge base |
| index.html, style.css, script.js | Web interface |
| requirements.txt | Python dependencies |

## Limitations
Retrieval-based; depends on word overlap; no multi-turn memory; answers are predefined.
