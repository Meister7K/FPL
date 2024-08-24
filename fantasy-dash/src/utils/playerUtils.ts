import playerDB from '../db/playerDB.json'


interface PlayerData {
    depth_chart_order: number | null;
    fantasy_data_id: number;
    weight: string;
    team: string | null;
    // ... add other fields as needed
    full_name: string;
    position: string;
    team_abbr: string | null;
  }
  
  export function getPlayerData(playerId: string): PlayerData | undefined {
    return playerDB[playerId as keyof typeof playerDB];
  }
  
  export function getPlayerName(playerId: string): string {
    const player = getPlayerData(playerId);
    return player ? player.full_name : 'Unknown Player';
  }
  
  export function getPlayerPosition(playerId: string): string {
    const player = getPlayerData(playerId);
    return player ? player.position : 'N/A';
  }
  
  export function getPlayerTeam(playerId: string): string {
    const player = getPlayerData(playerId);
    return player ? player.team_abbr || 'FA' : 'N/A';
  }