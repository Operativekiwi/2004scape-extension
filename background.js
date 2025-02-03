async function fetchRecentListings(url = 'https://lostcity.markets/') {
    try {
        const response = await fetch(url);
        const text = await response.text();

        // Extract the JSON data from the <div id="app" data-page="{...}">
        const jsonMatch = text.match(/<div id="app" data-page="([^"]+)">/);
        if (!jsonMatch) {
            console.error("Failed to find JSON data in page.");
            return [];
        }

        // Parse JSON safely
        const jsonData = JSON.parse(jsonMatch[1].replace(/&quot;/g, '"'));

        if (!jsonData || !jsonData.props || !jsonData.props.listings || !jsonData.props.listings.data) {
            console.error("No listings found in parsed data.");
            return [];
        }

        // Extract and format listings
        const listings = jsonData.props.listings.data.map((listing) => ({
            itemSlug: listing.item.slug,
            type: listing.type === "buy" ? "Buy" : "Sell",
            details: `${listing.quantity} for ${listing.price} GP ea.`,
            username: listing.username || "Unknown",
            time: new Date(listing.updatedAt).toLocaleString(),
            notes: listing.notes || "None",
        }));

        console.log("Fetched recent listings:", listings); // Debugging
        return listings;
    } catch (error) {
        console.error("Error fetching recent listings:", error);
        return [];
    }
}


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
    } else if (request.action === "fetchRecentListings") {
        fetchRecentListings()
            .then(listings => {
                sendResponse({ success: true, listings });
            })
            .catch(error => {
                console.error('Error:', error);
                sendResponse({ success: false, listings: [] });
            });
        return true;
    }
});

