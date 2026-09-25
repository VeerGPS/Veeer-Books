#!/usr/bin/env python3
"""
Build a fast Veeer Sukhadiya Books page reader for one book.

Every book gets exactly the same reader (public/readers/reader.js + reader.css).
This script only produces the per-book files:

  public/readers/<slug>.html            tiny shell (~2 KB) that loads the shared reader
  public/readers/<slug>/p/001.webp ...  full pages   (loaded one at a time, on demand)
  public/readers/<slug>/thumbs.webp     all thumbnails in one sprite (loaded only when the sidebar opens)
  public/readers/<slug>/text.json       page text for in-book search (loaded on first search)

Usage
  From a PDF (best quality, enables search and contents):
    python scripts/build_reader.py --pdf "public/books/The_1_Percent_Rule_.pdf" \
        --slug the-1-percent-rule --title "The 1% Rule" --author "Veer Sukhadiya" \
        [--cover public/images/1-percent-rule.png]

  From an old single-file reader (base64 page images embedded in the HTML):
    python scripts/build_reader.py --html public/readers_backups/foo.html.bak \
        --slug foo --title "Foo" --author "Veer Sukhadiya" [--pdf-text book.pdf]

Requires: pip install pillow pypdfium2 pypdf
"""
import argparse, base64, html, io, json, os, re, shutil, sys

from PIL import Image

PAGE_H = 1600        # rendered page height in px (crisp on retina, ~60-120 KB per page)
THUMB_W = 120
THUMB_COLS = 10
Q_PAGE = 80
Q_THUMB = 60


THUMBS = []


def save_page(img, out_dir, idx, box=None):
    img = img.convert("RGB")
    if img.height > PAGE_H:
        img = img.resize((round(img.width * PAGE_H / img.height), PAGE_H), Image.LANCZOS)
    img.save(os.path.join(out_dir, "p", f"{idx:03d}.webp"), "WEBP", quality=Q_PAGE, method=6)
    THUMBS.append(img.copy())
    return img.size


def save_thumbs(out_dir, ratio):
    """All thumbnails in one sprite image -> one request instead of hundreds."""
    tw, th = THUMB_W, round(THUMB_W * ratio)
    cols = min(THUMB_COLS, len(THUMBS))
    rows = -(-len(THUMBS) // cols)
    sheet = Image.new("RGB", (cols * tw, rows * th), "white")
    for i, im in enumerate(THUMBS):
        t = im.copy()
        t.thumbnail((tw, th), Image.LANCZOS)
        x, y = (i % cols) * tw + (tw - t.width) // 2, (i // cols) * th + (th - t.height) // 2
        sheet.paste(t, (x, y))
    sheet.save(os.path.join(out_dir, "thumbs.webp"), "WEBP", quality=Q_THUMB, method=6)
    return cols, rows


def pdf_images(path):
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(path)
    for i in range(len(doc)):
        page = doc[i]
        w, h = page.get_size()
        yield page.render(scale=PAGE_H / h).to_pil()


def pdf_texts(path):
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(path)
    out = []
    for i in range(len(doc)):
        t = doc[i].get_textpage().get_text_range()
        t = re.sub(r"[­‐](\r?\n)", "", t)          # soft hyphen line breaks
        t = re.sub(r"\s+", " ", t).strip()
        out.append(t)
    return out


def pdf_toc(path, offset):
    """Top two outline levels -> [{t, p, l}] (p is 1-based reader page)."""
    try:
        from pypdf import PdfReader
        r = PdfReader(path)
    except Exception:
        return []
    toc = []

    def walk(items, level):
        for it in items:
            if isinstance(it, list):
                if level < 1:
                    walk(it, level + 1)
                continue
            try:
                p = r.get_destination_page_number(it) + 1 + offset
            except Exception:
                continue
            title = re.sub(r"\s+", " ", str(it.title)).strip()
            if level:  # section kickers glued to headings: "The ideaWhy…" -> "The idea — Why…"
                title = re.sub(r"(?<=[a-z?’'])(?=[A-Z“])", " — ", title, count=1)
            if title:
                toc.append({"t": title, "p": p, "l": level})

    walk(r.outline, 0)
    return toc


def html_images(path, skip=0):
    s = open(path, encoding="utf-8", errors="ignore").read()
    for i, m in enumerate(re.finditer(r"data:image/[a-z+]+;base64,([A-Za-z0-9+/=]+)", s)):
        if i >= skip:
            yield Image.open(io.BytesIO(base64.b64decode(m.group(1))))


SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>{title_h} — {author_h}</title>
<link rel="preload" as="image" href="{slug}/p/001.webp" fetchpriority="high">
<link rel="stylesheet" href="reader.css?v={ver}">
</head>
<body>
<noscript>This reader needs JavaScript.</noscript>
<script>window.BOOK = {book};</script>
<script src="reader.js?v={ver}" defer></script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf")
    ap.add_argument("--html")
    ap.add_argument("--pdf-text", help="PDF to take search text / contents from when using --html")
    ap.add_argument("--cover", help="image to use as page 1 (before the PDF pages)")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--author", default="Veer Sukhadiya")
    ap.add_argument("--out", default="public/readers")
    ap.add_argument("--skip", type=int, default=0, help="--html: ignore the first N embedded images (e.g. spread thumbnails)")
    ap.add_argument("--toc", help="JSON file with a hand-written contents list [{t,p,l}]")
    ap.add_argument("--ver", default="3")
    a = ap.parse_args()
    if not (a.pdf or a.html):
        sys.exit("give --pdf or --html")

    book_dir = os.path.join(a.out, a.slug)
    shutil.rmtree(book_dir, ignore_errors=True)
    os.makedirs(os.path.join(book_dir, "p"))

    n = 0
    offset = 0
    if a.cover:
        n += 1
        save_page(Image.open(a.cover), book_dir, n)
        offset = 1
    src = pdf_images(a.pdf) if a.pdf else html_images(a.html, a.skip)
    for img in src:
        n += 1
        save_page(img, book_dir, n)
        print(f"\rpage {n}", end="", flush=True)
    print()

    text_src = a.pdf or a.pdf_text
    toc, texts = [], []
    if text_src:
        texts = [""] * offset + pdf_texts(text_src)
        toc = pdf_toc(text_src, offset)
        if a.cover:
            toc.insert(0, {"t": "Cover", "p": 1, "l": 0})
    if texts and len(texts) == n:
        with open(os.path.join(book_dir, "text.json"), "w", encoding="utf-8") as f:
            json.dump(texts, f, ensure_ascii=False, separators=(",", ":"))
    elif texts:
        print(f"warning: text has {len(texts)} pages but reader has {n}; search disabled")
        toc = [t for t in toc if t["p"] <= n] if abs(len(texts) - n) <= 2 else []
    if a.toc:
        toc = json.load(open(a.toc, encoding="utf-8"))
    if not toc:
        toc = [{"t": "Cover", "p": 1, "l": 0}]

    # Page aspect ratio from a normal (non-cover) page
    first = Image.open(os.path.join(book_dir, "p", f"{min(n, offset + 1):03d}.webp"))
    cols, rows = save_thumbs(book_dir, first.height / first.width)
    book = {
        "slug": a.slug, "title": a.title, "author": a.author, "pages": n,
        "w": first.width, "h": first.height, "tc": cols, "tr": rows,
        "search": bool(texts and len(texts) == n), "toc": toc,
    }
    shell = SHELL.format(
        title_h=html.escape(a.title), author_h=html.escape(a.author), slug=a.slug, ver=a.ver,
        book=json.dumps(book, ensure_ascii=False).replace("</", "<\\/"),
    )
    with open(os.path.join(a.out, a.slug + ".html"), "w", encoding="utf-8") as f:
        f.write(shell)
    total = sum(os.path.getsize(os.path.join(dp, x)) for dp, _, fs in os.walk(book_dir) for x in fs)
    print(f"{a.slug}: {n} pages, {total/1e6:.1f} MB on disk (loaded page-by-page)")


if __name__ == "__main__":
    main()
