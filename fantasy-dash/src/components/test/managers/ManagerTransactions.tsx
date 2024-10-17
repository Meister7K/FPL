//ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const TransactionCard: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const renderPlayerChanges = (changes: { [key: string]: number } | null, type: 'add' | 'drop') => {
    if (!changes) return null;
    return Object.entries(changes).map(([playerId, rosterId]) => (
      <div key={`${type}-${playerId}`} className="flex items-center">
        <span className={`mr-2 ${type === 'add' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {type === 'add' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
        <span>{`${getPlayerName(playerId)} - ${getRosterOwnerName(rosterId)}`}</span>
      </div>
    ));
  };

  return (
    <div className="bg-stone-950 shadow-md rounded-lg p-4">
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
      <p className="text-sm mt-2">
        Affected Rosters: {transaction.roster_ids.map(id => getRosterOwnerName(id)).join(', ')}
      </p>
      {transaction.consenter_ids && (
        <p className="text-sm mt-2">
          Consenter IDs: {transaction.consenter_ids.map(id => getRosterOwnerName(id)).join(', ')}
        </p>
      )}
    </div>
  );
};

const ITEMS_PER_LOAD = 5;

const ManagerTransactions: React.FC<ManagerTransactionsProps> = ({ transactions, currentUserId, currentRosterId }) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const processTransactions = () => {
      const flattenedTransactions = Object.values(transactions)
        .flatMap(yearTransactions => 
          Object.values(yearTransactions).flat()
        )
        .filter(transaction => 
          transaction.roster_ids.includes(parseInt(currentRosterId)) || 
          transaction.creator === currentUserId
        )
        .map(transaction => ({
          ...transaction,
          createdDate: new Date(transaction.created).toLocaleString(),
          updatedDate: new Date(transaction.status_updated).toLocaleString(),
        }))
        .sort((a, b) => b.created - a.created);

      setAllTransactions(flattenedTransactions);
      setDisplayedTransactions(flattenedTransactions.slice(0, ITEMS_PER_LOAD));
      setHasMore(flattenedTransactions.length > ITEMS_PER_LOAD);
    };

    processTransactions();
  }, [transactions, currentUserId, currentRosterId]);

  const loadMoreTransactions = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedTransactions.length;
      const nextTransactions = allTransactions.slice(
        currentLength,
        currentLength + ITEMS_PER_LOAD
      );
      
      setDisplayedTransactions(prev => [...prev, ...nextTransactions]);
      setHasMore(currentLength + nextTransactions.length < allTransactions.length);
      setIsLoading(false);
    }, 500); 
  }, [displayedTransactions, allTransactions, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreTransactions();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreTransactions, hasMore]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
      </div>

      <div className="bg-stone-800 p-4 rounded-lg">
        <div className="space-y-4">
          {displayedTransactions.map((transaction, index) => (
            <TransactionCard key={index} transaction={transaction} />
          ))}
          
          {displayedTransactions.length === 0 && (
            <div className="text-center py-8 text-stone-400">
              No transactions found
            </div>
          )}

          {hasMore && (
            <div 
              ref={loadingRef} 
              className="text-center py-4 text-stone-400"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-0"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-300"></div>
                </div>
              ) : (
                <span>Scroll for more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerTransactions;