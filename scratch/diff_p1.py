from PIL import Image
import numpy as np

im1 = Image.open('scratch/p1_ref.png')
im2 = Image.open('scratch/p1_conv.png')

print('Size 1:', im1.size, 'Size 2:', im2.size)
# Resize im2 to im1 if slight diff
if im1.size != im2.size:
    im2 = im2.resize(im1.size)
diff = np.abs(np.array(im1, dtype=np.int32) - np.array(im2, dtype=np.int32))
print('Mean absolute pixel diff:', np.mean(diff))
