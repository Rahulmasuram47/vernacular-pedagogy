import base64
import re

with open('frontend/node_modules/vosk-browser/dist/vosk.js', 'r', encoding='utf-8') as f:
    for line in f:
        line_s = line.strip()
        if line_s.startswith('var WorkerFactory = createBase64WorkerFactory('):
            start = line.find("createBase64WorkerFactory('") + len("createBase64WorkerFactory('")
            end = line.find("',")
            b64_str = line[start:end].strip()
            decoded = base64.b64decode(b64_str).decode('utf-8', errors='ignore')
            for m in re.finditer(r'downloadAndExtract', decoded):
                print('--- SNIPPET downloadAndExtract ---')
                print(decoded[max(0, m.start()-100):min(len(decoded), m.end()+500)])
            break
