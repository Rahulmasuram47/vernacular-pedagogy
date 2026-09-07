import pymupdf

doc_ref = pymupdf.open(r'c:\Users\harsh\OneDrive\Documents\SIH2026-IDEA-Presentation-Format.pdf')
doc_conv = pymupdf.open('scratch/SIH2026-IDEA-Presentation-Format.pdf')

doc_ref[0].get_pixmap().save('scratch/p1_ref.png')
doc_conv[0].get_pixmap().save('scratch/p1_conv.png')
print('Page 1 of both saved')
