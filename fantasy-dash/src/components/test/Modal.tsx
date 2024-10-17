// @ts-nocheck
import React from 'react';
import useFetchNflState from '@/hooks/useFetchNflState';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: any[]; 
  onSelectLeague: (league: any) => void; 
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, leagues, onSelectLeague }) => {
  useFetchNflState()

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-xl text-black font-semibold mb-4">Select a League:</h3>
        <ul>
          {leagues.map((league) => (
            <li key={league.league_id} className="mb-2">
              <button
                className="w-full bg-rose-500 text-white py-2 px-4 rounded hover:bg-rose-600"
                onClick={() => onSelectLeague(league)}
              >
                {league.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
