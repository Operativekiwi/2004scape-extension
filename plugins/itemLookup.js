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
  
  export default function () {
    return {
      name: "Item Lookup",
      icon: "🔍",
      createContent: createItemLookupContent,
      async init() {
        console.log("Item Lookup Plugin Initialized.");
      },
      destroy() {
        console.log("Item Lookup Plugin Destroyed.");
      }
    };
  }