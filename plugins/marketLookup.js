async function fetchMarketItems(query) {
    try {
      const url = `https://lostcity.markets/api/items?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch market items:", error);
      return [];
    }
  }
  
  function loadItemListings(slug, callback) {
    chrome.runtime.sendMessage({ action: "fetchItemListings", slug: slug }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching item listings:", chrome.runtime.lastError);
        callback([]);
        return;
      }
      if (!response || !response.success) {
        console.error("Failed to fetch item listings.");
        callback([]);
        return;
      }
      callback(response.listings);
    });
  }
  
  function displayItemDetails(itemSlug, listings, resultsContainer) {
    resultsContainer.innerHTML = ""; // Clear previous content
  
    const itemDetailsContainer = document.createElement('div');
    itemDetailsContainer.style.textAlign = 'center';
    itemDetailsContainer.style.marginBottom = '10px';
  
    const itemLink = document.createElement('a');
    itemLink.href = `https://lostcity.markets/items/${itemSlug}?type=buy`;
    itemLink.target = '_blank';
    itemLink.style.textDecoration = 'none';
    itemLink.style.color = 'inherit';
  
    const itemImage = document.createElement('img');
    itemImage.src = `https://lostcity.markets/img/items/${itemSlug}.webp`; // Changed to .webp
    itemImage.alt = itemSlug;
    itemImage.style.width = '64px';
    itemImage.style.height = '64px';
    itemImage.style.cursor = 'pointer';
  
    const itemName = document.createElement('h2');
    itemName.textContent = itemSlug.replace(/-/g, " ").toUpperCase();
    itemName.style.color = '#007bff';
    itemName.style.cursor = 'pointer';
  
    itemLink.appendChild(itemImage);
    itemLink.appendChild(itemName);
    itemDetailsContainer.appendChild(itemLink);
  
    const priceInfoContainer = document.createElement('div');
    priceInfoContainer.style.display = 'flex';
    priceInfoContainer.style.justifyContent = 'center';
    priceInfoContainer.style.gap = '15px';
    priceInfoContainer.style.marginTop = '10px';
    priceInfoContainer.style.backgroundColor = '#222';
    priceInfoContainer.style.padding = '8px';
    priceInfoContainer.style.borderRadius = '6px';
  
    const priceTypes = [
      { label: 'Gen. Store', value: '0' },
      { label: 'High Alch', value: '0' },
      { label: 'Low Alch', value: '0' }
    ];
  
    priceTypes.forEach(priceType => {
      const priceDiv = document.createElement('div');
      priceDiv.style.textAlign = 'center';
      priceDiv.innerHTML = `
        <u style="color: #bbb;">${priceType.label}:</u>
        <p style="color: #ddd;">${priceType.value}GP</p>
      `;
      priceInfoContainer.appendChild(priceDiv);
    });
  
    itemDetailsContainer.appendChild(priceInfoContainer);
    resultsContainer.appendChild(itemDetailsContainer);
  
    const filterContainer = document.createElement('div');
    filterContainer.style.display = 'flex';
    filterContainer.style.justifyContent = 'center';
    filterContainer.style.gap = '15px';
    filterContainer.style.marginBottom = '10px';
  
    const createFilterCheckbox = (label, id, defaultChecked) => {
      const wrapper = document.createElement('label');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '4px';
      wrapper.style.cursor = 'pointer';
  
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.checked = defaultChecked;
  
      const text = document.createElement('span');
      text.textContent = label;
      text.style.fontSize = '12px';
      text.style.color = '#fff';
  
      wrapper.appendChild(checkbox);
      wrapper.appendChild(text);
      return { wrapper, checkbox };
    };
  
    const { wrapper: buyWrapper, checkbox: buyCheckbox } = createFilterCheckbox('Buy', 'filter-buy', true);
    const { wrapper: sellWrapper, checkbox: sellCheckbox } = createFilterCheckbox('Sell', 'filter-sell', true);
  
    filterContainer.appendChild(buyWrapper);
    filterContainer.appendChild(sellWrapper);
    resultsContainer.appendChild(filterContainer);
  
    const listingsTable = document.createElement("table");
    listingsTable.style.width = "100%";
    listingsTable.style.borderCollapse = "collapse";
    listingsTable.style.marginTop = "10px";
    listingsTable.style.fontSize = "12px";
    listingsTable.style.lineHeight = "1.2";
  
    const tableHeader = `
      <thead>
        <tr style="background-color: #222; color: #fff;">
          <th style="padding: 3px;">Type</th>
          <th style="padding: 3px;">Details</th>
          <th style="padding: 3px;">User</th>
          <th style="padding: 3px;">Time</th>
          <th style="padding: 3px;">Notes</th>
        </tr>
      </thead>
    `;
  
    const renderListings = () => {
      const activeFilters = {
        Buy: buyCheckbox.checked,
        Sell: sellCheckbox.checked
      };
  
      const filteredListings = listings.filter(listing => activeFilters[listing.type]);
  
      let tableBody = "<tbody>";
      filteredListings.forEach((listing) => {
        tableBody += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 3px; font-weight: bold; color: ${listing.type === "Buy" ? "red" : "green"};">
              ${listing.type}
            </td>
            <td style="padding: 3px;">${listing.details}</td>
            <td style="padding: 3px;">${listing.username}</td>
            <td style="padding: 3px;">${listing.time}</td>
            <td style="padding: 3px;">${listing.notes}</td>
          </tr>
        `;
      });
      tableBody += "</tbody>";
  
      listingsTable.innerHTML = tableHeader + tableBody;
    };
  
    renderListings();
    buyCheckbox.addEventListener('change', renderListings);
    sellCheckbox.addEventListener('change', renderListings);
  
    resultsContainer.appendChild(listingsTable);
  }
  
  function createRecentListings() {
    const recentListingsContainer = document.createElement('div');
    recentListingsContainer.id = 'recent-listings';
    recentListingsContainer.style.width = '100%';
    recentListingsContainer.style.flex = '1';
    recentListingsContainer.style.overflowY = 'auto';
  
    const title = document.createElement('h3');
    title.textContent = 'Recent Listings';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    recentListingsContainer.appendChild(title);
  
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.marginBottom = '5px';
  
    const filterContainer = document.createElement('div');
    const buyCheckbox = document.createElement('input');
    buyCheckbox.type = 'checkbox';
    buyCheckbox.checked = true;
    buyCheckbox.style.marginRight = '3px';
  
    const buyLabel = document.createElement('label');
    buyLabel.textContent = 'Buy';
    buyLabel.style.fontSize = '12px';
  
    const sellCheckbox = document.createElement('input');
    sellCheckbox.type = 'checkbox';
    sellCheckbox.checked = true;
    sellCheckbox.style.marginRight = '3px';
    sellCheckbox.style.marginLeft = '10px';
  
    const sellLabel = document.createElement('label');
    sellLabel.textContent = 'Sell';
    sellLabel.style.fontSize = '12px';
  
    filterContainer.appendChild(buyCheckbox);
    filterContainer.appendChild(buyLabel);
    filterContainer.appendChild(sellCheckbox);
    filterContainer.appendChild(sellLabel);
  
    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '🔄';
    refreshButton.title = 'Refresh Listings';
    refreshButton.style.background = 'none';
    refreshButton.style.border = 'none';
    refreshButton.style.color = '#fff';
    refreshButton.style.fontSize = '14px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.style.padding = '2px 6px';
    refreshButton.style.borderRadius = '4px';
    refreshButton.style.transition = 'background 0.2s';
  
    refreshButton.addEventListener('mouseover', () => {
      refreshButton.style.background = '#333';
    });
    refreshButton.addEventListener('mouseout', () => {
      refreshButton.style.background = 'none';
    });
    refreshButton.addEventListener('click', () => {
      loadRecentListings();
    });
  
    controlsContainer.appendChild(filterContainer);
    controlsContainer.appendChild(refreshButton);
    recentListingsContainer.appendChild(controlsContainer);
  
    const listingsGrid = document.createElement('div');
    listingsGrid.style.display = 'grid';
    listingsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100%, 1fr))';
    listingsGrid.style.gap = '5px';
    listingsGrid.style.padding = '5px';
    listingsGrid.style.overflowY = 'auto';
    recentListingsContainer.appendChild(listingsGrid);
  
    function loadRecentListings() {
      listingsGrid.innerHTML = '<p style="text-align: center; color: #ccc;">Refreshing...</p>';
  
      chrome.runtime.sendMessage({ action: "fetchRecentListings" }, (response) => {
        console.log('Recent listings response:', response);
  
        if (!response || !response.success) {
          listingsGrid.innerHTML = '<p style="text-align: center; color: red;">Failed to load.</p>';
          console.error('Failed to load recent listings:', response);
          return;
        }
  
        if (!response.listings || response.listings.length === 0) {
          listingsGrid.innerHTML = '<p style="text-align: center; color: #aaa;">No recent listings.</p>';
          console.log('No listings found in response');
          return;
        }
  
        listingsGrid.innerHTML = '';
  
        response.listings.forEach(listing => {
          if ((!buyCheckbox.checked && listing.type === 'Buy') || (!sellCheckbox.checked && listing.type === 'Sell')) {
            return;
          }
  
          const listingCard = document.createElement('div');
          listingCard.className = 'listing-card';
          listingCard.style.borderBottom = '1px solid #333';
          listingCard.style.padding = '6px';
          listingCard.style.display = 'flex';
          listingCard.style.alignItems = 'center';
          listingCard.style.justifyContent = 'space-between';
          listingCard.style.width = '100%';
  
          listingCard.innerHTML = `
            <div style="display: flex; align-items: center;">
              <img src="https://lostcity.markets/img/items/${listing.itemSlug}.webp" 
                   alt="${listing.itemSlug}" 
                   style="width: 24px; height: 24px; border-radius: 4px; margin-right: 6px;">
              <div>
                <span style="color: ${listing.type === 'Sell' ? 'lightgreen' : 'tomato'}; font-weight: bold;">
                  ${listing.type} - ${listing.details}
                </span>
                <div style="color: #bbb; font-size: 11px;">
                  ${listing.username} • ${listing.time}
                </div>
              </div>
            </div>
          `;
  
          listingCard.addEventListener('click', () => {
            loadItemListings(listing.itemSlug, (listings) => {
              const resultsContainer = document.getElementById("market-results");
              const searchContainer = document.querySelector("#tab-market-lookup div");
              const backButton = document.querySelector("#tab-market-lookup button");
  
              if (resultsContainer && searchContainer && backButton) {
                searchContainer.style.display = "none";
                backButton.style.display = "block";
                resultsContainer.innerHTML = "";
                displayItemDetails(listing.itemSlug, listings, resultsContainer);
              }
            });
          });
  
          listingsGrid.appendChild(listingCard);
        });
      });
    }
  
    loadRecentListings();
    buyCheckbox.addEventListener('change', loadRecentListings);
    sellCheckbox.addEventListener('change', loadRecentListings);
  
    return recentListingsContainer;
  }
  
  function createMarketLookupContent() {
    const container = document.createElement("div");
    container.id = "tab-market-lookup";
  
    const title = document.createElement("h3");
    title.textContent = "Market Lookup";
    container.appendChild(title);
  
    const searchContainer = document.createElement("div");
    searchContainer.style.marginBottom = "10px";
  
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search for an item...";
    searchInput.style.width = "100%";
    searchInput.style.padding = "5px";
    searchContainer.appendChild(searchInput);
  
    container.appendChild(searchContainer);
  
    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.style.width = "100%";
    backButton.style.padding = "5px";
    backButton.style.backgroundColor = "#dc3545";
    backButton.style.color = "#fff";
    backButton.style.border = "none";
    backButton.style.cursor = "pointer";
    backButton.style.display = "none";
    backButton.addEventListener("click", () => {
      searchContainer.style.display = "block";
      backButton.style.display = "none";
      resultsContainer.innerHTML = "";
    });
    container.appendChild(backButton);
  
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "market-results";
    resultsContainer.style.overflowY = "auto";
    resultsContainer.style.maxHeight = "400px";
    resultsContainer.style.border = "1px solid #ccc";
    resultsContainer.style.padding = "5px";
    container.appendChild(resultsContainer);
  
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const query = searchInput.value.trim();
        if (!query) {
          resultsContainer.innerHTML = "";
          return;
        }
  
        resultsContainer.innerHTML = "Loading...";
        const items = await fetchMarketItems(query);
        resultsContainer.innerHTML = "";
  
        if (items.length === 0) {
          resultsContainer.textContent = "No market data found.";
          return;
        }
  
        items.forEach((item) => {
          const itemContainer = document.createElement("div");
          itemContainer.style.marginBottom = "5px";
          itemContainer.style.padding = "3px";
          itemContainer.style.display = "flex";
          itemContainer.style.alignItems = "center";
          itemContainer.style.borderBottom = "1px solid #ddd";
          itemContainer.style.cursor = "pointer";
          itemContainer.style.fontSize = "12px";
  
          const itemImage = document.createElement("img");
          itemImage.src = `https://lostcity.markets/img/items/${item.slug}.webp`; // Changed to .webp
          itemImage.alt = item.name;
          itemImage.style.width = "24px";
          itemImage.style.height = "24px";
          itemImage.style.marginRight = "5px";
  
          const itemName = document.createElement("span");
          itemName.style.color = "#007bff";
          itemName.style.fontWeight = "bold";
          itemName.textContent = item.name;
  
          itemContainer.appendChild(itemImage);
          itemContainer.appendChild(itemName);
          resultsContainer.appendChild(itemContainer);
  
          itemContainer.addEventListener("click", () => {
            searchContainer.style.display = "none";
            backButton.style.display = "block";
            resultsContainer.innerHTML = "";
            loadItemListings(item.slug, (listings) => {
              displayItemDetails(item.slug, listings, resultsContainer); // Already updated to .webp
            });
          });
        });
      }, 300);
    });
  
    container.appendChild(resultsContainer);
    const recentListings = createRecentListings();
    container.appendChild(recentListings);
  
    return container;
  }
  
  export default function () {
    return {
      name: "Market Lookup",
      icon: "📈",
      createContent: createMarketLookupContent,
      async init() {
        console.log("Market Lookup Plugin Initialized.");
      },
      destroy() {
        console.log("Market Lookup Plugin Destroyed.");
      }
    };
  }