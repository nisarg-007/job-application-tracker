/* =========================================================
   background.js — MV3 Service Worker
   Created by Nisarg Shah and Somil Doshi [Vibe Coder]
   - Opens welcome/onboarding page on first install
   - Injects content script on demand
   - Tracks application history in chrome.storage
   ========================================================= */

"use strict";

// ─── On Install: open onboarding wizard ───────────────────
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        // First install — open the welcome wizard
        chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    }
});

// ─── On Action Click: toggle iframe ──────────────────────
// Content script is auto-injected by manifest content_scripts.
// Try sendMessage first; only fall back to executeScript if the
// content script hasn't initialised yet on this page.
chrome.action.onClicked.addListener((tab) => {
    if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) {
        // Restricted page — nothing we can do
        return;
    }
    chrome.tabs.sendMessage(tab.id, { action: "toggleJobTracker" }, () => {
        if (chrome.runtime.lastError) {
            // Content script not ready yet — inject then toggle
            chrome.scripting.executeScript(
                { target: { tabId: tab.id }, files: ["content_script.js"] },
                () => {
                    if (chrome.runtime.lastError) {
                        console.warn("Could not inject:", chrome.runtime.lastError.message);
                    } else {
                        chrome.tabs.sendMessage(tab.id, { action: "toggleJobTracker" });
                    }
                }
            );
        }
    });
});

// ─── Message Listener ─────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Inject content script on demand
    if (message.action === "ensureContentScript") {
        const tabId = message.tabId;
        chrome.scripting.executeScript(
            { target: { tabId }, files: ["content_script.js"] },
            () => {
                if (chrome.runtime.lastError) {
                    console.warn("Could not inject:", chrome.runtime.lastError.message);
                    sendResponse({ injected: false });
                } else {
                    sendResponse({ injected: true });
                }
            }
        );
        return true; // async
    }

    // Save an application to history (called from popup.js)
    if (message.action === "saveApplication") {
        saveApplicationToHistory(message.data).then(() => {
            sendResponse({ saved: true });
        });
        return true;
    }

    // Get application history
    if (message.action === "getHistory") {
        getHistory().then((history) => {
            sendResponse({ history });
        });
        return true;
    }

    // Get dashboard stats
    if (message.action === "getStats") {
        getStats().then((stats) => {
            sendResponse(stats);
        });
        return true;
    }

    // Check for duplicate URL
    if (message.action === "checkDuplicate") {
        checkDuplicate(message.url).then((result) => {
            sendResponse(result);
        });
        return true;
    }
});

// ─── Application History Storage ──────────────────────────

async function saveApplicationToHistory(appData) {
    const { history = [] } = await chrome.storage.local.get("history");

    history.unshift({
        ...appData,
        savedAt: new Date().toISOString(),
        followedUp: false,
    });

    // Keep last 200 applications
    if (history.length > 200) history.length = 200;

    await chrome.storage.local.set({ history });
}

async function getHistory() {
    const { history = [] } = await chrome.storage.local.get("history");
    return history;
}

async function checkDuplicate(url) {
    const { history = [] } = await chrome.storage.local.get("history");
    const match = history.find((app) => app.url === url);
    if (match) {
        return {
            isDuplicate: true,
            existingApp: {
                jobTitle: match.jobTitle,
                companyName: match.companyName,
                savedAt: match.savedAt,
            },
        };
    }
    return { isDuplicate: false };
}

// ─── Dashboard Stats ─────────────────────────────────────

async function getStats() {
    const { history = [], dailyGoal = 5 } = await chrome.storage.local.get(["history", "dailyGoal"]);
    const now = new Date();

    // ── Today's count ──
    // Use the same "dd-MMM-yy" format as formatDateOnly() in popup.js
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const todayStr = `${String(now.getDate()).padStart(2,"0")}-${months[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`;
    const todayApps = history.filter((a) => a.applicationDate === todayStr);

    // ── This week's count (Sunday start) ──
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekApps = history.filter((a) => new Date(a.savedAt) >= weekStart);

    // ── Source breakdown ──
    const sources = {};
    history.forEach((a) => {
        const s = a.source || "Other";
        sources[s] = (sources[s] || 0) + 1;
    });

    // ── Status breakdown (used by dashboard bars in popup.js) ──
    const statusBreakdown = {};
    history.forEach((a) => {
        const s = a.status || "Applied";
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    });

    // ── Follow-up needed (7+ days, not marked as followed up) ──
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const needFollowUp = history.filter(
        (a) => !a.followedUp && new Date(a.savedAt) < sevenDaysAgo
    );

    return {
        totalApps: history.length,
        todayCount: todayApps.length,
        dailyGoal,
        weekCount: weekApps.length,
        sources,
        statusBreakdown,
        needFollowUp: needFollowUp.length,
        recentApps: history.slice(0, 5),
    };
}
