// utils/apiUtils.ts
export const fetchUserData = async (username: string) => {
    const response = await fetch(`/api/user?username=${username}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred fetching user data');
    }
    return response.json();
};

export const fetchLeagues = async (userId: string, year: string) => {
    const response = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
    if (!response.ok) {
        throw new Error('An error occurred fetching leagues');
    }
    return response.json();
};

export const fetchLeagueData = async (leagueId: string) => {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
    if (!response.ok) {
        throw new Error('An error occurred fetching league data');
    }
    return response.json();
};

export const fetchRosterData = async (leagueId: string) => {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    if (!response.ok) {
        throw new Error('An error occurred fetching roster data');
    }
    return response.json();
};

export const fetchMatchupData = async (leagueId: string, currentWeek: number) => {
    const matchupData = [];
    for (let week = 1; week <= currentWeek; week++) {
        const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
        if (!response.ok) {
            throw new Error(`An error occurred fetching matchup data for week ${week}`);
        }
        const weekMatchups = await response.json();
        matchupData.push({ week, matchups: weekMatchups });
    }
    return matchupData;
};

export const fetchManagers = async (leagueId: string) => {
    const rosterData = await fetchRosterData(leagueId);
    const managers = await Promise.all(
        rosterData.map(async (roster: any) => {
            const userResponse = await fetch(`https://api.sleeper.app/v1/user/${roster.owner_id}`);
            if (!userResponse.ok) {
                throw new Error(`Failed to fetch user data for ${roster.owner_id}`);
            }
            const userData = await userResponse.json();
            return {
                user_id: roster.owner_id,
                username: userData.display_name,
                roster: {
                    roster_id: roster.roster_id,
                    wins: roster.settings.wins,
                    losses: roster.settings.losses,
                    ties: roster.settings.ties,
                    fpts: roster.settings.fpts,
                    fpts_against: roster.settings.fpts_against,
                    players: roster.players,
                }
            };
        })
    );
    return managers;
};
