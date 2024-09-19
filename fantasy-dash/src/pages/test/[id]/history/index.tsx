// @ts-nocheck
import React from 'react';
import useLeagueStore from '../../../../store/testStore';
import HistoryRecord from '@/components/test/history/HistoryRecord';
import FPTSHistoricLineChart from '@/components/charts/FPTSHistoryChart';


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
     <FPTSHistoricLineChart data={rosterHistory} />
      
    
    </div>
  );
};

export default DraftPage;