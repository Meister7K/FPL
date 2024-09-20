// @ts-nocheck
import React, { useMemo, useState } from 'react';
import useLeagueStore from '../../../store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { getPlayerName } from '@/utils/playerUtils';

interface MatchupData {
  points: number;
  roster_id: number;
  matchup_id: number;
  starters: string[];
  starters_points: number[];
}

const CurrentMatchup: React.FC<{ roster_id: number }> = ({ roster_id }) => {
  const leagueMatchups = useLeagueStore((state) => state.leagueMatchups);
  const selectedLeague = useLeagueStore((state) => state.selectedLeague);
  const nflState = useLeagueStore((state) => state.nflState);

  const [selectedWeek, setSelectedWeek] = useState(nflState.week -1);

  const league = selectedLeague.league_id;
  const currentMatches = leagueMatchups[league];

  const matchupData = useMemo(() => {
    if (!currentMatches || !currentMatches[selectedWeek]) return null;

    const currMatch = currentMatches[selectedWeek];
    const userMatchup = currMatch.find((match: MatchupData) => match.roster_id === roster_id);
    if (!userMatchup) return null;

    const opponentMatchup = currMatch.find((match: MatchupData) => match.matchup_id === userMatchup.matchup_id && match.roster_id !== roster_id);
    if (!opponentMatchup) return null;

    return { user: userMatchup, opponent: opponentMatchup };
  }, [currentMatches, selectedWeek, roster_id]);

  const handleWeekChange = (increment: number) => {
    setSelectedWeek((prevWeek) => {
      const newWeek = prevWeek + increment;
      return newWeek >= 0 && newWeek <= 18 ? newWeek : prevWeek; // Assuming a maximum of 18 weeks
    });
  };

  if (!matchupData) {
    return <div>No matchup data found for the given roster_id in week {selectedWeek}.</div>;
  }

  const { user, opponent } = matchupData;

  return (
    <div className="current-matchup ">
      <h2 className='text-center'>Current Matchup</h2>
      
      <div className="week-selector text-center w-full flex justify-center">
        <button className='m-2 border rounded-md p-2' onClick={() => handleWeekChange(-1)} disabled={selectedWeek === 0}>Prev</button>
        <span className=' block'>Week {selectedWeek+1}</span>
        <button className='m-2 border rounded-md p-2' onClick={() => handleWeekChange(1)} disabled={selectedWeek === 18}>Next</button>
      </div>
      <div className="matchup-container flex justify-around">
        <div className="team user-team">
          <h3>{getRosterOwnerName(user.roster_id)}</h3>
          
          
          <ul>
            {user.starters.map((starter, index) => (
              <li key={starter}>
                {getPlayerName(starter)} -  {user.starters_points[index]}
              </li>
            ))}
          </ul>
          <p>Total: {user.points}</p>
        </div>
        <div className="team opponent-team">
          <h3>{getRosterOwnerName(opponent.roster_id)}</h3>
          
          
          <ul>
            {opponent.starters.map((starter, index) => (
              <li key={starter}>
                {getPlayerName(starter)} -  {opponent.starters_points[index]}
              </li>
            ))}
          </ul>
          <p>total: {opponent.points}</p>
        </div>
      </div>
    </div>
  );
};

export default CurrentMatchup;