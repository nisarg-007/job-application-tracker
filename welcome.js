/* =========================================================
   welcome.js — Onboarding wizard logic
   Handles step navigation, URL validation, script copy,
   and saves config to chrome.storage.local
   Created by Nisarg Shah and Somil Doshi [Vibe Coder]
   ========================================================= */

"use strict";

const TOTAL_STEPS = 5;
let currentStep = 0;

// ─── DOM refs ─────────────────────────────────────────────
const $steps = document.querySelectorAll(".step");
const $dots = document.querySelectorAll(".step-dot");
const $progress = document.getElementById("progressFill");
const $prevBtn = document.getElementById("prevBtn");
const $nextBtn = document.getElementById("nextBtn");
const $copyBtn = document.getElementById("copyScriptBtn");
const $scriptCode = document.getElementById("scriptCode");
const $urlInput = document.getElementById("webAppUrl");
const $sheetUrlInput = document.getElementById("sheetUrl");
const $urlValid = document.getElementById("urlValidation");
const $dailyGoal = document.getElementById("dailyGoal");

// ─── Apps Script code (embedded so users can copy it) ─────

const APPS_SCRIPT_CODE = `// ── Google Apps Script — Job Application Tracker ──
// Created by Nisarg Shah and Somil Doshi [Vibe Coder]
// Paste this into Extensions → Apps Script → Code.gs

const SHEET_NAME = "Applications";
const RESUMES_SHEET_NAME = "Resumes";

// ⚠️ Set this to your Drive folder ID (from the folder URL)
// Leave as-is to save files to root Drive
const DRIVE_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID_HERE";

const HEADER_BG = "#1a237e"; const HEADER_TEXT = "#ffffff"; const ACCENT_BORDER = "#3949ab";
const ROW_ODD = "#f8f9ff"; const ROW_EVEN = "#ffffff";
const APPLIED_COLOR = "#e8f5e9"; const REJECTED_COLOR = "#fce4ec";
const OA_COLOR = "#e3f2fd"; const SCREENING_COLOR = "#fff3e0"; const ROUND_COLOR = "#f3e5f5";
const STATUS_VALUES = ["Applied","Rejected","OA","Screening Call","1st Round","2nd Round","3rd Round"];

// ⚠️ RUN authorizePermissions() ONCE before deploying to grant Drive access!
function authorizePermissions() {
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Permissions authorized! You can now deploy.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.action === "uploadGeneralResume") return handleGeneralResumeUpload(data, ss);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); setupApplicationsSheet(sheet); }
    else if (sheet.getLastRow() < 1) { setupApplicationsSheet(sheet); }
    ensureResumesSheet(ss);
    return saveApplication(sheet, data, ss);
  } catch (err) {
    return _jsonResponse({ status: "error", message: err.toString() });
  }
}

function saveApplication(sheet, data, ss) {
  const company = data.companyName || ""; const role = data.jobTitle || "";
  const status = data.status || "Applied";
  let tailoredUrl = "";
  if (data.tailoredFileData && data.tailoredFileName) {
    tailoredUrl = uploadPdfToDrive(data.tailoredFileData, data.tailoredFileName, company, role, "Tailored");
    const resumesSheet = ensureResumesSheet(ss);
    const tName = (company && role) ? (company + " — " + role + " (Tailored)") : data.tailoredFileName.replace(/\\.pdf$/i,"");
    upsertResumeRow(resumesSheet, tName, tailoredUrl);
  }
  const row = [
    data.applicationDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yy"),
    company, role,
    "", // D JD link
    data.location || "", data.salary || "",
    "", // G Resume
    "", // H Tailored
    status, // I Status
    data.notes || "", // J Notes
  ];
  sheet.appendRow(row);
  const nr = sheet.getLastRow();
  if (data.url) {
    sheet.getRange(nr,4).setRichTextValue(SpreadsheetApp.newRichTextValue().setText("link").setLinkUrl(data.url).build());
  }
  if (data.resumeUsed) {
    if (data.resumeDriveUrl) {
      sheet.getRange(nr,7).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(data.resumeUsed).setLinkUrl(data.resumeDriveUrl).build());
    } else { sheet.getRange(nr,7).setValue(data.resumeUsed); }
  }
  if (tailoredUrl) {
    sheet.getRange(nr,8).setRichTextValue(SpreadsheetApp.newRichTextValue().setText("Tailored").setLinkUrl(tailoredUrl).build());
  }
  styleDataRow(sheet, nr, status);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_VALUES, true).setAllowInvalid(false).build();
  sheet.getRange(nr,9).setDataValidation(rule);
  return _jsonResponse({ status: "success", message: "Application saved!", row: nr });
}

function handleGeneralResumeUpload(data, ss) {
  if (!data.fileData || !data.fileName || !data.resumeName)
    return _jsonResponse({ status: "error", message: "Missing required fields." });
  const driveUrl = uploadPdfToDrive(data.fileData, data.fileName, data.resumeName, "", "General");
  const sheet = ensureResumesSheet(ss);
  upsertResumeRow(sheet, data.resumeName, driveUrl);
  return _jsonResponse({ status: "success", driveUrl: driveUrl });
}

function uploadPdfToDrive(base64Data, originalFileName, company, role, tag) {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/pdf");
  const base = originalFileName.replace(/\\.pdf$/i, "");
  const parts = [base, tag, company, role].map(cleanText).filter(Boolean);
  blob.setName(parts.join("_") + ".pdf");
  let file;
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== "YOUR_DRIVE_FOLDER_ID_HERE") {
    file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
  } else { file = DriveApp.createFile(blob); }
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function cleanText(t) { return String(t||"").trim().replace(/\\s+/g,"_").replace(/[^a-zA-Z0-9_]/g,""); }

function setupApplicationsSheet(sheet) {
  const headers = ["Date Applied","Company","Role","JD","Location","Salary","Resume","Tailored Resume","Status","Notes"];
  const hr = sheet.getRange(1,1,1,headers.length);
  hr.setValues([headers]).setBackground(HEADER_BG).setFontColor(HEADER_TEXT)
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1,32); sheet.setFrozenRows(1);
  hr.setBorder(null,null,true,null,null,null,ACCENT_BORDER,SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  [95,160,200,45,120,100,120,90,110,220].forEach((w,i) => sheet.setColumnWidth(i+1,w));
}

function styleDataRow(sheet, rowNum, status) {
  const bg = rowNum%2===0 ? ROW_EVEN : ROW_ODD;
  sheet.getRange(rowNum,1,1,10).setBackground(bg).setFontSize(10);
  sheet.setRowHeight(rowNum,24);
  let s = bg;
  if(status==="Applied") s=APPLIED_COLOR;
  else if(status==="Rejected") s=REJECTED_COLOR;
  else if(status==="OA") s=OA_COLOR;
  else if(status==="Screening Call") s=SCREENING_COLOR;
  else if(status==="1st Round"||status==="2nd Round"||status==="3rd Round") s=ROUND_COLOR;
  sheet.getRange(rowNum,9).setBackground(s).setHorizontalAlignment("center").setFontWeight("bold");
  [1,4,7,8].forEach(c => sheet.getRange(rowNum,c).setHorizontalAlignment("center"));
}

function ensureResumesSheet(ss) {
  let sheet = ss.getSheetByName(RESUMES_SHEET_NAME);
  if (sheet) return sheet;
  sheet = ss.insertSheet(RESUMES_SHEET_NAME);
  const hr = sheet.getRange(1,1,1,3);
  hr.setValues([["Resume Name","Google Drive Link","Date Added"]]).setBackground(HEADER_BG).setFontColor(HEADER_TEXT)
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setFrozenRows(1); sheet.setRowHeight(1,32);
  hr.setBorder(null,null,true,null,null,null,ACCENT_BORDER,SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setColumnWidth(1,220); sheet.setColumnWidth(2,300); sheet.setColumnWidth(3,130);
  return sheet;
}

function upsertResumeRow(sheet, resumeName, driveUrl) {
  const last = sheet.getLastRow();
  if (last > 1) {
    const names = sheet.getRange(2,1,last-1,1).getValues();
    for (let i=0; i<names.length; i++) {
      if (names[i][0]===resumeName) {
        sheet.getRange(i+2,2).setRichTextValue(SpreadsheetApp.newRichTextValue().setText("Open in Drive").setLinkUrl(driveUrl).build())
          .setHorizontalAlignment("center").setFontColor("#3949ab");
        return;
      }
    }
  }
  const rn = sheet.getLastRow()+1;
  const bg = rn%2===0 ? ROW_EVEN : ROW_ODD;
  sheet.getRange(rn,1,1,3).setBackground(bg).setFontSize(10);
  sheet.getRange(rn,1).setValue(resumeName);
  sheet.getRange(rn,2).setRichTextValue(SpreadsheetApp.newRichTextValue().setText("Open in Drive").setLinkUrl(driveUrl).build())
    .setHorizontalAlignment("center").setFontColor("#3949ab");
  sheet.getRange(rn,3).setValue(Utilities.formatDate(new Date(),Session.getScriptTimeZone(),"MM/dd/yyyy")).setHorizontalAlignment("center");
  sheet.setRowHeight(rn,24);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "getStats") return getSheetStats();
  return _jsonResponse({ status: "ok", message: "Job Tracker Web App is running." });
}

function getSheetStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return _jsonResponse({ status:"ok", totalApps:0, todayCount:0, weekCount:0, needFollowUp:0, statusBreakdown:{}, sources:{}, recentApps:[] });
    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    const tz = Session.getScriptTimeZone();
    const todayStr = Utilities.formatDate(new Date(), tz, "dd-MMM-yy");
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()); weekStart.setHours(0,0,0,0);
    const sevenDaysAgo = new Date(now.getTime() - 7*24*60*60*1000);
    let todayCount=0, weekCount=0, needFollowUp=0;
    const statusBreakdown={}, sources={}, recentApps=[];
    data.forEach((row, idx) => {
      const dateVal=row[0], company=String(row[1]||""), role=String(row[2]||""), status=String(row[8]||"Applied");
      let appDate = dateVal instanceof Date ? dateVal : null;
      if (!appDate) { try { appDate = new Date(String(dateVal)); } catch(_){} }
      const appDateStr = appDate ? Utilities.formatDate(appDate, tz, "dd-MMM-yy") : "";
      if (appDateStr===todayStr) todayCount++;
      if (appDate && appDate>=weekStart) weekCount++;
      if (appDate && appDate<sevenDaysAgo && status==="Applied") needFollowUp++;
      statusBreakdown[status] = (statusBreakdown[status]||0)+1;
      const urlCell = sheet.getRange(idx+2,4).getRichTextValue();
      const urlLink = urlCell ? urlCell.getLinkUrl() : "";
      if (urlLink) { try { const d=urlLink.match(/https?:\\/\\/(?:www\\.)?([^/]+)/)?.[1]||""; if(d) sources[d]=(sources[d]||0)+1; } catch(_){} }
      if (recentApps.length<5) recentApps.push({ jobTitle:role, companyName:company, status, applicationDate:appDateStr });
    });
    return _jsonResponse({ status:"ok", totalApps:data.length, todayCount, weekCount, needFollowUp, statusBreakdown, sources, recentApps });
  } catch(err) { return _jsonResponse({ status:"error", message:err.toString() }); }
}

function _jsonResponse(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }`;

// ─── Populate script code block ───────────────────────────
$scriptCode.textContent = APPS_SCRIPT_CODE;

// ─── Copy script to clipboard ─────────────────────────────
$copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    $copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      Copied!
    `;
    $copyBtn.classList.add("copied");
    setTimeout(() => {
      $copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy Code
      `;
      $copyBtn.classList.remove("copied");
    }, 2500);
  } catch {
    // Fallback: select the code block content
    const range = document.createRange();
    range.selectNodeContents($scriptCode);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
});

// ─── Copy headers to clipboard ─────────────────────────────
const $copyHeadersBtn = document.getElementById("copyHeadersBtn");
if ($copyHeadersBtn) {
  $copyHeadersBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("Date Applied\tCompany\tRole\tJD\tLocation\tSalary\tResume\tTailored Resume\tStatus\tNotes");
      const originalInner = $copyHeadersBtn.innerHTML;
      $copyHeadersBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Copied!
      `;
      $copyHeadersBtn.classList.add("copied");
      setTimeout(() => {
        $copyHeadersBtn.innerHTML = originalInner;
        $copyHeadersBtn.classList.remove("copied");
      }, 2500);
    } catch (e) {
      console.error("Failed to copy headers:", e);
    }
  });
}

// ─── URL validation ───────────────────────────────────────
$urlInput.addEventListener("input", () => {
  const val = $urlInput.value.trim();
  if (!val) {
    $urlValid.textContent = "";
    $urlValid.className = "url-validation";
    return;
  }
  if (val.startsWith("https://script.google.com/macros/s/") && val.endsWith("/exec")) {
    $urlValid.textContent = "✅ Looks like a valid Apps Script URL!";
    $urlValid.className = "url-validation valid";
  } else {
    $urlValid.textContent = "⚠️ URL should start with https://script.google.com/macros/s/ and end with /exec";
    $urlValid.className = "url-validation invalid";
  }
});

// ─── Step Navigation ──────────────────────────────────────

function goToStep(step) {
  // Validate step 3 before proceeding to step 4
  if (currentStep === 3 && step === 4) {
    const url = $urlInput.value.trim();
    if (!url || !url.startsWith("https://script.google.com/")) {
      $urlValid.textContent = "⚠️ Please paste a valid Web App URL before continuing.";
      $urlValid.className = "url-validation invalid";
      $urlInput.focus();
      return;
    }
  }

  currentStep = step;

  // Update step visibility
  $steps.forEach((s, i) => {
    s.classList.toggle("active", i === currentStep);
  });

  // Update dots
  $dots.forEach((d, i) => {
    d.classList.remove("active", "completed");
    if (i === currentStep) d.classList.add("active");
    else if (i < currentStep) d.classList.add("completed");
  });

  // Update progress bar
  $progress.style.width = `${((currentStep + 1) / TOTAL_STEPS) * 100}%`;

  // Update buttons
  $prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";

  if (currentStep === TOTAL_STEPS - 1) {
    $nextBtn.innerHTML = `
      Start Tracking!
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    `;
  } else if (currentStep === 0) {
    $nextBtn.innerHTML = `
      Let's Go!
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    `;
  } else {
    $nextBtn.innerHTML = `
      Next
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    `;
  }
}

$nextBtn.addEventListener("click", () => {
  if (currentStep < TOTAL_STEPS - 1) {
    goToStep(currentStep + 1);
  } else {
    // Final step — save settings and close
    saveSettings();
  }
});

$prevBtn.addEventListener("click", () => {
  if (currentStep > 0) goToStep(currentStep - 1);
});

// Allow clicking step dots to navigate (only to completed or current steps)
$dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const target = parseInt(dot.dataset.step);
    if (target <= currentStep) goToStep(target);
  });
});

// ─── Save settings to chrome.storage ──────────────────────

async function saveSettings() {
  const url = $urlInput.value.trim();
  const sUrl = $sheetUrlInput.value.trim();
  const goal = parseInt($dailyGoal.value) || 5;

  await chrome.storage.local.set({
    webAppUrl: url,
    sheetUrl: sUrl,
    dailyGoal: goal,
    setupComplete: true,
    installedAt: new Date().toISOString(),
  });

  // Close this tab
  window.close();
}

// ─── Load any previously saved values ─────────────────────

async function init() {
  try {
    const data = await chrome.storage.local.get(["webAppUrl", "sheetUrl", "dailyGoal"]);
    if (data.webAppUrl) $urlInput.value = data.webAppUrl;
    if (data.sheetUrl) $sheetUrlInput.value = data.sheetUrl;
    if (data.dailyGoal) $dailyGoal.value = data.dailyGoal;
  } catch { /* no prior data */ }
}

init();
