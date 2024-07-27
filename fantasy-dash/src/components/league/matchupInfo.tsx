import React from 'react';

interface MatchupInfoProps {
  matchupData: Record<number, any[]> | null | undefined;
}

const MatchupInfo: React.FC<MatchupInfoProps> = ({ matchupData }) => {
  if (!matchupData) {
    return <div>No matchup data available.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Matchups</h2>
      {Object.entries(matchupData).map(([week, matchups]) => (
        <div key={week} className="mb-4">
          <h3 className="text-lg font-semibold">Week {week}</h3>
          {matchups.map((matchup, index) => (
            <div key={index} className="mb-2">
              <p>Matchup {index + 1}: Team {matchup.roster_id} vs Team {matchup.opponent_id}</p>
              <p>Points: {matchup.points}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MatchupInfo;