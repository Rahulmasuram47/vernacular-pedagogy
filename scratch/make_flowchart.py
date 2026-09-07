import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(10.5, 1.8), dpi=300)
ax.set_facecolor('white')
fig.patch.set_facecolor('white')

steps = [
    ('Step 1: Input', 'Teacher / Student\nVoice or Text', '#1F497D', '#F0F4F8'),
    ('Step 2: Speech-to-Text', 'Whisper / Vosk\nOn-Device STT', '#0B5394', '#EBF5FB'),
    ('Step 3: Neural NMT', 'IndicTrans2\nMultilingual Model', '#B9770E', '#FEF9E7'),
    ('Step 4: Text-to-Speech', 'Indic-TTS / Coqui\nNative Speech Synth', '#1E8449', '#EAFAF1'),
    ('Step 5: Output & Cache', 'Bilingual Content\nOffline SQLite Cache', '#6C3483', '#F4ECF7')
]

n = len(steps)
box_w = 1.68
box_h = 1.3
gap = 0.38
total_w = n * box_w + (n - 1) * gap
start_x = (10.5 - total_w) / 2

for i, (title, desc, border_col, bg_col) in enumerate(steps):
    x = start_x + i * (box_w + gap)
    y = 0.25
    
    rect = patches.FancyBboxPatch((x, y), box_w, box_h,
                                  boxstyle='round,pad=0.06,rounding_size=0.12',
                                  facecolor=bg_col, edgecolor=border_col, linewidth=1.6,
                                  zorder=2)
    ax.add_patch(rect)
    
    ax.text(x + box_w/2, y + box_h - 0.25, title,
            ha='center', va='center', fontsize=9.5, fontweight='bold',
            color=border_col, fontfamily='Arial', zorder=3)
    
    ax.plot([x + 0.12, x + box_w - 0.12], [y + box_h - 0.44, y + box_h - 0.44],
            color=border_col, linewidth=0.7, alpha=0.4, zorder=3)
    
    ax.text(x + box_w/2, y + 0.42, desc,
            ha='center', va='center', fontsize=8.2, color='#212F3D',
            fontfamily='Arial', fontweight='normal', linespacing=1.25, zorder=3)
    
    if i < n - 1:
        arrow_x = x + box_w + 0.05
        arrow_y = y + box_h / 2
        ax.annotate('', xy=(arrow_x + gap - 0.1, arrow_y), xytext=(arrow_x, arrow_y),
                    arrowprops=dict(arrowstyle='->,head_width=0.32,head_length=0.35',
                                    lw=1.8, color='#7F8C8D'),
                    zorder=4)

ax.set_xlim(0, 10.5)
ax.set_ylim(0, 1.8)
ax.axis('off')
plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
plt.savefig('scratch/methodology_flowchart.png', dpi=300, bbox_inches='tight', pad_inches=0.02, transparent=False, facecolor='white')
plt.close()
print('Refined flowchart generated')
