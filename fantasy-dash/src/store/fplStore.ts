import create from 'zustand';
import { User, League, MatchupData } from '../types';

interface FPLState {
  userData: User | null;
  leagueData: League | null;
  matchupData: Record<number, any[]> | null;
  setUserData: (userData: User) => void;
  setLeagueData: (year: string, leagueData: League) => void;
  setMatchupData: (matchupData: Record<number, any[]>) => void;
}

export const useFPLStore = create<FPLState>((set) => ({
  userData: null,
  leagueData: null,
  matchupData: null,
  setUserData: (userData) => set({ userData }),
  setLeagueData: (year, leagueData) => set({ leagueData }),
  setMatchupData: (matchupData) => set({ matchupData }),
}));