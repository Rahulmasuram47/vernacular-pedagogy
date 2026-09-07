import pymupdf, sys
sys.stdout.reconfigure(encoding='utf-8')

doc_ref = pymupdf.open(r'c:\Users\harsh\OneDrive\Documents\SIH2026-IDEA-Presentation-Format.pdf')
doc_conv = pymupdf.open('scratch/SIH2026-IDEA-Presentation-Format.pdf')

print('Ref page 2 text:\n', doc_ref[1].get_text())
print('Conv page 2 text:\n', doc_conv[1].get_text())
