const fs = require('fs'); // File system module
const fetch = globalThis.fetch || require('node-fetch'); // Use native fetch if available

const API_URL = "https://api.sleeper.app/v1/players/nfl";
const VALID_POSITIONS = new Set(["QB", "RB", "WR", "FB", "TE"]);

async function fetchAndFilterPlayers() {
    try {
        const response = await fetch(API_URL);
        const players = await response.json();

        // Filter and extract only the necessary fields
        const filteredPlayers = Object.values(players)
            .filter(player =>
                VALID_POSITIONS.has(player.position) &&
                player.depth_chart_order >= 1 &&
                player.depth_chart_order <= 4
            )
            .map(player => ({
                player_id: player.player_id,
                full_name: player.full_name,
                team: player.team || "FA", // Default to 'FA' (Free Agent) if no team
                position: player.position,
                years_exp: player.years_exp ?? 0, // Default to 0 if undefined
                rookie_year: player.metadata?.rookie_year ?? "Unknown" // Extract from metadata, default if missing
            }));

        // Write filtered data to db.json
        fs.writeFileSync("db.json", JSON.stringify(filteredPlayers, null, 2), "utf8");
        console.log(`Successfully wrote ${filteredPlayers.length} players to db.json`);
    } catch (error) {
        console.error("Error fetching or writing data:", error);
    }
}

fetchAndFilterPlayers();
