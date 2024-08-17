import create from 'zustand';
import { User, League, MatchupData,RosterData } from '../types';

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
  // Add other relevant fields
}

interface FPLState {
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
}

export const useFPLStore = create<FPLState>((set) => ({
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
      return state.managers.find((manager) => manager.user_id === user_id);
  }
}));