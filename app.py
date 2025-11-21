from flask import Flask, render_template, request, jsonify
import re
from pathlib import Path

app = Flask(__name__, static_url_path="/static", static_folder="static", template_folder="templates")

BADWORDS_PATH = Path("badwords.txt")

def load_badwords():
    if BADWORDS_PATH.exists():
        # 한 줄에 하나, 공백/주석(#..) 무시
        lines = []
        for line in BADWORDS_PATH.read_text(encoding="utf-8").splitlines():
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            lines.append(s)
        return lines
    return []

badwords = load_badwords()

def escape_re(s: str) -> str:
    return re.escape(s)

def build_pattern(word: str, fuzzy: bool):
    # 퍼지면 문자 사이 특수문자/공백 허용
    if fuzzy:
        core = r"[\\W_\\s]*".join([escape_re(ch) for ch in word])
    else:
        core = escape_re(word)
    # 약한 경계(양쪽이 글자/숫자가 아닐 때 매칭)
    return re.compile(rf"(^|[^\\w\\p{{L}}\\p{{N}}])({core})(?=$|[^\\w\\p{{L}}\\p{{N}}])", re.IGNORECASE)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/filter", methods=["POST"])
def filter_api():
    data = request.get_json(force=True, silent=True) or {}
    text = str(data.get("text", ""))
    replacement = str(data.get("replacement", "*****"))
    fuzzy = bool(data.get("fuzzy", True))

    # 최신 badwords 로드(파일 수정 즉시 반영)
    global badwords
    badwords = load_badwords()

    out = text
    replaced = 0
    for w in badwords:
        if not w:
            continue
        rx = build_pattern(w, fuzzy)
        def _sub(m):
            nonlocal replaced
            replaced += 1
            pre = m.group(1) or ""
            return pre + replacement
        out = rx.sub(_sub, out)
    return jsonify({"output": out, "replaced": replaced})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
