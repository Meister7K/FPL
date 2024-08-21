export interface User {
    user_id: string;
    display_name: string;
    avatar:string;
    metadata: {
      team_name: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  export interface League {
    league_id: string;
    name: string;
    standings: {
      user_id: string;
      display_name: string;
      wins: number;
      losses: number;
      points_for: number;
    }[];
    matchupData: Record<number, MatchupData[]>;
    [key: string]: any;
  }

  export interface MatchupData {
    roster_id: number;
    points: number;
    matchup_id: number;
    opponent_id: number;
    // Add any other relevant fields
  }

  export interface RosterData{
    settings: any;
    roster_id: number;
  owner_id: string;
  fpts: number;
  fpts_against: number;
  }