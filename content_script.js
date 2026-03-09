/* =========================================================
   content_script.js — Scrapes job title & company name from
   the active page DOM. Runs on every page, responds to
   messages from the popup.
   Created by Nisarg Shah [Vibe Coder]
   ========================================================= */

(() => {
    "use strict";

    // ───────── Job‑title selectors (ordered by specificity) ─────────

    const TITLE_SELECTORS = [
        // LinkedIn
        "h1.top-card-layout__title",
        ".jobs-unified-top-card h1",
        ".job-details-jobs-unified-top-card__job-title h1",
        ".jobs-unified-top-card__job-title",
        'a.topcard__title',

        // Indeed
        ".jobsearch-JobInfoHeader-title",
        'h1[data-testid="jobsearch-JobInfoHeader-title"]',
        ".jobsearch-JobInfoHeader-title-container h1",

        // Greenhouse
        ".app-title",
        "#header .company-name + h1",
        'h1[class*="posting-headline"]',

        // Lever
        ".posting-headline h2",
        ".section-wrapper h1",

        // Workday
        'h2[data-automation-id="jobPostingHeader"]',
        'div[data-automation-id="jobPostingHeader"] h2',

        // Glassdoor
        '[data-test="job-title"]',

        // Generic fallbacks
        "h1.job-title",
        "h1.title",
        "h1",
    ];

    // ───────── Company‑name selectors ─────────

    const COMPANY_SELECTORS = [
        // LinkedIn
        ".topcard__org-name-link",
        ".jobs-unified-top-card__company-name a",
        ".jobs-unified-top-card__company-name",
        'a[data-tracking-control-name="public_jobs_topcard-org-name"]',

        // Indeed
        '[data-testid="inlineHeader-companyName"]',
        ".jobsearch-InlineCompanyRating-companyHeader a",
        ".jobsearch-InlineCompanyRating div:first-child a",

        // Greenhouse
        ".company-name",
        "#header .company-name",

        // Lever
        ".posting-categories .sort-by-time",
        ".main-header-logo img[alt]",

        // Workday
        'div[data-automation-id="jobPostingHeader"] dd',

        // Glassdoor
        '[data-test="employer-name"]',

        // Generic
        ".company-name",
        ".employer-name",
        '[itemprop="hiringOrganization"] [itemprop="name"]',
    ];

    // ───────── Helpers ─────────

    function queryFirst(selectors) {
        for (const sel of selectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const text = (el.textContent || "").trim();
                    if (text.length > 0 && text.length < 300) return text;
                }
            } catch (_) { /* invalid selector – skip */ }
        }
        return null;
    }

    function titleFromMeta() {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) return ogTitle.content.trim();
        return document.title || "";
    }

    function companyFromMeta() {
        const ogSite = document.querySelector('meta[property="og:site_name"]');
        if (ogSite) return ogSite.content.trim();
        const author = document.querySelector('meta[name="author"]');
        if (author) return author.content.trim();
        return "";
    }

    // ───── Lever‑specific company extraction from URL ─────
    function companyFromLeverUrl() {
        try {
            const hostname = location.hostname; // e.g. jobs.lever.co
            if (hostname.includes("lever.co")) {
                const parts = location.pathname.split("/").filter(Boolean);
                if (parts.length > 0) {
                    return parts[0]
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                }
            }
        } catch (_) { }
        return "";
    }

    // ───────── Main scraper ─────────

    function scrapeJobData() {
        let jobTitle = queryFirst(TITLE_SELECTORS);
        if (!jobTitle) jobTitle = titleFromMeta();

        let companyName = queryFirst(COMPANY_SELECTORS);
        if (!companyName) companyName = companyFromMeta();
        if (!companyName) companyName = companyFromLeverUrl();

        return { jobTitle: jobTitle || "", companyName: companyName || "" };
    }

    // ───────── Message listener ─────────
    // The popup sends { action: "scrapeJobData" } and we respond.

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "scrapeJobData") {
            sendResponse(scrapeJobData());
        }
        return true; // keep channel open for async
    });
})();
