// components/LeagueSelectionModal.tsx
import React from 'react';

interface League {
  league_id: string;
  name: string;
  // Add other relevant fields
}

interface LeagueSelectionModalProps {
  leagues: League[];
  onSelect: (leagueId: string) => void;
  onClose: () => void;
}

const LeagueSelectionModal: React.FC<LeagueSelectionModalProps> = ({ leagues, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-lg">
      <div className=" p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Select a League</h2>
        <ul className="space-y-2">
          {leagues.map((league) => (
            <li key={league.league_id}>
              <button
                onClick={() => {console.log("Selected league:", league);
                    onSelect(league.league_id)}}
                
                className="w-full text-left p-2 hover:bg-gray-100 rounded  hover:text-black"
              >
                {league.name}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default LeagueSelectionModal;