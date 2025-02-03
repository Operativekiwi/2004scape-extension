chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchItemListings") {
        const url = `https://lostcity.markets/items/${request.slug}`;
        
        console.log("Fetching item listings from:", url); // Debugging

        fetch(url)
            .then(response => response.text())
            .then(html => {
                console.log("Received response from", url); // Debugging

                // Extract the JSON embedded in <div id="app" data-page="{...}">
                const jsonMatch = html.match(/<div id="app" data-page="([^"]+)">/);
                if (!jsonMatch) {
                    console.error("Failed to find JSON data in page.");
                    sendResponse({ success: false, listings: [] });
                    return;
                }

                const jsonData = JSON.parse(jsonMatch[1].replace(/&quot;/g, '"')); // Convert encoded JSON

                if (!jsonData || !jsonData.props || !jsonData.props.listings || !jsonData.props.listings.data) {
                    console.error("No listings found in parsed data.");
                    sendResponse({ success: false, listings: [] });
                    return;
                }

                const listings = jsonData.props.listings.data.map((listing) => ({
                    type: listing.type === "buy" ? "Buy" : "Sell",
                    details: `${listing.quantity} for ${listing.price} GP ea.`,
                    username: listing.username || "Unknown",
                    time: new Date(listing.updatedAt).toLocaleString(),
                    notes: listing.notes || "None",
                }));

                console.log("Parsed listings:", listings); // Debugging
                sendResponse({ success: true, listings });
            })
            .catch(error => {
                console.error("Failed to fetch item listings:", error);
                sendResponse({ success: false, listings: [] });
            });

        return true; // Keeps sendResponse open
    }
});
