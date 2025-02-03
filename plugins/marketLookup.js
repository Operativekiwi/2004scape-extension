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

function createRecentListings() {
  const recentListingsContainer = document.createElement('div');
  recentListingsContainer.id = 'recent-listings';
  recentListingsContainer.style.marginTop = '10px';
  recentListingsContainer.style.padding = '10px';
  recentListingsContainer.style.border = '1px solid #444';
  recentListingsContainer.style.borderRadius = '6px';
  recentListingsContainer.style.backgroundColor = '#1a1a1a';
  recentListingsContainer.style.color = '#fff';
  recentListingsContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
  recentListingsContainer.style.width = '100%';
  recentListingsContainer.style.maxHeight = '350px';
  recentListingsContainer.style.overflowY = 'auto';

  // Title bar (with refresh button)
  const titleBar = document.createElement('div');
  titleBar.style.display = 'flex';
  titleBar.style.justifyContent = 'space-between';
  titleBar.style.alignItems = 'center';
  titleBar.style.marginBottom = '8px';

  const recentTitle = document.createElement('h4');
  recentTitle.textContent = 'Recent Listings';
  recentTitle.style.fontSize = '14px';
  recentTitle.style.fontWeight = 'bold';
  recentTitle.style.margin = '0';

  // Refresh button
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

  titleBar.appendChild(recentTitle);
  titleBar.appendChild(refreshButton);
  recentListingsContainer.appendChild(titleBar);

  const listingsGrid = document.createElement('div');
  listingsGrid.style.display = 'grid';
  listingsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100%, 1fr))';
  listingsGrid.style.gap = '5px';
  listingsGrid.style.padding = '5px';
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

          listingsGrid.innerHTML = ''; // Clear loading message

          response.listings.forEach(listing => {
              console.log('Processing listing:', listing);
              const listingCard = document.createElement('div');
              listingCard.className = 'listing-card';
              listingCard.style.border = '1px solid #333';
              listingCard.style.padding = '6px';
              listingCard.style.borderRadius = '4px';
              listingCard.style.backgroundColor = '#222';
              listingCard.style.color = '#ddd';
              listingCard.style.cursor = 'pointer';
              listingCard.style.transition = 'all 0.2s ease-in-out';
              listingCard.style.display = 'flex';
              listingCard.style.alignItems = 'center';
              listingCard.style.justifyContent = 'space-between';
              listingCard.style.width = '100%';

              listingCard.addEventListener('mouseover', () => {
                  listingCard.style.backgroundColor = '#333';
                  listingCard.style.transform = 'scale(1.02)';
              });
              listingCard.addEventListener('mouseout', () => {
                  listingCard.style.backgroundColor = '#222';
                  listingCard.style.transform = 'scale(1)';
              });

              listingCard.innerHTML = `
                  <div style="display: flex; align-items: center;">
                      <img src="https://lostcity.markets/img/items/${listing.itemSlug}.png" 
                          alt="${listing.itemSlug}" 
                          style="width: 28px; height: 28px; border-radius: 4px; margin-right: 6px;">
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
                  window.open(`https://lostcity.markets/items/${listing.itemSlug}`, '_blank');
              });

              listingsGrid.appendChild(listingCard);
          });
      });
  }

  // Load listings when the function is called
  loadRecentListings();

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

  // === ADD DEBOUNCED SEARCH FUNCTIONALITY ===
  let debounceTimer;
  searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer); // Reset timer
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
              itemContainer.style.fontSize = "12px"; // Smaller font size for results

              const itemImage = document.createElement("img");
              itemImage.src = `https://lostcity.markets/img/items/${item.slug}.png`;
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
            
                resultsContainer.innerHTML = `Loading details for ${item.name}...`;
            
                loadItemListings(item.slug, (listings) => {
                    // Create a clickable container for the image & name
                    resultsContainer.innerHTML = `
                        <div style="text-align: center;">
                            <a href="https://lostcity.markets/items/${item.slug}" target="_blank" style="text-decoration: none; color: inherit;">
                                <img src="https://lostcity.markets/img/items/${item.slug}.png" 
                                     alt="${item.name}" 
                                     style="width: 64px; height: 64px; cursor: pointer;">
                                <h2 style="color: #007bff; cursor: pointer;">${item.name}</h2>
                            </a>
                        </div>
                    `;
            
                    if (listings.length === 0) {
                        resultsContainer.innerHTML += "<p>No listings found.</p>";
                        return;
                    }
            
                    const listingsTable = document.createElement("table");
                    listingsTable.style.width = "100%";
                    listingsTable.style.borderCollapse = "collapse";
                    listingsTable.style.marginTop = "10px";
                    listingsTable.style.fontSize = "12px";  // Reduced font size
                    listingsTable.style.lineHeight = "1.2"; // Reduce space between rows
            
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
            
                    let tableBody = "<tbody>";
                    listings.forEach((listing) => {
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
                    resultsContainer.appendChild(listingsTable);
                });
            });
        });
      }, 300); // Adjust delay (300ms) for better responsiveness
  });

  container.appendChild(resultsContainer);
    
  // Add recent listings below the search results
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
