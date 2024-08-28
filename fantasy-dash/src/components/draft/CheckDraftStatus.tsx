import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import useLeagueStore from '../../store/testStore';
import useFetchDraftInfo from '../../hooks/useFetchDraftInfo';
import useFetchDraftPicks from '../../hooks/useFetchDraftPicks';

interface CheckDraftStatusProps {
  leagueId: string;
}

const CheckDraftStatus: React.FC<CheckDraftStatusProps> = ({ leagueId }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const draftInfo = useLeagueStore((state) => state.draftInfo);
  const { fetchDraftInfo } = useFetchDraftInfo(leagueId);
  const { fetchDraftPicks } = useFetchDraftPicks();
  const router = useRouter();
  const isMountedRef = useRef(true);

  const handleModalClose = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;

    const checkDraftStatus = async () => {
      if (!isMountedRef.current) return;

      await fetchDraftInfo();

      if (draftInfo && isMountedRef.current) {
        if (draftInfo.status === 'pre_draft') {
          setModalMessage('The draft has not started yet.');
          setShowModal(true);
        } else if (draftInfo.status === 'paused' || draftInfo.status === 'drafting') {
          if (draftInfo.draft_id) {
            await fetchDraftPicks(draftInfo.draft_id);
          }  // Schedule next check
          setTimeout(checkDraftStatus, 1000);
        } else if (draftInfo.status === 'complete') {
          const completionDate = new Date(draftInfo.start_time * 1000).toLocaleDateString();
          setModalMessage(`Draft completed on ${completionDate}`);
          setShowModal(true);
        }
      }
    };

    checkDraftStatus();

    return () => {
      isMountedRef.current = false;
    };
  }, [draftInfo, fetchDraftInfo, fetchDraftPicks, leagueId]);

  // Stop further checks if modal is shown
  useEffect(() => {
    if (showModal) {
      isMountedRef.current = false;
    }
  }, [showModal]);

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white/50 text-black p-4 rounded">
            <p>{modalMessage}</p>
            <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              Go Back
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckDraftStatus;