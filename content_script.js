/* =========================================================
   content_script.js — Scrapes job title & company name from
   the active page DOM. Runs on every page, responds to
   messages from the popup.
   Created by Nisarg Shah and Somil Doshi [Vibe Coder]
   ========================================================= */

(() => {
    "use strict";

    // ───────── Helpers ─────────

    function firstText(selectors, root) {
        const ctx = root || document;
        for (const sel of selectors) {
            try {
                const el = ctx.querySelector(sel);
                if (el) {
                    const text = (el.textContent || "").trim();
                    if (text.length > 0 && text.length < 300) return text;
                }
            } catch (_) { /* invalid selector – skip */ }
        }
        return "";
    }

    // ═══════════════════════════════════════════════════════
    //  Per-site scrapers — each returns { jobTitle, companyName }
    //  Return empty string to signal "not found" for a field.
    // ═══════════════════════════════════════════════════════

    function scrapeLinkedIn() {
        let jobTitle = firstText([
            ".job-details-jobs-unified-top-card__job-title h1",
            ".job-details-jobs-unified-top-card__job-title h2",
            ".job-details-jobs-unified-top-card__job-title a",
            ".job-details-jobs-unified-top-card__job-title",
            "h1.top-card-layout__title",
            ".jobs-unified-top-card h1",
            ".jobs-unified-top-card h2",
            ".jobs-unified-top-card__job-title",
            ".job-view-layout h1",
            ".job-view-layout h2",
            'a.topcard__title',
            "h1[class*='job-title']",
            "h2[class*='job-title']"
        ]);
        let companyName = firstText([
            ".job-details-jobs-unified-top-card__company-name a",
            ".job-details-jobs-unified-top-card__company-name",
            ".job-details-jobs-unified-top-card__primary-description-container a",
            ".job-details-jobs-unified-top-card__primary-description-container div a",
            ".job-details-jobs-unified-top-card__primary-description a",
            ".job-details-jobs-unified-top-card__subtitle-primary-description a",
            ".job-details-jobs-unified-top-card__subtitle-primary-description",
            ".topcard__org-name-link",
            ".jobs-unified-top-card__company-name a",
            ".jobs-unified-top-card__company-name",
            'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
            ".job-view-layout .job-details-jobs-unified-top-card__primary-description a",
        ]);

        // Fallback to active card in the left list if right pane is still rendering
        if (!jobTitle) {
            const activeCardTitle = document.querySelector(".jobs-search-results-list__list-item--active .job-card-list__title, .scaffold-layout__list-item--active .job-card-list__title");
            if (activeCardTitle) {
                jobTitle = (activeCardTitle.textContent || "").trim();
            }
        }
        if (!companyName) {
            const activeCardCompany = document.querySelector(".jobs-search-results-list__list-item--active .job-card-container__primary-description, .scaffold-layout__list-item--active .job-card-container__primary-description");
            if (activeCardCompany) {
                companyName = (activeCardCompany.textContent || "").trim();
            }
        }

        // Return a special placeholder string if we absolutely can't find it to prevent popup from using generic tab titles like "Top job picks"
        if (!jobTitle) {
            jobTitle = " "; // Return space to trick popup.js into NOT using its fallback `tab.title`, leaving it empty
        }

        return { jobTitle, companyName };
    }

    function scrapeIndeed() {
        let jobTitle = firstText([
            'h1[data-testid="jobsearch-JobInfoHeader-title"]',
            ".jobsearch-JobInfoHeader-title",
            ".jobsearch-JobInfoHeader-title-container h1",
        ]);
        const companyName = firstText([
            '[data-testid="inlineHeader-companyName"] a',
            '[data-testid="inlineHeader-companyName"]',
            ".jobsearch-InlineCompanyRating-companyHeader a",
            ".jobsearch-InlineCompanyRating div:first-child a",
        ]);
        
        if (jobTitle) {
            jobTitle = jobTitle.replace(/\s*-\s*job\s*post$/i, "").trim();
        }

        return { jobTitle, companyName };
    }

    function scrapeGlassdoor() {
        // Glassdoor renders a split-pane: job list on left, detail on right.
        // data-test attributes are stable across redesigns.
        const jobTitle = firstText([
            '[data-test="job-title"]',
            'h1[data-test="job-title"]',
            '[class*="JobTitle"]',
            '[class*="job-title"]',
        ]);
        // Employer name: data-test is the most stable selector.
        // Never fall back to og:site_name (that returns "Glassdoor").
        const companyName = firstText([
            '[data-test="employer-name"]',
            '[data-test="employerName"]',
            'h4[class*="EmployerName"]',
            'span[class*="EmployerName"]',
            '[class*="employer-name"]',
        ]);
        return { jobTitle, companyName };
    }

    function scrapeGreenhouse() {
        const jobTitle = firstText([
            ".app-title",
            'h1[class*="posting-headline"]',
            "#header .company-name + h1",
            "h1",
        ]);
        const companyName = firstText([
            "#header .company-name",
            ".company-name",
        ]);
        return { jobTitle, companyName };
    }

    function scrapeLever() {
        const jobTitle = firstText([
            ".posting-headline h2",
            ".section-wrapper h1",
            "h2",
        ]);
        // Company name from URL path: jobs.lever.co/companyname/...
        let companyName = "";
        try {
            const parts = location.pathname.split("/").filter(Boolean);
            if (parts.length > 0) {
                companyName = parts[0]
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
            }
        } catch (_) { }
        return { jobTitle, companyName };
    }

    function scrapeWorkday() {
        const jobTitle = firstText([
            'h2[data-automation-id="jobPostingHeader"]',
            'div[data-automation-id="jobPostingHeader"] h2',
        ]);
        const companyName = firstText([
            'div[data-automation-id="jobPostingHeader"] dd',
        ]);
        return { jobTitle, companyName };
    }

    function scrapeTeal() {
        const jobTitle = firstText(["h1"]);
        let companyName = "";
        try {
            const titleEl = document.querySelector("h1");
            if (titleEl && titleEl.nextElementSibling) {
                const text = titleEl.nextElementSibling.innerText || titleEl.nextElementSibling.textContent || "";
                const parts = text.split("·");
                if (parts.length > 0) companyName = parts[0].trim();
            }
        } catch (_) { }
        return { jobTitle, companyName };
    }

    function scrapeWellfound() {
        // Wellfound pages: /company/shopmonkey (company overview) or /jobs/... (job detail)
        // Breadcrumb HTML: <div class="shared-breadcrumb ...">
        //   <a class="shared-breadcrumb-text">Discover</a> ›
        //   <a class="shared-breadcrumb-text">Startups</a> ›
        //   <span class="shared-breadcrumb-text">Shopmonkey</span>  ← last item, a <span> not <a>
        // </div>
        let companyName = "";
        let jobTitle = "";

        try {
            // Last breadcrumb item is a <span> (current page), previous items are <a> tags.
            // We want the last .shared-breadcrumb-text element regardless of tag.
            const crumbItems = document.querySelectorAll(
                '.shared-breadcrumb .shared-breadcrumb-text, [class*="breadcrumb"] .shared-breadcrumb-text'
            );
            if (crumbItems.length > 0) {
                const last = crumbItems[crumbItems.length - 1];
                const t = (last.textContent || "").trim();
                // Skip generic items like "Startups", "Companies", "Jobs"
                if (t && !/^(startups?|companies|jobs|discover|home)$/i.test(t)) {
                    companyName = t;
                }
            }

            // Fallback: the prominent company name heading on the page
            // Wellfound renders it as an <h2> or inside a styled div
            if (!companyName) {
                const nameEl = document.querySelector(
                    '[data-test="startup-name"], [class*="startupName"], [class*="startup-name"]'
                );
                if (nameEl) companyName = (nameEl.textContent || "").trim();
            }

            // Job title: on a job detail page it appears in an <h1> or <h2>
            // On the company overview page there is no job title.
            jobTitle = firstText([
                'h1[class*="title"]',
                'h2[class*="title"]',
                '[data-test="job-title"]',
            ]);

            // Strip " careers" suffix (e.g. "Shopmonkey careers" page heading)
            companyName = companyName.replace(/\s+careers?$/i, "").trim();
        } catch (_) { }

        return { jobTitle, companyName };
    }

    function scrapeYCombinator() {
        let companyName = "";
        let jobTitle = "";

        try {
            // First try to scrape job title specifically from YC job detail page.
            jobTitle = firstText([
                "h1",
                ".post-title",
                'h1[class*="title"]',
                ".ycdc-with-link-color a[href*=\"/jobs/\"]"
            ]);

            // Company name: last item in the shared-breadcrumb (it's a <span>, not an <a>)
            const crumbSpan = document.querySelector('.shared-breadcrumb span.shared-breadcrumb-text');
            if (crumbSpan) {
                const t = (crumbSpan.textContent || "").trim();
                if (t && !/^(home|companies|startups|jobs)$/i.test(t)) companyName = t;
            }

            // Fallback: the company name heading div (Tailwind class, less stable but works)
            if (!companyName) {
                const nameDiv = document.querySelector('div.text-2xl');
                if (nameDiv) companyName = (nameDiv.textContent || "").trim();
            }
            
            // Fallback via document title if missing
            if ((!jobTitle || !companyName) && document.title) {
                // Typical format: "Senior Test & Release Engineer at Soraban | Y Combinator"
                const titleParts = document.title.split('|');
                if (titleParts.length > 0) {
                    const atParts = titleParts[0].split(' at ');
                    if (atParts.length >= 2) {
                        if (!jobTitle) jobTitle = atParts[0].trim();
                        if (!companyName) companyName = atParts[1].trim();
                     } else if (!jobTitle) {
                        jobTitle = titleParts[0].trim();
                     }
                }
            }
            
        } catch (_) { }

        return { jobTitle, companyName };
    }

    function scrapeJobright() {
        const jobTitle = firstText([
            'h1[class*="title"]',
            'h2[class*="title"]',
            '[data-testid="job-title"]',
            'h1',
        ]);
        const companyName = firstText([
            '[class*="company-name"]',
            '[class*="companyName"]',
            '[data-testid="company-name"]',
            'a[href*="/company/"]',
        ]);
        return { jobTitle, companyName };
    }

    function scrapeWayUp() {
        // WayUp opens jobs in a modal/drawer on top of the listing page.
        // From screenshot: modal header shows company logo + "Defense Logistics Agency" + location,
        // and job title "Lead Contract Specialist" appears at top-right of modal.
        let jobTitle = "";
        let companyName = "";

        try {
            // Try modal/dialog context first, fall back to full document
            const modal = document.querySelector('[role="dialog"], [class*="JobModal"], [class*="job-modal"], [class*="ApplicationModal"]');
            const ctx = modal || document;

            // Job title: prominent heading inside the modal
            jobTitle = firstText([
                'h1',
                'h2',
                '[class*="job-title"]',
                '[class*="JobTitle"]',
                '[class*="position-title"]',
                '[class*="PositionTitle"]',
            ], ctx);

            // Company name: shown near the company logo in the modal header
            companyName = firstText([
                '[class*="company-name"]',
                '[class*="CompanyName"]',
                '[class*="employer-name"]',
                '[class*="EmployerName"]',
                'a[href*="/profile/"]',
                'a[href*="/company/"]',
            ], ctx);

            // Reject platform strings that leaked in
            const BAD = /^(wayup|get hired|jobs\s*&\s*internships|search location)/i;
            if (jobTitle && BAD.test(jobTitle)) jobTitle = "";
            if (companyName && (BAD.test(companyName) || companyName.length > 80)) companyName = "";
        } catch (_) { }

        return { jobTitle, companyName };
    }

    // ───── Generic company-website (direct company career pages) ─────
    function scrapeCompanyWebsite() {
        // Schema.org JobPosting markup — most reliable
        const schemaTitle = firstText(['[itemtype*="JobPosting"] [itemprop="title"]', '[itemprop="title"]']);
        const schemaCompany = firstText(['[itemtype*="JobPosting"] [itemprop="hiringOrganization"] [itemprop="name"]']);

        const jobTitle = schemaTitle || firstText(["h1.job-title", "h1.title", "h1"]);

        let companyName = schemaCompany;
        if (!companyName) {
            // Logo alt text in header/nav is often the company name
            const logoImg = document.querySelector('header img[alt], .navbar img[alt], nav img[alt], [class*="logo"] img[alt]');
            if (logoImg) {
                const alt = (logoImg.getAttribute("alt") || "").trim();
                if (alt.length > 0 && alt.length < 60 && !/logo/i.test(alt)) companyName = alt;
            }
        }
        if (!companyName) {
            // og:site_name is set to company name on most career pages
            const ogSite = document.querySelector('meta[property="og:site_name"]');
            if (ogSite) companyName = (ogSite.content || "").trim();
        }

        // Clean up job title: strip "CompanyName - Job Title" or "Job Title | CompanyName"
        let cleanTitle = jobTitle;
        if (cleanTitle) {
            const dashSplit = cleanTitle.match(/^.{0,80}?(?:\s[-–—|]\s)(.+)$/);
            if (dashSplit) cleanTitle = dashSplit[1].trim();
        }

        return { jobTitle: cleanTitle, companyName };
    }

    // ═══════════════════════════════════════════════════════
    //  Salary & Location (unchanged, work across all sites)
    // ═══════════════════════════════════════════════════════

    function extractSalary() {
        const linkedinSalarySelectors = [
            ".jobs-unified-top-card__job-insight--highlight span",
            ".job-details-jobs-unified-top-card__job-insight--highlight span",
            '[data-test="salary-info"]',
            ".compensation-type",
            ".jobs-unified-top-card__salary-info",
            ".job-details-preferences-and-skills__pill span",
        ];
        for (const sel of linkedinSalarySelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const t = (el.textContent || "").trim();
                    if (t.includes("$") || t.toLowerCase().includes("salary")) return t;
                }
            } catch (_) {}
        }

        const insightEls = document.querySelectorAll(
            ".jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__job-insight, .tvm__text"
        );
        for (const el of insightEls) {
            const t = (el.textContent || "").trim();
            if (t.includes("$") || /\b\d{2,3}[kK]\b/.test(t)) return t.replace(/\s+/g, " ").trim();
        }

        const text = document.body.innerText || "";
        const rangeMatch = text.match(/\$[\d,]{2,7}(?:\.\d+)?\s*(?:k|K|m|M)?\s*(?:-|to|—)\s*\$[\d,]{2,7}(?:\.\d+)?\s*(?:k|K|m|M)?/i);
        if (rangeMatch) return rangeMatch[0];

        const singleMatch = text.match(/(?:Salary|Pay|Compensation)[^\n]*?(\$[\d,]{3,7}(?:\.\d+)?\s*(?:k|K|m|M)?)/i);
        if (singleMatch) return singleMatch[1];

        return "";
    }

    function extractLocation() {
        const linkedinLocationSelectors = [
            ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
            ".job-details-jobs-unified-top-card__bullet",
            ".jobs-unified-top-card__workplace-type",
            ".job-details-jobs-unified-top-card__workplace-type",
            ".jobs-unified-top-card__primary-description-container span.tvm__text--positive",
            ".jobs-unified-top-card__primary-description span",
            ".job-details-jobs-unified-top-card__primary-description-container span",
        ];
        for (const sel of linkedinLocationSelectors) {
            try {
                const els = document.querySelectorAll(sel);
                for (const el of els) {
                    const t = (el.textContent || "").trim();
                    if (t.length > 1 && t.length < 80 && !/^\d+$/.test(t) && !/ago$/.test(t) && !/applicant/i.test(t)) {
                        return t;
                    }
                }
            } catch (_) {}
        }

        const genericSelectors = [
            '[data-testid="inlineHeader-companyLocation"]',
            ".jobsearch-JobInfoHeader-subtitle span",
            ".location",
        ];
        for (const sel of genericSelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const t = (el.textContent || "").trim();
                    if (t.length > 0 && t.length < 100) return t;
                }
            } catch (_) {}
        }

        const text = document.body.innerText.substring(0, 3000) || "";
        const match = text.match(/\b(Remote|Hybrid|On-site|Onsite|In-person)\b/i);
        if (match) {
            const loc = match[1].toLowerCase();
            return loc === "onsite" ? "On-site" : loc === "in-person" ? "On-site" : loc.charAt(0).toUpperCase() + loc.slice(1);
        }
        return "";
    }

    // ═══════════════════════════════════════════════════════
    //  Main scraper — routes to the right per-site function
    // ═══════════════════════════════════════════════════════

    function scrapeJobData() {
        const host = location.hostname;
        let result = { jobTitle: "", companyName: "" };

        if (host.includes("linkedin.com")) {
            result = scrapeLinkedIn();
        } else if (host.includes("indeed.com")) {
            result = scrapeIndeed();
        } else if (host.includes("glassdoor.com")) {
            result = scrapeGlassdoor();
        } else if (host.includes("greenhouse.io") || host.includes("greenhouse.com")) {
            result = scrapeGreenhouse();
        } else if (host.includes("lever.co")) {
            result = scrapeLever();
        } else if (host.includes("workday.com") || host.includes("myworkdayjobs.com")) {
            result = scrapeWorkday();
        } else if (host.includes("tealhq.com")) {
            result = scrapeTeal();
        } else if (host.includes("wellfound.com") || host.includes("angel.co")) {
            result = scrapeWellfound();
        } else if (host.includes("ycombinator.com")) {
            result = scrapeYCombinator();
        } else if (host.includes("jobright.ai")) {
            result = scrapeJobright();
        } else if (host.includes("wayup.com")) {
            result = scrapeWayUp();
        } else {
            result = scrapeCompanyWebsite();
        }

        return {
            jobTitle: result.jobTitle || "",
            companyName: result.companyName || "",
            salary: extractSalary(),
            location: extractLocation(),
        };
    }

    // ───────── Message listener ─────────
    // The popup sends { action: "scrapeJobData" } and we respond.

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "scrapeJobData") {
            sendResponse(scrapeJobData());
        } else if (message.action === "toggleJobTracker") {
            toggleTrackerIframe();
            sendResponse({ status: "toggled" });
        }
        return true; // keep channel open for async
    });

    // ───────── Iframe Injection Logic ─────────
    const IFRAME_ID = "job-tracker-extension-iframe";

    function toggleTrackerIframe() {
        let iframe = document.getElementById(IFRAME_ID);
        
        if (iframe) {
            // Toggle visibility if it exists
            if (iframe.style.display === "none") {
                iframe.style.display = "block";
            } else {
                iframe.style.display = "none";
            }
        } else {
            // Create and inject iframe
            iframe = document.createElement("iframe");
            iframe.id = IFRAME_ID;
            iframe.src = chrome.runtime.getURL("popup.html");
            
            // Styling to make it look like a floating popup
            Object.assign(iframe.style, {
                position: "fixed",
                top: "16px",
                right: "16px",
                width: "420px",
                height: "640px",
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
                zIndex: "2147483647", // Max z-index
                backgroundColor: "transparent",
                colorScheme: "normal",
                display: "block"
            });
            
            document.body.appendChild(iframe);
        }
    }

    // Listen for close message from the iframe
    window.addEventListener("message", (event) => {
        // Security: verify origin is our extension
        if (event.origin !== `chrome-extension://${chrome.runtime.id}`) return;
        
        if (event.data && event.data.action === "closeJobTracker") {
            const iframe = document.getElementById(IFRAME_ID);
            if (iframe) {
                iframe.style.display = "none";
            }
        }
    });
})();
