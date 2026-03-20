/**
 * ======================================================================
 *  Google Apps Script — Job Application Tracker Web App
 *  Created by Nisarg Shah and Somil Doshi [Vibe Coder]
 * ======================================================================
 *
 *  SHEET COLUMNS — Applications (A → I):
 *
 *    A: Date Applied
 *    B: Company
 *    C: Role
 *    D: JD (job posting link — shown as "link")
 *    E: Location
 *    F: Salary
 *    G: Resume  (general name hyperlink OR "Tailored" hyperlink — same column)
 *    H: Status  (dropdown)
 *    I: Notes
 *
 *  SHEET COLUMNS — Resumes (A → C):
 *    A: Resume Name
 *    B: Google Drive Link (shown as "Open in Drive")
 *    C: Date Added
 *
 * ──────────────────────────────────────────────────────────────────────
 *  SETUP:
 *  1. Create a Google Sheet with a tab named "Applications"
 *  2. Extensions → Apps Script → paste this file → Save
 *  3. Run authorizePermissions() once (grants Drive access)
 *  4. Deploy → New deployment → Web app (Execute as: Me, Anyone)
 *  5. Copy Web App URL → paste into extension Settings tab
 *
 * ======================================================================
 */

// ──── CONFIGURATION ────
const SHEET_NAME         = "Applications";
const RESUMES_SHEET_NAME = "Resumes";

const DRIVE_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID_HERE";
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// ──── THEME COLORS ────
const HEADER_BG       = "#1a237e";
const HEADER_TEXT     = "#ffffff";
const ACCENT_BORDER   = "#3949ab";
const ROW_ODD         = "#f8f9ff";
const ROW_EVEN        = "#ffffff";

const APPLIED_COLOR   = "#b7e1cd"; // Green chip
const REJECTED_COLOR  = "#ea9999"; // Red chip
const OA_COLOR        = "#fce8b2"; // Yellow chip
const SCREENING_COLOR = "#d7aefb"; // Purple chip
const ROUND1_COLOR    = "#f4cccc"; // Pink chip
const ROUND2_COLOR    = "#f1f3f4"; // Grey chip
const ROUND3_COLOR    = "#f1f3f4"; // Grey chip

const STATUS_VALUES = ["Applied", "Rejected", "OA", "Screening Call", "1st Round", "2nd Round", "3rd Round"];
const NUM_COLS = 9; // A through I


// ======================================================================
//  AUTHORISE (run once before deploying)
// ======================================================================

/**
 * ⚠️ RUN THIS ONCE before deploying the web app.
 * Select this function → Run → Allow permissions.
 */
function authorizePermissions() {
    DriveApp.getRootFolder();
    (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());
    Logger.log("Permissions authorized! You can now deploy.");
}


// ======================================================================
//  MAIN ENTRY POINTS
// ======================================================================

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const ss   = (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());

        if (data.action === "uploadGeneralResume") {
            return handleGeneralResumeUpload(data, ss);
        }

        let sheet = ss.getSheetByName(SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(SHEET_NAME);
            setupApplicationsSheet(sheet);
        } else if (sheet.getLastRow() < 1) {
            setupApplicationsSheet(sheet);
        }

        ensureResumesSheet(ss);
        return saveApplication(sheet, data);

    } catch (err) {
        return _jsonResponse({ status: "error", message: err.toString() });
    }
}

function doGet(e) {
    const action = (e && e.parameter && e.parameter.action) || "";
    if (action === "getStats") return getSheetStats();
    return _jsonResponse({ status: "ok", message: "Job Tracker Web App is running." });
}


// ======================================================================
//  GET STATS (for Dashboard)
// ======================================================================

function getSheetStats() {
    try {
        const ss    = (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());
        const sheet = ss.getSheetByName(SHEET_NAME);
        if (!sheet || sheet.getLastRow() < 2) {
            return _jsonResponse({
                status: "ok", totalApps: 0, todayCount: 0, weekCount: 0,
                needFollowUp: 0, statusBreakdown: {}, sources: {}, recentApps: []
            });
        }

        const lastRow = sheet.getLastRow();
        const data    = sheet.getRange(2, 1, lastRow - 1, NUM_COLS).getValues();

        const tz       = Session.getScriptTimeZone();
        const todayStr = Utilities.formatDate(new Date(), tz, "dd-MMM-yy");
        const now      = new Date();

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let todayCount = 0, weekCount = 0, needFollowUp = 0;
        const statusBreakdown = {};
        const sources = {};
        const recentApps = [];

        data.forEach((row, idx) => {
            const dateVal = row[0];           // A
            const company = String(row[1] || ""); // B
            const role    = String(row[2] || ""); // C
            const status  = String(row[7] || "Applied"); // H (col 8, index 7)

            let appDate = null;
            if (dateVal instanceof Date) {
                appDate = dateVal;
            } else {
                try { appDate = new Date(String(dateVal)); } catch (_) {}
            }
            const appDateStr = appDate ? Utilities.formatDate(appDate, tz, "dd-MMM-yy") : "";

            if (appDateStr === todayStr) todayCount++;
            if (appDate && appDate >= weekStart) weekCount++;
            if (appDate && appDate < sevenDaysAgo && status === "Applied") needFollowUp++;

            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

            // Extract domain from JD hyperlink (col D = index 3)
            try {
                const urlCell = sheet.getRange(idx + 2, 4).getRichTextValue();
                const urlLink = urlCell ? urlCell.getLinkUrl() : "";
                if (urlLink) {
                    const domain = urlLink.match(/https?:\/\/(?:www\.)?([^/]+)/)?.[1] || "";
                    if (domain) sources[domain] = (sources[domain] || 0) + 1;
                }
            } catch (_) {}

            if (recentApps.length < 5) {
                recentApps.push({ jobTitle: role, companyName: company, status, applicationDate: appDateStr });
            }
        });

        return _jsonResponse({
            status: "ok",
            totalApps: data.length,
            todayCount,
            weekCount,
            needFollowUp,
            statusBreakdown,
            sources,
            recentApps,
        });
    } catch (err) {
        return _jsonResponse({ status: "error", message: err.toString() });
    }
}


// ======================================================================
//  SAVE JOB APPLICATION
// ======================================================================

function saveApplication(sheet, data) {
    const company = data.companyName || "";
    const role    = data.jobTitle    || "";
    const ss      = (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());
    const status  = data.status || "Applied";

    // ── Upload tailored resume PDF if provided ──
    let tailoredDriveUrl = "";
    if (data.tailoredFileData && data.tailoredFileName) {
        tailoredDriveUrl = uploadPdfToDrive(
            data.tailoredFileData, data.tailoredFileName, company, role, "Tailored"
        );
        const resumesSheet = ensureResumesSheet(ss);
        const tailoredName = (company && role)
            ? (company + " — " + role + " (Tailored)")
            : data.tailoredFileName.replace(/\.pdf$/i, "");
        upsertResumeRow(resumesSheet, tailoredName, tailoredDriveUrl);
    }

    // ── Insert at row 2 (newest entry always on top) ──
    sheet.insertRowAfter(1);
    const newRow = 2;
    sheet.getRange(newRow, 1, 1, NUM_COLS).clearFormat();

    const row = [
        data.applicationDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yy"),
        company,
        role,
        "",        // D — JD link
        data.location || "",
        data.salary   || "",
        "",        // G — Resume (general or tailored — same cell)
        status,    // H — Status
        data.notes || "",  // I — Notes
    ];

    sheet.getRange(newRow, 1, 1, NUM_COLS).setValues([row]);

    // ── D: Job posting link ──
    if (data.url) {
        sheet.getRange(newRow, 4).setRichTextValue(
            SpreadsheetApp.newRichTextValue().setText("link").setLinkUrl(data.url).build()
        );
    }

    // ── G: Resume column — tailored takes priority, then general ──
    if (tailoredDriveUrl) {
        // Tailored resume uploaded this submission
        sheet.getRange(newRow, 7).setRichTextValue(
            SpreadsheetApp.newRichTextValue().setText("Tailored").setLinkUrl(tailoredDriveUrl).build()
        );
    } else if (data.resumeUsed) {
        // General resume selected
        if (data.resumeDriveUrl) {
            sheet.getRange(newRow, 7).setRichTextValue(
                SpreadsheetApp.newRichTextValue().setText(data.resumeUsed).setLinkUrl(data.resumeDriveUrl).build()
            );
        } else {
            sheet.getRange(newRow, 7).setValue(data.resumeUsed);
        }
    }

    // ── Style row and apply Status dropdown ──
    styleDataRow(sheet, newRow, status);
    applyStatusValidation(sheet, newRow);

    return _jsonResponse({ status: "success", message: "Application saved!", row: newRow });
}


// ======================================================================
//  GENERAL RESUME UPLOAD
// ======================================================================

function handleGeneralResumeUpload(data, ss) {
    if (!data.fileData || !data.fileName || !data.resumeName) {
        return _jsonResponse({ status: "error", message: "Missing file data, fileName, or resumeName." });
    }
    const driveUrl = uploadPdfToDrive(data.fileData, data.fileName, data.resumeName, "", "General");
    const sheet = ensureResumesSheet(ss);
    upsertResumeRow(sheet, data.resumeName, driveUrl);
    return _jsonResponse({ status: "success", driveUrl });
}


// ======================================================================
//  DRIVE FILE UPLOAD
// ======================================================================

function uploadPdfToDrive(base64Data, originalFileName, company, role, tag) {
    const decoded  = Utilities.base64Decode(base64Data);
    const blob     = Utilities.newBlob(decoded, "application/pdf");
    const baseName = originalFileName.replace(/\.pdf$/i, "");

    let newName = baseName;
    const cleanTag = cleanText(tag);
    const cleanCo  = cleanText(company);
    const cleanRo  = cleanText(role);
    if (cleanTag) newName += "_" + cleanTag;
    if (cleanCo)  newName += "_" + cleanCo;
    if (cleanRo)  newName += "_" + cleanRo;
    newName += ".pdf";
    blob.setName(newName);

    let file;
    if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== "YOUR_DRIVE_FOLDER_ID_HERE") {
        file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
    } else {
        file = DriveApp.createFile(blob);
    }
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
}

function cleanText(text) {
    return String(text || "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}


// ======================================================================
//  SHEET SETUP & STYLING
// ======================================================================

function setupApplicationsSheet(sheet) {
    const headers = [
        "Date Applied", "Company", "Role", "JD",
        "Location", "Salary", "Resume",
        "Status", "Notes"
    ];
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setValues([headers])
        .setBackground(HEADER_BG)
        .setFontColor(HEADER_TEXT)
        .setFontWeight("bold")
        .setFontSize(10)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);
    hr.setBorder(null, null, true, null, null, null, ACCENT_BORDER, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // Column widths: A-I
    [95, 160, 200, 45, 130, 100, 120, 110, 220].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

/**
 * ⚠️ Run this ONCE if you have an old sheet with the wrong columns.
 *
 * Old structure (12 cols):
 *   A: Application Date, B: Company Name, C: Job Title, D: URL,
 *   E: Location, F: Salary, G: Resume Used, H: Tailored Resume,
 *   I: Source, J: Source Link, K: Status, L: Notes
 *
 * New structure (9 cols):
 *   A: Date Applied, B: Company, C: Role, D: JD,
 *   E: Location, F: Salary, G: Resume (merged), H: Status (dropdown), I: Notes
 *
 * This function reads the old data, rebuilds each row in the new layout,
 * rewrites the sheet, and applies Status dropdowns.
 */
function fixExistingSheet() {
    const ss    = (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) { Logger.log("Sheet not found."); return; }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        setupApplicationsSheet(sheet);
        Logger.log("No data rows — headers set.");
        return;
    }

    const numDataRows = lastRow - 1;
    const totalCols   = sheet.getLastColumn();

    // Detect old vs new structure by column count
    const isOldStructure = totalCols >= 11;

    // Read raw values
    const rawData = sheet.getRange(2, 1, numDataRows, totalCols).getValues();

    // Read ALL rich text cells BEFORE clearing anything
    // Old col D (index 3) = JD URL,  col G (index 6) = Resume,  col H (index 7) = Tailored
    // New col D (index 3) = JD URL,  col G (index 6) = Resume
    const jdColOld      = 4;  // 1-based
    const resumeColOld  = 7;
    const tailoredColOld= 8;
    const jdColNew      = 4;
    const resumeColNew  = 7;

    const jdRich       = sheet.getRange(2, jdColOld,       numDataRows, 1).getRichTextValues();
    const resumeRich   = sheet.getRange(2, resumeColOld,   numDataRows, 1).getRichTextValues();
    const tailoredRich = isOldStructure
        ? sheet.getRange(2, tailoredColOld, numDataRows, 1).getRichTextValues()
        : null;

    // Build new row values
    const newRows = rawData.map((row, i) => {
        let dateVal, company, role, location, salary, status, notes;

        if (isOldStructure) {
            dateVal  = row[0];
            company  = row[1];
            role     = row[2];
            location = row[4];
            salary   = row[5];
            status   = row[10];
            notes    = row[11] || "";
        } else {
            dateVal  = row[0];
            company  = row[1];
            role     = row[2];
            location = row[4];
            salary   = row[5];
            status   = row[7];
            notes    = row[8] || "";
        }

        const validStatus = STATUS_VALUES.includes(String(status)) ? String(status) : "Applied";

        return [ dateVal, company, role, "", location, salary, "", validStatus, notes ];
    });

    // Clear data rows (content + formatting) and rewrite headers
    sheet.getRange(2, 1, numDataRows, totalCols).clearContent();
    sheet.getRange(2, 1, numDataRows, totalCols).clearFormat();
    setupApplicationsSheet(sheet);

    // Write plain values
    if (newRows.length > 0) {
        sheet.getRange(2, 1, newRows.length, NUM_COLS).setValues(newRows);
    }

    // Restore rich text: JD (col D=4) and Resume (col G=7)
    newRows.forEach((_, i) => {
        const rowNum = i + 2;

        // JD link — same column in both old and new
        const jdRt = jdRich[i][0];
        const jdUrl = jdRt ? jdRt.getLinkUrl() : "";
        if (jdUrl) {
            sheet.getRange(rowNum, jdColNew).setRichTextValue(
                SpreadsheetApp.newRichTextValue().setText("link").setLinkUrl(jdUrl).build()
            );
        }

        // Resume: tailored takes priority (old col H), then general (old col G)
        let resumeRt = null;
        if (isOldStructure && tailoredRich) {
            const tRt  = tailoredRich[i][0];
            const tUrl = tRt ? tRt.getLinkUrl() : "";
            const tTxt = tRt ? tRt.getText().trim() : "";
            if (tUrl && tTxt) {
                resumeRt = SpreadsheetApp.newRichTextValue().setText(tTxt).setLinkUrl(tUrl).build();
            }
        }
        if (!resumeRt) {
            const gRt  = resumeRich[i][0];
            const gUrl = gRt ? gRt.getLinkUrl() : "";
            const gTxt = gRt ? gRt.getText().trim() : "";
            if (gUrl && gTxt) {
                resumeRt = SpreadsheetApp.newRichTextValue().setText(gTxt).setLinkUrl(gUrl).build();
            } else if (gTxt) {
                sheet.getRange(rowNum, resumeColNew).setValue(gTxt);
            }
        }
        if (resumeRt) {
            sheet.getRange(rowNum, resumeColNew).setRichTextValue(resumeRt);
        }
    });

    // Apply Status dropdown to col H for all rows
    const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(STATUS_VALUES, true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(2, 8, newRows.length, 1).setDataValidation(rule);

    // Style each row
    newRows.forEach((row, idx) => {
        styleDataRow(sheet, idx + 2, String(row[7]));
    });

    Logger.log("Migration complete. " + newRows.length + " rows converted to 9-column structure.");
}

function styleDataRow(sheet, rowNum, status) {
    const bg = rowNum % 2 === 0 ? ROW_EVEN : ROW_ODD;
    sheet.getRange(rowNum, 1, 1, NUM_COLS)
        .setBackground(bg)
        .setFontSize(10)
        .setFontColor("#000000")
        .setFontWeight("normal");
    sheet.setRowHeight(rowNum, 24);

    let statusBg = bg;
    switch (status) {
        case "Applied":        statusBg = APPLIED_COLOR;   break;
        case "Rejected":       statusBg = REJECTED_COLOR;  break;
        case "OA":             statusBg = OA_COLOR;        break;
        case "Screening Call": statusBg = SCREENING_COLOR; break;
        case "1st Round":      statusBg = ROUND1_COLOR;    break;
        case "2nd Round":      statusBg = ROUND2_COLOR;    break;
        case "3rd Round":      statusBg = ROUND3_COLOR;    break;
    }

    // Status col H = 8
    sheet.getRange(rowNum, 8)
        .setBackground(statusBg)
        .setHorizontalAlignment("center");

    // Center: Date (1), JD (4), Resume (7)
    [1, 4, 7].forEach((col) => sheet.getRange(rowNum, col).setHorizontalAlignment("center"));

    // Blue hyperlink color for JD (col 4) and Resume (col 7)
    [4, 7].forEach((col) => sheet.getRange(rowNum, col).setFontColor("#1155cc"));
}

function applyStatusValidation(sheet, rowNum) {
    // Attempt to copy existing data validation from the row below to preserve user's custom chip colors
    const lastRow = sheet.getLastRow();
    if (lastRow > rowNum) {
        const existingRule = sheet.getRange(rowNum + 1, 8).getDataValidation();
        if (existingRule) {
            sheet.getRange(rowNum, 8).setDataValidation(existingRule);
            return;
        }
    }
    
    // Fallback default validation rule
    const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(STATUS_VALUES, true)
        .setAllowInvalid(false)
        .build();
    sheet.getRange(rowNum, 8).setDataValidation(rule);
}


// ======================================================================
//  RESUMES SHEET
// ======================================================================

function ensureResumesSheet(ss) {
    let sheet = ss.getSheetByName(RESUMES_SHEET_NAME);
    if (sheet) return sheet;

    sheet = ss.insertSheet(RESUMES_SHEET_NAME);
    const hr = sheet.getRange(1, 1, 1, 3);
    hr.setValues([["Resume Name", "Google Drive Link", "Date Added"]])
        .setBackground(HEADER_BG).setFontColor(HEADER_TEXT)
        .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 32);
    hr.setBorder(null, null, true, null, null, null, ACCENT_BORDER, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 130);
    return sheet;
}

function upsertResumeRow(sheet, resumeName, driveUrl) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < names.length; i++) {
            if (names[i][0] === resumeName) {
                sheet.getRange(i + 2, 2).setRichTextValue(
                    SpreadsheetApp.newRichTextValue().setText("Open in Drive").setLinkUrl(driveUrl).build()
                ).setHorizontalAlignment("center").setFontColor("#3949ab");
                return;
            }
        }
    }
    const rn = sheet.getLastRow() + 1;
    const bg = rn % 2 === 0 ? ROW_EVEN : ROW_ODD;
    sheet.getRange(rn, 1, 1, 3).setBackground(bg).setFontSize(10);
    sheet.getRange(rn, 1).setValue(resumeName);
    sheet.getRange(rn, 2).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("Open in Drive").setLinkUrl(driveUrl).build()
    ).setHorizontalAlignment("center").setFontColor("#3949ab");
    sheet.getRange(rn, 3)
        .setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy"))
        .setHorizontalAlignment("center");
    sheet.setRowHeight(rn, 24);
}


// ======================================================================
//  UTILITY
// ======================================================================

function _jsonResponse(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
