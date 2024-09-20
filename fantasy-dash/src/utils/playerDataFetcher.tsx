import axios from 'axios';

interface PlayerData {
  projections: any;
  stats: any;
}

export const fetchPlayerData = async (playerId: string | number, year: string | number): Promise<PlayerData> => {
  try {
    // Construct URLs
    const projectionsUrl = `https://api.sleeper.com/projections/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;
    const statsUrl = `https://api.sleeper.com/stats/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;

    // Make API calls
    const [projectionsResponse, statsResponse] = await Promise.all([
      axios.get(projectionsUrl),
      axios.get(statsUrl),
    ]);

    // Return fetched data
    return {
      projections: projectionsResponse.data,
      stats: statsResponse.data,
    };
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
};