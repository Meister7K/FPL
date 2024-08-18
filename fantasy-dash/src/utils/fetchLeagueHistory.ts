// utils/fetchHistoricalRosters.ts
import { useFPLStore } from '../store/fplStore';

const fetchHistoricalRosters = async (startYear: number) => {
  const rostersData: Record<number, any> = {};
  let leagueId = useFPLStore.getState().leagueId; // Get leagueId from the store
  let currentYear = new Date().getFullYear();
  
  if (!leagueId) {
    console.warn("League ID is not set in the store.");
    return rostersData;
  }

  while (leagueId && currentYear >= startYear) {
    try {
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
      if (!leagueResponse.ok) {
        console.warn(`Failed to fetch league data for year ${currentYear}`);
        break;
      }
      const leagueData = await leagueResponse.json();
      const previousLeagueId = leagueData.previous_league_id;

      if (previousLeagueId) {
        const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${previousLeagueId}/rosters`);
        if (!rostersResponse.ok) {
          console.warn(`No roster data available for year ${currentYear}`);
        } else {
          const rosters = await rostersResponse.json();
          if (Object.keys(rosters).length > 0) {
            rostersData[currentYear] = rosters;
          } else {
            console.warn(`Roster data is empty for year ${currentYear}`);
          }
        }
        leagueId = previousLeagueId;
        currentYear--;
      } else {
        console.warn(`No previous league ID found for year ${currentYear}`);
        break;
      }
    } catch (error) {
      console.error(`Error fetching data for year ${currentYear}:`, error);
      break;
    }
  }

  return rostersData;
};

export default fetchHistoricalRosters;



