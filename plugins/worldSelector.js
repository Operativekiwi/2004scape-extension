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
      const response = await fetch("https://2004.lostcity.rs/api/v1/worldlist");
      const data = await response.json();

      // Map regions to flag URLs
      const regionFlags = {
          "United States": "/img/gamewin/usflag.gif",
          "Germany": "/img/gamewin/gerflag.gif",
          "Russia": "/img/gamewin/rusflag.gif"
      };

      const worlds = data.map((world) => {
          const flagSrc = regionFlags[world.region] || null;
          return {
              world: world.id,
              region: world.region,
              players: world.players,
              flagSrc,
              address: world.address
          };
      });

      return worlds;
  } catch (error) {
      console.error("Failed to fetch world list from API:", error);
      return [];
  }
}

async function getPing(serverAddress) {
  const start = performance.now();
  try {
      await fetch(serverAddress, { method: "HEAD", mode: "no-cors", headers: { Range: "bytes=0-1" }
      }); // Using HEAD for minimal data transfer
      const end = performance.now();
      return Math.round(end - start); // Return time in milliseconds
  } catch (error) {
      console.error(`Failed to ping ${serverAddress}:`, error);
      return "N/A"; // Return "N/A" if the ping fails
  }
}

function sortWorlds(worlds, key, ascending = true) {
  return [...worlds].sort((a, b) => {
      if (a[key] === "N/A" || b[key] === "N/A") return a[key] === "N/A" ? 1 : -1; // Handle "N/A" last
      if (typeof a[key] === "number") {
          return ascending ? a[key] - b[key] : b[key] - a[key];
      }
      return ascending
          ? a[key].toString().localeCompare(b[key].toString())
          : b[key].toString().localeCompare(a[key].toString());
  });
}

async function createWorldSelectorContent() {
  const container = document.createElement("div");
  container.id = "tab-world-selector";

  const title = document.createElement("h3");
  title.textContent = "Select a World";
  container.appendChild(title);

  let worlds = await fetchWorlds();
  const currentWorld = new URLSearchParams(window.location.search).get("world");

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.textAlign = "left";

  // Create headers with sorting functionality
  const headers = [
      { key: "region", text: "🌎" },
      { key: "world", text: "🌐" },
      { key: "players", text: "👥" },
      { key: "ping", text: "📡" }
  ];

  const headerRow = document.createElement("tr");
  headers.forEach(({ key, text }) => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.cursor = "pointer";
      th.style.padding = "8px";
      th.style.borderBottom = "2px solid #ccc";

      let ascending = true; // Default sort order

      th.addEventListener("click", async () => {
          if (key === "ping") {
              // Fetch pings before sorting by ping
              for (const world of worlds) {
                  if (!world.ping) world.ping = await getPing(world.address);
              }
          }
          worlds = sortWorlds(worlds, key, ascending);
          ascending = !ascending; // Toggle sort order
          renderTableBody(worlds, tableBody, currentWorld);
      });

      headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Create table body
  const tableBody = document.createElement("tbody");
  table.appendChild(tableBody);
  container.appendChild(table);

  // Render initial table body
  renderTableBody(worlds, tableBody, currentWorld);

  return container;
}

function renderTableBody(worlds, tableBody, currentWorld) {
  tableBody.innerHTML = ""; // Clear existing rows

  worlds.forEach(async ({ world, region, players, flagSrc, address, ping }) => {
      const row = document.createElement("tr");

      // Location with flag only
      const locationCell = document.createElement("td");
      locationCell.style.padding = "8px";
      if (flagSrc) {
          const flag = document.createElement("img");
          flag.src = flagSrc;
          flag.alt = `Flag for ${region}`;
          flag.style.width = "20px";
          flag.style.height = "15px";
          locationCell.appendChild(flag);
      }
      row.appendChild(locationCell);

      // World number as a hyperlink
      const worldCell = document.createElement("td");
      const worldLink = document.createElement("a");
      worldLink.href = `https://2004.lostcity.rs/client?world=${world}&detail=high&method=0`;
      worldLink.textContent = currentWorld === world.toString() ? `World ${world} (current)` : `World ${world}`;
      worldCell.style.padding = "8px";
      worldCell.appendChild(worldLink);
      row.appendChild(worldCell);

      // Player count
      const playersCell = document.createElement("td");
      playersCell.textContent = players;
      playersCell.style.padding = "8px";
      row.appendChild(playersCell);

      // Ping
      const pingCell = document.createElement("td");
      pingCell.textContent = ping ? `${ping}ms` : "Calculating...";
      pingCell.style.padding = "8px";

      if (!ping) {
          // Dynamically update ping when fetched
          const calculatedPing = await getPing(address);
          pingCell.textContent = `${calculatedPing}ms`;
      }

      row.appendChild(pingCell);

      tableBody.appendChild(row);
  });
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
