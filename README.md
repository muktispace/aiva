# MathQuest Kids PWA

A mobile-first progressive web app for Class 1–3 kids featuring:
- 10–15 minute daily game-based math practice.
- Quick skill check and personalized path.
- Level progression with rewards (stars, coins, badges).
- Weekly parent reports for accuracy, confidence, minutes, and consistency.
- Mentor/discipline check-ins to support daily habit formation.

## Run locally (same machine)

You can use **any free port**.

```bash
cd /workspace/aiva
python3 -m http.server <PORT> --bind 127.0.0.1
```

Example:

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Open: `http://localhost:<PORT>`

## If localhost does not open


### Common command typo to avoid

Use the full command including `python3`:

```bash
python3 -m http.server <PORT> --bind 127.0.0.1
```

Do **not** add extra characters after the IP (for example `127.0.0.1~`).
That typo causes: `socket.gaierror: [Errno 8] nodename nor servname provided, or not known`.

### 1) Check whether a server is running on your chosen port

macOS / Linux:

```bash
lsof -i :<PORT>
```

Windows (PowerShell):

```powershell
netstat -ano | findstr :<PORT>
```

- If you see **nothing**, no server is running on that port.
- If another app is using the port, choose a different one.

### 2) Start this app on another port

```bash
cd /workspace/aiva
python3 -m http.server 3456 --bind 127.0.0.1
```

Then open: `http://localhost:3456`

### 3) Why ERR_CONNECTION_REFUSED happens

`ERR_CONNECTION_REFUSED` usually means there is **no active server listening** on that exact port.

## Run for phone / another device on same Wi-Fi

`localhost` on your phone means "the phone itself", not your computer.
To open this app on a phone, run the server on all interfaces with any free port:

```bash
cd /workspace/aiva
python3 -m http.server <PORT> --bind 0.0.0.0
```

Then open in your phone browser:

`http://<YOUR_COMPUTER_LAN_IP>:<PORT>`

Example:

`http://192.168.1.25:3456`

## Quick troubleshooting checklist

1. Keep the terminal running where `python3 -m http.server ...` was started.
2. Use the correct URL for your scenario:
   - Same machine: `http://localhost:<PORT>`
   - Phone: `http://<LAN_IP>:<PORT>`
3. If the port is in use, switch to another free port.
4. If needed, allow the selected port through firewall.
