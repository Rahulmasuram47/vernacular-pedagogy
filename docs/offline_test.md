# Offline test (manual)

This checks that Hindi → Santali translation and worksheet stubs work with **Wi‑Fi / mobile data off**. The app talks only to `localhost` (this computer). That is not the public internet.

`POST /translate` uses the on-disk dictionary in `data/santali_dictionary.json`. There is no `requests` (or other HTTP client) on that path.

## Before you start

1. Start the backend:

```powershell
cd "c:\Users\harsh\OneDrive\Documents\vernacular pedagogy\backend"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

2. Start the frontend (second terminal):

```powershell
cd "c:\Users\harsh\OneDrive\Documents\vernacular pedagogy\frontend"
npm run dev
```

3. Open http://localhost:5173 and confirm the green **Offline Ready** badge is visible. That badge is static HTML/CSS. It does not ping the network.

4. With internet still on, type `नमस्ते` and click **अनुवाद करें**. You should see Santali `ᱡᱚᱦᱟᱨ`.

## Turn the internet off

Windows: turn off Wi‑Fi (and mobile hotspot if you use one), or use Airplane mode. Do **not** stop the two local terminals.

Optional check that the public internet is really down: a normal website such as https://example.com should fail to load.

Keep http://localhost:5173 and http://127.0.0.1:8000 — those are local.

## Confirm translation (offline)

**In the browser:** on the already-open app page, translate `बैठ जाओ` again. Hindi and Santali should still appear.

**On the API** (third terminal, internet still off):

```powershell
python -c "import json,urllib.request; r=urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/translate', data=json.dumps({'text':'नमस्ते'}).encode(), headers={'Content-Type':'application/json'})); print(r.read().decode('utf-8'))"
```

Expect JSON with `"santali": "ᱡᱚᱦᱟᱨ"` and `"confidence": "exact"`.

## Confirm worksheet (offline)

The on-screen **कार्यपत्रक बनाएँ** button builds a local preview (no internet). Also hit the stub API:

```powershell
python -c "import json,urllib.request; r=urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/worksheet', data=json.dumps({'hindi':'नमस्ते','santali':'ᱡᱚᱦᱟᱨ'}).encode('utf-8'), headers={'Content-Type':'application/json'})); print(r.read().decode('utf-8'))"
```

Expect JSON with the same Hindi/Santali echoed back (`"stub": true` is fine).

## Pass / fail

- **Pass:** UI still shows **Offline Ready**, translate still returns Santali, worksheet still returns JSON, all while public sites fail.
- **Fail:** translate/worksheet only work when Wi‑Fi is on, or the UI tries to reach a cloud translation service.
