import { useEffect, useState } from 'react';
import useTestStore from '@/store/testStore';  

const useFetchNflState = () => {
  const { setNflState } = useTestStore();  
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
        setNflState(data);  
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setNflState]);

  return { loading, error };  
};

export default useFetchNflState;
