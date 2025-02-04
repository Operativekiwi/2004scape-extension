import { fetchPlayerSkills } from './playerLookup.js';

async function createQuestHelperContent() {
  const container = document.createElement("div");
  container.id = "tab-quest-helper";
  container.style.padding = "10px";
  container.style.height = "100%";
  container.style.overflow = "hidden";
  container.style.flexDirection = "column";
  container.style.display = "flex";
  container.style.color = "#fff";
  
  // Load saved data
  const savedUsername = localStorage.getItem('quest-helper-username');
  const savedQuests = JSON.parse(localStorage.getItem('quest-helper-progress') || '{}');
  const savedSteps = JSON.parse(localStorage.getItem('quest-helper-steps') || '{}');
  
  function checkSkillRequirements(requirements, playerSkills) {
    if (!requirements || !requirements.length || !playerSkills) return true;
    return requirements.every(req => 
      playerSkills[req.skill.toLowerCase()]?.level >= req.level
    );
  }
  
  function getQuestStatus(questId, quest, playerSkills) {
    if (savedQuests[questId]) return 'lightgreen';
    
    const questSteps = savedSteps[questId] || {};
    const hasStarted = Object.values(questSteps).some(step => step);
    
    if (!checkSkillRequirements(quest.requirements.skills, playerSkills)) {
      return '#ff6b6b';
    }
    
    return hasStarted ? '#ffd700' : '#fff';
  }
  
  async function showMainScreen() {
    container.innerHTML = '';
    
    // Title
    const title = document.createElement("h2");
    title.textContent = "Quest Helper";
    title.style.fontSize = "16px";
    title.style.margin = "0 0 15px 0";
    title.style.paddingBottom = "8px";
    title.style.borderBottom = "1px solid #4d4d4d";
    container.appendChild(title);
    
    // Username search
    const searchDiv = document.createElement("div");
    searchDiv.style.marginBottom = "15px";
    
    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.placeholder = "Enter username...";
    usernameInput.value = savedUsername || '';
    usernameInput.style.width = "100%";
    usernameInput.style.marginBottom = "8px";
    usernameInput.style.padding = "6px";
    usernameInput.style.fontSize = "12px";
    usernameInput.style.backgroundColor = "#242424";
    usernameInput.style.border = "1px solid #4d4d4d";
    usernameInput.style.borderRadius = "4px";
    usernameInput.style.color = "#fff";
    
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.style.width = "100%";
    searchButton.style.padding = "6px";
    searchButton.style.fontSize = "12px";
    searchButton.style.backgroundColor = "#4CAF50";
    searchButton.style.border = "none";
    searchButton.style.borderRadius = "4px";
    searchButton.style.color = "#fff";
    searchButton.style.cursor = "pointer";
    
    searchDiv.appendChild(usernameInput);
    searchDiv.appendChild(searchButton);
    container.appendChild(searchDiv);
    
    // Quests list
    const scrollContainer = document.createElement("div");
    scrollContainer.style.overflowY = "auto";  
    scrollContainer.style.flexGrow = "1";  // Allows it to take available space
    scrollContainer.style.maxHeight = "100vh";  // Adjust as needed, allows scrolling
    scrollContainer.style.minHeight = "200px";  // Ensures enough space
    scrollContainer.style.paddingRight = "8px";  // Prevents double scrollbar
            
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "12px";
    
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Quest Name", "Done"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.padding = "6px";
      th.style.textAlign = "left";
      th.style.borderBottom = "1px solid #4d4d4d";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    
    try {
      const response = await fetch(chrome.runtime.getURL('plugins/quests.json'));
      const questData = await response.json();
      const playerSkills = JSON.parse(localStorage.getItem('quest-helper-skills') || '{}');
      
      Object.entries(questData).forEach(([questId, quest]) => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid #333";
        
        const nameCell = document.createElement("td");
        const questLink = document.createElement("a");
        questLink.href = "#";
        questLink.textContent = quest.name;
        
        const status = getQuestStatus(questId, quest, playerSkills);
        questLink.style.color = status;
        questLink.style.textDecoration = "none";
        questLink.style.padding = "6px";
        questLink.style.display = "block";
        
        questLink.addEventListener("mouseover", () => {
          questLink.style.backgroundColor = "#333";
        });
        
        questLink.addEventListener("mouseout", () => {
          questLink.style.backgroundColor = "transparent";
        });
        
        questLink.addEventListener("click", () => showQuestScreen(questId, quest));
        nameCell.appendChild(questLink);
        const checkCell = document.createElement("td");
        checkCell.style.padding = "6px";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = savedQuests[questId] || false;
        checkbox.style.transform = "scale(1.1)";
        checkbox.addEventListener("change", () => {
          savedQuests[questId] = checkbox.checked;
          localStorage.setItem('quest-helper-progress', JSON.stringify(savedQuests));
          questLink.style.color = getQuestStatus(questId, quest, playerSkills);
        });
        checkCell.appendChild(checkbox);
        
        row.appendChild(nameCell);
        row.appendChild(checkCell);
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      scrollContainer.appendChild(table);
      container.appendChild(scrollContainer);
      
    } catch (error) {
      console.error("Failed to load quest data:", error);
    }
    
    searchButton.addEventListener("click", async () => {
      const username = usernameInput.value.trim();
      if (!username) return;
      
      searchButton.disabled = true;
      searchButton.textContent = "Searching...";
      
      const skills = await fetchPlayerSkills(username);
      if (skills) {
        localStorage.setItem('quest-helper-username', username);
        localStorage.setItem('quest-helper-skills', JSON.stringify(skills));
        showMainScreen();
      }
      
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    });
  }
  
  async function showQuestScreen(questId, quest) {
    container.innerHTML = '';
    
    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back";
    backBtn.style.marginBottom = "15px";
    backBtn.style.padding = "6px 12px";
    backBtn.style.fontSize = "12px";
    backBtn.style.backgroundColor = "#4CAF50";
    backBtn.style.border = "none";
    backBtn.style.borderRadius = "4px";
    backBtn.style.color = "#fff";
    backBtn.style.cursor = "pointer";
    backBtn.addEventListener("click", showMainScreen);
    container.appendChild(backBtn);
    
    const title = document.createElement("h2");
    title.textContent = quest.name;
    title.style.fontSize = "16px";
    title.style.margin = "0 0 15px 0";
    title.style.paddingBottom = "8px";
    title.style.borderBottom = "1px solid #4d4d4d";
    container.appendChild(title);
    
    const scrollContent = document.createElement("div");
    scrollContent.style.overflowY = "auto";
    scrollContent.style.maxHeight = "100vh"; // Adjust if needed
    scrollContent.style.paddingRight = "8px";
            
    if (quest.requirements.skills.length > 0) {
      const skillsDiv = document.createElement("div");
      skillsDiv.style.marginBottom = "15px";
      
      const skillsTitle = document.createElement("h3");
      skillsTitle.textContent = "Skill Requirements";
      skillsTitle.style.fontSize = "14px";
      skillsTitle.style.margin = "0 0 8px 0";
      skillsDiv.appendChild(skillsTitle);
      
      const skills = JSON.parse(localStorage.getItem('quest-helper-skills') || '{}');
      const skillsList = document.createElement("ul");
      skillsList.style.margin = "0";
      skillsList.style.padding = "0 0 0 20px";
      
      quest.requirements.skills.forEach(req => {
        const playerLevel = skills[req.skill.toLowerCase()]?.level || 1;
        const hasLevel = playerLevel >= req.level;
        
        const li = document.createElement("li");
        li.style.color = hasLevel ? 'lightgreen' : '#ff6b6b';
        li.textContent = `${req.skill} (${playerLevel}/${req.level})`;
        skillsList.appendChild(li);
      });
      
      skillsDiv.appendChild(skillsList);
      scrollContent.appendChild(skillsDiv);
    }
    
    ['items', 'quests', 'other'].forEach(reqType => {
      if (quest.requirements[reqType].length > 0) {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";
        
        const title = document.createElement("h3");
        title.textContent = `${reqType.charAt(0).toUpperCase() + reqType.slice(1)} Requirements`;
        title.style.fontSize = "14px";
        title.style.margin = "0 0 8px 0";
        div.appendChild(title);
        
        const list = document.createElement("ul");
        list.style.margin = "0";
        list.style.padding = "0 0 0 20px";
        
        quest.requirements[reqType].forEach(req => {
          const li = document.createElement("li");
          li.textContent = req;
          list.appendChild(li);
        });
        
        div.appendChild(list);
        scrollContent.appendChild(div);
      }
    });
    
    const stepsTitle = document.createElement("h3");
    stepsTitle.textContent = "Quest Steps";
    stepsTitle.style.fontSize = "14px";
    stepsTitle.style.margin = "15px 0 8px 0";
    scrollContent.appendChild(stepsTitle);
    
    const questSteps = savedSteps[questId] || {};
    
    quest.steps.forEach((step, index) => {
      const stepDiv = document.createElement("div");
      stepDiv.style.display = "flex";
      stepDiv.style.alignItems = "flex-start";
      stepDiv.style.marginBottom = "8px";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = questSteps[index] || false;
      checkbox.style.transform = "scale(1.1)";
      checkbox.style.marginRight = "8px";
      checkbox.style.marginTop = "2px";
      checkbox.addEventListener("change", () => {
        questSteps[index] = checkbox.checked;
        savedSteps[questId] = questSteps;
        localStorage.setItem('quest-helper-steps', JSON.stringify(savedSteps));
      });
      
      const stepText = document.createElement("span");
      stepText.textContent = `${index + 1}. ${step}`;
      
      stepDiv.appendChild(checkbox);
      stepDiv.appendChild(stepText);
      scrollContent.appendChild(stepDiv);
    });
    
    container.appendChild(scrollContent);
  }
  
  await showMainScreen();
  return container;
}

export default function() {
  return {
    name: "Quest Helper",
    icon: "📜",
    createContent: createQuestHelperContent,
    async init() {
      console.log("Quest Helper Plugin Initialized");
    },
    destroy() {
      console.log("Quest Helper Plugin Destroyed");
    }
  };
}