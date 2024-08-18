'use client'
// pages/history.tsx
import { useEffect, useState } from 'react';
import { useFPLStore } from '../../store/fplStore'; // Import your Zustand store
import { fetchLeagueManagers } from '@/utils/fetchManagers';

interface ManagerData {
    owner_id: string;
    username: string;
    roster_id: number;
    fpts: number;
    fpts_against: number;
    wins: number;
    losses: number;
    ppts: number;
    ties: number;
  }
  
  interface YearlyData {
    year: number;
    managers: ManagerData[];
  }
  
  const HistoryPage = () => {
    const [historyData, setHistoryData] = useState<YearlyData[]>([]);
    const leagueId = useFPLStore((state) => state.leagueId);
  
    useEffect(() => {
      const fetchLeagueHistory = async (startYear: number, initialLeagueId: string) => {
        const fetchedHistory: YearlyData[] = [];
        let currentLeagueId: string | null = initialLeagueId;
        let year = startYear;
  
        while (currentLeagueId) {
          try {
            // Fetch manager usernames and roster data
            const managers = await fetchLeagueManagers(currentLeagueId);
  
            // Fetch roster data
            const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/rosters`);
            if (!leagueResponse.ok) throw new Error('Failed to fetch league rosters');
            const rosters = await leagueResponse.json();
  
            // Combine manager data with roster data
            const managerData: ManagerData[] = rosters.map((roster: any) => {
              const manager = managers.find((m) => m.user_id === roster.owner_id);
              return {
                owner_id: roster.owner_id,
                username: manager ? manager.username : 'Unknown',
                roster_id: roster.roster_id,
                fpts: roster.settings.fpts + roster.settings.fpts_decimal / 100,
                fpts_against: roster.settings.fpts_against + roster.settings.fpts_against_decimal / 100,
                wins: roster.settings.wins,
                losses: roster.settings.losses,
                ppts: roster.settings.ppts + roster.settings.ppts_decimal / 100,
                ties: roster.settings.ties,
              };
            });
  
            // Sort managers by wins, and by FPTS if there is a tie in wins
            managerData.sort((a, b) => {
              if (b.wins !== a.wins) {
                return b.wins - a.wins;
              } else {
                return b.fpts - a.fpts;
              }
            });
  
            // Add the year and its managers to the history data
            fetchedHistory.push({ year, managers: managerData });
  
            // Move to the previous league if it exists
            const leagueInfoResponse = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`);
            if (!leagueInfoResponse.ok) throw new Error('Failed to fetch league info');
            const leagueData = await leagueInfoResponse.json();
  
            currentLeagueId = leagueData.previous_league_id || null;
            year -= 1; // Move to the previous year
  
          } catch (error) {
            console.error(`Error fetching data for year ${year}:`, error);
            break; // Stop if there's an error or if previous_league_id is null
          }
        }
  
        return fetchedHistory;
      };
  
      if (leagueId) {
        fetchLeagueHistory(2023, leagueId).then(data => setHistoryData(data));
      }
    }, [leagueId]);
  
    if (!leagueId) {
      return <p>Please set the league ID in the store.</p>;
    }
  
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">League History</h1>
        <div className="mt-4">
          {historyData.length === 0 ? (
            <p>No historical data available.</p>
          ) : (
            historyData.map((yearlyData) => (
              <div key={yearlyData.year} className="mt-4 flex flex-wrap border ">
                <h2 className="text-xl font-semibold w-full text-center">Year: {yearlyData.year}</h2>
                <ol className='list-decimal marker:text-red-700 list-outside flex flex-wrap'>
                    {yearlyData.managers.map((manager, index) => (
                  <li key={index} className="m-10 ">
                    {/* <p>Owner ID: {manager.owner_id}</p> */}
                    <h2 className='text-lg'> {manager.username}</h2>
                    {/* <p>Roster ID: {manager.roster_id}</p> */}
                    <p>Wins: {manager.wins}</p>
                    <p>Losses: {manager.losses}</p>
                    <p>FPTS: {manager.fpts}</p>
                    <p>FPTS Against: {manager.fpts_against}</p>
                    
                    <p>PPTS: {manager.ppts}</p>
                    <p>Ties: {manager.ties}</p>
                  </li>
                ))}
                </ol>
                
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  export default HistoryPage;