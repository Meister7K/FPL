import React from 'react';
import fplDB from '../../db/fplDB.json';

interface MatchupInfoProps {
  matchupData: Record<number, any[]> | null | undefined;
}

const MatchupInfo: React.FC<MatchupInfoProps> = ({ matchupData }) => {
  if (!matchupData) {
    return <div>No matchup data available.</div>;
  }

  const getDisplayName = (ownerId: string) => {
    const user = fplDB.find(user => user.roster_id === ownerId);
    return user ? user.display_name : `Team ${ownerId}`;
  };

  const groupedMatchups: Record<number, any[]> = {};




  return (
    <div className='mx-auto px-2'>
      <h2 className="text-xl font-bold mb-4 text-center">Matchups</h2>
      {Object.entries(matchupData).map(([week, matchups]) => (
        <div key={week} className="mb-4">
          <h3 className="text-lg font-semibold text-center underline underline-offset-4 pb-2">Week {week}</h3>
          {Object.values(
            matchups.reduce((acc, matchup) => {
              if (!acc[matchup.matchup_id]) {
                acc[matchup.matchup_id] = [];
              }
              acc[matchup.matchup_id].push(matchup);
              return acc;
            }, {} as Record<number, any[]>)
          ).map((matchupPair, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-center mb-2 ">
                <div className="w-1/2">
                  <h4 className={matchupPair[0].points > matchupPair[1].points ? 'text-green-700 font-bold':'font-bold text-red-700' }>{getDisplayName(matchupPair[0].roster_id)}</h4>
                  <p> {matchupPair[0].points}</p>
                  
                </div>
                <div className="text-center w-1/4">
                  <h4 className="font-bold">VS</h4>
                </div>
                <div className="w-1/2 text-right">
                  <h4 className={matchupPair[1].points > matchupPair[0].points ? 'text-green-700 font-bold':'font-bold text-red-700' }>{getDisplayName(matchupPair[1].roster_id)}</h4>
                  <p>{matchupPair[1].points}</p>
                  
                </div>
              </div>
              <div className='w-full h-[.5px] bg-white'></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MatchupInfo;