# CampusLink

CampusLink is an interactive 3D wayfinding and campus event kiosk application for **ITER, SOA University**. It features a 3D perspective SVG map, department/building resolution, active event tracking, seen/unseen event notifications, and a campus terminal design aesthetic.

---

## 📱 Mobile Testing on Local Network

CampusLink is configured to allow direct mobile testing from smartphones or any devices connected to the same Wi-Fi network.

### 1. Find Your Computer's Local IP Address

- **Windows (PowerShell / Command Prompt):**
  ```cmd
  ipconfig
  ```
  Look for `IPv4 Address` under your active Wi-Fi or Ethernet adapter (e.g., `10.236.135.119` or `192.168.1.50`).

- **macOS / Linux:**
  ```bash
  ifconfig
  # or
  ip addr
  ```

---

### 2. Start the Development Servers

1. **Start Backend Server (Express):**
   ```bash
   cd server
   npm run dev
   ```
   The backend server binds to `0.0.0.0:5000` and displays both local and network URLs:
   ```text
   Express Backend Server Ready
   ➜  Local:   http://localhost:5000/
   ➜  Network: http://<local-ip>:5000/
   ```

2. **Start Frontend Dev Server (Vite):**
   ```bash
   cd client
   npm run dev
   ```
   Vite binds to `0.0.0.0:3000` and displays:
   ```text
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://<local-ip>:3000/
   ```

---

### 3. Access CampusLink from Your Phone

1. Connect your smartphone to the **same Wi-Fi network** as your computer.
2. Open Chrome, Safari, or any browser on your mobile phone.
3. Enter the URL:
   ```text
   http://<your-local-ip>:3000
   ```
   *Example:* `http://10.236.135.119:3000` or `http://192.168.1.50:3000`

---

### ⚡ Hot Reloading & HMR

Vite's Hot Module Replacement (HMR) websocket client remains fully functional when accessed from a mobile browser. Any saved changes in `client/src` will automatically re-render live on your phone.

---

### 🛡️ Network & Firewall Troubleshooting

If your smartphone cannot connect to `http://<local-ip>:3000`:

1. **Same Wi-Fi Network:** Ensure your phone is connected to the exact same Wi-Fi network (not mobile data or a separate guest Wi-Fi).
2. **Windows Firewall / macOS Firewall:**
   - On Windows, ensure Windows Defender Firewall allows incoming connections on port `3000` and `5000`, or select "Allow access on Private networks" when prompted.
   - To temporarily open port 3000 in Windows PowerShell (Run as Admin):
     ```powershell
     New-NetFirewallRule -DisplayName "CampusLink Dev" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
     ```
3. **Public Wi-Fi Isolation:** Some institutional or public Wi-Fi networks block peer-to-peer traffic between connected devices ("AP Isolation"). If using a university network that enforces isolation, connect both devices to a mobile hotspot instead.
