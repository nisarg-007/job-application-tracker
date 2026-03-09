/* =========================================================
   welcome.js — Onboarding wizard logic
   Handles step navigation, URL validation, script copy,
   and saves config to chrome.storage.local
   Created by Nisarg Shah [Vibe Coder]
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
const $urlValid = document.getElementById("urlValidation");
const $dailyGoal = document.getElementById("dailyGoal");

// ─── Apps Script code (embedded so users can copy it) ─────

const APPS_SCRIPT_CODE = `// ── Google Apps Script — Job Application Tracker ──
// Created by Nisarg Shah [Vibe Coder]
// Paste this into Extensions → Apps Script → Code.gs

const SHEET_NAME = "Applications";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return _jsonResponse({
        status: "error",
        message: 'Sheet "' + SHEET_NAME + '" not found.',
      });
    }

    const row = [
      data.timestamp       || new Date().toISOString(),
      data.applicationDate || "",
      data.jobTitle        || "",
      data.companyName     || "",
      data.url             || "",
      data.resumeUsed      || "",
      data.likelihood      || "",
      data.source          || "",
      data.status          || "Applied",
      data.notes           || "",
    ];

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

function doGet(e) {
  return _jsonResponse({
    status: "ok",
    message: "Job Tracker Web App is running.",
  });
}

function _jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

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
  const goal = parseInt($dailyGoal.value) || 5;

  await chrome.storage.local.set({
    webAppUrl: url,
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
    const data = await chrome.storage.local.get(["webAppUrl", "dailyGoal"]);
    if (data.webAppUrl) $urlInput.value = data.webAppUrl;
    if (data.dailyGoal) $dailyGoal.value = data.dailyGoal;
  } catch { /* no prior data */ }
}

init();
