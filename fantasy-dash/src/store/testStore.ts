// store/testStore.ts
import create from 'zustand';

interface LeagueData {
  season: string| number;
  // Define the structure based on the data returned by the API
  league_id: string;
  previous_league_id: string | null;
  name: string;
  // roster_positions: ;
  bracket_id: number | null;
  loser_bracket_id: number | null;
  total_rosters: number;
  draft_id: string;
}

interface DraftInfo {
  draft_id: string;
  draft_order: { [key: string]: number };
  season: string;
  start_time: number;
  status: string;
}

interface League {
  league_id: string;
  name: string;
  // add other relevant league fields here
}

interface Roster {
  roster_id: string;
  owner_id: string;
  players: string[];
  season: string;
  // Add other relevant roster fields here
}


interface LeagueStoreState {
  userId: string | null;
  leagues: League[];
  selectedLeague: League | null;
  leagueData: LeagueData[];
  currentRoster: Roster[];
  rosterHistory: Roster[][];
  leagueUsers: { [leagueId: string]: LeagueUser[] };
leagueMatchups: { [leagueId: string]: Matchup[][] };
leagueBrackets: { [leagueId: string]: { winners: Bracket, losers: Bracket } };
draftPicks: DraftPick[];
draftInfo: DraftInfo | null;
leagueTransactions: { [leagueId: string]: { [season: string]: any[] } };
  setUserId: (userId: string) => void;
  setLeagues: (leagues: League[]) => void;
  selectLeague: (league: League) => void;
  setLeagueData: (leagueData: LeagueData[]) => void;
  setCurrentRoster: (roster: Roster[]) => void;
  setRosterHistory: (rosters: Roster[][]) => void;
  clearStore: () => void;
  setLeagueUsers: (users: { [leagueId: string]: LeagueUser[] }) => void;
setLeagueMatchups: (matchups: { [leagueId: string]: Matchup[][] }) => void;
setLeagueBrackets: (brackets: { [leagueId: string]: { winners: Bracket, losers: Bracket } }) => void;
setDraftPicks: (picks: DraftPick[]) => void;
setDraftInfo: (draftInfo: DraftInfo) => void;
setLeagueTransactions: (transactions: { [leagueId: string]: { [season: string]: any[] } }) => void;
}


const useLeagueStore = create<LeagueStoreState>((set) => ({
  userId: null,
  leagues: [],
  selectedLeague: null,
  leagueData: [],
  currentRoster: [],
  rosterHistory: [],
  leagueUsers: {},
  leagueMatchups: {},
  leagueBrackets: {},
  draftPicks: [],
  draftInfo: null,
  leagueTransactions: {},
  setUserId: (userId: string) => {
    console.log('Setting userId:', userId);
    set({ userId });
  },

  setLeagues: (leagues: League[]) => {
    console.log('Setting leagues:', leagues);
    set({ leagues });
  },

  selectLeague: (league: League) => {
    console.log('Selecting league:', league);
    set({ selectedLeague: league });
  },

  setLeagueData: (leagueData: LeagueData[]) => {
    console.log('Setting leagueData:', leagueData);
    set({ leagueData });
  },

  setCurrentRoster: (roster: Roster[]) => {
    console.log('Setting currentRoster:', roster);
    set({ currentRoster: roster });
  },

  setRosterHistory: (rosters: Roster[][]) => {
    console.log('Setting rosterHistory:', rosters);
    set({ rosterHistory: rosters });
  },

  setLeagueUsers: (users) => {
    console.log('Setting leagueUsers:', users);
    set({ leagueUsers: users });
  },

  setLeagueMatchups: (matchups) => {
    console.log('Setting leagueMatchups:', matchups);
    set({ leagueMatchups: matchups });
  },

  setLeagueBrackets: (brackets) => {
    console.log('Setting leagueBrackets:', brackets);
    set({ leagueBrackets: brackets });
  },
  setDraftPicks: (picks) =>{
    console.log('Setting draftPicks:', picks);
    set({ draftPicks: picks })
  } ,
  setDraftInfo: (draftInfo: DraftInfo) => {
    console.log('Setting draftInfo:', draftInfo);
    set({ draftInfo });
  },
  setLeagueTransactions: (transactions) => {
    console.log('Setting leagueTransactions:', transactions);
    set((state) => ({
      leagueTransactions: { ...state.leagueTransactions, ...transactions },
    }));
  },
  clearStore: () => {
    console.log('Clearing store');
    set({
      userId: null,
      leagues: [],
      selectedLeague: null,
      leagueData: [],
      currentRoster: [],
      rosterHistory: [],
      leagueUsers: {},
      leagueMatchups: {},
      leagueBrackets: {},
      draftPicks: [],
      draftInfo: null,
      leagueTransactions:{},
    });
  },
}));

export default useLeagueStore;