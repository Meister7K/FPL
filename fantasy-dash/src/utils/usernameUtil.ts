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

export function getRosterOwnerName(id: string | number, fallbackId?: string | number): string {
  const leagueUsers = useLeagueStore.getState().leagueUsers;
  const rosters = useLeagueStore.getState().currentRoster;

  if (!leagueUsers || !Array.isArray(leagueUsers)) {
    return `Owner ${id}`;  // Return a default value if leagueUsers is not available
  }

  // Function to find user by ID
  const findUserById = (searchId: string | number) => {
    // Check if the ID matches a user first
    const userById = leagueUsers.find(u => u.user_id === searchId);
    if (userById) {
      return userById.display_name;
    }

    // If not found by user_id, assume it's a roster_id and find the roster
    const roster = rosters.find(r => r.roster_id === searchId);
    if (!roster) return null;

    // Find the user by roster's owner_id
    const userByRoster = leagueUsers.find(u => u.user_id === roster.owner_id);
    return userByRoster ? userByRoster.display_name : null;
  }

  // Try with primary ID
  const primaryResult = findUserById(id);
  if (primaryResult) return primaryResult;

  // If primary ID returns null and fallbackId is provided, try with fallbackId
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