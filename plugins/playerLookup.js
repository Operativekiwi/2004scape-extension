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
    const url = `https://2004.lostcity.rs/api/hiscores/player/${encodeURIComponent(playerName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null; // Player not found
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Skill type mapping from API documentation
    const skillMap = {
      0: "overall",
      1: "attack",
      2: "defence",
      3: "strength",
      4: "hitpoints",
      5: "ranged",
      6: "prayer",
      7: "magic",
      8: "cooking",
      9: "woodcutting",
      10: "fletching",
      11: "fishing",
      12: "firemaking",
      13: "crafting",
      14: "smithing",
      15: "mining",
      16: "herblore",
      17: "agility",
      18: "thieving",
      21: "runecrafting"
    };

    // Initialize skills with default values
    const skills = {
      attack: { level: 1, xp: 0 },
      hitpoints: { level: 10, xp: 1154 }, // Default starting level for Hitpoints
      mining: { level: 1, xp: 0 },
      strength: { level: 1, xp: 0 },
      agility: { level: 1, xp: 0 },
      smithing: { level: 1, xp: 0 },
      defence: { level: 1, xp: 0 },
      herblore: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 },
      ranged: { level: 1, xp: 0 },
      thieving: { level: 1, xp: 0 },
      cooking: { level: 1, xp: 0 },
      prayer: { level: 1, xp: 0 },
      crafting: { level: 1, xp: 0 },
      firemaking: { level: 1, xp: 0 },
      magic: { level: 1, xp: 0 },
      fletching: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      runecrafting: { level: 1, xp: 0 },
      total: { level: 0, xp: 0 }
    };

    // Populate skills from API data
    data.forEach(skillEntry => {
      const skillName = skillMap[skillEntry.type];
      if (skillName) {
        skills[skillName] = {
          level: skillEntry.level,
          xp: skillEntry.value
        };
      }
    });

    // Ensure total is set (might be missing if player has no ranked skills)
    if (!skills.total.level) {
      skills.total.level = Object.keys(skills)
        .filter(skill => skill !== "total" && skill !== "overall")
        .reduce((sum, skill) => sum + skills[skill].level, 0);
      skills.total.xp = Object.keys(skills)
        .filter(skill => skill !== "total" && skill !== "overall")
        .reduce((sum, skill) => sum + skills[skill].xp, 0);
    }

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

    const skills = [
      "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
      "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
      "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
      "Runecrafting"
    ];

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

    totalDiv.title = `XP: ${playerSkills["total"].xp.toLocaleString()}`;

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