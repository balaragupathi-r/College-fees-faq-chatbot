"""College Fees & Scholarships FAQ Chatbot (TF-IDF + Cosine Similarity)."""
import argparse, json, os, re, threading, webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity

try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    STOP = set(stopwords.words("english"))
    word_tokenize("test")
    USE_NLTK = True
except Exception:          # NLTK or its data missing -> simple fallback
    USE_NLTK = False
    STOP = set(ENGLISH_STOP_WORDS)

BASE = os.path.dirname(os.path.abspath(__file__))
THRESHOLD = 0.25
FALLBACK = ("Sorry, I could not find a matching answer. Please contact the "
            "accounts office or the scholarship coordinator.")
EMPTY = "Please type a question about college fees or scholarships."
# Simple synonym handling: map variants to one canonical word
SYNONYMS = {"fees": "fee", "charges": "fee", "payment": "pay", "paying": "pay",
            "paid": "pay", "scholarships": "scholarship", "bursary": "scholarship",
            "grant": "scholarship", "documents": "document", "certificate": "document",
            "refunds": "refund", "loans": "loan", "instalments": "instalment",
            "installment": "instalment", "installments": "instalment",
            "online": "online", "upi": "online", "deadline": "date"}

def preprocess(text):
    text = text.lower()
    tokens = word_tokenize(text) if USE_NLTK else re.findall(r"[a-z0-9]+", text)
    out = [SYNONYMS.get(t, t) for t in tokens if t.isalnum() and t not in STOP]
    return " ".join(out)

class FAQBot:
    def __init__(self, path=os.path.join(BASE, "faqs.json")):
        with open(path, encoding="utf-8") as f:
            self.faqs = json.load(f)
        self.vec = TfidfVectorizer()
        self.matrix = self.vec.fit_transform([preprocess(q["question"]) for q in self.faqs])

    def ask(self, question):
        clean = preprocess(question or "")
        if not clean:
            return {"answer": EMPTY, "matched": None, "score": 0.0}
        scores = cosine_similarity(self.vec.transform([clean]), self.matrix)[0]
        i = int(scores.argmax()); s = float(scores[i])
        if s >= THRESHOLD:
            return {"answer": self.faqs[i]["answer"], "matched": self.faqs[i]["question"], "score": round(s, 4)}
        return {"answer": FALLBACK, "matched": None, "score": round(s, 4)}

bot = FAQBot()

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        name = "index.html" if self.path in ("/", "") else self.path.lstrip("/")
        path = os.path.join(BASE, name)
        types = {".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json"}
        ext = os.path.splitext(name)[1]
        if ext in types and os.path.isfile(path) and os.path.dirname(os.path.abspath(path)) == BASE:
            with open(path, "rb") as f:
                self._send(200, f.read(), types[ext] + "; charset=utf-8")
        else:
            self._send(404, b"Not found", "text/plain")

    def do_POST(self):
        if self.path != "/ask":
            return self._send(404, b"Not found", "text/plain")
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            res = bot.ask(data.get("question", ""))
        except Exception:
            res = {"answer": EMPTY, "matched": None, "score": 0.0}
        self._send(200, json.dumps(res).encode("utf-8"), "application/json")

    def log_message(self, *a):
        pass

def cli():
    print("Fees & Scholarships FAQ Chatbot (type 'exit' to quit)")
    while True:
        try:
            q = input("You: ").strip()
        except EOFError:
            break
        if q.lower() in ("exit", "quit"):
            break
        r = bot.ask(q)
        print("Bot:", r["answer"])
        if r["matched"]:
            print(f"     [Matched: {r['matched']} | Score: {r['score']:.4f}]")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--cli", action="store_true")
    p.add_argument("--port", type=int, default=8000)
    a = p.parse_args()
    if a.cli:
        return cli()
    url = f"http://127.0.0.1:{a.port}"
    print(f"Loaded {len(bot.faqs)} FAQs. Serving at {url} (Ctrl+C to stop)")
    threading.Timer(1, lambda: webbrowser.open(url)).start()
    try:
        HTTPServer(("127.0.0.1", a.port), Handler).serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")

if __name__ == "__main__":
    main()
