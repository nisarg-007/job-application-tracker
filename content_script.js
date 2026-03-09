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
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".job-details-jobs-unified-top-card__primary-description-container a",
        ".job-details-jobs-unified-top-card__primary-description a",
        ".job-details-jobs-unified-top-card__primary-description",
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

    // ───── Company extraction from URL (Lever, Greenhouse) ─────
    function companyFromUrl() {
        try {
            const hostname = location.hostname;
            const pathname = location.pathname;
            const parts = pathname.split("/").filter(Boolean);

            if (hostname.includes("lever.co")) {
                if (parts.length > 0) {
                    return parts[0]
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                }
            } else if (hostname.includes("greenhouse.io")) {
                if (parts.length > 0) {
                    let comp = parts[0];
                    if (comp !== "embed" && comp !== "jobs") {
                        return comp.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    } else if (parts.length > 1) {
                        return parts[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    }
                }
            }
        } catch (_) { }
        return "";
    }

    // ───── Teal‑specific company extraction ─────
    function companyFromTeal() {
        try {
            if (location.hostname.includes("tealhq.com")) {
                const titleEl = document.querySelector("h1");
                if (titleEl && titleEl.nextElementSibling) {
                    const text = titleEl.nextElementSibling.innerText || titleEl.nextElementSibling.textContent || "";
                    const parts = text.split("·");
                    if (parts.length > 0) return parts[0].trim();
                }
            }
        } catch (_) { }
        return "";
    }

    function extractSalary() {
        const text = document.body.innerText || "";
        const match = text.match(/\$[\d,]{2,7}(?:\.\d+)?\s*(?:k|K|m|M)?\s*(?:-|to|—)\s*\$[\d,]{2,7}(?:\.\d+)?\s*(?:k|K|m|M)?/i);
        if (match) return match[0];

        const singleMatch = text.match(/(?:Salary|Pay|Compensation).*?(\$[\d,]{3,7}(?:\.\d+)?\s*(?:k|K|m|M)?)/i);
        if (singleMatch) return singleMatch[1];

        return "";
    }

    function extractLocation() {
        const LOCATION_SELECTORS = [
            // LinkedIn
            ".job-details-jobs-unified-top-card__exact-location",
            ".job-details-jobs-unified-top-card__primary-description-container span.tvm__text",
            ".jobs-unified-top-card__bullet",

            // Indeed
            '[data-testid="inlineHeader-companyLocation"]',
            "#jobLocationText",

            // Greenhouse
            ".location",
            "#header .location",
            ".job__location",

            // Lever
            ".sort-by-time.posting-category",
            ".posting-categories .location",

            // Workday
            'div[data-automation-id="locations"] dd',
            'div[data-automation-id="location"] dd',

            // Glassdoor
            '[data-test="location"]',

            // Ashby
            ".job-info-list button:nth-child(2)",
            ".job-info-list button",

            // Generic fallbacks
            ".company-location",
            ".job-location",
            ".posting-location",
            '[itemprop="jobLocation"]'
        ];

        let domLoc = queryFirst(LOCATION_SELECTORS) || "";

        // Secondary fallback for Greenhouse specifically (og:description often holds location)
        if (!domLoc && location.hostname.includes("greenhouse.io")) {
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc && ogDesc.content) {
                domLoc = ogDesc.content.trim();
            }
        }

        // Scan full body text for remote/hybrid indicator (removed 3000 limit)
        const text = document.body.innerText || "";
        const modeMatch = text.match(/\b(Remote|Hybrid|On-site|Onsite)\b/i);
        let mode = "";

        if (modeMatch) {
            let m = modeMatch[1].toLowerCase();
            mode = m === "onsite" ? "On-site" : m.charAt(0).toUpperCase() + m.slice(1);
        }

        // Output clean up
        domLoc = domLoc.replace(/\n/g, ", ").replace(/\s{2,}/g, " ").trim();

        if (domLoc && mode) {
            if (!domLoc.toLowerCase().includes(mode.toLowerCase())) {
                return `${domLoc} (${mode})`;
            }
            return domLoc;
        } else if (domLoc) {
            return domLoc;
        } else if (mode) {
            return mode;
        }
        return "";
    }

    // ───────── Main scraper ─────────

    function scrapeJobData() {
        let jobTitle = queryFirst(TITLE_SELECTORS);
        if (!jobTitle) jobTitle = titleFromMeta();

        let companyName = "";

        if (location.hostname.includes("tealhq.com")) {
            companyName = companyFromTeal();
        }

        if (!companyName) companyName = queryFirst(COMPANY_SELECTORS);
        if (!companyName) companyName = companyFromMeta();
        if (!companyName) companyName = companyFromUrl();

        return {
            jobTitle: jobTitle || "",
            companyName: companyName || "",
            salary: extractSalary(),
            location: extractLocation()
        };
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
