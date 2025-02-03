console.log("2004Scape Extension Base Loaded.");

async function createPluginImportContent() {
  const container = document.createElement("div");
  container.style.padding = "15px";

  const title = document.createElement("h3");
  title.textContent = "Import Plugin";
  container.appendChild(title);

  // URL Import Section
  const urlTitle = document.createElement("h4");
  urlTitle.textContent = "Import from URL";
  container.appendChild(urlTitle);

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.placeholder = "Enter plugin URL...";
  urlInput.style.width = "100%";
  urlInput.style.marginBottom = "10px";
  urlInput.style.padding = "5px";
  container.appendChild(urlInput);

  const urlButton = document.createElement("button");
  urlButton.textContent = "Import from URL";
  urlButton.style.width = "100%";
  urlButton.style.marginBottom = "20px";
  urlButton.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) return;

    try {
      await pluginManager.loadPlugin(import(url));
      urlInput.value = "";
    } catch (error) {
      alert("Failed to load plugin: " + error.message);
    }
  });
  container.appendChild(urlButton);

  // File Import Section
  const fileTitle = document.createElement("h4");
  fileTitle.textContent = "Import from File";
  container.appendChild(fileTitle);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".js";
  fileInput.style.marginBottom = "10px";
  container.appendChild(fileInput);

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const blob = new Blob([text], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await pluginManager.loadPlugin(import(url));
      URL.revokeObjectURL(url);
      fileInput.value = "";
    } catch (error) {
      alert("Failed to load plugin: " + error.message);
    }
  });

  // Plugin List
  const listTitle = document.createElement("h4");
  listTitle.textContent = "Loaded Plugins";
  listTitle.style.marginTop = "20px";
  container.appendChild(listTitle);

  const pluginList = document.createElement("div");
  pluginList.id = "plugin-list";
  container.appendChild(pluginList);

  function updatePluginList() {
    pluginList.innerHTML = "";
    pluginManager.plugins.forEach(plugin => {
      const pluginItem = document.createElement("div");
      pluginItem.style.padding = "5px";
      pluginItem.style.marginBottom = "5px";
      pluginItem.style.backgroundColor = "#2a2a2a";
      pluginItem.style.borderRadius = "4px";
      pluginItem.style.display = "flex";
      pluginItem.style.justifyContent = "space-between";
      pluginItem.style.alignItems = "center";

      const pluginInfo = document.createElement("span");
      pluginInfo.textContent = `${plugin.icon || '🔌'} ${plugin.name}`;
      pluginItem.appendChild(pluginInfo);

      const unloadButton = document.createElement("button");
      unloadButton.textContent = "Unload";
      unloadButton.style.padding = "2px 5px";
      unloadButton.addEventListener("click", () => {
        pluginManager.unloadPlugin(plugin.name);
        updatePluginList();
      });
      pluginItem.appendChild(unloadButton);

      pluginList.appendChild(pluginItem);
    });
  }

  // Initial plugin list update
  updatePluginList();

  // Subscribe to plugin changes
  pluginManager.onPluginChange = updatePluginList;

  return container;
}

// Create the tab structure without the "Plugin Manager" tab
async function createVerticalTabsContainer() {
  const existingTabs = document.getElementById("vertical-tabs-container");
  if (existingTabs) existingTabs.remove();

  const tabsContainer = document.createElement("div");
  tabsContainer.id = "vertical-tabs-container";
  tabsContainer.style.position = "fixed";
  tabsContainer.style.top = "10px";
  tabsContainer.style.right = "10px";
  tabsContainer.style.width = "250px";
  tabsContainer.style.height = "600px";
  tabsContainer.style.backgroundColor = "#1b1b1b";
  tabsContainer.style.color = "#fff";
  tabsContainer.style.border = "2px solid #4d4d4d";
  tabsContainer.style.borderRadius = "8px";
  tabsContainer.style.overflow = "hidden";
  tabsContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";
  tabsContainer.style.display = "flex";
  tabsContainer.style.resize = "both";
  tabsContainer.style.overflow = "auto";

  // Drag functionality
  let isDragging = false;
  let offsetX, offsetY;

  tabsContainer.addEventListener("mousedown", (e) => {
    if (e.target === tabsContainer) {
      isDragging = true;
      offsetX = e.clientX - tabsContainer.getBoundingClientRect().left;
      offsetY = e.clientY - tabsContainer.getBoundingClientRect().top;
      tabsContainer.style.cursor = "move";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      tabsContainer.style.left = `${newX}px`;
      tabsContainer.style.top = `${newY}px`;
      tabsContainer.style.right = "";
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      tabsContainer.style.cursor = "default";
    }
  });

  const tabsBar = document.createElement("div");
  tabsBar.style.width = "50px";
  tabsBar.style.backgroundColor = "#2a2a2a";
  tabsBar.style.display = "flex";
  tabsBar.style.flexDirection = "column";
  tabsBar.style.alignItems = "center";

  const tabContent = document.createElement("div");
  tabContent.style.flex = "1";
  tabContent.style.padding = "10px";
  tabContent.style.overflowY = "auto";

  // Create buttons for each plugin
  pluginManager.plugins.forEach((plugin, index) => {
    if (plugin.hidden) return; // Skip hidden plugins

    const button = document.createElement("button");
    button.textContent = plugin.icon || "🔌";
    button.title = plugin.name;

    button.style.margin = "10px 0";
    button.style.background = "none";
    button.style.border = "none";
    button.style.color = "#fff";
    button.style.cursor = "pointer";
    button.style.fontSize = "20px";
    button.style.width = "40px";
    button.style.height = "40px";

    button.addEventListener("click", async () => {
      if (plugin.createContent) {
        const content = await plugin.createContent();
        tabContent.replaceChildren(content);
      }
    });

    tabsBar.appendChild(button);

    if (index === 0) {
      button.click();
    }
  });

  tabsContainer.appendChild(tabsBar);
  tabsContainer.appendChild(tabContent);

  document.body.appendChild(tabsContainer);
}

function refreshTabBar() {
  const tabsContainer = document.getElementById("vertical-tabs-container");
  if (tabsContainer) {
    tabsContainer.remove();
    createVerticalTabsContainer();
  }
}

const pluginManager = {
  plugins: [],
  onPluginChange: null,
  async loadPlugin(pluginModule) {
    try {
      const module = await pluginModule;
      const pluginFactory = module.default;
      if (typeof pluginFactory !== "function") {
        console.error("Plugin must export a function as default export");
        return;
      }

      const plugin = pluginFactory();
      if (!plugin || !plugin.init || !plugin.name) {
        console.error("Invalid plugin structure", plugin);
        return;
      }

      this.plugins.push(plugin);
      await plugin.init();
      console.log(`Plugin loaded: ${plugin.name}`);
      this.onPluginChange?.();
      refreshTabBar();
    } catch (error) {
      console.error("Failed to load plugin:", error);
    }
  },
  unloadPlugin(pluginName) {
    const index = this.plugins.findIndex((p) => p.name === pluginName);
    if (index !== -1) {
      this.plugins[index].destroy?.();
      this.plugins.splice(index, 1);
      console.log(`Plugin unloaded: ${pluginName}`);
      this.onPluginChange?.();
      refreshTabBar();
    } else {
      console.error(`Plugin not found: ${pluginName}`);
    }
  },
};

async function loadPluginsFromJSON() {
  try {
    const response = await fetch(chrome.runtime.getURL("plugins/plugins.json"));
    const data = await response.json();
    if (data.plugins && Array.isArray(data.plugins)) {
      for (const pluginFile of data.plugins) {
        const pluginPath = chrome.runtime.getURL(`plugins/${pluginFile}`);
        await pluginManager.loadPlugin(import(pluginPath));
      }
    } else {
      console.error("Invalid plugins JSON file");
    }
  } catch (error) {
    console.error("Failed to load plugins JSON:", error);
  }
}

async function initialize() {
  await createVerticalTabsContainer();
  await loadPluginsFromJSON();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

window.pluginManager = pluginManager;