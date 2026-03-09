# Chrome Web Store Listing Content

> Copy-paste this content when publishing to the Chrome Web Store.

---

## Extension Name
```
Job Application Tracker — Save to Google Sheets
```

## Short Description (132 chars max)
```
Track job applications to Google Sheets with one click. Dashboard, daily goals, duplicate detection & follow-up reminders. Free!
```

## Detailed Description (up to 16,000 chars)

```
🧳 JOB APPLICATION TRACKER — Your Free Job Search Companion

Tired of losing track of where you applied? Forgetting which resume you sent? Missing follow-up deadlines?

Job Application Tracker saves every job application to YOUR Google Sheet with a single click. No sign-ups, no subscriptions, no hidden fees — completely free and open-source.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ KEY FEATURES

🎯 ONE-CLICK TRACKING
• Open any job posting → click the extension → hit Save
• Auto-detects job title and company name from the page
• Works on LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor, and any other job site

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

🌐 SUPPORTED JOB SITES

Works on ANY website, with smart auto-detection for:
✅ LinkedIn
✅ Indeed
✅ Greenhouse
✅ Lever
✅ Workday
✅ Glassdoor
✅ And hundreds more (falls back to page title)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 WHO IS THIS FOR?

• Job seekers applying to multiple positions
• Career changers tracking applications across industries
• Students applying for internships and entry-level roles
• Recruiters managing candidate outreach
• Anyone who wants to stay organized during their job search

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ WHY JOB APPLICATION TRACKER?

Unlike paid tools like Huntr, Teal, or JobScan:
• ✅ Completely FREE — no premium tier, no trial limits
• ✅ Your data stays in YOUR Google Sheet — not locked in someone else's platform
• ✅ Works offline (local dashboard) — no internet needed for stats
• ✅ Open source — transparent and trustworthy
• ✅ Lightweight — under 50KB, no bloat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created by Nisarg Shah [Vibe Coder]
Open source on GitHub — contributions welcome!
```

## Category
```
Productivity
```

## Language
```
English
```

## Tags / Keywords
```
job tracker, job application tracker, job search, career, resume, google sheets, job board, linkedin, indeed, greenhouse, lever, workday, productivity, free
```

---

## Privacy Practices (for Chrome Web Store form)

### Single Purpose Description
```
This extension tracks job applications by saving job details from the current page to the user's personal Google Sheet via Google Apps Script.
```

### Permissions Justification

| Permission | Justification |
|-----------|---------------|
| `activeTab` | Required to read the URL and page title of the current tab when the user clicks the extension icon to track a job application. |
| `scripting` | Required to inject the content script that detects job title and company name from the DOM of job posting pages. |
| `storage` | Required to store user preferences (Web App URL, daily goal), application history for the dashboard, and custom resume names locally. |
| `alarms` | Required to periodically check (every 6 hours) for applications needing follow-up and update the badge count. |

### Host Permissions Justification
```
Content script uses <all_urls> because job postings exist on any domain. The script only activates when the user clicks the extension icon and only reads job title/company name text from the page. No data is collected passively.
```

### Data Usage Disclosure
- [x] I do not sell user data to third parties
- [x] I do not use or transfer user data for purposes unrelated to the item's core functionality
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes
