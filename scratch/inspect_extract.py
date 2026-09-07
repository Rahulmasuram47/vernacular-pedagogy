import base64

with open('frontend/node_modules/vosk-browser/dist/vosk.js', 'r', encoding='utf-8') as f:
    for line in f:
        line_s = line.strip()
        if line_s.startswith('var WorkerFactory = createBase64WorkerFactory('):
            start = line.find("createBase64WorkerFactory('") + len("createBase64WorkerFactory('")
            end = line.find("',")
            b64_str = line[start:end].strip()
            decoded = base64.b64decode(b64_str).decode('utf-8', errors='ignore')
            idx = decoded.find('function downloadAndExtract(')
            print('--- downloadAndExtract ---')
            print(decoded[idx:idx+1200])

            idx2 = decoded.find('function extract(')
            print('--- extract ---')
            print(decoded[idx2:idx2+1200])
            break
