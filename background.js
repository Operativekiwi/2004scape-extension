async function fetchRecentListings() {
    const urls = [
        'https://lostcity.markets/?type=buy',
        'https://lostcity.markets/?type=sell'
    ];

    try {
        const responses = await Promise.all(urls.map(url => fetch(url).then(res => res.text())));

        let allListings = [];

        responses.forEach((text, index) => {
            const jsonMatch = text.match(/<div id="app" data-page="([^"]+)">/);
            if (!jsonMatch) {
                console.error(`Failed to find JSON data in ${urls[index]}`);
                return;
            }

            const jsonData = JSON.parse(jsonMatch[1].replace(/&quot;/g, '"'));

            if (!jsonData?.props?.listings?.data) {
                console.error(`No listings found in parsed data from ${urls[index]}`);
                return;
            }

            const listings = jsonData.props.listings.data.map((listing) => ({
                itemSlug: listing.item.slug,
                type: listing.type === "buy" ? "Buy" : "Sell",
                details: `${listing.quantity} for ${listing.price} GP ea.`,
                username: listing.username || "Unknown",
                time: new Date(listing.updatedAt),
                notes: listing.notes || "None",
            }));

            allListings = allListings.concat(listings);
        });

        // Sort by most recent time
        allListings.sort((a, b) => b.time - a.time);

        // Convert time back to a string format
        allListings.forEach(listing => {
            listing.time = listing.time.toLocaleString();
        });

        console.log("Fetched recent listings:", allListings);
        return allListings;
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

        return true; //
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

