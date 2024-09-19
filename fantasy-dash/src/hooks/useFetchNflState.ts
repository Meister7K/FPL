import { useEffect, useState } from 'react';
import useTestStore from '@/store/testStore';  // Import Zustand store

const useFetchNflState = () => {
  const { setNflState } = useTestStore();  // Get the setter from Zustand store
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://api.sleeper.app/v1/state/nfl');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setNflState(data);  // Save data to the Zustand store
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setNflState]);

  return { loading, error };  // Return loading and error states for UI handling
};

export default useFetchNflState;
