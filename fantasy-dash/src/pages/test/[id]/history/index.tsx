import React from 'react';
import useLeagueStore from '../../../../store/testStore';
import DraftBoard from '../../../../components/draft/DraftBoard';
import useFetchDraftPicks from '@/hooks/useFetchDraftPicks';

const DraftPage: React.FC = () => {
//   const { loading, error } = useFetchDraftPicks();
  const draftPicks = useLeagueStore((state) => state.draftPicks) || [];
  const leagueUsers = useLeagueStore((state) => state.leagueUsers) || [];

  return (
    <div>
     
      
    
    </div>
  );
};

export default DraftPage;