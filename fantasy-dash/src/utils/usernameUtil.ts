// @ts-nocheck
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

export function getRosterOwnerName(id: string | number): string {
  const leagueUsers = useLeagueStore.getState().leagueUsers;
  const rosters = useLeagueStore.getState().currentRoster;

  // Check if the ID matches a user first
  const userById = leagueUsers.find(u => u.user_id === id);
  if (userById) {
    return userById.display_name;
  }

  // If not found by user_id, assume it's a roster_id and find the roster
  const roster = rosters.find(r => r.roster_id === id);
  if (!roster) return 'Unknown';

  // Find the user by roster's owner_id
  const userByRoster = leagueUsers.find(u => u.user_id === roster.owner_id);
  return userByRoster ? userByRoster.display_name : 'Unknown';
}


export function mapDraftPicksToUserNames(draftPicks: any[]): any[] {
  return draftPicks.map(pick => ({
    ...pick,
    picked_by: getRosterOwnerName(pick.picked_by)
  }));
}