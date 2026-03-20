# Chrome Web Store — Copy-Paste Listing

---

## 1. EXTENSION NAME
> Copy exactly as-is into the "Name" field

```
Job Application Tracker — Save to Google Sheets
```

---

## 2. SHORT DESCRIPTION
> Max 132 characters. Copy into the "Short description" field.

```
Track job applications to Google Sheets with one click. Dashboard, daily goals, duplicate detection & follow-up reminders. Free!
```

---

## 3. DETAILED DESCRIPTION
> Copy everything between the triple backticks into the "Detailed description" field.

```
🧳 JOB APPLICATION TRACKER — Your Free Job Search Companion

Tired of losing track of where you applied? Forgetting which resume you sent? Missing follow-up deadlines?

Job Application Tracker saves every job application to YOUR Google Sheet with a single click. No sign-ups, no subscriptions, no hidden fees — completely free and open-source.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ KEY FEATURES

🎯 ONE-CLICK TRACKING
• Open any job posting → click the extension → hit Save
• Auto-detects job title and company name from the page
• Works on all major job boards and hiring platforms out of the box
• Falls back gracefully on any other website using the page title

📊 APPLICATION DASHBOARD
• See your total applications, weekly count, and follow-up needs at a glance
• Visual likelihood breakdown (High / Medium / Low)
• Top job sources displayed as chips
• Recent applications with time-ago display

🎯 DAILY GOAL TRACKER
• Set your daily application goal (e.g., 5 apps/day)
• Beautiful animated progress ring shows your progress
• Motivational messages keep you going: "3 more to hit your goal 💪"

⚠️ DUPLICATE DETECTION
• Already tracked this job? We'll warn you before you save again
• No more double applications or wasted time

🔔 FOLLOW-UP REMINDERS
• Red badge appears on the extension icon when applications are 7+ days old
• Never forget to follow up — the #1 mistake job seekers make

🧠 SMART RESUME MEMORY
• Type a custom resume name once → it's saved in the dropdown forever
• No more retyping "Data Analyst Resume v3" every single time

🧙 GUIDED SETUP (Under 3 Minutes!)
• Beautiful 5-step wizard opens automatically on first install
• Walks you through creating the Google Sheet, setting up the script, and connecting everything
• Even if you've never used Google Apps Script, you'll be set up in minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 YOUR PRIVACY MATTERS

• 100% Private — Your data goes to YOUR Google Sheet, not our servers
• No accounts required — No sign-up, no email, no login
• No tracking — Zero analytics, zero telemetry, zero ads
• Open source — Read every line of code on GitHub
• Minimal permissions — Only requests what's absolutely necessary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 HOW IT WORKS

1. Install the extension
2. Complete the 3-minute setup wizard
3. Go to any job posting page
4. Click the extension icon
5. Review auto-detected info, select resume, set likelihood
6. Click "Save to Sheet" ✅
7. Open your Google Sheet — your application is there!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WHAT GETS TRACKED

Each application saves these columns to your Google Sheet:
• Timestamp
• Application Date
• Job Title
• Company Name
• URL
• Resume Used
• Likelihood (High/Medium/Low)
• Source (domain name)
• Notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 WORKS EVERYWHERE

Job Application Tracker works on any job posting page across the web. It includes smart auto-detection built for the most popular hiring platforms, and gracefully falls back to reading the page title and metadata for any other site — no configuration needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 WHO IS THIS FOR?

• Job seekers applying to multiple positions
• Career changers tracking applications across industries
• Students applying for internships and entry-level roles
• Anyone who wants to stay organized during their job search

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ WHY JOB APPLICATION TRACKER?

Unlike paid tools with subscription walls:
• ✅ Completely FREE — no premium tier, no trial limits
• ✅ Your data stays in YOUR Google Sheet — not locked in someone else's platform
• ✅ Works offline (local dashboard) — no internet needed for stats
• ✅ Open source — transparent and trustworthy
• ✅ Lightweight — under 50KB, no bloat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created by Nisarg Shah and Somil Doshi [Vibe Coder]
Open source on GitHub — contributions welcome!
```

---

## 4. CATEGORY
> Select from the dropdown in the Chrome Web Store form.

```
Productivity
```

---

## 5. LANGUAGE
```
English
```

---

## 6. TAGS / KEYWORDS
> Enter each tag separately in the keywords field (do NOT paste as a comma list — type each one and press Enter).

```
job tracker
job application tracker
job search organizer
resume tracker
google sheets
career productivity
application organizer
free job tracker
job board tracker
```

---

## 7. SINGLE PURPOSE DESCRIPTION
> For the "Privacy practices" section — paste into the single purpose description box.

```
This extension tracks job applications by saving job details from the current page to the user's personal Google Sheet via Google Apps Script.
```

---

## 8. PERMISSIONS JUSTIFICATION
> Fill each one individually in the permissions form.

| Permission | What to type |
|-----------|--------------|
| `activeTab` | Required to read the URL and page title of the current tab when the user clicks the extension icon to track a job application. |
| `scripting` | Required to inject the content script that detects job title and company name from the DOM of job posting pages. |
| `storage` | Required to store user preferences (Web App URL, daily goal), application history for the dashboard, and custom resume names locally in the browser. |
| `alarms` | Required to periodically check (every 6 hours) for applications needing follow-up and update the badge count on the extension icon. |

---

## 9. HOST PERMISSIONS JUSTIFICATION
> Paste into the host permissions justification text box.

```
This extension tracks job applications from any website, since job postings exist across thousands of different employer domains (e.g., company career pages, ATS platforms, job boards). It is not possible to enumerate all valid job posting URLs in advance.

The content script is lightweight and only reads job title and company name text from the DOM when the user explicitly opens the extension popup. No data is collected passively, in the background, or without the user's direct action. No browsing history, cookies, or personal data is accessed or transmitted. All scraped data goes directly from the user's browser to their own private Google Sheet, with no intermediary servers.

The broad host permission is functionally equivalent to activeTab in practice — the script only activates on user interaction — but requires the content_scripts manifest entry for the sendMessage communication pattern used between the popup and content script in Manifest V3.
```

---

## 10. DATA USAGE CHECKBOXES
> Check all three boxes in the privacy practices form:

- [x] I do not sell user data to third parties
- [x] I do not use or transfer user data for purposes unrelated to the item's core functionality
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 11. RESUBMISSION NOTE (Optional but recommended)
> If the form has a "notes to reviewer" field, paste this:

```
Updated the store listing to comply with the keyword spam policy (violation reference: Yellow Argon). Removed the comma-separated list of job site platform names from the description and tags. The supported platforms section has been rewritten as descriptive prose.
```
