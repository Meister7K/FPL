// @ts-nocheck
import useLeagueStore from '../store/testStore';

interface LeagueUser {
  user_id: string;
  display_name: string;
 
}

interface Roster {
  roster_id: string;
  owner_id: string;

}

export function getRosterOwnerName(id: string | number, fallbackId?: string | number): string {
  const leagueUsers = useLeagueStore.getState().leagueUsers;
  const rosters = useLeagueStore.getState().currentRoster;

  if (!leagueUsers || !Array.isArray(leagueUsers)) {
    return `Owner ${id}`;  
  }


  const findUserById = (searchId: string | number) => {
 
    const userById = leagueUsers.find(u => u.user_id === searchId);
    if (userById) {
      return userById.display_name;
    }

 
    const roster = rosters.find(r => r.roster_id === searchId);
    if (!roster) return null;

   
    const userByRoster = leagueUsers.find(u => u.user_id === roster.owner_id);
    return userByRoster ? userByRoster.display_name : null;
  }

  
  const primaryResult = findUserById(id);
  if (primaryResult) return primaryResult;

 
  if (fallbackId !== undefined) {
    const fallbackResult = findUserById(fallbackId);
    if (fallbackResult) return fallbackResult;
  }

  return id;
}

export function mapDraftPicksToUserNames(draftPicks: any[]): any[] {
  return draftPicks.map(pick => ({
    ...pick,
    picked_by: getRosterOwnerName(pick.picked_by, pick.original_owner)
  }));
}