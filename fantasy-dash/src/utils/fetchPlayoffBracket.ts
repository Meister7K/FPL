export const fetchPlayoffBrackets = async (leagueId: string) => {
    try {
        const winnersBracketResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`);
        if (!winnersBracketResponse.ok) throw new Error('Failed to fetch winners bracket');
        const winnersBracket = await winnersBracketResponse.json();

        const losersBracketResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`);
        if (!losersBracketResponse.ok) throw new Error('Failed to fetch losers bracket');
        const losersBracket = await losersBracketResponse.json();

        return {
            winnersBracket,
            losersBracket
        };
    } catch (error) {
        console.error('Error fetching playoff brackets:', error);
        throw error;
    }
};
