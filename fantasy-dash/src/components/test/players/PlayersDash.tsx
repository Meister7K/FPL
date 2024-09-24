// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { getPlayerData } from '@/utils/playerUtils';
import PlayerPointsChart from '@/components/charts/PlayerPointsChart';
import { fetchPlayerData } from '@/utils/playerDataFetcher';
import playerDB from '@/db/playerDB.json';

const PlayersDash: React.FC = () => {
  const [selectedPlayer1, setSelectedPlayer1] = useState<string | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<string | null>(null);
  const [player1Data, setPlayer1Data] = useState<any>(null);
  const [player2Data, setPlayer2Data] = useState<any>(null);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [filteredPlayers1, setFilteredPlayers1] = useState<[string, any][]>([]);
  const [filteredPlayers2, setFilteredPlayers2] = useState<[string, any][]>([]);

 console.log(Object.entries(playerDB))

 useEffect(() => {
  // Function to filter players based on the search term
  const filterPlayers = (searchTerm: string) => {
    if (searchTerm.length > 2) {
      return Object.entries(playerDB)
        .filter(([_, player]) => {
          // Ensure the player object exists and check the full_name property
          return player.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .slice(0, 10); // Limit to 10 results for performance
    }
    return [];
  };

  // Set filtered players based on search terms
  setFilteredPlayers1(filterPlayers(searchTerm1));
  setFilteredPlayers2(filterPlayers(searchTerm2));
}, [searchTerm1, searchTerm2, playerDB]); // Ensure playerDB is included as a dependency


  useEffect(() => {
    const fetchPlayerDetails = async (playerId: string | null, setPlayerData: React.Dispatch<React.SetStateAction<any>>) => {
      if (playerId) {
        const playerInfo = getPlayerData(playerId);
        const seasonData = await fetchPlayerData(playerId, new Date().getFullYear().toString());
        setPlayerData({ ...playerInfo, ...seasonData });
      }
    };

    fetchPlayerDetails(selectedPlayer1, setPlayer1Data);
    fetchPlayerDetails(selectedPlayer2, setPlayer2Data);
  }, [selectedPlayer1, selectedPlayer2]);

  const handlePlayerSelect = (playerId: string, playerNumber: number) => {
    if (playerNumber === 1) {
      setSelectedPlayer1(playerId);
      setSearchTerm1('');
    } else {
      setSelectedPlayer2(playerId);
      setSearchTerm2('');
    }
  };

  const renderPlayerSearch = (playerNumber: number, searchTerm: string, setSearchTerm: React.Dispatch<React.SetStateAction<string>>, filteredPlayers: [string, any][]) => (
    <div className="relative">
      <input
        type="text"
        placeholder={`Search for player ${playerNumber}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded bg-stone-800"
      />
      {filteredPlayers.length > 0 && (
        <ul className="absolute z-10 w-full  border rounded mt-1">
          {filteredPlayers.map(([playerId, player]) => (
            <li 
              key={playerId}
              onClick={() => handlePlayerSelect(playerId, playerNumber)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {player.full_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderPlayerCard = (playerData: any) => {
    if (!playerData) return null;

    return (
      <div className="border rounded p-4 mt-4">
        <h2 className="text-xl font-bold mb-2">{playerData.full_name}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Position:</strong> {playerData.position}</p>
            <p><strong>Team:</strong> {playerData.team || 'Free Agent'}</p>
            <p><strong>Age:</strong> {playerData.age}</p>
            <p><strong>Height:</strong> {Math.floor(Number(playerData.height) / 12)}&apos;{Number(playerData.height) % 12}&ldquo;</p>
            <p><strong>Weight:</strong> {playerData.weight} lbs</p>
          </div>
          <div>
            <p><strong>College:</strong> {playerData.college}</p>
            <p><strong>Years of Experience:</strong> {playerData.years_exp}</p>
            <p><strong>Status:</strong> {playerData.status}</p>
            <p><strong>Jersey Number:</strong> {playerData.number}</p>
          </div>
        </div>
        {playerData.stats && playerData.projections && (
          <PlayerPointsChart 
            player_id={{ player_id: playerData.player_id }}
            stats={playerData.stats}
            projections={playerData.projections}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Player Dashboard</h1>
      <div className="flex space-x-4">
        {renderPlayerSearch(1, searchTerm1, setSearchTerm1, filteredPlayers1)}
        {renderPlayerSearch(2, searchTerm2, setSearchTerm2, filteredPlayers2)}
      </div>
      <div className="flex space-x-4 mt-4">
        <div className="w-1/2">
          {renderPlayerCard(player1Data)}
        </div>
        <div className="w-1/2">
          {renderPlayerCard(player2Data)}
        </div>
      </div>
    </div>
  );
};

export default PlayersDash;