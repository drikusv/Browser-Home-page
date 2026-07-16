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
let editState = null; // Stores { category, index } when modifying a link

// Defensive storage manager to securely interface with extensions or standard localStorage
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

  // Handle Empty Slate State
  if (categories.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.padding = "32px 16px";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.textContent =
      "No links found. Create your first link in the left panel!";
    visualList.appendChild(emptyMsg);
    return;
  }

  let colorIndex = 0;
  categories.forEach((cat) => {
    const columnColor = themeColors[colorIndex % themeColors.length];
    colorIndex++;

    const links = data[cat] || [];
    if (links.length === 0) return;

    // Visual Wrapper Group
    const catGroup = document.createElement("div");
    catGroup.className = "manage-category-group";

    // Custom Category Header banner inside manager list
    const catHeader = document.createElement("div");
    catHeader.className = "manage-category-header";
    catHeader.style.borderLeft = `3px solid ${columnColor}`;

    const label = document.createElement("span");
    label.style.color = columnColor;
    label.textContent = cat;

    const countTag = document.createElement("span");
    countTag.className = "manage-category-count";
    countTag.textContent = `${links.length} ${links.length === 1 ? "item" : "items"}`;

    catHeader.appendChild(label);
    catHeader.appendChild(countTag);
    catGroup.appendChild(catHeader);

    // Group rows inside category block
    links.forEach((link, index) => {
      const item = document.createElement("div");
      item.className = "manage-item";

      const info = document.createElement("div");
      info.className = "manage-info";

      const meta = document.createElement("div");
      meta.className = "manage-meta";

      const name = document.createElement("span");
      name.className = "manage-name";
      name.innerText = link.name;

      const urlLabel = document.createElement("span");
      urlLabel.className = "manage-url";
      urlLabel.innerText = link.url;

      meta.appendChild(name);
      meta.appendChild(urlLabel);
      info.appendChild(meta);

      // Row-level Actions
      const actions = document.createElement("div");
      actions.className = "manage-actions";

      // Category migration select dropdown
      const moveSelect = document.createElement("select");
      moveSelect.className = "manage-move-select";
      categories.forEach((otherCat) => {
        const opt = document.createElement("option");
        opt.value = otherCat;
        opt.textContent =
          otherCat === cat ? `Category: ${otherCat}` : `Move: ${otherCat}`;
        if (otherCat === cat) opt.selected = true;
        moveSelect.appendChild(opt);
      });
      moveSelect.addEventListener("change", (e) => {
        moveLinkCategory(cat, index, e.target.value);
      });

      // Reorder Up
      const upBtn = document.createElement("button");
      upBtn.className = "action-icon-btn";
      upBtn.innerHTML = "▲";
      upBtn.title = "Move Up";
      if (index === 0) {
        upBtn.style.opacity = "0.15";
        upBtn.style.cursor = "not-allowed";
      } else {
        upBtn.addEventListener("click", () => {
          moveLinkOrder(cat, index, -1);
        });
      }

      // Reorder Down
      const downBtn = document.createElement("button");
      downBtn.className = "action-icon-btn";
      downBtn.innerHTML = "▼";
      downBtn.title = "Move Down";
      if (index === links.length - 1) {
        downBtn.style.opacity = "0.15";
        downBtn.style.cursor = "not-allowed";
      } else {
        downBtn.addEventListener("click", () => {
          moveLinkOrder(cat, index, 1);
        });
      }

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "action-icon-btn";
      editBtn.innerHTML = "✏️";
      editBtn.title = "Edit Link Details";
      editBtn.addEventListener("click", () => {
        startEditing(cat, index);
      });

      // Delete Button
      const delBtn = document.createElement("button");
      delBtn.className = "action-icon-btn delete-btn";
      delBtn.innerHTML = "🗑️";
      delBtn.title = "Delete Link";
      delBtn.addEventListener("click", () => {
        deleteLinkItem(cat, index);
      });

      actions.appendChild(moveSelect);
      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      item.appendChild(info);
      item.appendChild(actions);
      catGroup.appendChild(item);
    });

    visualList.appendChild(catGroup);
  });
}

function moveLinkOrder(category, index, direction) {
  const list = currentData[category];
  if (!list) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  // Swap elements in place to preserve order
  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  storageManager.set(currentData, () => {
    renderDashboard(currentData);
    renderManagerOptions(currentData);
    document.getElementById("json-input").value = JSON.stringify(
      currentData,
      null,
      2,
    );
    showToast("Sorting order updated!", false);
  });
}

function moveLinkCategory(oldCategory, index, newCategory) {
  if (oldCategory === newCategory) return;

  const item = currentData[oldCategory][index];

  // Remove from the old category
  currentData[oldCategory].splice(index, 1);
  if (currentData[oldCategory].length === 0) {
    delete currentData[oldCategory];
  }

  // Insert into the new category
  if (!currentData[newCategory]) {
    currentData[newCategory] = [];
  }
  currentData[newCategory].push(item);

  // Cancel edit view if we just moved the active editing item
  if (
    editState &&
    editState.category === oldCategory &&
    editState.index === index
  ) {
    cancelEditing();
  }

  storageManager.set(currentData, () => {
    renderDashboard(currentData);
    renderManagerOptions(currentData);
    document.getElementById("json-input").value = JSON.stringify(
      currentData,
      null,
      2,
    );
    showToast(`Migrated to "${newCategory}" category!`, false);
  });
}

function startEditing(category, index) {
  const link = currentData[category][index];
  editState = { category, index };

  document.getElementById("form-name").value = link.name;
  document.getElementById("form-url").value = link.url;

  const select = document.getElementById("form-category-select");
  select.value = category;
  document.getElementById("form-category-custom").value = "";

  document.getElementById("form-action-title").textContent =
    "✏️ Edit Link Details";
  document.getElementById("add-link-btn").textContent = "Save Changes";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");
}

function cancelEditing() {
  editState = null;
  document.getElementById("form-name").value = "";
  document.getElementById("form-url").value = "";
  document.getElementById("form-category-custom").value = "";
  document.getElementById("form-action-title").textContent = "Add New Link";
  document.getElementById("add-link-btn").textContent = "Add to Dashboard";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
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

  if (editState) {
    // Edit mode: Update existing item
    const oldCat = editState.category;
    const oldIdx = editState.index;

    if (oldCat !== finalCategory) {
      // Category has been changed during form edits, perform a migration
      currentData[oldCat].splice(oldIdx, 1);
      if (currentData[oldCat].length === 0) {
        delete currentData[oldCat];
      }
      if (!currentData[finalCategory]) {
        currentData[finalCategory] = [];
      }
      currentData[finalCategory].push({ name: linkName, url: linkUrl });
    } else {
      // Category stayed the same, update item in place to preserve order!
      currentData[finalCategory][oldIdx] = { name: linkName, url: linkUrl };
    }
  } else {
    // Create mode: Create a brand new link
    if (!currentData[finalCategory]) {
      currentData[finalCategory] = [];
    }
    currentData[finalCategory].push({ name: linkName, url: linkUrl });
  }

  storageManager.set(currentData, () => {
    cancelEditing(); // Clears editState, resets headers & resets inputs
    renderDashboard(currentData);
    renderManagerOptions(currentData);
    document.getElementById("json-input").value = JSON.stringify(
      currentData,
      null,
      2,
    );
    showToast("Dashboard updated successfully!", false);
  });
}

function deleteLinkItem(category, index) {
  if (currentData[category]) {
    currentData[category].splice(index, 1);

    if (currentData[category].length === 0) {
      delete currentData[category];
    }

    // Cancel editing if we happen to delete the item currently being edited
    if (
      editState &&
      editState.category === category &&
      editState.index === index
    ) {
      cancelEditing();
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
      cancelEditing();
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
    renderManagerOptions(currentData); // Keep lists fully refreshed
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
    .getElementById("cancel-edit-btn")
    .addEventListener("click", cancelEditing);
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
