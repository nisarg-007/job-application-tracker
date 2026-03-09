/* =========================================================
   background.js — MV3 Service Worker
   Created by Nisarg Shah [Vibe Coder]
   - Opens welcome/onboarding page on first install
   - Injects content script on demand
   - Manages follow-up reminder badge
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

    // Update badge for follow-up reminders
    await updateFollowUpBadge();
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

    // Today's count
    const todayStr = now.toISOString().slice(0, 10);
    const todayApps = history.filter((a) => a.applicationDate === todayStr);

    // This week's count (Sunday start)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekApps = history.filter((a) => new Date(a.savedAt) >= weekStart);

    // Source breakdown
    const sources = {};
    history.forEach((a) => {
        const s = a.source || "Other";
        sources[s] = (sources[s] || 0) + 1;
    });

    // Likelihood breakdown
    const likelihoods = { High: 0, Medium: 0, Low: 0 };
    history.forEach((a) => {
        if (likelihoods.hasOwnProperty(a.likelihood)) {
            likelihoods[a.likelihood]++;
        }
    });

    // Follow-up needed (7+ days, not marked as followed up)
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
        likelihoods,
        needFollowUp: needFollowUp.length,
        recentApps: history.slice(0, 5),
    };
}

// ─── Follow-Up Badge ─────────────────────────────────────

async function updateFollowUpBadge() {
    const { history = [] } = await chrome.storage.local.get("history");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = history.filter(
        (a) => !a.followedUp && new Date(a.savedAt) < sevenDaysAgo
    ).length;

    if (count > 0) {
        chrome.action.setBadgeText({ text: String(count) });
        chrome.action.setBadgeBackgroundColor({ color: "#f87171" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

// ─── Periodic badge update (every 6 hours) ────────────────
chrome.alarms.create("followUpCheck", { periodInMinutes: 360 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "followUpCheck") {
        updateFollowUpBadge();
    }
});

// Initial badge check on service worker start
updateFollowUpBadge();
