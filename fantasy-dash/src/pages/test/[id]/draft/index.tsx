// @ts-nocheck
import React from 'react';
import useLeagueStore from '../../../../store/testStore';
import DraftBoard from '../../../../components/draft/DraftBoard'; // Adjust the path as necessary

const DraftPage: React.FC = () => {
  const draftPicks = useLeagueStore((state) => state.draftPicks);
  const leagueUsers = useLeagueStore((state) => state.leagueUsers);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Draft Board</h1>
      {draftPicks && leagueUsers && (
        <DraftBoard draftPicks={draftPicks} leagueUsers={leagueUsers} />
      )}
    </div>
  );
};

export default DraftPage;
