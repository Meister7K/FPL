// utils/fetchMatchups.ts

export const fetchWeekMatchups = async (leagueId: string, week: number): Promise<{ points: number; roster_id: number; matchup_id: number }[]> => {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch matchup data for Week ${week}`);
    }
  
    const data = await response.json();
  
    // console.log(`Week ${week} data:`, data); // Debugging: Check what data is being returned
  
    return data.map((matchup: any) => ({
      points: matchup.points,
      roster_id: matchup.roster_id,
      matchup_id: matchup.matchup_id,
    }));
  };
  
  export const fetchMatchupData = async (leagueId: string): Promise<{ [week: string]: { points: number; roster_id: number; matchup_id: number }[] }> => {
    const matchupData: { [week: string]: { points: number; roster_id: number; matchup_id: number }[] } = {};
  
    for (let week = 1; week <= 17; week++) {
      try {
        const weekData = await fetchWeekMatchups(leagueId, week);
        // console.log(`Matchup data for Week ${week}:`, weekData); // Debugging: Check if data is being added correctly
        matchupData[week] = weekData;
      } catch (error) {
        console.error(`Failed to fetch matchup data for Week ${week}:`, error);
      }
    }
  
    // console.log("Full matchup data:", matchupData); // Debugging: Final structure of matchupData
    return matchupData;
  };
  