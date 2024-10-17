// @ts-nocheck
import { memo } from 'react';
import { getPlayerName, getPlayerPosition, getPlayerTeam } from '@/utils/playerUtils';

interface DraftPick {
  player_id: string;
  pick_no: number;
  metadata?: {
    amount?: number;
  };
}

interface DraftBoardCardProps {
  pick: DraftPick;
  getBackgroundColor: (position: string) => string;
}


const DraftBoardCard = memo(({ pick, getBackgroundColor }: DraftBoardCardProps) => {
  const playerName = getPlayerName(pick.player_id);
  const playerPosition = getPlayerPosition(pick.player_id);
  const playerTeam = getPlayerTeam(pick.player_id);

  return (
    <div
      key={pick.pick_no}
      className={`${getBackgroundColor(playerPosition)} p-2 mb-2 rounded shadow`}
    >
      <span>{pick.pick_no}</span>
      {pick.metadata?.amount ? <span className="float-end">${pick.metadata.amount}</span> : null}
      <img
        className="h-20 bg-slate-500/50 mx-auto border rounded-full"
        src={`https://sleepercdn.com/content/nfl/players/${pick.player_id}.jpg`}
        alt={playerName}
      />
      <div className="text-xs font-semibold text-center">{playerName}</div>
      <div className="text-xs text-center">{playerPosition} - {playerTeam}</div>
    </div>
  );
});

DraftBoardCard.displayName = 'DraftBoardCard';

export default DraftBoardCard;
