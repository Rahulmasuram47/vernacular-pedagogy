from PIL import Image
import numpy as np

im_ref = Image.open('scratch/page2_ref.png')
im_conv = Image.open('scratch/page2_converted.png')

print('Ref size:', im_ref.size)
print('Conv size:', im_conv.size)
