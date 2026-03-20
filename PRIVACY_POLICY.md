# Privacy Policy for Job Application Tracker

**Last Updated:** March 8, 2026  
**Developer:** Nisarg Shah and Somil Doshi

## Overview

Job Application Tracker is a Chrome extension that helps job seekers track their job applications by saving application details to their personal Google Sheet. Your privacy is important to us, and this policy explains what data we collect, how we use it, and how we protect it.

## Data Collection

### What We Collect
The extension collects the following data **only when you actively click "Save to Sheet"**:
- **Job posting URL** — The URL of the page you are viewing
- **Job title** — Extracted from the page content or entered manually
- **Company name** — Extracted from the page content or entered manually
- **Timestamp** — The date and time you saved the application
- **Resume used** — The resume name you select or type
- **Likelihood rating** — Your self-assessed likelihood of hearing back (High/Medium/Low)
- **Source domain** — The domain of the job posting URL (e.g., linkedin.com)

### What We Do NOT Collect
- ❌ Personal identification information (name, email, phone)
- ❌ Browsing history or activity outside of your active use
- ❌ Passwords or login credentials
- ❌ Cookies or tracking data
- ❌ Data from pages you don't explicitly save
- ❌ Any data for advertising or marketing purposes

## Data Storage

### Local Storage
- Application history and dashboard statistics are stored locally in your browser using Chrome's `chrome.storage.local` API
- This data **never leaves your browser** and is only used to display your dashboard and detect duplicate applications

### Google Sheets
- When you click "Save to Sheet," your application data is sent **directly to your own Google Apps Script Web App**, which writes it to **your own Google Sheet**
- We do not operate any servers or databases
- Your data goes from your browser → your Google Apps Script → your Google Sheet
- **We never see, access, or store your data on any third-party server**

## Permissions Explained

| Permission | Why We Need It |
|------------|---------------|
| `activeTab` | To read the current page URL and title when you click the extension icon |
| `scripting` | To inject the content script that detects job title and company name from the page |
| `storage` | To save your settings (Web App URL, daily goal) and application history locally |
| `alarms` | To periodically check for follow-up reminders (every 6 hours) |

## Third-Party Services

The only third-party service used is **Google Apps Script**, which:
- Is configured and controlled entirely by you
- Runs under your own Google account
- Writes exclusively to your own Google Sheet
- Is not operated, monitored, or accessible by us

## Data Sharing

We do **not** share, sell, transfer, or disclose any user data to any third parties. Period.

## Data Deletion

- **Local data:** You can clear all extension data by right-clicking the extension icon → "Remove from Chrome," or by clearing browser data in Chrome Settings
- **Google Sheet data:** You control your Google Sheet entirely — you can delete rows or the entire sheet at any time

## Changes to This Policy

If we update this privacy policy, we will update the "Last Updated" date at the top. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

If you have any questions about this privacy policy, please contact:

**Nisarg Shah and Somil Doshi**  
Email: nisarg0708@gmail.com  
GitHub: [https://github.com/nisarg-007](https://github.com/nisarg-007)

---

*This extension is open-source and the complete source code is available for review.*
