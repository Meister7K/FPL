import React from 'react';
import { useProjections } from '../hooks/useProjections';

const ProjectionsTest: React.FC = () => {
  // Test with a few known player IDs
  const testPlayerIds = ['4046', '4881', '6797', '8183']; // Sample player IDs
  
  const { 
    projections, 
    loading, 
    error, 
    progress, 
    refetch, 
    clearCache 
  } = useProjections({
    playerIds: testPlayerIds,
    week: 18,
    year: 2024
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Projections Service Test</h2>
      
      <div className="mb-4 flex space-x-2">
        <button 
          onClick={refetch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Projections'}
        </button>
        
        <button 
          onClick={clearCache}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cache
        </button>
      </div>

      {loading && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-sm">Loading projections...</div>
            <div className="text-xs text-gray-500">
              {progress.completed} / {progress.total}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Projections Results:</h3>
        {Object.entries(projections).map(([playerId, projection]) => (
          <div key={playerId} className="flex justify-between p-2 bg-gray-50 rounded">
            <span>Player {playerId}</span>
            <span className="font-mono">{projection.toFixed(2)} pts</span>
          </div>
        ))}
        
        {Object.keys(projections).length === 0 && !loading && (
          <div className="text-gray-500 italic">No projections loaded</div>
        )}
      </div>
    </div>
  );
};

export default ProjectionsTest;