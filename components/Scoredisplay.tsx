import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import useScoreStore from '@/stores/useScoreStore';

interface ScoreSummaryProps {
  runs?: {
    team_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
  }[];
  localTeamId: number;
  visitorTeamId: number;
  localTeamName: string;
  visitorTeamName: string;
  status: string;
  winnerTeamId?: number;
  note?: string;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  runs,
  localTeamId,
  visitorTeamId,
  localTeamName,
  visitorTeamName,
  status,
  winnerTeamId,
  note
}) => {
  if (!runs || runs.length === 0) {
    return (
      <div className="text-center p-2">
        <Badge className="bg-yellow-600 text-white">{status}</Badge>
        {note && <p className="text-gray-400 text-sm mt-2">{note}</p>}
      </div>
    );
  }

  // Group runs by team
  const localTeamRuns = runs.filter(r => r.team_id === localTeamId);
  const visitorTeamRuns = runs.filter(r => r.team_id === visitorTeamId);

  // Format innings score
  const formatInningsScore = (teamRuns: typeof runs) => {
    return teamRuns.map(r => `${r.score}/${r.wickets} (${r.overs})`).join(' & ');
  };

  const localScore = formatInningsScore(localTeamRuns);
  const visitorScore = formatInningsScore(visitorTeamRuns);

  // Determine winner
  let resultText = '';
  if (status === 'Finished') {
    if (winnerTeamId === localTeamId) {
      resultText = `${localTeamName} won`;
    } else if (winnerTeamId === visitorTeamId) {
      resultText = `${visitorTeamName} won`;
    } else {
      resultText = 'Match Drawn';
    }
  }

  return (
    <div className="bg-gray-800 p-3 rounded-md text-center">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="w-full md:w-5/12 text-left md:text-right">
          <span className="text-white font-medium">{localTeamName}</span>
          <div className="text-lg font-bold text-yellow-400">{localScore || '-'}</div>
        </div>
      
        <div className="w-full md:w-2/12 flex justify-center items-center">
          <Badge className={status === 'Finished' ? "bg-red-600" : "bg-green-600"}>{status}</Badge>
        </div>
      
        <div className="w-full md:w-5/12 text-right md:text-left">
          <span className="text-white font-medium">{visitorTeamName}</span>
          <div className="text-lg font-bold text-yellow-400">{visitorScore || '-'}</div>
        </div>
      </div>
      
      {resultText && (
        <div className="mt-2 text-green-400 font-medium">{resultText}</div>
      )}
      
      {note && (
        <div className="mt-1 text-gray-400 text-sm">{note}</div>
      )}
    </div>
  );
};

interface BattingCardProps {
  batting: {
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
  }[];
  teamName: string;
}

export const BattingCard: React.FC<BattingCardProps> = ({ batting, teamName }) => {
  if (!batting || batting.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden mb-4">
      <CardContent className="p-0">
        <div className="p-3 bg-gray-700">
          <h3 className="font-semibold text-white">{teamName} - Batting</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="py-2 px-3 text-left">Batsman</th>
                <th className="py-2 px-3 text-right">R</th>
                <th className="py-2 px-3 text-right">B</th>
                <th className="py-2 px-3 text-right">4s</th>
                <th className="py-2 px-3 text-right">6s</th>
                <th className="py-2 px-3 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {batting.map((player) => (
                <tr key={player.id} className={player.active ? "bg-gray-700 bg-opacity-40" : ""}>
                  <td className="py-2 px-3 text-white">
                    {player.player_name || `Player #${player.player_id}`}
                    {player.active && <Badge className="ml-2 bg-green-600 text-xs">Batting</Badge>}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-white">{player.score}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.ball || 0}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.four_x}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.six_x}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.rate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

interface BowlingCardProps {
  bowling: {
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
  }[];
  teamName: string;
}

export const BowlingCard: React.FC<BowlingCardProps> = ({ bowling, teamName }) => {
  if (!bowling || bowling.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden mb-4">
      <CardContent className="p-0">
        <div className="p-3 bg-gray-700">
          <h3 className="font-semibold text-white">{teamName} - Bowling</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="py-2 px-3 text-left">Bowler</th>
                <th className="py-2 px-3 text-right">O</th>
                <th className="py-2 px-3 text-right">R</th>
                <th className="py-2 px-3 text-right">W</th>
                <th className="py-2 px-3 text-right">WD</th>
                <th className="py-2 px-3 text-right">NB</th>
                <th className="py-2 px-3 text-right">Econ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bowling.map((player) => (
                <tr key={player.id} className={player.active ? "bg-gray-700 bg-opacity-40" : ""}>
                  <td className="py-2 px-3 text-white">
                    {player.player_name || `Player #${player.player_id}`}
                    {player.active && <Badge className="ml-2 bg-blue-600 text-xs">Bowling</Badge>}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.overs.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.runs}</td>
                  <td className="py-2 px-3 text-right font-medium text-white">{player.wickets}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.wide}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.noball}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{player.rate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export const LiveScoreDisplay = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, loading, error, setCurrentMatchId, setMatch, setLoading, setError } = useScoreStore();
  
  useEffect(() => {
    const fetchMatchScores = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        setCurrentMatchId(id as string);
        
        const response = await fetch(`/api/liveScore/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch score data (status ${response.status})`);
        }
        
        const data = await response.json();
        if (data && data.data) {
          // Update player names if they don't exist
          if (data.data.batting && data.data.batting.length > 0) {
            data.data.batting = data.data.batting.map((batsman: any) => {
              if (!batsman.player_name && data.data.lineup) {
                const player = data.data.lineup.find((p: any) => p.id === batsman.player_id);
                if (player) {
                  batsman.player_name = player.fullname;
                }
              }
              return batsman;
            });
          }
          
          if (data.data.bowling && data.data.bowling.length > 0) {
            data.data.bowling = data.data.bowling.map((bowler: any) => {
              if (!bowler.player_name && data.data.lineup) {
                const player = data.data.lineup.find((p: any) => p.id === bowler.player_id);
                if (player) {
                  bowler.player_name = player.fullname;
                }
              }
              return bowler;
            });
          }
          
          setMatch(id as string, data.data);
        }
      } catch (err) {
        console.error("Error fetching match scores:", err);
        setError(err instanceof Error ? err.message : "Failed to load match scores");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchScores();
    
    // Set up polling for live updates (every 30 seconds)
    const intervalId = setInterval(fetchMatchScores, 30000);
    
    return () => clearInterval(intervalId);
  }, [id, setMatch, setLoading, setError, setCurrentMatchId]);

  const matchData = id ? matches[id as string] : null;
  
  if (loading && !matchData) {
    return <div className="text-center p-4 text-gray-400">Loading live scores...</div>;
  }
  
  if (error && !matchData) {
    return <div className="text-center p-4 text-red-400">Failed to load scores: {error}</div>;
  }
  
  if (!matchData) {
    return <div className="text-center p-4 text-gray-400">No score data available</div>;
  }

  // Find which teams are batting/bowling based on active players
  const activeBattingTeamId = matchData.batting?.find(b => b.active)?.team_id;
  const activeBowlingTeamId = matchData.bowling?.find(b => b.active)?.team_id;
  
  // Group batting by team
  const localTeamBatting = matchData.batting?.filter(b => b.team_id === matchData.localteam.id) || [];
  const visitorTeamBatting = matchData.batting?.filter(b => b.team_id === matchData.visitorteam.id) || [];
  
  // Group bowling by team  
  const localTeamBowling = matchData.bowling?.filter(b => b.team_id === matchData.localteam.id) || [];
  const visitorTeamBowling = matchData.bowling?.filter(b => b.team_id === matchData.visitorteam.id) || [];

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Live Score</h2>
      
      <Card className="bg-gray-800 border-gray-700 shadow-lg mb-6">
        <CardContent className="p-4">
          <ScoreSummary 
            runs={matchData.runs} 
            localTeamId={matchData.localteam.id}
            visitorTeamId={matchData.visitorteam.id}
            localTeamName={matchData.localteam.name}
            visitorTeamName={matchData.visitorteam.name}
            status={matchData.status}
            winnerTeamId={matchData.winner_team_id}
            note={matchData.note}
          />
        </CardContent>
      </Card>
      
      {/* Show current batting team first */}
      {activeBattingTeamId === matchData.localteam.id && (
        <>
          <BattingCard 
            batting={localTeamBatting} 
            teamName={matchData.localteam.name} 
          />
          <BowlingCard 
            bowling={visitorTeamBowling} 
            teamName={matchData.visitorteam.name} 
          />
        </>
      )}
      
      {activeBattingTeamId === matchData.visitorteam.id && (
        <>
          <BattingCard 
            batting={visitorTeamBatting} 
            teamName={matchData.visitorteam.name} 
          />
          <BowlingCard 
            bowling={localTeamBowling} 
            teamName={matchData.localteam.name} 
          />
        </>
      )}
      
      {/* If no active batting/bowling or match is finished, show all data */}
      {(!activeBattingTeamId || matchData.status === 'Finished') && (
        <>
          {localTeamBatting.length > 0 && (
            <BattingCard 
              batting={localTeamBatting} 
              teamName={matchData.localteam.name} 
            />
          )}
          
          {visitorTeamBowling.length > 0 && (
            <BowlingCard 
              bowling={visitorTeamBowling} 
              teamName={matchData.visitorteam.name} 
            />
          )}
          
          {visitorTeamBatting.length > 0 && (
            <BattingCard 
              batting={visitorTeamBatting} 
              teamName={matchData.visitorteam.name} 
            />
          )}
          
          {localTeamBowling.length > 0 && (
            <BowlingCard 
              bowling={localTeamBowling} 
              teamName={matchData.localteam.name} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default LiveScoreDisplay;