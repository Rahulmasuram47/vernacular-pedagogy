import pymupdf, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open(r'c:\Users\harsh\OneDrive\Documents\SIH2026-IDEA-Presentation-Format.pdf')
for i, page in enumerate(doc):
    print(f'=== PAGE {i+1} ===')
    blocks = page.get_text('dict')['blocks']
    for b in blocks:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    text = s['text'].strip()
                    if text:
                        bbox = [round(x, 1) for x in s['bbox']]
                        font = s['font']
                        size = round(s['size'], 1)
                        color = hex(s['color'])
                        print(f'  bbox={bbox}, font={font}, size={size}, col={color}: "{text}"')
