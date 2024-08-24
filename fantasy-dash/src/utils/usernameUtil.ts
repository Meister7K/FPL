
import useLeagueStore from '../store/testStore';

interface LeagueUser {
  user_id: string;
  display_name: string;
  // Add other relevant fields
}

interface Roster {
  roster_id: string;
  owner_id: string;
  // Add other relevant fields
}

export function getRosterOwnerName(rosterId: string): string {
  const leagueUsers = useLeagueStore.getState().leagueUsers;
  const rosters = useLeagueStore.getState().currentRoster;

  // Find the roster
  const roster = rosters.find(r => r.roster_id === rosterId);
  if (!roster) return 'Unknown';

  // Find the user
  const user = leagueUsers.find(u => u.user_id === roster.owner_id);
  return user ? user.display_name : 'Unknown';
}

export function mapDraftPicksToUserNames(draftPicks: any[]): any[] {
  return draftPicks.map(pick => ({
    ...pick,
    picked_by: getRosterOwnerName(pick.picked_by)
  }));
}