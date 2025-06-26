# GDPR Auto Mailer – Chrome Extension

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

A browser extension that helps you instantly find privacy-related email addresses on any website and send GDPR data deletion requests with a single click. Works on Chrome, Firefox, Edge, Brave, and Opera.
---

## ✨ Features

- 🔍 **Automatic email detection** via page scraping
- 🧠 **Built-in GDPR email database** per website
- ➕ **Custom email entries** – users can store their own addresses
- 🧾 **Pre-filled GDPR deletion request template**
- 💌 **Opens default mail client** to send the request
- 🌐 **Fallback Google Search** if no email is found (site-specific)
- 🌍 **Fully cross-browser**: works on Chrome, Firefox, Edge, Brave, Opera

---

## ⚙️ Tech Stack

- JavaScript
- HTML
- Chrome Extension APIs
- Local JSON database
- Optional browser integration 

---

## 🚀 How it Works

1. The user clicks the extension icon while on a website.
2. The script scrapes all visible email addresses from the page.
3. It checks:
   - Internal GDPR address database
   - User-defined custom addresses
4. If a valid email is found, it opens the default email client with a pre-filled GDPR request.
5. If no email is found, it automatically opens a Google search like:

---

## 🧭 Browser Compatibility

This extension has been tested and works properly on:

- ✅ Google Chrome
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Brave Browser
- ✅ Opera

### Firefox Installation
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on"**
3. Select any file from the project folder (e.g., `manifest.json`)


---

## 📦 Installation

### For Chromium-based browsers (Chrome, Edge, etc.)
1. Clone or download this repository
2. Go to `chrome://extensions/`
3. Enable **Developer Mode**
4. Click **"Load unpacked"** and select the project folder


---

## 🧪 Limitations

- Detects only email addresses that are visible in the page text (does not parse hidden or dynamic content).
- Depends on the internal GDPR email database, which is continuously updated — but may not cover all websites.
- Google Search fallback is manual: the user is redirected to a search query if no address is found.
- Users must manually add missing addresses to their personal database if neither the page nor the global database includes them.

---

## 💡 Future Improvements

- Cloud sync for user entries
- Form submission automation with reCAPTCHA handling
- Export/import of GDPR request history
- Publishing to Firefox Add-ons Store

---

## 👤 Author

**Mihai** – Built for Round 2 of the AlgoArena Hackathon (2025).  
Feel free to open issues or contribute via pull requests.






