export const fetchLeagueManagers = async (leagueId: string) => {
    try {
     
        const rosterResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
        if (!rosterResponse.ok) {
            throw new Error('Failed to fetch league rosters');
        }
        const rosterData = await rosterResponse.json();

 
        const userIds = rosterData.map((roster: any) => roster.owner_id);

    
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

 
        const users = await Promise.all(userPromises);

  
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

