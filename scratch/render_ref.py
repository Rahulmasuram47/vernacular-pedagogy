import fitz

doc = fitz.open(r'c:\Users\harsh\OneDrive\Documents\SIH2026-IDEA-Presentation-Format.pdf')
page2 = doc[1]
pix = page2.get_pixmap()
pix.save('scratch/page2_ref.png')
print('Page 2 pixmap saved')
