console.log("2004Scape Extension with Vertical Tabs and Item Lookup Tool Loaded.");

// Auto-refresh interval reference
let autoRefreshInterval = null;

// Fetch the world list dynamically from the server
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

// Fetch items from the API
async function fetchItems(query) {
  try {
    const url = `https://2004items-production.up.railway.app/api/items?name=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return [];
  }
}

// Helper function to calculate drop rates
function calculateDropRate(threshold, total = 128) {
  return ((threshold / total) * 100).toFixed(2);
}

async function fetchNPCDropTable(npcFile) {
  try {
    const baseUrl = 'https://raw.githubusercontent.com/2004Scape/Server/e5131afd059895bc040a8836b1f7b03cdfad2893/data/src/scripts/drop%20tables/scripts/';
    const response = await fetch(`${baseUrl}${npcFile}`);
    if (!response.ok) return null;
    
    const dropTableContent = await response.text();
    console.log(dropTableContent);  // Add this line to inspect the drop table content
    const drops = [];
    const lines = dropTableContent.split('\n');
    
    // Find NPCs
    const npcs = [];
    let previousThreshold = 0;

    lines.forEach(line => {
      // Clean the line and skip empty lines or comments
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('//')) return;

      // Find NPC IDs
      const npcMatch = line.match(/\[ai_queue3,npc_(\d+)\]/);
      if (npcMatch) {
        npcs.push(npcMatch[1]);
      }

      // Find drops
      const randomCheck = line.match(/\$random\s*<\s*(\d+)/);
      if (randomCheck) {
        const threshold = parseInt(randomCheck[1]);
        // Look for item name in the same line
        const itemMatch = line.match(/obj_add\(npc_coord,\s*(\w+)/);
        if (itemMatch) {
          const rate = calculateDropRate(threshold - previousThreshold);
          const itemName = itemMatch[1].replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
          
          // Only add if the rate is greater than 0
          if (rate > 0) {
            drops.push({
              item: itemName,
              rate: rate
            });
          }
          previousThreshold = threshold;
        }
      }

      // Reset previousThreshold when we see a new drop table label
      if (line.includes('drop_table')) {
        previousThreshold = 0;
      }
    });

    // Sort drops by rate (highest to lowest)
    drops.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

    return { npcs, drops };
  } catch (error) {
    console.error("Failed to fetch drop table:", error);
    return null;
  }
}

// Create the content for the World Selector tab
async function createWorldSelectorContent() {
  const container = document.createElement("div");
  container.id = "tab-world-selector";

  const title = document.createElement("h3");
  title.textContent = "Select a World";
  container.appendChild(title);

  // Get current world from URL
  const currentWorld = new URLSearchParams(window.location.search).get('world');

  // Fetch worlds and add links
  const worlds = await fetchWorlds();
  worlds.forEach(({ world, players }) => {
    const link = document.createElement("a");
    link.href = `https://2004scape.org/client?world=${world}&detail=high&method=0`;
    
    // Add visual indicator for current world
    if (world === currentWorld) {
      link.textContent = `World ${world} (${players}) ← Current World`;
      link.style.backgroundColor = '#28a745';
    } else {
      link.textContent = `World ${world} (${players})`;
    }
    
    link.style.display = "block";
    link.style.margin = "5px 0";

    // Add warning prompt for world change
    if (world !== currentWorld) {
      link.addEventListener('click', (e) => {
        const showWarning = localStorage.getItem('showWorldChangeWarning') !== 'false';
        if (showWarning && !confirm(`Are you sure you want to switch to World ${world}?`)) {
          e.preventDefault();
        }
      });
    }

    container.appendChild(link);
  });

  // Add warning toggle checkbox
  const warningContainer = document.createElement("div");
  warningContainer.style.marginTop = "15px";
  warningContainer.style.borderTop = "1px solid #4d4d4d";
  warningContainer.style.paddingTop = "10px";

  const warningCheckbox = document.createElement("input");
  warningCheckbox.type = "checkbox";
  warningCheckbox.id = "show-warning";
  warningCheckbox.checked = localStorage.getItem('showWorldChangeWarning') !== 'false';
  warningCheckbox.addEventListener("change", (event) => {
    localStorage.setItem('showWorldChangeWarning', event.target.checked);
  });

  const warningLabel = document.createElement("label");
  warningLabel.htmlFor = "show-warning";
  warningLabel.textContent = " Show world change warning";

  warningContainer.appendChild(warningCheckbox);
  warningContainer.appendChild(warningLabel);

  // Add refresh button
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "Refresh";
  refreshButton.style.marginTop = "10px";
  refreshButton.addEventListener("click", async () => {
    container.replaceChildren(await createWorldSelectorContent());
  });

  container.appendChild(refreshButton);

  // Auto-refresh toggle
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
  container.appendChild(warningContainer);

  return container;
}

// Create the content for the Item Lookup Tool tab
function createItemLookupContent() {
  const container = document.createElement("div");
  container.id = "tab-item-lookup";

  const title = document.createElement("h3");
  title.textContent = "Item Lookup";
  container.appendChild(title);

  // Search input and button
  const searchContainer = document.createElement("div");
  searchContainer.style.marginBottom = "10px";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search for items...";
  searchInput.style.width = "100%";
  searchInput.style.padding = "5px";
  searchInput.style.marginBottom = "10px";
  searchContainer.appendChild(searchInput);

  const searchButton = document.createElement("button");
  searchButton.textContent = "Search";
  searchButton.style.width = "100%";
  searchButton.style.padding = "5px";
  searchButton.style.backgroundColor = "#007bff";
  searchButton.style.color = "#fff";
  searchButton.style.border = "none";
  searchButton.style.cursor = "pointer";
  searchContainer.appendChild(searchButton);

  container.appendChild(searchContainer);

  // Results container
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "item-results";
  resultsContainer.style.overflowY = "auto";
  resultsContainer.style.maxHeight = "400px";
  resultsContainer.style.border = "1px solid #ccc";
  resultsContainer.style.padding = "5px";
  container.appendChild(resultsContainer);

  // Search button event
  searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = "Loading...";
    const items = await fetchItems(query);
    resultsContainer.innerHTML = "";

    if (items.length === 0) {
      resultsContainer.textContent = "No items found.";
      return;
    }

    items.forEach((item) => {
      const itemContainer = document.createElement("div");
      itemContainer.style.marginBottom = "10px";
      itemContainer.style.padding = "5px";
      itemContainer.style.display = "flex";
      itemContainer.style.alignItems = "center";

      const logo = document.createElement("img");
      logo.src = item.logo_url;
      logo.alt = item.name;
      logo.style.width = "40px";
      logo.style.height = "40px";
      logo.style.marginRight = "10px";
      itemContainer.appendChild(logo);

      const details = document.createElement("div");
      details.innerHTML = `
        <strong>${item.name}</strong><br>
        Location: ${item.location || "N/A"}<br>
        Shop Price: ${item.shop_price || "N/A"}<br>
        High Alchemy: ${item.high_alchemy || "N/A"}<br>
        Low Alchemy: ${item.low_alchemy || "N/A"}
      `;
      itemContainer.appendChild(details);

      resultsContainer.appendChild(itemContainer);
    });
  });

  return container;
}

// Create the content for the NPC Drop Table tab
function createNPCDropTableContent() {
  const container = document.createElement("div");
  container.id = "tab-npc-drops";

  const title = document.createElement("h3");
  title.textContent = "NPC Drop Tables";
  container.appendChild(title);

  // Create NPC selector
  const selectContainer = document.createElement("div");
  selectContainer.style.marginBottom = "10px";

  const npcSelect = document.createElement("select");
  npcSelect.style.width = "100%";
  npcSelect.style.padding = "5px";
  npcSelect.style.marginBottom = "10px";

  // Add NPC options
  const npcFiles = [
    { file: 'bandit.rs2', name: 'Bandit' },
    { file: 'bandit_camp_leaders.rs2', name: 'Bandit Camp Leaders' },
    { file: 'barbarian.rs2', name: 'Barbarian' },
    { file: 'bear.rs2', name: 'Bear' },
    { file: 'black_demon.rs2', name: 'Black Demon' },
    { file: 'black_dragon.rs2', name: 'Black Dragon' },
    { file: 'black_knight.rs2', name: 'Black Knight' },
    { file: 'blue_dragon.rs2', name: 'Blue Dragon' },
    { file: 'chaos_druid.rs2', name: 'Chaos Druid' },
    { file: 'chaos_druid_warrior.rs2', name: 'Chaos Druid Warrior' },
    { file: 'chaos_dwarf.rs2', name: 'Chaos Dwarf' },
    { file: 'chicken.rs2', name: 'Chicken' },
    { file: 'cow.rs2', name: 'Cow' },
    { file: 'dark_warrior.rs2', name: 'Dark Warrior' },
    { file: 'dark_wizard.rs2', name: 'Dark Wizard' },
    { file: 'druid.rs2', name: 'Druid' },
    { file: 'dwarf.rs2', name: 'Dwarf' },
    { file: 'earth_warrior.rs2', name: 'Earth Warrior' },
    { file: 'entrana_firebird.rs2', name: 'Entrana Firebird' },
    { file: 'farmer.rs2', name: 'Farmer' },
    { file: 'fire_giant.rs2', name: 'Fire Giant' },
    { file: 'giant.rs2', name: 'Giant' },
    { file: 'giant_rat.rs2', name: 'Giant Rat' },
    { file: 'goblin.rs2', name: 'Goblin' },
    { file: 'greater_demon.rs2', name: 'Greater Demon' },
    { file: 'green_dragon.rs2', name: 'Green Dragon' },
    { file: 'grip.rs2', name: 'Grip' },
    { file: 'guard.rs2', name: 'Guard' },
    { file: 'guard_dog.rs2', name: 'Guard Dog' },
    { file: 'hellhound.rs2', name: 'Hellhound' },
    { file: 'highwayman.rs2', name: 'Highwayman' },
    { file: 'hobgoblin.rs2', name: 'Hobgoblin' },
    { file: 'ice_giant.rs2', name: 'Ice Giant' },
    { file: 'ice_warrior.rs2', name: 'Ice Warrior' },
    { file: 'imp.rs2', name: 'Imp' },
    { file: 'jailer.rs2', name: 'Jailer' },
    { file: 'jogre.rs2', name: 'Jogre' },
    { file: 'jonny_the_beard.rs2', name: 'Jonny the Beard' },
    { file: 'lesser_demon.rs2', name: 'Lesser Demon' },
    { file: 'man.rs2', name: 'Man' },
    { file: 'monk_of_zamorak.rs2', name: 'Monk of Zamorak' },
    { file: 'moss_giant.rs2', name: 'Moss Giant' },
    { file: 'mugger.rs2', name: 'Mugger' },
    { file: 'necromancer.rs2', name: 'Necromancer' },
    { file: 'otherwordly_being.rs2', name: 'Otherworldly Being' },
    { file: 'paladin.rs2', name: 'Paladin' },
    { file: 'pirate.rs2', name: 'Pirate' },
    { file: 'rat.rs2', name: 'Rat' },
    { file: 'red_dragon.rs2', name: 'Red Dragon' },
    { file: 'rogue.rs2', name: 'Rogue' },
    { file: 'salarin_the_twisted.rs2', name: 'Salarin the Twisted' },
    { file: 'skeleton.rs2', name: 'Skeleton' },
    { file: 'thug.rs2', name: 'Thug' },
    { file: 'ugthanki.rs2', name: 'Ugthanki' },
    { file: 'unicorn.rs2', name: 'Unicorn' },
    { file: 'white_knight.rs2', name: 'White Knight' },
    { file: 'wizard.rs2', name: 'Wizard' },
    { file: 'test.rs2', name: 'test' },
    { file: 'yanille_soldier_tower_guard.rs2', name: 'Yanille Tower Guard' },
    { file: 'zombie.rs2', name: 'Zombie' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an NPC...";
  npcSelect.appendChild(defaultOption);

  npcFiles.forEach(npc => {
    const option = document.createElement("option");
    option.value = npc.file;
    option.textContent = npc.name;
    npcSelect.appendChild(option);
  });

  selectContainer.appendChild(npcSelect);
  container.appendChild(selectContainer);

  // Results container
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "npc-drops-results";
  resultsContainer.style.overflowY = "auto";
  resultsContainer.style.maxHeight = "400px";
  resultsContainer.style.border = "1px solid #ccc";
  resultsContainer.style.padding = "5px";
  container.appendChild(resultsContainer);

  // Handle NPC selection
  npcSelect.addEventListener("change", async () => {
    const selectedFile = npcSelect.value;
    if (!selectedFile) {
      resultsContainer.innerHTML = "";
      return;
    }

    resultsContainer.innerHTML = "Loading...";
    const dropTableInfo = await fetchNPCDropTable(selectedFile);
    
    if (!dropTableInfo) {
      resultsContainer.innerHTML = "Failed to load drop table.";
      return;
    }

    let html = `
      <div style="margin-bottom: 10px; padding: 10px; background-color: #2a2a2a; border-radius: 4px;">
        <strong>NPC IDs:</strong> ${dropTableInfo.npcs.join(', ')}
      </div>
    `;

    if (dropTableInfo.drops.length === 0) {
      html += '<div style="padding: 10px;">No drops found for this NPC.</div>';
    } else {
      dropTableInfo.drops.forEach(drop => {
        html += `
          <div style="margin-bottom: 5px; padding: 10px; background-color: #2a2a2a; border-radius: 4px;">
            <strong>${drop.item}</strong>
            <div style="color: #8a8a8a;">Drop Rate: ${drop.rate}%</div>
          </div>
        `;
      });
    }

    resultsContainer.innerHTML = html;
});

  return container;
}

// Create the tab structure
async function addVerticalTabs() {
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

  const tabs = [
    { id: "tab-world-selector", icon: "🌍", content: await createWorldSelectorContent() },
    { id: "tab-item-lookup", icon: "🔍", content: createItemLookupContent() },
    { id: "tab-npc-drops", icon: "👾", content: createNPCDropTableContent() }
  ];

  tabs.forEach(({ id, icon, content }) => {
    const button = document.createElement("button");
    button.textContent = icon;
    button.style.margin = "10px 0";
    button.style.background = "none";
    button.style.border = "none";
    button.style.color = "#fff";
    button.style.cursor = "pointer";
    button.style.fontSize = "20px";
    button.style.width = "40px";
    button.style.height = "40px";

    button.addEventListener("click", () => {
      tabContent.replaceChildren(content instanceof HTMLElement ? content : document.createTextNode(content));
    });

    tabsBar.appendChild(button);
  });

  tabContent.replaceChildren(tabs[0].content);

  tabsContainer.appendChild(tabsBar);
  tabsContainer.appendChild(tabContent);

  document.body.appendChild(tabsContainer);
}

// Initialize the tabs
addVerticalTabs();