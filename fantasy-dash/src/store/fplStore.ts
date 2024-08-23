import create from 'zustand';
import { User, League, RosterData } from '../types';

interface HistoricalData {
  year: number;
  managers: ManagerData[];
}

interface ManagerData {
  owner_id: string;
  username: string;
  wins: number;
  losses: number;
  fpts: number;
  fpts_against: number;
}

interface WinnerLoserData {
  year: number;
  winners: number[];
  losers: number[];
}

interface TotalData {
  username: string;
  totalWins: number;
  totalLosses: number;
  totalFpts: number;
  totalFptsAgainst: number;
  yearsPlayed: number;
  averageFptsPerYear: number;
  avgWinPerYear: number;
  avgLossPerYear: number;
  winPercentage: number;
}

interface Roster {
  roster_id: string;
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_against: number;
  players: string[]; // Array of player IDs or names
}

interface Manager {
  user_id: string;
  username: string;
  roster: Roster;
  roster_id: number;
}

interface FPLState {
  historicalData: HistoricalData[];
  totalData: TotalData[];
  userData: User | null;
  leagueData: League | null;
  matchupData: Record<number, any[]> | null;
  rosterData: RosterData[] | null;
  leagueId: string | null;
  managers: Manager[];
  winnerLoserData: WinnerLoserData[];

  setUserData: (userData: User) => void;
  setLeagueData: (year: string, leagueData: League) => void;
  setMatchupData: (matchupData: Record<number, any[]>) => void;
  setRosterData: (rosterData: RosterData[]) => void;
  setLeagueId: (id: string) => void;
  setManagers: (managers: Manager[]) => void;
  getManagerById: (user_id: string) => Manager | undefined;
  setHistoricalData: (data: HistoricalData[]) => void;
  setTotalData: (data: TotalData[]) => void;
  setWinnerLoserData: (data: WinnerLoserData[]) => void;
}

export const useFPLStore = create<FPLState>((set) => ({
  historicalData: [],
  totalData: [],
  userData: null,
  leagueData: null,
  matchupData: null,
  rosterData: null,
  leagueId: null,
  managers: [],
  winnerLoserData: [],

  setUserData: (data) => {
    console.log("Setting userData in store:", data);
    set({ userData: data });
  },

  setLeagueData: (year, data) => {
    console.log("Setting leagueData in store:", { ...data, year });
    set((state) => ({ leagueData: { ...data, year } }));
  },

  setMatchupData: (data) => {
    console.log("Setting matchupData in store:", data);
    set({ matchupData: data });
  },

  setRosterData: (data) => {
    console.log("Setting rosterData in store:", data);
    set({ rosterData: data });
  },

  setLeagueId: (id: string) => {
    console.log("Setting leagueId in store:", id);
    set({ leagueId: id });
  },

  setManagers: (managers) => {
    console.log("Setting managers in store:", managers);
    set({ managers });
  },

  getManagerById: (user_id) => {
    const state = useFPLStore.getState();
    const manager = state.managers.find((manager) => manager.user_id === user_id);
    console.log(`Fetching manager by ID (${user_id}):`, manager);
    return manager;
  },

  setHistoricalData: (data) => {
    console.log("Setting historicalData in store:", data);
    set({ historicalData: data });
  },

  setTotalData: (data) => {
    console.log("Setting totalData in store:", data);
    set({ totalData: data });
  },

  setWinnerLoserData: (data) => {
    console.log("Setting winnerLoserData in store:", data);
    set({ winnerLoserData: data });
  },
}));
