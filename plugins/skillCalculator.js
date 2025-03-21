import { fetchPlayerSkills } from './playerLookup.js';

async function fetchExperienceTable() {
  return {
    1: 0,
    2: 83,
    3: 174,
    4: 276,
    5: 388,
    6: 512,
    7: 650,
    8: 801,
    9: 969,
    10: 1154,
    11: 1358,
    12: 1584,
    13: 1833,
    14: 2107,
    15: 2411,
    16: 2746,
    17: 3115,
    18: 3523,
    19: 3973,
    20: 4470,
    21: 5018,
    22: 5624,
    23: 6291,
    24: 7028,
    25: 7842,
    26: 8740,
    27: 9730,
    28: 10824,
    29: 12031,
    30: 13363,
    31: 14833,
    32: 16456,
    33: 18247,
    34: 20224,
    35: 22406,
    36: 24815,
    37: 27473,
    38: 30408,
    39: 33648,
    40: 37224,
    41: 41171,
    42: 45529,
    43: 50339,
    44: 55649,
    45: 61512,
    46: 67983,
    47: 75127,
    48: 83014,
    49: 91721,
    50: 101333,
    51: 111945,
    52: 123660,
    53: 136594,
    54: 150872,
    55: 166636,
    56: 184040,
    57: 203254,
    58: 224466,
    59: 247886,
    60: 273742,
    61: 302288,
    62: 333804,
    63: 368599,
    64: 407015,
    65: 449428,
    66: 496254,
    67: 547953,
    68: 605032,
    69: 668051,
    70: 737627,
    71: 814445,
    72: 899257,
    73: 992895,
    74: 1096278,
    75: 1210421,
    76: 1336443,
    77: 1475581,
    78: 1629200,
    79: 1798808,
    80: 1986068,
    81: 2192818,
    82: 2421087,
    83: 2673114,
    84: 2951373,
    85: 3258594,
    86: 3597792,
    87: 3972294,
    88: 4385776,
    89: 4842295,
    90: 5346332,
    91: 5902831,
    92: 6517253,
    93: 7195629,
    94: 7944614,
    95: 8771558,
    96: 9684577,
    97: 10692629,
    98: 11805606,
    99: 13034431
  };
}

async function loadMethods() {
  try {
    const url = chrome.runtime.getURL('plugins/skillMethods.json');
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error loading skill methods:", error);
    return {};
  }
}

function createCalculatorContent() {
  const container = document.createElement("div");
  container.id = "tab-skill-calculator";

  const searchContainer = document.createElement("div");
  searchContainer.style.marginBottom = "20px";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Enter player name...";
  searchInput.style.width = "calc(100% - 110px)";
  searchInput.style.marginRight = "10px";

  const searchButton = document.createElement("button");
  searchButton.textContent = "Search";
  searchButton.style.width = "100px";

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchButton);
  container.appendChild(searchContainer);

  const skillGrid = document.createElement("div");
  skillGrid.style.display = "grid";
  skillGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
  skillGrid.style.gap = "10px";
  skillGrid.style.marginBottom = "20px";

  const skills = [
    "Attack", "Hitpoints", "Mining", "Strength", "Agility", "Smithing",
    "Defence", "Herblore", "Fishing", "Ranged", "Thieving", "Cooking",
    "Prayer", "Crafting", "Firemaking", "Magic", "Fletching", "Woodcutting",
    "Runecraft"
  ];

  skills.forEach(skill => {
    const skillDiv = document.createElement("div");
    skillDiv.style.display = "flex";
    skillDiv.style.alignItems = "center";
    skillDiv.style.cursor = "pointer";
    
    const icon = document.createElement("img");
    icon.src = `https://oldschool.runescape.wiki/images/${skill}_icon.png`;
    icon.alt = skill;
    icon.style.width = "20px";
    icon.style.height = "20px";
    icon.style.marginRight = "5px";
    
    const levelSpan = document.createElement("span");
    levelSpan.textContent = "1";
    levelSpan.style.color = "#fff";
    levelSpan.dataset.skill = skill.toLowerCase();
    
    skillDiv.appendChild(icon);
    skillDiv.appendChild(levelSpan);
    skillDiv.addEventListener("click", () => showCalculator(skill, container));
    skillGrid.appendChild(skillDiv);
  });
  
  container.appendChild(skillGrid);

  const calculatorSection = document.createElement("div");
  calculatorSection.id = "calculator-section";
  container.appendChild(calculatorSection);

  searchButton.addEventListener("click", async () => {
    const playerName = searchInput.value.trim();
    if (!playerName) return;

    const playerSkills = await fetchPlayerSkills(playerName);
    if (!playerSkills) {
      alert("Player not found");
      return;
    }

    skills.forEach(skill => {
      const skillData = playerSkills[skill.toLowerCase()];
      if (skillData) {
        const levelSpan = skillGrid.querySelector(`span[data-skill="${skill.toLowerCase()}"]`);
        if (levelSpan) {
          levelSpan.textContent = skillData.level;
          levelSpan.dataset.exp = skillData.xp;
        }
      }
    });

    const calculatorSection = container.querySelector("#calculator-section");
    const selectedSkill = calculatorSection.getAttribute("data-selected-skill");
    if (selectedSkill) {
      const skillData = playerSkills[selectedSkill.toLowerCase()];
      if (skillData) {
        const currentLevelInput = document.getElementById("current-level");
        const targetLevelInput = document.getElementById("target-level");
        const currentExpDiv = document.getElementById("current-exp");
        
        if (currentLevelInput) {
          currentLevelInput.value = skillData.level;
        }
        if (targetLevelInput) {
          targetLevelInput.value = Math.min(skillData.level + 1, 99);
        }
        if (currentExpDiv) {
          currentExpDiv.textContent = skillData.xp.toLocaleString();
        }
        
        currentLevelInput?.dispatchEvent(new Event('change'));
      }
    }
  });
  
  return container;
}

async function showCalculator(skill, container) {
  const calculatorSection = container.querySelector("#calculator-section");
  calculatorSection.innerHTML = "";
  calculatorSection.setAttribute("data-selected-skill", skill);

  const skillSpan = container.querySelector(`span[data-skill="${skill.toLowerCase()}"]`);
  const currentLevel = parseInt(skillSpan?.textContent || "1");
  const currentExp = parseInt(skillSpan?.dataset.exp || "0"); // Changed to parseInt since API XP is integer

  const levelInputs = document.createElement("div");
  levelInputs.style.backgroundColor = "#161616";
  levelInputs.style.padding = "10px";
  levelInputs.style.marginBottom = "20px";

  levelInputs.innerHTML = `
    <div style="margin-bottom: 10px; color: #fff;">
      <div>Current Level</div>
      <input type="number" id="current-level" min="1" max="99" value="${currentLevel}" 
             style="width: 60px; background: #262626; color: white; border: 1px solid #404040;">
      <div>Current Experience</div>
      <div id="current-exp">${currentExp.toLocaleString()}</div>
    </div>
    <div style="color: #fff;">
      <div>Target Level</div>
      <input type="number" id="target-level" min="1" max="99" value="${Math.min(currentLevel + 1, 99)}" 
             style="width: 60px; background: #262626; color: white; border: 1px solid #404040;">
      <div>Target Experience</div>
      <div id="target-exp">0</div>
    </div>
  `;
  calculatorSection.appendChild(levelInputs);

  const methods = await loadMethods();
  const methodsContainer = document.createElement("div");
  methodsContainer.style.backgroundColor = "#161616";
  methodsContainer.style.color = "#fff";

  const noActionSelected = document.createElement("div");
  noActionSelected.style.padding = "10px";
  noActionSelected.style.borderBottom = "1px solid #404040";
  noActionSelected.innerHTML = `
    <div style="color: #FFA500;">No action selected</div>
    <div style="color: #808080;">Shift-click to select multiple</div>
  `;
  methodsContainer.appendChild(noActionSelected);

  methods[skill]?.forEach(method => {
    const methodDiv = document.createElement("div");
    methodDiv.style.display = "flex";
    methodDiv.style.alignItems = "center";
    methodDiv.style.padding = "10px";
    methodDiv.style.borderBottom = "1px solid #404040";
    methodDiv.style.cursor = "pointer";

    const methodIcon = document.createElement("img");
    methodIcon.src = method.icon;
    methodIcon.onerror = () => {
      methodIcon.src = `https://oldschool.runescape.wiki/images/${skill}_icon.png`;
      console.log(`Failed to load method icon for ${method.name}, using ${skill} icon as fallback`);
    };
    methodIcon.alt = method.name;
    methodIcon.style.width = "30px";
    methodIcon.style.height = "30px";
    methodIcon.style.marginRight = "10px";

    const methodInfo = document.createElement("div");
    methodInfo.style.flex = "1";
    
    const actionsSpan = document.createElement("span");
    actionsSpan.style.color = "#808080";
    actionsSpan.textContent = " - 0 actions";

    methodInfo.innerHTML = `
      <div>${method.name}</div>
      <div style="color: #808080;">Lvl. ${method.level} (${method.exp}xp)</div>
    `;

    methodDiv.appendChild(methodIcon);
    methodDiv.appendChild(methodInfo);

    methodDiv.addEventListener("click", async () => {
      const currentLevel = parseInt(document.getElementById("current-level").value);
      const targetLevel = parseInt(document.getElementById("target-level").value);
      
      if (currentLevel < method.level) {
        methodDiv.style.backgroundColor = "#400000";
        return;
      }
    
      const skillSpan = document.querySelector(`span[data-skill="${calculatorSection.getAttribute("data-selected-skill").toLowerCase()}"]`);
      const currentExp = parseInt(skillSpan?.dataset.exp || "0"); // Changed to parseInt
    
      const expTable = await fetchExperienceTable();
      const expNeeded = expTable[targetLevel] - currentExp;
      const actionsNeeded = Math.ceil(expNeeded / method.exp);
    
      actionsSpan.textContent = ` - ${actionsNeeded.toLocaleString()} actions`;
      document.getElementById("current-exp").textContent = currentExp.toLocaleString();
      document.getElementById("target-exp").textContent = expTable[targetLevel].toLocaleString();
    });
            
    methodInfo.appendChild(actionsSpan);
    methodsContainer.appendChild(methodDiv);
  });

  calculatorSection.appendChild(methodsContainer);

  document.getElementById("current-level").addEventListener("change", updateExperience);
  document.getElementById("target-level").addEventListener("change", updateExperience);

  async function updateExperience() {
    const expTable = await fetchExperienceTable();
    const currentLevel = parseInt(document.getElementById("current-level").value);
    const targetLevel = parseInt(document.getElementById("target-level").value);
  
    const skillSpan = document.querySelector(`span[data-skill="${calculatorSection.getAttribute("data-selected-skill").toLowerCase()}"]`);
    const currentExp = parseInt(skillSpan?.dataset.exp || "0"); // Changed to parseInt
  
    document.getElementById("current-exp").textContent = currentExp.toLocaleString();
    document.getElementById("target-exp").textContent = expTable[targetLevel].toLocaleString();
  }
  
  updateExperience();
}

export default function () {
  return {
    name: "Skill Calculator",
    icon: "📊",
    createContent: createCalculatorContent,
    async init() {
      console.log("Skill Calculator Plugin Initialized.");
    },
    destroy() {
      console.log("Skill Calculator Plugin Destroyed.");
    }
  };
}