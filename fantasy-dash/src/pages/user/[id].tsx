// pages/user/[id].tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import userData from '../../db/fplDB.json';

type APIData = {
  avatar: string;
  display_name: string;
  user_id: string;
  metadata: {
    team_name: string;
    [key: string]: any;
  };
  [key: string]: any;
};

const UserDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const hardUserData = userData;

  const [APIData, setAPIData] = useState<APIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAPIData();
    }
  }, [id]);

  const fetchAPIData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }
      
      setAPIData(data);
      console.log(APIData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!APIData) return <div>No user data found</div>;

  return (
    <div className='mx-auto max-w-screen-lg w-full flex flex-col items-center'>
      <Link href="/">Back to Users</Link>
      <h1>{APIData.display_name}</h1>
      <img src={`https://sleepercdn.com/avatars/${APIData.avatar}`} alt="User Avatar"  className='rounded-full border border-slate-200 h-auto w-96' />
      <p>User ID: {APIData.user_id}</p>

    {
      
    }
      

      {/* Add more user details as needed */}
    </div>
  );
};

export default UserDetails;