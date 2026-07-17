# Custom Browser Home Page Setup Guide

This guide explains how to set this dashboard/homepage as your default home page or new tab page in **Google Chrome**.

Because this project includes a `manifest.json` file, it can be loaded directly as a browser extension in Chrome, which is the easiest way to override the New Tab page.

---

## 🌐 Google Chrome Setup

You can configure this dashboard in Chrome using two methods: as a **New Tab Extension** (recommended) or via **Chrome Settings**.

### Method 1: Load as a New Tab Extension (Recommended)
This method automatically replaces your standard "New Tab" page with this dashboard.

1. Open Google Chrome.
2. Navigate to: `chrome://extensions/`
3. In the top-right corner, toggle the **Developer mode** switch to **ON**.
4. In the top-left corner, click the **Load unpacked** button.
5. In the file explorer, select the folder containing this project:
   `C:\..\..\Browser_home`
6. Open a new tab. Chrome will show a warning: *"Is this the new tab page you expected?"*.
7. Click **Keep it** to finalize the setup.

### Method 2: Set as Homepage or Startup Page (No Extension)
If you prefer not to load it as an extension, you can set it as your Home page or Startup page.

1. Copy the full file URL of the homepage:
   `file:///C:/../../Browser_home/index.html`
2. Open Chrome settings by clicking the three dots in the top-right and choosing **Settings**.
3. **For Startup Page:**
   * Go to **On startup** in the left menu.
   * Select **Open a specific page or set of pages**.
   * Click **Add a new page**, paste the file URL, and click **Add**.
4. **For Home Button:**
   * Go to **Appearance** in the left menu.
   * Enable **Show home button**.
   * Select the second option (empty text field), paste the file URL.
