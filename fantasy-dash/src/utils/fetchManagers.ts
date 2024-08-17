export const fetchLeagueManagers = async (leagueId: string) => {
    try {
        // Fetch roster data for the league
        const rosterResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
        if (!rosterResponse.ok) {
            throw new Error('Failed to fetch league rosters');
        }
        const rosterData = await rosterResponse.json();

        // Extract user IDs from the roster data
        const userIds = rosterData.map((roster: any) => roster.owner_id);

        // Fetch user details for each user ID
        const userPromises = userIds.map((userId: string) =>
            fetch(`https://api.sleeper.app/v1/user/${userId}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch user data for user ID ${userId}`);
                    }
                    return response.json();
                })
                .then((userData) => ({
                    user_id: userId,
                    username: userData.display_name
                }))
        );

        // Wait for all user details to be fetched
        const users = await Promise.all(userPromises);

        // Combine manager details with usernames
        const managers = rosterData.map((roster: any) => {
            const user = users.find((user) => user.user_id === roster.owner_id);
            return {
                user_id: roster.owner_id,
                username: user ? user.username : 'Unknown'
            };
        });

        return managers;
    } catch (error) {
        console.error('Error fetching league managers:', error);
        throw error;
    }
};

