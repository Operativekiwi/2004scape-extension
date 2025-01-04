async function fetchPlayerData(playerName) {
    try {
      const url = `https://2004scape.org/mod/session/${encodeURIComponent(playerName)}`;
      const response = await fetch(url);
  
      if (response.redirected) {
        return { exists: false };
      }
  
      const html = await response.text();
      const logs = parseSessionLog(html);
      const status = determineOnlineStatus(logs);
      return { exists: true, status, logs };
    } catch (error) {
      console.error("Failed to fetch player data:", error);
      return { exists: false };
    }
  }
  
  async function fetchAdventureLog(playerName) {
    try {
      const url = `https://2004scape.org/player/adventurelog/${encodeURIComponent(playerName)}`;
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      console.error("Failed to fetch adventure log:", error);
      return "";
    }
  }
  
  function parseSessionLog(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
  
    // Extract the session log entries
    const logEntries = Array.from(doc.querySelectorAll("div[style='text-align: left']"));
    const logs = logEntries.map(entry => {
      const time = entry.querySelector("span").textContent.trim();
      const action = entry.textContent.replace(/\s+/g, " ").trim().split("\n").pop();
      return { time, action };
    });
  
    return logs;
  }
  
  function determineOnlineStatus(logs) {
    if (logs.length === 0) return "Unknown";
  
    const mostRecentAction = logs[0].action.toLowerCase();
    if (mostRecentAction.includes("ws socket closed") || mostRecentAction.includes("logged out")) {
      return "Offline";
    }
    if (mostRecentAction.includes("server check in") || mostRecentAction.includes("logged in")) {
      return "Online";
    }
    return "Unknown";
  }
  
  function createPlayerLookupContent() {
    const container = document.createElement("div");
    container.id = "tab-player-lookup";
  
    const title = document.createElement("h3");
    title.textContent = "Player Lookup";
    container.appendChild(title);
  
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Enter player name...";
    searchInput.style.width = "100%";
    searchInput.style.marginBottom = "10px";
    container.appendChild(searchInput);
  
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.style.width = "100%";
    searchButton.style.marginBottom = "20px";
    container.appendChild(searchButton);
  
    const resultContainer = document.createElement("div");
    resultContainer.style.padding = "10px";
    resultContainer.style.border = "1px solid #ccc";
    resultContainer.style.marginTop = "10px";
    resultContainer.style.display = "none";
    container.appendChild(resultContainer);
  
    searchButton.addEventListener("click", async () => {
      const playerName = searchInput.value.trim();
      if (!playerName) return;
  
      resultContainer.style.display = "block";
      resultContainer.innerHTML = "Loading...";
  
      const playerData = await fetchPlayerData(playerName);
      if (!playerData.exists) {
        resultContainer.innerHTML = "Player not found.";
        return;
      }
  
      const statusDiv = document.createElement("div");
      statusDiv.textContent = `Player Status: ${playerData.status}`;
      resultContainer.innerHTML = "";
      resultContainer.appendChild(statusDiv);
  
      // Skills
      const skills = [
        "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
        "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
        "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
        "Runecraft"
      ];
  
      const skillGrid = document.createElement("div");
      skillGrid.style.display = "grid";
      skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
      skillGrid.style.gap = "10px";
      skillGrid.style.marginTop = "20px";
  
      skills.forEach(skill => {
        const skillDiv = document.createElement("div");
        skillDiv.style.display = "flex";
        skillDiv.style.alignItems = "center";
  
        const icon = document.createElement("img");
        icon.src = `https://oldschool.runescape.wiki/images/${skill}_icon.png`;
        icon.alt = skill;
        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.marginRight = "5px";
  
        const label = document.createElement("span");
        label.textContent = "1";
        label.style.color = "yellow";
  
        skillDiv.appendChild(icon);
        skillDiv.appendChild(label);
        skillGrid.appendChild(skillDiv);
      });
  
      resultContainer.appendChild(skillGrid);
  
      // Adventure Log
      const adventureLogText = await fetchAdventureLog(playerName);
      const adventureLogEntries = adventureLogText
        .split("\n")
        .filter(line => /^\d{4}-\d{2}-\d{2}/.test(line))
        .slice(0, 3);
  
      if (adventureLogEntries.length > 0) {
        const logTitle = document.createElement("h4");
        logTitle.textContent = "Recent Events";
        logTitle.style.marginTop = "20px";
        resultContainer.appendChild(logTitle);
  
        const logList = document.createElement("ul");
        adventureLogEntries.forEach(entry => {
          const logItem = document.createElement("li");
          logItem.textContent = entry.trim();
          logList.appendChild(logItem);
        });
  
        resultContainer.appendChild(logList);
      }
  
      const logLink = document.createElement("a");
      logLink.href = `https://2004scape.org/player/adventurelog/${encodeURIComponent(playerName)}`;
      logLink.target = "_blank";
      logLink.textContent = "View Full Adventure Log";
      logLink.style.display = "block";
      logLink.style.marginTop = "10px";
      resultContainer.appendChild(logLink);
    });
  
    return container;
  }
  
  export default function () {
    return {
      name: "Player Lookup",
      icon: "🧍",
      createContent: createPlayerLookupContent,
      async init() {
        console.log("Player Lookup Plugin Initialized.");
      },
      destroy() {
        console.log("Player Lookup Plugin Destroyed.");
      }
    };
  }
  