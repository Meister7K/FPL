import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getRosterOwnerName } from '@/utils/usernameUtil';
import { getPlayerName } from '@/utils/playerUtils';

interface Transaction {
  status: string;
  type: string;
  metadata?: { notes?: string };
  created: number;
  settings?: { waiver_bid?: number };
  leg: number;
  draft_picks: any[];
  creator: string;
  transaction_id: string;
  adds: { [key: string]: number } | null;
  drops: { [key: string]: number } | null;
  consenter_ids: number[] | null;
  roster_ids: number[];
  status_updated: number;
  waiver_budget: any[];
}

interface LeagueTransactions {
  [leagueId: string]: Transaction[];
}

interface YearTransactions {
  [year: string]: LeagueTransactions;
}

interface ManagerTransactionsProps {
  transactions: YearTransactions;
  currentUserId: string;
  currentRosterId: string;
}

const ManagerTransactions: React.FC<ManagerTransactionsProps> = ({ transactions, currentUserId, currentRosterId }) => {
  const [processedTransactions, setProcessedTransactions] = useState<YearTransactions>({});
  const [selectedYear, setSelectedYear] = useState<string>('');

  console.log(currentRosterId)
  console.log(currentUserId)
  

  useEffect(() => {
    const processTransactions = () => {
      const processed: YearTransactions = {};

      Object.entries(transactions).forEach(([year, leagueTransactions]) => {
        processed[year] = {};

        Object.entries(leagueTransactions).forEach(([leagueId, leagueTransactions]) => {
          // Filter transactions for the current manager
          const filteredTransactions = leagueTransactions.filter(transaction => 
            transaction.roster_ids.includes(parseInt(currentRosterId)) || 
            transaction.creator === currentUserId
          );

          processed[year][leagueId] = filteredTransactions.map(transaction => ({
            ...transaction,
            createdDate: new Date(transaction.created).toLocaleString(),
            updatedDate: new Date(transaction.status_updated).toLocaleString(),
          }));

          // Sort transactions from newest to oldest
          processed[year][leagueId].sort((a, b) => b.created - a.created);
        });
      });

      setProcessedTransactions(processed);
      
      // Set the most recent year as the default selected year
      const years = Object.keys(processed);
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    };

    processTransactions();
  }, [transactions, currentUserId, currentRosterId]);

  console.log()

  const renderPlayerChanges = (changes: { [key: string]: number } | null, type: 'add' | 'drop') => {
    if (!changes) return null;
    return Object.entries(changes).map(([playerId, rosterId]) => (
      <div key={`${type}-${playerId}`} className="flex items-center">
        <span className={`mr-2 ${type === 'add' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {type === 'add' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
        <span>{`${getPlayerName(playerId)}`}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-stone-800 text-white border border-stone-600 rounded px-2 py-1"
        >
          {
      
          Object.keys(processedTransactions).map(year => (
            <option key={year} value={year}>{Object.keys(processedTransactions[year])}</option>
          ))
          }
        </select>
      </div>
      {selectedYear && processedTransactions[selectedYear] && (
        <div className="bg-stone-800 p-4 rounded-lg">
          <div className="space-y-4">
            {Object.entries(processedTransactions[selectedYear]).flatMap(([leagueId, leagueTransactions]) =>
              leagueTransactions.map((transaction, index) => (
                <div key={`${leagueId}-${index}`} className="bg-stone-950 shadow-md rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold capitalize">{transaction.type} Transaction</h3>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.status === 'complete' ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-800 text-rose-100'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mb-2">Created: {transaction.createdDate}</p>
                  <p className="text-sm text-stone-500 mb-2">Updated: {transaction.updatedDate}</p>
                  <p className="text-sm mb-2">Creator: {getRosterOwnerName(transaction.creator)}</p>
                  {/* <p className="text-sm mb-2">Transaction ID: {transaction.transaction_id}</p> */}
                  {transaction.settings?.waiver_bid && (
                    <p className="text-sm mb-2">Waiver Bid: {`$${transaction.settings.waiver_bid}`}</p>
                  )}
                  <div className="space-y-2">
                    {renderPlayerChanges(transaction.adds, 'add')}
                    {renderPlayerChanges(transaction.drops, 'drop')}
                  </div>
                  {transaction.metadata?.notes && (
                    <p className="mt-2 text-sm italic">{transaction.metadata.notes}</p>
                  )}
                  <p className="text-sm mt-2">Affected Rosters: {transaction.roster_ids.map(id=>getRosterOwnerName(id))}</p>
                  {transaction.consenter_ids && (
                    <p className="text-sm mt-2">Consenter IDs: {transaction.roster_ids.map(id=>getRosterOwnerName(id))}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTransactions;