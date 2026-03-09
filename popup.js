/* =========================================================
   popup.js — Full popup logic
   Created by Nisarg Shah [Vibe Coder]
   • Tabbed UI (Track / Dashboard)
   • Scraping via content script
   • Duplicate URL detection
   • POST to Google Apps Script
   • Dashboard stats, daily goal ring, recent apps
   • First-time check → redirect to welcome wizard
   ========================================================= */

"use strict";

// ─── DOM refs: Track tab ──────────────────────────────────
const $jobTitle = document.getElementById("jobTitle");
const $companyName = document.getElementById("companyName");
const $location = document.getElementById("location");
const $salary = document.getElementById("salary");
const $pageUrl = document.getElementById("pageUrl");
const $dateTime = document.getElementById("dateTime");
const $resumeSelect = document.getElementById("resumeSelect");
const $resumeCustom = document.getElementById("resumeCustom");
const $likelihood = document.getElementById("likelihood");
const $appStatus = document.getElementById("appStatus");
const $notes = document.getElementById("notes");
const $form = document.getElementById("trackerForm");
const $saveBtn = document.getElementById("saveBtn");
const $status = document.getElementById("status");
const $dupWarning = document.getElementById("duplicateWarning");
const $dupDetails = document.getElementById("duplicateDetails");

// ─── DOM refs: Dashboard tab ──────────────────────────────
const $goalCount = document.getElementById("goalCount");
const $goalTotal = document.getElementById("goalTotal");
const $goalRingFill = document.getElementById("goalRingFill");
const $goalMotivate = document.getElementById("goalMotivate");
const $statTotal = document.getElementById("statTotal");
const $statWeek = document.getElementById("statWeek");
const $statFollowUp = document.getElementById("statFollowUp");
const $barHigh = document.getElementById("barHigh");
const $barMedium = document.getElementById("barMedium");
const $barLow = document.getElementById("barLow");
const $countHigh = document.getElementById("countHigh");
const $countMedium = document.getElementById("countMedium");
const $countLow = document.getElementById("countLow");
const $sourceChips = document.getElementById("sourceChips");
const $recentList = document.getElementById("recentList");

// ─── DOM refs: Tabs & navigation ─────────────────────────
const $tabs = document.querySelectorAll(".tab");
const $tabContents = { track: document.getElementById("tabTrack"), dashboard: document.getElementById("tabDashboard") };
const $settingsBtn = document.getElementById("settingsBtn");

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function extractDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return ""; }
}

function formatDateTime(date) {
    return date.toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
}

function formatDateOnly(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function showStatus(message, type = "success") {
    $status.textContent = message;
    $status.className = `status ${type} visible`;
    setTimeout(() => $status.classList.remove("visible"), 4000);
}

function setLoading(loading) {
    $saveBtn.disabled = loading;
    $saveBtn.querySelector(".btn-text").style.display = loading ? "none" : "";
    $saveBtn.querySelector(".btn-loader").style.display = loading ? "inline-flex" : "none";
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ═══════════════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════════════

$tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        $tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        Object.values($tabContents).forEach((c) => c.classList.remove("active"));
        $tabContents[target].classList.add("active");
        if (target === "dashboard") loadDashboard();
    });
});

// Settings button → open welcome wizard
$settingsBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});

// Theme Toggle
const $themeToggleBtn = document.getElementById("themeToggleBtn");
const $sunIcon = document.querySelector(".sun-icon");
const $moonIcon = document.querySelector(".moon-icon");

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    if (theme === "light") {
        $sunIcon.style.display = "block";
        $moonIcon.style.display = "none";
    } else {
        $sunIcon.style.display = "none";
        $moonIcon.style.display = "block";
    }
}

$themeToggleBtn.addEventListener("click", () => {
    const newTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
});

// Open Sheet button → open the connected Google Sheet
const $openSheetBtn = document.getElementById("openSheetBtn");
$openSheetBtn.addEventListener("click", async () => {
    const { webAppUrl, sheetUrl } = await chrome.storage.local.get(["webAppUrl", "sheetUrl"]);
    const url = webAppUrl || ((typeof CONFIG !== "undefined") ? CONFIG.WEB_APP_URL : "");
    if (url && url.startsWith("https://script.google.com/")) {
        // Open the user's specific sheet if they provided the URL, otherwise open the Sheets homepage
        chrome.tabs.create({ url: sheetUrl ? sheetUrl : "https://docs.google.com/spreadsheets" });
    } else {
        showStatus("⚙ Set up your Google Sheet first (click the gear icon)", "error");
    }
});

// ═══════════════════════════════════════════════════════════
//  RESUME DROPDOWN — Smart memory: custom names auto-save
// ═══════════════════════════════════════════════════════════

async function populateResumeDropdown() {
    // Start with defaults from config
    const defaults = (typeof CONFIG !== "undefined" && CONFIG.RESUME_OPTIONS) || ["General Resume"];

    // Load user-added custom resumes from storage
    const { customResumes = [] } = await chrome.storage.local.get("customResumes");

    // Merge: defaults first, then custom (no duplicates), then "+ Add New" at the end
    const allOptions = [...defaults.filter(o => !o.toLowerCase().includes("custom"))];
    customResumes.forEach((r) => {
        if (!allOptions.includes(r)) allOptions.push(r);
    });
    allOptions.push("+ Add New Resume");

    // Clear and rebuild
    $resumeSelect.innerHTML = "";
    allOptions.forEach((opt) => {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt;
        $resumeSelect.appendChild(el);
    });
}

$resumeSelect.addEventListener("change", () => {
    const isAddNew = $resumeSelect.value === "+ Add New Resume";
    $resumeCustom.style.display = isAddNew ? "block" : "none";
    if (isAddNew) {
        $resumeCustom.value = "";
        $resumeCustom.focus();
    }
});

/** Save a custom resume name to storage so it appears in dropdown next time */
async function saveCustomResume(name) {
    if (!name || name === "+ Add New Resume") return;
    const { customResumes = [] } = await chrome.storage.local.get("customResumes");
    if (!customResumes.includes(name)) {
        customResumes.push(name);
        await chrome.storage.local.set({ customResumes });
    }
}

// ═══════════════════════════════════════════════════════════
//  INIT — Check first-time, scrape data, check duplicates
// ═══════════════════════════════════════════════════════════

async function init() {
    // Check if setup is complete
    const { setupComplete, webAppUrl, theme } = await chrome.storage.local.get(["setupComplete", "webAppUrl", "theme"]);

    if (theme) applyTheme(theme);

    if (!setupComplete && (!webAppUrl || webAppUrl === "YOUR_WEB_APP_URL_HERE")) {
        const configUrl = (typeof CONFIG !== "undefined") ? CONFIG.WEB_APP_URL : "";
        if (!configUrl || configUrl === "YOUR_WEB_APP_URL_HERE") {
            chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
            return;
        }
    }

    await populateResumeDropdown();

    // Set date/time
    const now = new Date();
    $dateTime.value = formatDateTime(now);

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    $pageUrl.value = tab.url || "";

    // Check for duplicate URL
    checkDuplicate(tab.url);

    // Try to scrape
    try {
        const data = await messageScraper(tab.id);
        applyScrapedData(data, tab.title);
    } catch {
        try {
            await chrome.runtime.sendMessage({ action: "ensureContentScript", tabId: tab.id });
            await new Promise((r) => setTimeout(r, 250));
            const data = await messageScraper(tab.id);
            applyScrapedData(data, tab.title);
        } catch {
            $jobTitle.value = tab.title || "";
        }
    }
}

function messageScraper(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { action: "scrapeJobData" }, (response) => {
            if (chrome.runtime.lastError || !response) reject(chrome.runtime.lastError);
            else resolve(response);
        });
    });
}

function applyScrapedData(data, fallbackTitle) {
    if (data.jobTitle) $jobTitle.value = data.jobTitle;
    else if (fallbackTitle) $jobTitle.value = fallbackTitle;
    if (data.companyName) $companyName.value = data.companyName;
    if (data.location) $location.value = data.location;
    if (data.salary) $salary.value = data.salary;
}

// ═══════════════════════════════════════════════════════════
//  DUPLICATE URL CHECK
// ═══════════════════════════════════════════════════════════

async function checkDuplicate(url) {
    try {
        const result = await chrome.runtime.sendMessage({ action: "checkDuplicate", url });
        if (result && result.isDuplicate) {
            const app = result.existingApp;
            $dupDetails.textContent = `You saved "${app.jobTitle}" at ${app.companyName || "—"} on ${new Date(app.savedAt).toLocaleDateString()}.`;
            $dupWarning.style.display = "flex";
        }
    } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════
//  FORM SUBMISSION
// ═══════════════════════════════════════════════════════════

$form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Resolve Web App URL (storage overrides config)
    const stored = await chrome.storage.local.get("webAppUrl");
    let webAppUrl = stored.webAppUrl || "";
    if (!webAppUrl) {
        webAppUrl = (typeof CONFIG !== "undefined") ? CONFIG.WEB_APP_URL : "";
    }
    if (!webAppUrl || webAppUrl === "YOUR_WEB_APP_URL_HERE") {
        showStatus("⚠️  Set your Web App URL first! Click ⚙ above.", "error");
        return;
    }

    setLoading(true);

    const now = new Date();

    // Determine resume value — if custom, save it for future use
    let resumeValue;
    if ($resumeSelect.value === "+ Add New Resume") {
        resumeValue = $resumeCustom.value.trim() || "General Resume";
        // Save this custom name so it appears in dropdown next time
        await saveCustomResume(resumeValue);
    } else {
        resumeValue = $resumeSelect.value;
    }

    const payload = {
        timestamp: now.toISOString(),
        applicationDate: formatDateOnly(now),
        jobTitle: $jobTitle.value.trim(),
        companyName: $companyName.value.trim(),
        url: $pageUrl.value,
        location: $location.value.trim(),
        salary: $salary.value.trim(),
        resumeUsed: resumeValue,
        likelihood: $likelihood.value,
        source: extractDomain($pageUrl.value),
        status: $appStatus.value,
        notes: $notes.value.trim(),
    };

    try {
        await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload),
            mode: "no-cors",
        });

        // Save to local history (for dashboard)
        await chrome.runtime.sendMessage({ action: "saveApplication", data: payload });

        showStatus("✅  Saved to Google Sheet!", "success");

        // Refresh dashboard stats silently
        loadDashboard();
    } catch (err) {
        console.error("Save error:", err);
        showStatus("❌  Failed to save. Check console.", "error");
    } finally {
        setLoading(false);
    }
});

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════

async function loadDashboard() {
    try {
        const stats = await chrome.runtime.sendMessage({ action: "getStats" });
        if (!stats) return;

        // ── Daily Goal Ring ──
        const pct = Math.min(stats.todayCount / stats.dailyGoal, 1);
        const circumference = 2 * Math.PI * 42; // r=42
        $goalRingFill.style.strokeDashoffset = circumference * (1 - pct);
        $goalCount.textContent = stats.todayCount;
        $goalTotal.textContent = stats.dailyGoal;

        // Motivational text
        if (stats.todayCount === 0) {
            $goalMotivate.textContent = "Ready to start? Open a job posting and track it!";
        } else if (stats.todayCount < stats.dailyGoal) {
            const remaining = stats.dailyGoal - stats.todayCount;
            $goalMotivate.textContent = `Great progress! ${remaining} more to hit your goal 💪`;
        } else {
            $goalMotivate.textContent = "🎉 Goal reached! You're on fire today!";
        }

        // ── Stats Grid ──
        $statTotal.textContent = stats.totalApps;
        $statWeek.textContent = stats.weekCount;
        $statFollowUp.textContent = stats.needFollowUp;

        // ── Likelihood Bars ──
        const maxLik = Math.max(stats.likelihoods.High, stats.likelihoods.Medium, stats.likelihoods.Low, 1);
        $barHigh.style.width = `${(stats.likelihoods.High / maxLik) * 100}%`;
        $barMedium.style.width = `${(stats.likelihoods.Medium / maxLik) * 100}%`;
        $barLow.style.width = `${(stats.likelihoods.Low / maxLik) * 100}%`;
        $countHigh.textContent = stats.likelihoods.High;
        $countMedium.textContent = stats.likelihoods.Medium;
        $countLow.textContent = stats.likelihoods.Low;

        // ── Source Chips ──
        const entries = Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).slice(0, 6);
        if (entries.length) {
            $sourceChips.innerHTML = entries
                .map(([s, c]) => `<span class="source-chip">${s} <span class="source-count">${c}</span></span>`)
                .join("");
        } else {
            $sourceChips.innerHTML = '<span class="source-chip empty">No data yet</span>';
        }

        // ── Recent Applications ──
        if (stats.recentApps && stats.recentApps.length) {
            $recentList.innerHTML = stats.recentApps
                .map((app) => `
          <div class="recent-item">
            <div class="recent-dot ${app.likelihood}"></div>
            <div class="recent-info">
              <div class="recent-title">${escapeHtml(app.jobTitle || "Untitled")}</div>
              <div class="recent-company">${escapeHtml(app.companyName || "—")} · ${app.source || ""}</div>
            </div>
            <div class="recent-date">${timeAgo(app.savedAt)}</div>
          </div>
        `).join("");
        } else {
            $recentList.innerHTML = `
        <div class="recent-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>No applications tracked yet.<br/>Start by tracking a job page!</p>
        </div>`;
        }
    } catch (err) {
        console.warn("Dashboard load error:", err);
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════
init();
