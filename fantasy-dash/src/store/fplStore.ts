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
  // Add other relevant fields as needed
}

interface Manager {
  user_id: string;
  username: string;
  roster: Roster;
  roster_id: number;
  // Add other relevant fields
}

interface FPLState {
  historicalData: HistoricalData[];
  totalData: TotalData[];
  userData: User | null;
  leagueData: League | null;
  matchupData: Record<number, any[]> | null;
  rosterData: RosterData[] | null;
  setUserData: (userData: User) => void;
  setLeagueData: (year: string, leagueData: League) => void;
  setMatchupData: (matchupData: Record<number, any[]>) => void;
  setRosterData: (rosterData: RosterData[]) => void;
  leagueId: string | null;
  setLeagueId: (id: string) => void;
  managers: Manager[];
  setManagers: (managers: Manager[]) => void;
  getManagerById: (user_id: string) => Manager | undefined;
  setHistoricalData: (data: HistoricalData[]) => void;
  setTotalData: (data: TotalData[]) => void;
  winnerLoserData: WinnerLoserData[];
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
  setLeagueId: (id: string) => set({ leagueId: id }),
  setUserData: (data) => set({ userData: data }),
  setLeagueData: (year, data) => set((state) => {
    console.log("Setting leagueData in store:", { ...data, year });
    return { leagueData: { ...data, year } };
  }),
  setMatchupData: (data) => set((state) => {
    console.log("Setting matchupData in store:", data);
    return { matchupData: data };
  }),
  setRosterData: (data) => set((state) => {
    console.log("Setting rosterData in store:", data);
    return { rosterData: data };
  }),
  
  setManagers: (managers) => set({ managers }),
  getManagerById: (user_id) => {
      const state = useFPLStore.getState();
      return state.managers.find((manager: { user_id: string; }) => manager.user_id === user_id);
  },
  setHistoricalData: (data) => set({ historicalData: data }),
  setTotalData: (data) => set({ totalData: data }),
  winnerLoserData: [],
  setWinnerLoserData: (data) => set({ winnerLoserData: data }),
}));