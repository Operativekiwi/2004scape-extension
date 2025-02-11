async function fetchAdventureLog(playerName) {
  try {
    const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
    const response = await fetch(url);
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const entries = [];
    const logDivs = doc.querySelectorAll('div[style="text-align: left"]');
    
    logDivs.forEach(div => {
      const timestamp = div.querySelector('span')?.textContent.trim() || '';
      const content = div.textContent.split('\n').map(line => line.trim()).filter(line => line && !line.includes(timestamp))[0] || '';
      
      if (timestamp && content) {
        entries.push({ timestamp, content });
      }
    });

    return entries;
  } catch (error) {
    console.error("Failed to fetch adventure log:", error);
    return [];
  }
}

async function fetchPlayerSkills(playerName) {
  try {
    const url = `https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(playerName)}`;
    const response = await fetch(url);

    if (response.redirected) return null;

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const skillRows = doc.querySelectorAll("table tbody tr");
    const skills = {};
    let totalLevel = 0;
    let totalXP = 0;

    skillRows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length === 6) {
        const skillName = cells[2]?.textContent.trim();
        const level = parseInt(cells[4]?.textContent.trim(), 10);
        const xp = parseFloat(cells[5]?.textContent.trim().replace(/,/g, "")); // Allow decimal XP values
        if (skillName && !isNaN(level) && !isNaN(xp)) {
          if (skillName.toLowerCase() === "overall") {
            totalLevel = level;
            totalXP = xp;
          } else {
            skills[skillName.toLowerCase()] = { level, xp };
          }
        }
      }
    });

    skills["total"] = { level: totalLevel, xp: totalXP };
    return skills;
  } catch (error) {
    console.error("Failed to fetch player skills:", error);
    return null;
  }
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

    const playerSkills = await fetchPlayerSkills(playerName);

    if (!playerSkills) {
      resultContainer.innerHTML = "Player not found.";
      return;
    }

    resultContainer.innerHTML = "";
    
    const skillGrid = document.createElement("div");
    skillGrid.style.display = "grid";
    skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
    skillGrid.style.gap = "10px";
    skillGrid.style.marginTop = "20px";

    // List of skills in the correct order
    const skills = [
      "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
      "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
      "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
      "Runecrafting"
    ];

    // Add individual skills first
    skills.forEach(skill => {
      const skillDiv = document.createElement("div");
      skillDiv.style.display = "flex";
      skillDiv.style.alignItems = "center";
    
      const icon = document.createElement("img");
      const iconName = skill === "Runecrafting" ? "Runecraft" : skill;
      icon.src = `https://oldschool.runescape.wiki/images/${iconName}_icon.png`;
      icon.alt = skill;
      icon.style.width = "20px";
      icon.style.height = "20px";
      icon.style.marginRight = "5px";
    
      const label = document.createElement("span");
      const skillData = playerSkills[skill.toLowerCase()];
      label.textContent = skillData?.level || "1";
      label.style.color = "yellow";
      
      if (skillData?.xp) {
        skillDiv.title = `XP: ${skillData.xp.toLocaleString()}`;
      }
    
      skillDiv.appendChild(icon);
      skillDiv.appendChild(label);
      skillGrid.appendChild(skillDiv);
    });

    // Add Total Level at the end
    const totalDiv = document.createElement("div");
    totalDiv.style.display = "flex";
    totalDiv.style.alignItems = "center";

    const totalIcon = document.createElement("img");
    totalIcon.src = "https://oldschool.runescape.wiki/images/Stats_icon.png";
    totalIcon.alt = "Total Level";
    totalIcon.style.width = "20px";
    totalIcon.style.height = "20px";
    totalIcon.style.marginRight = "5px";

    const totalLabel = document.createElement("span");
    totalLabel.textContent = playerSkills["total"].level;
    totalLabel.style.color = "yellow";

    totalDiv.title = `XP: ${playerSkills["total"].xp.toLocaleString()}`; // Tooltip with total XP

    totalDiv.appendChild(totalIcon);
    totalDiv.appendChild(totalLabel);
    skillGrid.appendChild(totalDiv);

    resultContainer.appendChild(skillGrid);

    const logLink = document.createElement("a");
    logLink.href = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
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
export { fetchPlayerSkills };
