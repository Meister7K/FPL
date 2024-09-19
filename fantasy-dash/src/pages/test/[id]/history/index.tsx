import React from 'react';
import useLeagueStore from '../../../../store/testStore';
import HistoryRecord from '@/components/test/history/HistoryRecord';


const DraftPage: React.FC = () => {
//   const { loading, error } = useFetchDraftPicks();
  
  // const leagueUsers = useLeagueStore((state) => state.leagueUsers) || [];
  const rosterHistory = useLeagueStore((state) => state.rosterHistory) || [];
  const leagueBrackets = useLeagueStore(state => state.leagueBrackets);

  console.log(leagueBrackets)

  const pairedData = (rosterHistory,leagueBrackets)=>{
    
  }

  return (
    <div>
     <HistoryRecord data={rosterHistory} brackets={leagueBrackets}/>
      
    
    </div>
  );
};

export default DraftPage;