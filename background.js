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
        const buyUrl = `https://lostcity.markets/items/${request.slug}?type=buy`;
        const sellUrl = `https://lostcity.markets/items/${request.slug}?type=sell`;
        
        console.log("Fetching item listings from:", buyUrl, sellUrl);

        Promise.all([
            fetch(buyUrl).then(response => response.text()),
            fetch(sellUrl).then(response => response.text())
        ])
        .then(([buyHtml, sellHtml]) => {
            let allListings = [];

            // Process buy listings
            const buyJsonMatch = buyHtml.match(/<div id="app" data-page="([^"]+)">/);
            if (buyJsonMatch) {
                const buyJsonData = JSON.parse(buyJsonMatch[1].replace(/&quot;/g, '"'));
                
                if (buyJsonData?.props?.listings?.data) {
                    const buyListings = buyJsonData.props.listings.data.map((listing) => ({
                        type: "Buy",
                        details: `${listing.quantity} for ${listing.price} GP ea.`,
                        username: listing.username || "Unknown",
                        time: new Date(listing.updatedAt).toLocaleString(),
                        notes: listing.notes || "None",
                    }));
                    allListings = allListings.concat(buyListings);
                }
            }

            // Process sell listings
            const sellJsonMatch = sellHtml.match(/<div id="app" data-page="([^"]+)">/);
            if (sellJsonMatch) {
                const sellJsonData = JSON.parse(sellJsonMatch[1].replace(/&quot;/g, '"'));
                
                if (sellJsonData?.props?.listings?.data) {
                    const sellListings = sellJsonData.props.listings.data.map((listing) => ({
                        type: "Sell",
                        details: `${listing.quantity} for ${listing.price} GP ea.`,
                        username: listing.username || "Unknown",
                        time: new Date(listing.updatedAt).toLocaleString(),
                        notes: listing.notes || "None",
                    }));
                    allListings = allListings.concat(sellListings);
                }
            }

            // Sort listings by most recent time
            allListings.sort((a, b) => new Date(b.time) - new Date(a.time));

            console.log("Parsed listings:", allListings);
            sendResponse({ success: true, listings: allListings });
        })
        .catch(error => {
            console.error("Failed to fetch item listings:", error);
            sendResponse({ success: false, listings: [] });
        });

        return true; // Indicates we'll send response asynchronously
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