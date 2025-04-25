// store/useScoreStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Team {
  id: number;
  name: string;
  code: string;
  image_path: string;
}

interface Batting {
  id: number;
  player_id: number;
  player_name?: string;
  score: number;
  ball?: number;
  four_x: number;
  six_x: number;
  rate: number;
  team_id: number;
  active: boolean;
}

interface Bowling {
  id: number;
  player_id: number;
  player_name?: string;
  overs: number;
  runs: number;
  wickets: number;
  wide: number;
  noball: number;
  rate: number;
  team_id: number;
  active: boolean;
}

interface Runs {
  team_id: number;
  inning: number;
  score: number;
  wickets: number;
  overs: number;
}

interface Player {
  id: number;
  name: string;
  image_path?: string;
}

interface FixtureData {
  id: number;
  localteam: Team;
  visitorteam: Team;
  venue: { name: string };
  starting_at: string;
  formatted_starting_at: string;
  status: string;
  note?: string;
  batting: Batting[];
  bowling: Bowling[];
  runs: Runs[];
  winner_team_id?: number;
  lineup?: {
    id: number;
    fullname: string;
    image_path: string;
    team_id: number;
  }[];
}

interface ScoreState {
  matches: Record<string, FixtureData>; // Store multiple matches by ID
  players: Record<number, Player>;
  currentMatchId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setMatch: (matchId: string, matchData: FixtureData) => void;
  updateMatch: (matchId: string, partialMatchData: Partial<FixtureData>) => void;
  setPlayers: (playersData: Record<number, Player>) => void;
  setCurrentMatchId: (matchId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMatches: () => void;
}

const useScoreStore = create<ScoreState>()(
  devtools(
    persist(
      (set) => ({
        matches: {},
        players: {},
        currentMatchId: null,
        loading: false,
        error: null,
        
        setMatch: (matchId, matchData) => 
          set((state) => ({ 
            matches: { 
              ...state.matches, 
              [matchId]: matchData 
            } 
          })),
          
        updateMatch: (matchId, partialMatchData) => 
          set((state) => ({
            matches: {
              ...state.matches,
              [matchId]: state.matches[matchId] 
                ? { ...state.matches[matchId], ...partialMatchData }
                : partialMatchData as FixtureData
            }
          })),
          
        setPlayers: (playersData) => 
          set(() => ({ players: playersData })),
          
        setCurrentMatchId: (matchId) => 
          set(() => ({ currentMatchId: matchId })),
          
        setLoading: (isLoading) => 
          set(() => ({ loading: isLoading })),
          
        setError: (error) => 
          set(() => ({ error })),
          
        clearMatches: () => 
          set(() => ({ matches: {} })),
      }),
      {
        name: 'cricket-score-storage',
        partialize: (state) => ({
          matches: state.matches,
          players: state.players,
          currentMatchId: state.currentMatchId,
        }),
      }
    )
  )
);

export default useScoreStore;