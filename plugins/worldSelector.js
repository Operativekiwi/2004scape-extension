async function waitForContainer(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkContainer = () => {
        const container = document.getElementById("vertical-tabs-container");
        if (container) {
          resolve(container);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout waiting for container"));
        } else {
          setTimeout(checkContainer, 100);
        }
      };
      checkContainer();
    });
  }
  
  async function fetchWorlds() {
    try {
      const response = await fetch("https://2004scape.org/serverlist?hires.x=63&hires.y=19&method=0");
      const text = await response.text();
  
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const worldLinks = doc.querySelectorAll('a[href*="/client?world="]');
      const worlds = [];
  
      worldLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const worldMatch = href.match(/world=(\d+)/);
        const worldNumber = worldMatch ? worldMatch[1] : null;
  
        const playersCell = link.parentElement.nextElementSibling;
        const players = playersCell ? playersCell.textContent.trim() : "Unknown";
  
        if (worldNumber) {
          worlds.push({ world: worldNumber, players });
        }
      });
  
      return worlds;
    } catch (error) {
      console.error("Failed to fetch world list:", error);
      return [];
    }
  }
  
  async function createWorldSelectorContent() {
    const container = document.createElement("div");
    container.id = "tab-world-selector";
  
    const title = document.createElement("h3");
    title.textContent = "Select a World";
    container.appendChild(title);
  
    // Get current world from URL
    const currentWorld = new URLSearchParams(window.location.search).get("world");
  
    // Fetch worlds and add links
    const worlds = await fetchWorlds();
    worlds.forEach(({ world, players }) => {
      const link = document.createElement("a");
      link.href = `https://2004scape.org/client?world=${world}&detail=high&method=0`;
  
      if (world === currentWorld) {
        link.textContent = `World ${world} (${players}) ← Current World`;
      } else {
        link.textContent = `World ${world} (${players})`;
      }
  
      link.style.display = "block";
      link.style.margin = "5px 0";
  
      link.addEventListener("click", (e) => {
        const showWarning = localStorage.getItem("showWorldChangeWarning") !== "false";
        if (showWarning && !confirm(`Are you sure you want to switch to World ${world}?`)) {
          e.preventDefault();
        }
      });
  
      container.appendChild(link);
    });
  
    const warningContainer = document.createElement("div");
    warningContainer.style.marginTop = "15px";
    warningContainer.style.borderTop = "1px solid #4d4d4d";
    warningContainer.style.paddingTop = "10px";
  
    const warningCheckbox = document.createElement("input");
    warningCheckbox.type = "checkbox";
    warningCheckbox.id = "show-warning";
    warningCheckbox.checked = localStorage.getItem("showWorldChangeWarning") !== "false";
    warningCheckbox.addEventListener("change", (event) => {
      localStorage.setItem("showWorldChangeWarning", event.target.checked);
    });
  
    const warningLabel = document.createElement("label");
    warningLabel.htmlFor = "show-warning";
    warningLabel.textContent = " Show world change warning";
  
    warningContainer.appendChild(warningCheckbox);
    warningContainer.appendChild(warningLabel);
  
    container.appendChild(warningContainer);
  
    const refreshButton = document.createElement("button");
    refreshButton.textContent = "Refresh";
    refreshButton.style.marginTop = "10px";
    refreshButton.addEventListener("click", async () => {
      container.replaceChildren(await createWorldSelectorContent());
    });
  
    container.appendChild(refreshButton);
  
    const autoRefreshContainer = document.createElement("div");
    autoRefreshContainer.style.marginTop = "10px";
  
    const autoRefreshCheckbox = document.createElement("input");
    autoRefreshCheckbox.type = "checkbox";
    autoRefreshCheckbox.id = "auto-refresh";
    autoRefreshCheckbox.addEventListener("change", (event) => {
      if (event.target.checked) {
        autoRefreshInterval = setInterval(async () => {
          container.replaceChildren(await createWorldSelectorContent());
        }, 60000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    });
  
    const autoRefreshLabel = document.createElement("label");
    autoRefreshLabel.htmlFor = "auto-refresh";
    autoRefreshLabel.textContent = " Auto-refresh (60s)";
  
    autoRefreshContainer.appendChild(autoRefreshCheckbox);
    autoRefreshContainer.appendChild(autoRefreshLabel);
  
    container.appendChild(autoRefreshContainer);
  
    return container;
  }
  
  async function addTab(name, content) {
    const tabsContainer = await waitForContainer();
    const tabsBar = tabsContainer.querySelector("div:first-child");
    const tabContent = tabsContainer.querySelector("div:last-child");
  
    const button = document.createElement("button");
    button.textContent = name;
    button.style.margin = "10px 0";
    button.style.background = "none";
    button.style.border = "none";
    button.style.color = "#fff";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.width = "100%";
    button.addEventListener("click", () => {
      tabContent.replaceChildren(content);
    });
  
    tabsBar.appendChild(button);
  }
  
  async function removeTab(name) {
    const tabsContainer = await waitForContainer();
    const tabsBar = tabsContainer.querySelector("div:first-child");
    const buttons = tabsBar.querySelectorAll("button");
  
    buttons.forEach((button) => {
      if (button.textContent === name) {
        button.remove();
      }
    });
  }
  
  export default function () {
    return {
      name: "World Selector",
      icon: "🌍",
      createContent: createWorldSelectorContent,
      async init() {
        console.log("World Selector Plugin Initialized.");
      },
      destroy() {
        console.log("World Selector Plugin Destroyed.");
      },
    };
  }
  
  