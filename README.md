# 🧳 Job Application Tracker — Chrome Extension

### Never lose track of where you applied. Ever again.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install%20Free-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-6c63ff?style=for-the-badge)](LICENSE)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-ff6b6b?style=for-the-badge)](https://github.com/nisarg-007)

---

**Job Application Tracker** is a **free, open-source Chrome extension** that saves your job applications to Google Sheets with a single click. No sign-ups, no subscriptions, no data collection — just you, your browser, and your own Google Sheet.

Built for job seekers who are tired of losing track of where they applied, which resume they used, and when to follow up.

> 💡 *"I applied to 200+ jobs and lost track after 20. This extension would have saved me weeks."*

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **One-Click Save** | Auto-detects job title & company from LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor, and more |
| 📊 **Application Dashboard** | Track total applications, weekly stats, source breakdown, and likelihood analysis |
| 🎯 **Daily Goal Tracker** | Set daily application goals with an animated progress ring — stay motivated! |
| ⚠️ **Duplicate Detection** | Warns you if you've already tracked a job posting — no double applications |
| 🔔 **Follow-Up Reminders** | Badge appears when applications are 7+ days old — never forget to follow up |
| 📜 **Recent Applications** | Quick-view of your last 5 tracked apps right in the popup |
| 🧠 **Smart Resume Memory** | Type a custom resume name once — it automatically appears in the dropdown forever |
| 🧙 **Setup Wizard** | Beautiful 5-step onboarding walks you through everything on first install |
| 🔒 **100% Private** | Your data goes to YOUR Google Sheet. No servers, no tracking, no ads |

---

## 📸 Screenshots

<p align="center">
  <img src="screenshots/track-tab.png" alt="Track Tab" width="280" />
  &nbsp;&nbsp;&nbsp;
  <img src="screenshots/dashboard-tab.png" alt="Dashboard Tab" width="280" />
  &nbsp;&nbsp;&nbsp;
  <img src="screenshots/welcome-wizard.png" alt="Welcome Wizard" width="380" />
</p>

---

## 🚀 Quick Start (3 Minutes!)

### Step 1: Install the Extension

🚪 **Gate 1: Chrome Web Store** *(coming soon)*
Search "Job Application Tracker" or [click here](#) to install directly from the store.

🚪 **Gate 2: Pull from Repository (Manual Install)**
Want to install without using the Web Store? You can easily load the extension directly from the source code right here.

👉 **[Read the step-by-step guide on how to install from the repository](INSTALL_FROM_REPO.md)**

### Step 2: Set Up Your Google Sheet
When you first install, the **Setup Wizard** opens automatically and walks you through:

1. 📝 Creating a Google Sheet, renaming the first sheet tab to exactly **`Applications`** (instead of Sheet1), and adding the right columns
2. 📋 Copying the backend script (one-click copy!)
3. 🔗 Pasting your Web App URL (and optionally your actual Sheet URL for quick access)
4. 🎯 Setting your daily application goal

**That's it.** You're ready to track.

### Step 3: Start Tracking!
1. Navigate to any job posting (LinkedIn, Indeed, etc.)
2. Click the extension icon
3. Review the auto-detected info
4. Hit **"Save to Sheet"**
5. Check your Google Sheet — new row added! ✨

---

## 📊 Google Sheet Columns

**⏱️ Quick Setup:** The Setup Wizard has a "Copy Headers" button — click it, paste into cell **A1** of your sheet, and all columns are set instantly!

```text
Date Applied	Company	Role	JD	Location	Salary	Resume	Tailored Resume	Status	Notes
```

Each tracked application creates a styled row with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| A: Date Applied | Auto-set on save | 08-Mar-26 |
| B: Company | Auto-detected or typed | Google |
| C: Role | Auto-detected or typed | Software Engineer |
| D: JD | Job posting link (shown as "link") | *hyperlink* |
| E: Location | Auto-detected or typed | Remote |
| F: Salary | Auto-detected or typed | $120k–$150k |
| G: Resume | General resume name (linked to Drive) | *hyperlink* |
| H: Tailored Resume | Job-specific PDF (shown as "Tailored") | *hyperlink* |
| I: Status | Dropdown in sheet + extension | Applied |
| J: Notes | Free text | Referral from… |

**Status dropdown options:** Applied · Rejected · OA · Screening Call · 1st Round · 2nd Round · 3rd Round

A separate **Resumes** sheet tab is auto-created to store all uploaded resumes (general and tailored) with their Google Drive links.

---

## 🔑 Google Apps Script Setup (Full Guide)

### 1. Create Your Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) → create a new sheet
2. **Rename the first tab to exactly `Applications`** (right-click the tab → Rename)

### 2. Add the Apps Script Backend
1. In your sheet → **Extensions → Apps Script**
2. Delete all existing code in `Code.gs`
3. Open the extension → **Setup Wizard** → Step 2 → click **Copy Code**
4. Paste into the Apps Script editor → **Save** (Ctrl+S)

### 3. Add the Drive OAuth Scope (Required for PDF uploads!)
> Without this step, resume uploads will fail with a permissions error.

1. In the Apps Script editor → click the **gear icon ⚙️** (Project Settings) in the left sidebar
2. Check **"Show 'appsscript.json' manifest file in editor"**
3. Click the **`<>`** (Editor) tab and open `appsscript.json`
4. Replace its contents with:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```
> Change `"America/New_York"` to your timezone if needed (e.g. `"America/Los_Angeles"`)

5. **Save** (Ctrl+S)

### 4. Authorize Permissions
1. In the function dropdown at the top of the editor, select **`authorizePermissions`**
2. Click **Run**
3. Click **Review permissions** → choose your Google account → click **Allow**

### 5. Deploy as Web App
1. Click **Deploy → New deployment**
2. Click the gear ⚙ next to "Type" → select **Web app**
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** → **Authorize access** if prompted
5. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### 6. (Optional) Set a Drive Folder for Resumes
By default, uploaded PDFs are saved to your root Google Drive. To save them in a specific folder:
1. Create a folder in Google Drive → open it
2. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/**THIS_IS_THE_ID**`
3. In `Code.gs`, find `const DRIVE_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID_HERE";` and replace the placeholder with your ID
4. Save and redeploy (**Deploy → Manage deployments → Edit → New version → Deploy**)

### 7. Connect the Extension
1. Open the extension → **Settings tab**
2. Paste your Web App URL
3. Optionally paste your Sheet URL (for the "Open Sheet" button)
4. Click **Save**

---

## 🔧 Supported Job Sites

Works on **any website**, with smart detection for:

| Site | Auto-Detect Title | Auto-Detect Company |
|------|:-----------------:|:-------------------:|
| LinkedIn | ✅ | ✅ |
| Indeed | ✅ | ✅ |
| Greenhouse | ✅ | ✅ |
| Lever | ✅ | ✅ |
| Workday | ✅ | ✅ |
| Glassdoor | ✅ | ✅ |
| **Any other site** | Falls back to `<h1>` / page title | Falls back to meta tags |

> 💡 On unsupported sites, the title and company fields are fully editable — just type them in!

---

## 🏗️ Architecture

```
📁 Job Application Tracker
├── manifest.json          # Chrome MV3 configuration
├── config.js              # Resume options + fallback Web App URL
├── popup.html             # Extension popup (Track + Dashboard tabs)
├── popup.css              # Premium dark theme styling
├── popup.js               # Popup logic: scraping, form, dashboard
├── content_script.js      # DOM scraper for job sites
├── background.js          # Service worker: history, stats, badges
├── welcome.html           # 5-step onboarding wizard
├── welcome.css            # Wizard styling
├── welcome.js             # Wizard logic + Apps Script copy
├── google_apps_script.js  # Backend code (paste into Apps Script)
├── PRIVACY_POLICY.md      # Privacy policy
├── icons/                 # Extension icons (16, 48, 128px)
└── screenshots/           # Store listing screenshots
```

### Data Flow

```
Job Posting Page → Content Script (scrapes) → Popup (form)
                                                    ↓
                                              User clicks Save
                                                    ↓
                                    POST JSON → Google Apps Script
                                                    ↓
                                            Your Google Sheet ✅
```

- **No middle servers** — data goes directly from your browser to your Google Sheet
- **Local storage** — dashboard stats and history stored in your browser only
- **No accounts** — no sign-up, no login, no email required

---

## 🔒 Privacy & Security

- ✅ **Open source** — read every line of code yourself
- ✅ **No servers** — we don't operate any backend infrastructure
- ✅ **No tracking** — zero analytics, zero telemetry, zero ads
- ✅ **No data collection** — your applications stay between your browser and your Google Sheet
- ✅ **Minimal permissions** — only `activeTab`, `scripting`, `storage`, `alarms`
- ✅ **Full privacy policy** — see [PRIVACY_POLICY.md](PRIVACY_POLICY.md)

---

## 🎨 Customization

### Change Resume Options
Edit `config.js` to set your default resume dropdown:
```javascript
RESUME_OPTIONS: [
  "Software Engineer Resume",
  "Data Analyst Resume",
  "Product Manager Resume",
]
```
Or just type a custom name — it'll be remembered automatically!

### Change Daily Goal
Re-open the Setup Wizard (click ⚙ in the popup) to change your daily goal.

### Change Follow-Up Period
Edit `background.js` and change `7` (days) to any number you want.

### Change Theme Colors
Edit the CSS variables in `popup.css` `:root` to match your style.

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork this repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

### Ideas for Contributions
- [ ] Add more job site selectors (e.g., ZipRecruiter, AngelList)
- [ ] Export application history as CSV
- [ ] Dark/Light theme toggle
- [ ] Application status tracking (Applied → Interview → Offer)
- [ ] Chrome Web Store review prompt
- [ ] Localization (i18n)

---

## 📝 Changelog

### v2.0.0 — March 2026
- ✨ First-time setup wizard with 5-step onboarding
- 📊 Dashboard tab with daily goal ring, stats, and charts
- ⚠️ Duplicate URL detection
- 🔔 Follow-up reminder badges
- 📜 Recent applications list
- 🧠 Smart resume memory (custom names auto-saved)
- 🏷️ Creator branding

### v1.0.0 — March 2026
- 🎯 Core tracking: auto-detect job title & company
- 📋 Google Sheets integration via Apps Script
- 🎨 Premium dark-themed popup UI

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Free to use, modify, and distribute. If you find it useful, star ⭐ this repo!

---

## 👨‍💻 Authors

**Nisarg Shah** — *Original Creator · Vibe Coder*

- GitHub: [@nisarg-007](https://github.com/nisarg-007)

**Somil Doshi** — *Contributor*

- GitHub: [@somildoshi12](https://github.com/somildoshi12)

---

<p align="center">
  <strong>If this extension helped you land a job, give it a ⭐!</strong><br/>
  <sub>Built with ❤️ for every job seeker out there.</sub>
</p>
