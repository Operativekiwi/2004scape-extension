async function fetchPlayerData(playerName) {
    try {
      const url = `https://2004.lostcity.rs/mod/session/${encodeURIComponent(playerName)}`;
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
      const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find all log entries
      const entries = [];
      const logDivs = doc.querySelectorAll('div[style="text-align: left"]');
      
      logDivs.forEach(div => {
        const timestamp = div.querySelector('span')?.textContent.trim() || '';
        // Get the text content after the timestamp
        const content = div.textContent.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.includes(timestamp))[0] || '';
        
        if (timestamp && content) {
          entries.push({
            timestamp,
            content
          });
        }
      });
  
      return entries;
    } catch (error) {
      console.error("Failed to fetch adventure log:", error);
      return [];
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
  
      const logLink = document.createElement("a");
      logLink.href = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
      logLink.target = "_blank";
      logLink.textContent = "View Full Adventure Log";
      logLink.style.display = "block";
      logLink.style.marginTop = "10px";
      resultContainer.appendChild(logLink);
  
      // Display recent adventure log entries
      const logEntries = await fetchAdventureLog(playerName);
      if (logEntries.length > 0) {
        const recentTitle = document.createElement("h4");
        recentTitle.textContent = "Recent Events";
        recentTitle.style.marginTop = "20px";
        resultContainer.appendChild(recentTitle);
  
        const entriesContainer = document.createElement("div");
        entriesContainer.style.marginTop = "10px";
  
        // Display up to 3 most recent entries
        logEntries.slice(0, 3).forEach(entry => {
          const entryDiv = document.createElement("div");
          entryDiv.style.marginBottom = "10px";
          
          const timestamp = document.createElement("div");
          timestamp.style.color = "#888";
          timestamp.textContent = entry.timestamp;
          
          const content = document.createElement("div");
          content.textContent = entry.content;
          
          entryDiv.appendChild(timestamp);
          entryDiv.appendChild(content);
          entriesContainer.appendChild(entryDiv);
        });
  
        resultContainer.appendChild(entriesContainer);
      }
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