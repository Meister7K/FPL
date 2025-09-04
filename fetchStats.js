const fs = require('fs'); // File system module
const fetch = globalThis.fetch || require('node-fetch'); // Use native fetch if available

const API_URL = "https://api.sleeper.com/stats/nfl/player";
const CURRENT_YEAR = new Date().getFullYear(); // Get the current year

// Load players from db.json
const players = JSON.parse(fs.readFileSync("db.json", "utf8"));

async function fetchPlayerStats(playerId, playerName, playerPosition, rookieYear) {
    let playerStats = [];

    for (let year = rookieYear; year <= CURRENT_YEAR; year++) {
        const url = `${API_URL}/${playerId}?season_type=regular&season=${year}&grouping=week`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to fetch stats for player ${playerId} in ${year}`);
                continue; // Skip this year if API call fails
            }
            
            const data = await response.json();
            playerStats.push({ year, stats: data });
        } catch (error) {
            console.error(`Error fetching stats for player ${playerId} in ${year}:`, error);
        }
    }

    return { playerId, playerName, playerPosition, stats: playerStats };
}

async function fetchAllStats() {
    let allStats = [];

    for (const player of players) {
        const rookieYear = parseInt(player.rookie_year) || CURRENT_YEAR; // Default to current year if missing
        console.log(`Fetching stats for ${player.full_name} (${player.player_id}) from ${rookieYear} to ${CURRENT_YEAR}`);

        const playerData = await fetchPlayerStats(player.player_id, player.full_name, player.position, rookieYear);
        allStats.push(playerData);
    }

    // Write stats to stats.json
    fs.writeFileSync("stats.json", JSON.stringify(allStats, null, 2), "utf8");
    console.log("Successfully wrote stats to stats.json");
}

// Run the function
fetchAllStats();
