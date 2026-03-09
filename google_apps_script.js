/**
 * ======================================================================
 *  Google Apps Script — Job Application Tracker Web App
 *  Created by Nisarg Shah [Vibe Coder]
 * ======================================================================
 *
 *  PURPOSE:
 *  Receives POST requests from the Chrome extension and appends each
 *  job application as a new row in your Google Sheet.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  SETUP INSTRUCTIONS (step‑by‑step):
 * ──────────────────────────────────────────────────────────────────────
 *
 *  1️⃣  CREATE THE GOOGLE SHEET
 *     • Go to https://sheets.google.com → Blank spreadsheet.
 *     • Rename the first sheet tab to: Applications
 *     • In Row 1, type these EXACT column headers (A1 → L1):
 *
 *       A1: Timestamp
 *       B1: Application Date
 *       C1: Job Title
 *       D1: Company Name
 *       E1: URL
 *       F1: Location
 *       G1: Salary
 *       H1: Resume Used
 *       I1: Confidence Level
 *       J1: Source
 *       K1: Status
 *       L1: Notes
 *
 *  2️⃣  OPEN THE SCRIPT EDITOR
 *     • In the Sheet menu bar: Extensions → Apps Script.
 *     • Delete any default code in Code.gs.
 *     • Paste THIS ENTIRE FILE into Code.gs and click 💾 Save.
 *
 *  3️⃣  DEPLOY AS A WEB APP
 *     • Click Deploy → New deployment.
 *     • Click the ⚙ gear next to "Select type" → choose "Web app".
 *     • Description: Job Tracker Webhook (or anything).
 *     • Execute as: Me
 *     • Who has access: Anyone
 *     • Click Deploy.
 *
 *  4️⃣  AUTHORIZE THE APP
 *     ⚠️  Google will show "Google hasn't verified this app" — THIS IS NORMAL!
 *     This happens for ALL personal Apps Scripts. It's YOUR script
 *     accessing YOUR sheet — it is completely safe.
 *
 *     To proceed:
 *       a) Click "Advanced" (small link at bottom-left)
 *       b) Click "Go to <your project name> (unsafe)"
 *       c) Click "Allow"
 *
 *     After that, copy the Web App URL (looks like:
 *       https://script.google.com/macros/s/ABCDEF.../exec )
 *
 *  5️⃣  PASTE THE URL INTO THE CHROME EXTENSION
 *     • The Setup Wizard will ask for it, OR
 *     • Open config.js in the extension folder.
 *     • Replace YOUR_WEB_APP_URL_HERE with the URL you just copied.
 *     • Save config.js.
 *     • Reload the extension in chrome://extensions.
 *
 *  Done! 🎉   Click the extension icon on any job page to try it out.
 *
 * ======================================================================
 */

// ──── CONFIGURATION ────
// Change this if your sheet tab has a different name.
const SHEET_NAME = "Applications";


/**
 * Handles incoming POST requests from the Chrome extension.
 */
function doPost(e) {
    try {
        // Parse the incoming JSON
        const data = JSON.parse(e.postData.contents);

        // Open the active spreadsheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();

        // Try to get the sheet by name first, otherwise just grab the first sheet available
        let sheet = ss.getSheetByName(SHEET_NAME);
        if (!sheet) {
            sheet = ss.getSheets()[0];
        }

        if (!sheet) {
            return _jsonResponse({
                status: "error",
                message: "Could not find any sheets in the spreadsheet document.",
            });
        }

        // Build the row in the same column order as the headers
        const row = [
            data.timestamp || new Date().toISOString(),  // A — Timestamp
            data.applicationDate || "",                  // B — Application Date
            data.jobTitle || "",                         // C — Job Title
            data.companyName || "",                      // D — Company Name
            data.url || "",                              // E — URL
            data.location || "",                         // F — Location
            data.salary || "",                           // G — Salary
            data.resumeUsed || "",                       // H — Resume Used
            data.likelihood || "",                       // I — Confidence Level
            data.source || "",                           // J — Source
            data.status || "Applied",                    // K — Status
            data.notes || "",                            // L — Notes
        ];

        // Append as a new row after the last row with data
        sheet.appendRow(row);

        return _jsonResponse({
            status: "success",
            message: "Application saved!",
            row: sheet.getLastRow(),
        });

    } catch (err) {
        return _jsonResponse({
            status: "error",
            message: err.toString(),
        });
    }
}


/**
 * Optional: handle GET requests (useful for quick health‑checks).
 */
function doGet(e) {
    return _jsonResponse({
        status: "ok",
        message: "Job Application Tracker Web App is running.",
    });
}


/**
 * Utility — returns a JSON ContentService response.
 */
function _jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
