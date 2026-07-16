const defaultLinks = {
  Work: [
    { name: "GitHub", url: "https://github.com" },
    { name: "StackOverflow", url: "https://stackoverflow.com" },
  ],
  Social: [
    { name: "Reddit", url: "https://reddit.com" },
    { name: "Twitter", url: "https://twitter.com" },
  ],
  Tools: [
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "Calendar", url: "https://calendar.google.com" },
  ],
};

const themeColors = [
  "#6ea5ff", // Blue Accent
  "#4cd17c", // Green Accent
  "#ff844c", // Orange Accent
  "#cd7eff", // Purple Accent
  "#ff6e84", // Pink Accent
];

let currentData = {};

// Defensive fallback parser to process local extension objects or pure strings securely
const storageManager = {
  get: function (callback) {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(["custom_homepage_links"], function (result) {
        const storedValue = result.custom_homepage_links;
        if (!storedValue) {
          callback(defaultLinks);
        } else if (typeof storedValue === "string") {
          try {
            callback(JSON.parse(storedValue));
          } catch (e) {
            callback(defaultLinks);
          }
        } else if (typeof storedValue === "object") {
          callback(storedValue);
        } else {
          callback(defaultLinks);
        }
      });
    } else {
      const local = localStorage.getItem("custom_homepage_links");
      if (local) {
        try {
          callback(JSON.parse(local));
        } catch (e) {
          callback(defaultLinks);
        }
      } else {
        callback(defaultLinks);
      }
    }
  },
  set: function (data, callback) {
    currentData = data;
    const stringified = JSON.stringify(data, null, 2);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set(
        { custom_homepage_links: stringified },
        callback,
      );
    } else {
      localStorage.setItem("custom_homepage_links", stringified);
      if (callback) callback();
    }
  },
};

function renderDashboard(data) {
  const container = document.getElementById("live-dashboard");
  container.innerHTML = "";

  let colorIndex = 0;

  for (const [category, links] of Object.entries(data)) {
    if (!links || links.length === 0) continue;

    const columnColor = themeColors[colorIndex % themeColors.length];
    colorIndex++;

    const column = document.createElement("div");
    column.className = "category-column";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.style.color = columnColor;
    title.innerText = category;
    column.appendChild(title);

    const list = document.createElement("ul");
    list.className = "link-list";

    links.forEach((link) => {
      const item = document.createElement("li");
      item.className = "link-item";

      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";

      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.backgroundColor = columnColor;

      const nameSpan = document.createElement("span");
      nameSpan.innerText = link.name;

      a.appendChild(dot);
      a.appendChild(nameSpan);
      item.appendChild(a);
      list.appendChild(item);
    });

    column.appendChild(list);
    container.appendChild(column);
  }
}

function renderManagerOptions(data) {
  const categorySelect = document.getElementById("form-category-select");
  const visualList = document.getElementById("visual-manage-list");

  categorySelect.innerHTML = "";
  const categories = Object.keys(data);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  const customOpt = document.createElement("option");
  customOpt.value = "__NEW__";
  customOpt.textContent = "-- Create New --";
  categorySelect.appendChild(customOpt);

  visualList.innerHTML = "";

  let colorIndex = 0;
  categories.forEach((cat) => {
    const columnColor = themeColors[colorIndex % themeColors.length];
    colorIndex++;

    data[cat].forEach((link, index) => {
      const item = document.createElement("div");
      item.className = "manage-item";

      const info = document.createElement("div");
      info.className = "manage-info";

      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.backgroundColor = columnColor;

      const meta = document.createElement("div");
      meta.className = "manage-meta";

      const name = document.createElement("span");
      name.className = "manage-name";
      name.innerText = link.name;

      const catLabel = document.createElement("span");
      catLabel.className = "manage-cat";
      catLabel.innerText = cat;

      meta.appendChild(name);
      meta.appendChild(catLabel);
      info.appendChild(dot);
      info.appendChild(meta);

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = "🗑️";
      // Safer programmatic event mapping to prevent strict CSP violations
      delBtn.addEventListener("click", () => {
        deleteLinkItem(cat, index);
      });

      item.appendChild(info);
      item.appendChild(delBtn);
      visualList.appendChild(item);
    });
  });
}

function addLinkItem() {
  const selectVal = document.getElementById("form-category-select").value;
  const inputVal = document.getElementById("form-category-custom").value.trim();
  const linkName = document.getElementById("form-name").value.trim();
  let linkUrl = document.getElementById("form-url").value.trim();

  if (!linkName || !linkUrl) {
    showToast("Name and URL are required fields.", true);
    return;
  }

  if (!/^https?:\/\//i.test(linkUrl)) {
    linkUrl = "https://" + linkUrl;
  }

  let finalCategory = selectVal;
  if (selectVal === "__NEW__" || inputVal !== "") {
    finalCategory = inputVal || "Custom";
  }

  if (!currentData[finalCategory]) {
    currentData[finalCategory] = [];
  }

  currentData[finalCategory].push({ name: linkName, url: linkUrl });

  storageManager.set(currentData, () => {
    document.getElementById("form-name").value = "";
    document.getElementById("form-url").value = "";
    document.getElementById("form-category-custom").value = "";

    renderDashboard(currentData);
    renderManagerOptions(currentData);
    document.getElementById("json-input").value = JSON.stringify(
      currentData,
      null,
      2,
    );
    showToast("Item added successfully!", false);
  });
}

function deleteLinkItem(category, index) {
  if (currentData[category]) {
    currentData[category].splice(index, 1);

    if (currentData[category].length === 0) {
      delete currentData[category];
    }

    storageManager.set(currentData, () => {
      renderDashboard(currentData);
      renderManagerOptions(currentData);
      document.getElementById("json-input").value = JSON.stringify(
        currentData,
        null,
        2,
      );
      showToast("Item deleted successfully!", false);
    });
  }
}

function saveRawJson() {
  const input = document.getElementById("json-input").value;
  try {
    const parsed = JSON.parse(input);
    storageManager.set(parsed, () => {
      renderDashboard(parsed);
      renderManagerOptions(parsed);
      showToast("Config loaded successfully!", false);
    });
  } catch (e) {
    showToast("Invalid JSON markup schema. Try again.", true);
  }
}

function showToast(msg, isError) {
  const toast = document.getElementById("status-toast");
  toast.textContent = msg;
  if (isError) {
    toast.className = "toast error";
  } else {
    toast.className = "toast";
  }
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function init() {
  storageManager.get(function (data) {
    currentData = data;
    renderDashboard(data);
    renderManagerOptions(data);
    document.getElementById("json-input").value = JSON.stringify(data, null, 2);
  });

  const modal = document.getElementById("settings-modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");

  const openModal = () => {
    modal.classList.remove("hidden");
  };

  const closeModal = () => {
    modal.classList.add("hidden");
  };

  openModalBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  document
    .getElementById("add-link-btn")
    .addEventListener("click", addLinkItem);
  document
    .getElementById("save-json-btn")
    .addEventListener("click", saveRawJson);

  document.getElementById("copy-json-btn").addEventListener("click", () => {
    const jsonText = document.getElementById("json-input").value;
    const textarea = document.createElement("textarea");
    textarea.value = jsonText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("Copied to clipboard!", false);
  });

  const tabVisual = document.getElementById("tab-visual");
  const tabJson = document.getElementById("tab-json");
  const panelVisual = document.getElementById("panel-visual");
  const panelJson = document.getElementById("panel-json");

  tabVisual.addEventListener("click", () => {
    tabVisual.classList.add("active");
    tabJson.classList.remove("active");
    panelVisual.classList.remove("hidden");
    panelJson.classList.add("hidden");
  });

  tabJson.addEventListener("click", () => {
    tabJson.classList.add("active");
    tabVisual.classList.remove("active");
    panelJson.classList.remove("hidden");
    panelVisual.classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", init);
