/* =========================================================
   popup.js — Full popup logic
   Created by Nisarg Shah and Somil Doshi [Vibe Coder]
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
const $tabContents = {
    track: document.getElementById("tabTrack"),
    dashboard: document.getElementById("tabDashboard"),
    settings: document.getElementById("tabSettings")
};
const $settingsBtn = document.getElementById("settingsBtn");
const $closeTrackerBtn = document.getElementById("closeTrackerBtn");
const $refreshBtn = document.getElementById("refreshBtn");

// ─── DOM refs: Settings tab ───────────────────────────────
const $newResumeName = document.getElementById("newResumeName");
const $newResumeFile = document.getElementById("newResumeFile");
const $newResumeFileText = document.getElementById("newResumeFileText");
const $addResumeBtn = document.getElementById("addResumeBtn");
const $addResumeStatus = document.getElementById("addResumeStatus");
const $resumeLibraryList = document.getElementById("resumeLibraryList");
const $resumeLibraryEmpty = document.getElementById("resumeLibraryEmpty");
const $settingsWebAppUrl = document.getElementById("settingsWebAppUrl");
const $settingsSheetUrl = document.getElementById("settingsSheetUrl");
const $settingsDailyGoal = document.getElementById("settingsDailyGoal");
const $saveConnectionBtn = document.getElementById("saveConnectionBtn");
const $settingsStatus = document.getElementById("settingsStatus");

// ─── DOM refs: Tailored resume ────────────────────────────
const $tailoredResumeFile = document.getElementById("tailoredResumeFile");
const $tailoredResumeFileText = document.getElementById("tailoredResumeFileText");

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function extractDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return ""; }
}

function formatDateTime(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = String(date.getDate()).padStart(2, "0");
    const m = months[date.getMonth()];
    const y = String(date.getFullYear()).slice(-2); // get last 2 digits

    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");

    return `${d}-${m}-${y} ${hh}:${mm}`;
}

function formatDateOnly(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = String(date.getDate()).padStart(2, "0");
    const m = months[date.getMonth()];
    const y = String(date.getFullYear()).slice(-2);

    return `${d}-${m}-${y}`;
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
        if (target === "settings") loadSettingsTab();
    });
});

// Settings button → open welcome wizard
$settingsBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});

// Refresh button
if ($refreshBtn) {
    $refreshBtn.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Add a quick spinning animation to the icon
        const svg = $refreshBtn.querySelector("svg");
        if (svg) svg.style.animation = "spin 1s linear infinite";

        $pageUrl.value = tab.url || "";
        checkDuplicate(tab.url);

        try {
            // Always try to re-inject just in case the page navigation cleared our content script
            await chrome.runtime.sendMessage({ action: "ensureContentScript", tabId: tab.id });
            await new Promise((r) => setTimeout(r, 250));
            const data = await messageScraper(tab.id);
            applyScrapedData(data, tab.title);
            
            // Manually set a success status directly if desired
            const prevStatus = $status.textContent;
            const prevClass = $status.className;
            $status.textContent = "Data Refreshed!";
            $status.className = "status success visible";
            setTimeout(() => {
                $status.classList.remove("visible");
                setTimeout(() => {
                    $status.textContent = prevStatus;
                    $status.className = prevClass;
                }, 250);
            }, 2000);
        } catch {
            $jobTitle.value = tab.title || "";
        } finally {
            if (svg) svg.style.animation = "";
        }
    });
}

// Close button → sends postMessage to parent window to hide iframe
if ($closeTrackerBtn) {
    $closeTrackerBtn.addEventListener("click", () => {
        window.parent.postMessage({ action: "closeJobTracker" }, "*");
    });
}

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
if ($openSheetBtn) {
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
}

// ═══════════════════════════════════════════════════════════
//  FILE HELPERS
// ═══════════════════════════════════════════════════════════

/** Read a File object as a base64 string (data URI stripped) */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // strip "data:...;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Show filename when user picks a file in the settings resume form
$newResumeFile.addEventListener("change", () => {
    const f = $newResumeFile.files[0];
    $newResumeFileText.textContent = f ? f.name : "Choose PDF file…";
});

// Show filename for tailored resume in track tab
$tailoredResumeFile.addEventListener("change", () => {
    const f = $tailoredResumeFile.files[0];
    $tailoredResumeFileText.textContent = f ? f.name : "Choose PDF (optional)…";
});

// Setup drag and drop for file uploads
function setupDragAndDrop(labelElement, fileInputElement, textElement, defaultText) {
    if (!labelElement) return;
    
    labelElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        labelElement.classList.add("drag-over");
    });

    labelElement.addEventListener("dragleave", (e) => {
        e.preventDefault();
        labelElement.classList.remove("drag-over");
    });

    labelElement.addEventListener("drop", (e) => {
        e.preventDefault();
        labelElement.classList.remove("drag-over");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
                fileInputElement.files = e.dataTransfer.files;
                textElement.textContent = f.name;
                // Dispatch change event to handle any specific file uploading logics elsewhere
                fileInputElement.dispatchEvent(new Event("change"));
            } else {
                showStatus("Please drop a valid PDF file.", "error");
            }
        }
    });
}

setupDragAndDrop(
    document.getElementById("newResumeFileLabel"),
    $newResumeFile,
    $newResumeFileText,
    "Choose PDF file…"
);

setupDragAndDrop(
    document.getElementById("tailoredResumeLabel"),
    $tailoredResumeFile,
    $tailoredResumeFileText,
    "Choose PDF (optional)…"
);

// ═══════════════════════════════════════════════════════════
//  RESUME LIBRARY — Stored as [{name, driveUrl}] in resumeLibrary
// ═══════════════════════════════════════════════════════════

async function getResumeLibrary() {
    const { resumeLibrary = [] } = await chrome.storage.local.get("resumeLibrary");
    return resumeLibrary;
}

async function saveResumeLibrary(library) {
    await chrome.storage.local.set({ resumeLibrary: library });
}

async function populateResumeDropdown() {
    const library = await getResumeLibrary();
    $resumeSelect.innerHTML = "";

    // ── "Tailored Resume" always first ──
    const tailoredEl = document.createElement("option");
    tailoredEl.value = "__tailored__";
    tailoredEl.textContent = "📎 Tailored Resume (upload PDF)";
    $resumeSelect.appendChild(tailoredEl);

    // ── General resumes from library ──
    library.forEach((r) => {
        const el = document.createElement("option");
        el.value = r.name;
        el.textContent = r.name;
        $resumeSelect.appendChild(el);
    });

    // ── "+ Add in Settings" at end ──
    const addEl = document.createElement("option");
    addEl.value = "__add_new__";
    addEl.textContent = "+ Add Resume in Settings →";
    $resumeSelect.appendChild(addEl);

    if (library.length > 0) {
        $resumeSelect.value = library[0].name;
    } else {
        $resumeSelect.value = "__tailored__";
    }

    // Restore file picker visibility on repopulate
    updateTailoredVisibility();
}

function updateTailoredVisibility() {
    const isTailored = $resumeSelect.value === "__tailored__";
    const $label = document.getElementById("tailoredResumeLabel");
    if ($label) $label.style.display = isTailored ? "flex" : "none";
}

$resumeSelect.addEventListener("change", () => {
    if ($resumeSelect.value === "__add_new__") {
        // Switch to Settings tab
        $tabs.forEach((t) => t.classList.remove("active"));
        document.querySelector('.tab[data-tab="settings"]').classList.add("active");
        Object.values($tabContents).forEach((c) => c.classList.remove("active"));
        $tabContents.settings.classList.add("active");
        loadSettingsTab();
        // Reset to tailored option
        $resumeSelect.value = "__tailored__";
    }
    updateTailoredVisibility();
});

// ═══════════════════════════════════════════════════════════
//  SETTINGS TAB
// ═══════════════════════════════════════════════════════════

async function loadSettingsTab() {
    // Load connection settings
    const { webAppUrl = "", sheetUrl = "", dailyGoal = 5 } = await chrome.storage.local.get(["webAppUrl", "sheetUrl", "dailyGoal"]);
    $settingsWebAppUrl.value = webAppUrl;
    $settingsSheetUrl.value = sheetUrl;
    $settingsDailyGoal.value = dailyGoal;

    // Render resume library
    await renderResumeLibrary();
}

async function renderResumeLibrary() {
    const library = await getResumeLibrary();
    $resumeLibraryList.innerHTML = "";

    if (library.length === 0) {
        $resumeLibraryEmpty.style.display = "flex";
        return;
    }
    $resumeLibraryEmpty.style.display = "none";

    // Setup drag and drop state for reordering
    let draggedItemIdx = null;

    library.forEach((resume, idx) => {
        const item = document.createElement("div");
        item.className = "resume-library-item";
        item.draggable = true; // Make item draggable
        item.dataset.idx = idx; // Store original index on element
        
        item.innerHTML = `
            <div class="resume-library-drag-handle" title="Drag to reorder" style="cursor: grab; margin-right: 8px; color: var(--text-muted); display: flex; align-items: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </div>
            <div class="resume-library-info">
                <div class="resume-library-name">${escapeHtml(resume.name)}</div>
                ${resume.driveUrl
                    ? `<a class="resume-library-link" href="${escapeHtml(resume.driveUrl)}" target="_blank">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Open in Drive
                       </a>`
                    : `<span class="resume-library-no-link">Not uploaded yet</span>`}
            </div>
            <div class="resume-library-actions">
                <button class="resume-delete-btn" data-idx="${idx}" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            </div>
        `;
        
        // Drag events for reordering
        item.addEventListener("dragstart", (e) => {
            draggedItemIdx = parseInt(item.dataset.idx);
            item.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", draggedItemIdx); // needed for Firefox
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
            draggedItemIdx = null;
        });

        item.addEventListener("dragover", (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = "move";
            const bounding = item.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            if (e.clientY - offset > 0) {
                item.style.borderBottom = "2px solid var(--primary)";
                item.style.borderTop = "";
            } else {
                item.style.borderTop = "2px solid var(--primary)";
                item.style.borderBottom = "";
            }
        });

        item.addEventListener("dragleave", () => {
            item.style.borderTop = "";
            item.style.borderBottom = "";
        });

        item.addEventListener("drop", async (e) => {
            e.preventDefault();
            item.style.borderTop = "";
            item.style.borderBottom = "";
            
            if (draggedItemIdx === null) return;
            const targetIdx = parseInt(item.dataset.idx);
            
            if (draggedItemIdx !== targetIdx) {
                const lib = await getResumeLibrary();
                
                // Adjust target index if dropping below the midpoint
                const bounding = item.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                let dropTargetIdx = targetIdx;
                if (e.clientY - offset > 0) {
                    dropTargetIdx++;
                }

                if (draggedItemIdx < dropTargetIdx) {
                    dropTargetIdx--;
                }
                
                // Move item in array
                const [movedItem] = lib.splice(draggedItemIdx, 1);
                lib.splice(dropTargetIdx, 0, movedItem);
                
                await saveResumeLibrary(lib);
                await renderResumeLibrary();
                await populateResumeDropdown();
            }
        });

        $resumeLibraryList.appendChild(item);
    });

    // Delete button handlers
    $resumeLibraryList.querySelectorAll(".resume-delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const idx = parseInt(btn.dataset.idx);
            const lib = await getResumeLibrary();
            lib.splice(idx, 1);
            await saveResumeLibrary(lib);
            await renderResumeLibrary();
            await populateResumeDropdown();
        });
    });
}

/** Upload a general resume PDF to Drive via Apps Script, store driveUrl in library */
async function uploadGeneralResume(name, file) {
    const stored = await chrome.storage.local.get("webAppUrl");
    let webAppUrl = stored.webAppUrl || "";
    if (!webAppUrl && typeof CONFIG !== "undefined") webAppUrl = CONFIG.WEB_APP_URL;
    if (!webAppUrl || webAppUrl === "YOUR_WEB_APP_URL_HERE") {
        throw new Error("Web App URL not set. Go to Connection settings first.");
    }

    const base64 = await fileToBase64(file);
    const payload = {
        action: "uploadGeneralResume",
        resumeName: name,
        fileName: file.name,
        fileData: base64,
    };

    // Can't read response with no-cors, so we use a separate upload endpoint approach:
    // We send with mode:"cors" since Apps Script returns JSON
    const resp = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
    });
    const json = await resp.json();
    if (json.status !== "success") throw new Error(json.message || "Upload failed");
    return json.driveUrl; // returned by Apps Script
}

// Add resume button — uploads PDF and saves to library
$addResumeBtn.addEventListener("click", async () => {
    const name = $newResumeName.value.trim();
    const file = $newResumeFile.files[0];
    if (!name) { $newResumeName.focus(); return; }
    if (!file) {
        $addResumeStatus.textContent = "Please choose a PDF file.";
        $addResumeStatus.className = "upload-status error";
        return;
    }

    $addResumeBtn.disabled = true;
    $addResumeStatus.textContent = "Uploading to Drive…";
    $addResumeStatus.className = "upload-status uploading";

    try {
        const driveUrl = await uploadGeneralResume(name, file);

        const lib = await getResumeLibrary();
        const existing = lib.findIndex((r) => r.name === name);
        if (existing >= 0) {
            lib[existing].driveUrl = driveUrl; // update existing
        } else {
            lib.push({ name, driveUrl });
        }
        await saveResumeLibrary(lib);

        $newResumeName.value = "";
        $newResumeFile.value = "";
        $newResumeFileText.textContent = "Choose PDF file…";
        $addResumeStatus.textContent = "✅ Uploaded & saved!";
        $addResumeStatus.className = "upload-status success";
        setTimeout(() => { $addResumeStatus.textContent = ""; $addResumeStatus.className = "upload-status"; }, 3000);

        await renderResumeLibrary();
        await populateResumeDropdown();
    } catch (err) {
        $addResumeStatus.textContent = "❌ " + err.message;
        $addResumeStatus.className = "upload-status error";
    } finally {
        $addResumeBtn.disabled = false;
    }
});

// Save connection settings
$saveConnectionBtn.addEventListener("click", async () => {
    const webAppUrl = $settingsWebAppUrl.value.trim();
    const sheetUrl = $settingsSheetUrl.value.trim();
    const dailyGoal = parseInt($settingsDailyGoal.value) || 5;
    await chrome.storage.local.set({ webAppUrl, sheetUrl, dailyGoal, setupComplete: true });
    $settingsStatus.textContent = "✅ Settings saved!";
    $settingsStatus.className = "status success visible";
    setTimeout(() => $settingsStatus.classList.remove("visible"), 3000);
});

// ═══════════════════════════════════════════════════════════
//  INIT — Check first-time, scrape data, check duplicates
// ═══════════════════════════════════════════════════════════

async function init() {
    // Check if setup is complete
    const { setupComplete, webAppUrl, theme } = await chrome.storage.local.get(["setupComplete", "webAppUrl", "theme"]);

    // Apply theme — default to 'dark' on first install
    applyTheme(theme || "dark");

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

    const selectedResume = $resumeSelect.value;
    const isTailored = selectedResume === "__tailored__";

    // General resume: name + drive URL from library
    let resumeUsed = "";
    let resumeDriveUrl = "";
    if (!isTailored && selectedResume !== "__add_new__") {
        resumeUsed = selectedResume;
        const library = await getResumeLibrary();
        const found = library.find((r) => r.name === selectedResume);
        if (found) resumeDriveUrl = found.driveUrl || "";
    }

    // Tailored resume — read as base64 if selected and file picked
    let tailoredBase64 = "";
    let tailoredFileName = "";
    if (isTailored) {
        const tailoredFile = $tailoredResumeFile.files[0];
        if (tailoredFile) {
            tailoredBase64 = await fileToBase64(tailoredFile);
            tailoredFileName = tailoredFile.name;
        }
    }

    const payload = {
        applicationDate: formatDateOnly(now),
        jobTitle: $jobTitle.value.trim(),
        companyName: $companyName.value.trim(),
        url: $pageUrl.value,
        location: $location.value.trim(),
        salary: $salary.value.trim(),
        resumeUsed,
        resumeDriveUrl,
        tailoredFileData: tailoredBase64,
        tailoredFileName: tailoredFileName,
        source: extractDomain($pageUrl.value),
        status: $appStatus.value,
        notes: $notes.value.trim(),
    };

    try {
        await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload),
        });

        // Save to local history (for dashboard)
        await chrome.runtime.sendMessage({ action: "saveApplication", data: payload });

        showStatus("✅  Saved to Google Sheet!", "success");
        
        // Close the iframe tracker upon successful save
        setTimeout(() => {
            window.parent.postMessage({ action: "closeJobTracker" }, "*");
        }, 1500); // Give user time to see success message

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
//  DASHBOARD — fetches live stats from Google Sheet via doGet
// ═══════════════════════════════════════════════════════════

async function fetchSheetStats(webAppUrl) {
    const resp = await fetch(webAppUrl + "?action=getStats", { method: "GET" });
    const json = await resp.json();
    if (json.status !== "ok") throw new Error(json.message || "Sheet error");
    return json;
}

async function loadDashboard() {
    try {
        const { dailyGoal = 5 } = await chrome.storage.local.get("dailyGoal");
        let stored = await chrome.storage.local.get("webAppUrl");
        let webAppUrl = stored.webAppUrl || ((typeof CONFIG !== "undefined") ? CONFIG.WEB_APP_URL : "");

        let stats = null;

        // Try fetching live data from the sheet
        if (webAppUrl && webAppUrl !== "YOUR_WEB_APP_URL_HERE") {
            try {
                stats = await fetchSheetStats(webAppUrl);
            } catch (e) {
                console.warn("Sheet stats fetch failed, falling back to local:", e);
            }
        }

        // Fall back to local history if sheet fetch failed
        if (!stats) {
            stats = await chrome.runtime.sendMessage({ action: "getStats" });
        }
        if (!stats) return;

        // Merge daily goal from local storage (sheet doesn't store it)
        stats.dailyGoal = stats.dailyGoal || dailyGoal;

        // ── Daily Goal Ring ──
        const pct = Math.min(stats.todayCount / stats.dailyGoal, 1);
        const circumference = 2 * Math.PI * 42;
        $goalRingFill.style.strokeDashoffset = circumference * (1 - pct);
        $goalCount.textContent = stats.todayCount;
        $goalTotal.textContent = stats.dailyGoal;

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

        // ── Status Breakdown bars (replaces likelihood since we removed it) ──
        const statusBreakdown = stats.statusBreakdown || {};
        const maxLik = Math.max(...Object.values(statusBreakdown), 1);
        $barHigh.style.width = `${((statusBreakdown["Applied"] || 0) / maxLik) * 100}%`;
        $barMedium.style.width = `${((statusBreakdown["Screening Call"] || 0) + (statusBreakdown["OA"] || 0)) / maxLik * 100}%`;
        $barLow.style.width = `${((statusBreakdown["Rejected"] || 0) / maxLik) * 100}%`;
        $countHigh.textContent = statusBreakdown["Applied"] || 0;
        $countMedium.textContent = (statusBreakdown["Screening Call"] || 0) + (statusBreakdown["OA"] || 0);
        $countLow.textContent = statusBreakdown["Rejected"] || 0;

        // ── Source Chips ──
        const sources = stats.sources || {};
        const entries = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6);
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
            <div class="recent-dot status-${escapeHtml((app.status || "Applied").replace(/\s+/g,""))}"></div>
            <div class="recent-info">
              <div class="recent-title">${escapeHtml(app.jobTitle || "Untitled")}</div>
              <div class="recent-company">${escapeHtml(app.companyName || "—")}</div>
            </div>
            <div class="recent-meta">
              <span class="recent-status-badge status-${escapeHtml((app.status || "Applied").replace(/\s+/g,""))}">${escapeHtml(app.status || "Applied")}</span>
              <span class="recent-date">${app.applicationDate || ""}</span>
            </div>
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
