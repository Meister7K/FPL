import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useLeagueStore from '@/store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import ManagerDash from '@/components/test/managers/ManagerDash';
import { getPlayerName, getPlayerPosition, getPlayerTeam } from '@/utils/playerUtils';

const ManagerPage = () => {
  const router = useRouter();
  const { manager_id } = router.query;
  const [managerData, setManagerData] = useState(null);
  
  const rosters = useLeagueStore((state) => state.currentRoster);
  const users = useLeagueStore((state) => state.leagueUsers);

  useEffect(() => {
    if (rosters && manager_id && users) {
      const roster = rosters.find(r => r.owner_id === manager_id);
      const user = users.find(u => u.user_id === manager_id);
      if (roster && user) {
        setManagerData({
          username: getRosterOwnerName(roster.roster_id),
          user_id:manager_id,
          roster_id:roster.roster_id,
          teamName: user.metadata?.team_name || `Team ${roster.roster_id}`,
          wins: roster.settings.wins,
          losses: roster.settings.losses,
          pointsFor: roster.settings.fpts + roster.settings.fpts_decimal / 100,
          pointsAgainst: roster.settings.fpts_against + roster.settings.fpts_against_decimal / 100,
          avatar: user.metadata.avatar,
          players: roster.players.map(playerId => ({
            player_id: playerId,
            full_name: getPlayerName(playerId),
            position: getPlayerPosition(playerId),
            team: getPlayerTeam(playerId)
          })),
          starters: roster.starters
        });
      }
    } 
  }, [rosters, manager_id, users]);

  if (!managerData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <ManagerDash {...managerData} />
    </div>
  );
};

export default ManagerPage;