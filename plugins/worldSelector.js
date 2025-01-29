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

/**
 * 1) Parses the HTML from /serverlist row by row, allowing multiple region headings (flag rows)
 *    inside the same <table>. Each new heading row updates currentFlagSrc for subsequent worlds.
 */
async function fetchWorlds() {
    try {
        // Fetch the raw HTML
        const response = await fetch("https://2004.lostcity.rs/serverlist?hires.x=101&hires.y=41&method=0");
        const html = await response.text();

        // Parse into a DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const worlds = [];

        // Each <td align="center" width="165"> may contain multiple region headings
        const regionTables = doc.querySelectorAll("table > tbody > tr > td > table");
        regionTables.forEach((regionTable) => {
            const rows = regionTable.querySelectorAll("tr");

            let currentFlagSrc = null;  // We'll update this each time we see a new heading row

            rows.forEach((row) => {
                const imgEl = row.querySelector("img");
                const link = row.querySelector("a");

                // A row with an <img> but NO <a> is a region heading row
                // E.g.  <tr><td colspan="2"><img src="/img/gamewin/usflag.gif"> United States</td></tr>
                if (imgEl && !link) {
                    currentFlagSrc = imgEl.getAttribute("src");
                    return;
                }

                // A row with an <a> is a "world row"
                // E.g.  <tr><td><a href="/client?world=1...">World 1</a></td> <td>8 players</td></tr>
                if (link) {
                    // Extract world # from the href
                    const match = link.href.match(/world=(\d+)/);
                    if (!match) return; 
                    const worldNumber = parseInt(match[1], 10);

                    // Extract "X players" from the last cell
                    const playerCell = row.querySelector("td:last-child");
                    let players = 0;
                    if (playerCell) {
                        const txt = playerCell.textContent.trim();
                        const playersMatch = txt.match(/(\d+)\s*players/);
                        if (playersMatch) {
                            players = parseInt(playersMatch[1], 10);
                        }
                    }

                    worlds.push({
                        flagSrc: currentFlagSrc || "",  // Fallback if no heading found
                        world: worldNumber,
                        players,
                    });
                }
            });
        });

        return worlds;
    } catch (error) {
        console.error("Failed to fetch or parse world list:", error);
        return [];
    }
}

/** 2) Simple sort so we can click table headers for “world” or “players” columns */
function sortWorlds(worlds, key, ascending = true) {
    return [...worlds].sort((a, b) => {
        if (typeof a[key] === "number" && typeof b[key] === "number") {
            return ascending ? a[key] - b[key] : b[key] - a[key];
        }
        return ascending
            ? String(a[key]).localeCompare(String(b[key]))
            : String(b[key]).localeCompare(String(a[key]));
    });
}

/** 3) Build the “World Selector” DOM: a table with columns [Flag, World, Players] */
async function createWorldSelectorContent() {
    const container = document.createElement("div");
    container.id = "tab-world-selector";

    const title = document.createElement("h3");
    title.textContent = "Select a World";
    container.appendChild(title);

    // Fetch worlds from the HTML
    let worlds = await fetchWorlds();
    const currentWorld = new URLSearchParams(window.location.search).get("world");

    // Create a table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.textAlign = "left";

    // Table headers for [Flag | World | Players]
    const headers = [
        { key: "flagSrc", text: "🌎" },
        { key: "world", text: "🌐" },
        { key: "players", text: "🧍‍♂️" },
    ];

    const headerRow = document.createElement("tr");
    headers.forEach(({ key, text }) => {
        const th = document.createElement("th");
        th.textContent = text;
        th.style.cursor = "pointer";
        th.style.padding = "8px";
        th.style.borderBottom = "2px solid #ccc";

        let ascending = true;
        th.addEventListener("click", () => {
            // Sorting by "flagSrc" is possible, but not that useful
            worlds = sortWorlds(worlds, key, ascending);
            ascending = !ascending;
            renderTableBody(worlds, tableBody, currentWorld);
        });

        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Table body
    const tableBody = document.createElement("tbody");
    table.appendChild(tableBody);
    container.appendChild(table);

    // Initial rendering
    renderTableBody(worlds, tableBody, currentWorld);

    return container;
}

/** 4) Renders each row with [Flag | World | Players] – no region names. */
function renderTableBody(worlds, tableBody, currentWorld) {
    tableBody.innerHTML = "";

    worlds.forEach(({ flagSrc, world, players }) => {
        const row = document.createElement("tr");

        // 1) Flag cell
        const flagCell = document.createElement("td");
        flagCell.style.padding = "8px";
        if (flagSrc) {
            const flagImg = document.createElement("img");
            flagImg.src = flagSrc;
            flagImg.alt = "flag";
            flagImg.style.width = "20px";
            flagImg.style.height = "15px";
            flagCell.appendChild(flagImg);
        } else {
            // If missing, just leave blank
            flagCell.textContent = "";
        }
        row.appendChild(flagCell);

        // 2) World cell with hyperlink
        const worldCell = document.createElement("td");
        worldCell.style.padding = "8px";
        const link = document.createElement("a");
        link.href = `https://2004.lostcity.rs/client?world=${world}&detail=high&method=0`;
        link.textContent = (currentWorld === String(world))
            ? `World ${world} (current)`
            : `World ${world}`;
        worldCell.appendChild(link);
        row.appendChild(worldCell);

        // 3) Players cell
        const playersCell = document.createElement("td");
        playersCell.style.padding = "8px";
        playersCell.textContent = players;
        row.appendChild(playersCell);

        tableBody.appendChild(row);
    });
}

/** 5) Add the plugin tab */
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

/** 6) Export the plugin */
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
