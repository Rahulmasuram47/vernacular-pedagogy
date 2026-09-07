import pymupdf

doc = pymupdf.open('scratch/SIH2026-IDEA-Presentation-Format.pdf')
print('Converted PDF page count:', len(doc))
page2 = doc[1]
pix = page2.get_pixmap()
pix.save('scratch/page2_converted.png')
print('Page 2 converted saved')
