# 🛠️ How to Install Job Application Tracker from GitHub (Repo)

If you prefer not to install the extension directly from the Chrome Web Store, or if you want to use the latest version available on GitHub, you can install it manually straight from this repository. This process is called "Loading an unpacked extension".

## 🚀 Step-by-Step Guide

### 1. Get the Code
You have two options to download the extension files to your computer:
- **Option A (Git):** If you have Git installed, open your terminal and run:
  ```bash
  git clone https://github.com/nisarg-007/job-application-tracker.git
  ```
- **Option B (ZIP Download):** Alternatively, click the green **Code** button at the top of this repository page and select **Download ZIP**. Once downloaded, extract the ZIP file to a folder on your computer.

### 2. Open the Chrome Extensions Page
Open your Google Chrome browser and navigate to the Extensions management page. You can do this by either:
- Typing `chrome://extensions/` directly into your address bar and hitting **Enter**.
- Or, clicking the **three vertical dots (⋮)** in the top right corner of Chrome > **Extensions** > **Manage Extensions**.

### 3. Enable Developer Mode
In the top right corner of the Extensions page, you will see a toggle switch labeled **Developer mode**. Turn this **ON**. 
*(This will reveal extra options that are required for a manual installation).*

### 4. Load the Extension
1. Click the **Load unpacked** button that just appeared in the top left corner of the page.
2. A file browser window will open. Navigate to the folder where you cloned or extracted the code.
3. Select the `job-application-tracker` folder (this folder should contain the `manifest.json` file inside it) and click **Select Folder**.

### 5. Pin the Extension
The extension is now installed! To make it easily accessible:
1. Click the **Puzzle piece icon** 🧩 (Extensions) in the top right corner of your Chrome browser window.
2. Find **Job Application Tracker** in your extension list.
3. Click the **Pin icon** 📌 next to it. 

> 🎉 **You're all set!** Your extension is locally installed and ready to use. Now just click the pinned extension icon to launch the Setup Wizard.

---

### 🔄 Updating the Extension in the Future
Since you installed it manually from the repository, the extension will **not** automatically update when new versions are released. To update:
1. Pull the newest code from GitHub using `git pull` (or download and extract the latest ZIP again, replacing your old folder).
2. Go back to `chrome://extensions/`.
3. Find the Job Application Tracker card and click the **Refresh icon (🔄)** to reload the new code.
