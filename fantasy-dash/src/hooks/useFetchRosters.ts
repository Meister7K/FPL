import useLeagueStore from '../store/testStore';
import fantasyData from '../db/fplDB.json'

const useFetchRosters = () => {
  const setCurrentRoster = useLeagueStore((state) => state.setCurrentRoster);
  const setRosterHistory = useLeagueStore((state) => state.setRosterHistory);
  const leagueData = useLeagueStore((state) => state.leagueData);
  
  const fetchRoster = async (leagueId: string) => {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    if (!response.ok) throw new Error('Failed to fetch roster data');
    return response.json();
  };

  const fetchCurrentRoster = async (leagueId: string) => {
    try {
      const currentRoster = await fetchRoster(leagueId);
      setCurrentRoster(currentRoster);
    } catch (error) {
      console.error('Error fetching current roster:', error);
    }
  };

  const fetchRosterHistory = async () => {
    try {
      const allRosters = await Promise.all(
        leagueData.map(async (league) => {
          const rosters = await fetchRoster(league.league_id);
          return {
            season: league.season, // Include the season from leagueData
            rosters,
          };
        })
      );
      setRosterHistory(allRosters);
    } catch (error) {
      console.error('Error fetching roster history:', error);
    }
  };

  return {
    fetchCurrentRoster,
    fetchRosterHistory,
  };
};

export default useFetchRosters;

