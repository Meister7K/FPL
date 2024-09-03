import { useState, useEffect } from 'react';
import axios from 'axios';

const usePlayerData = (playerId: string| number, year:string|number) => {
  const [data, setData] = useState({ projections: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct URLs
        const projectionsUrl = `https://api.sleeper.com/projections/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;
        const statsUrl = `https://api.sleeper.com/stats/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;

        // Make API calls
        const [projectionsResponse, statsResponse] = await Promise.all([
          axios.get(projectionsUrl),
          axios.get(statsUrl),
        ]);

        // Update state with fetched data
        setData({
          projections: projectionsResponse.data,
          stats: statsResponse.data,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (playerId && year) {
      fetchPlayerData();
    }
  }, [playerId, year]);

  return { data, loading, error };
};

export default usePlayerData;
