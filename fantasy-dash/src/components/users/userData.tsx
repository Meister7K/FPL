// pages/index.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import userData from '../../db/fplDB.json';

const UserList = () => {
  const [users, setUsers] = useState(userData);

  return (
    <div>
      <h1>Fantasy Premier League Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.user_id}>
            <Link href={`/user/${user.user_id}`}>
              {user.display_name} ({user.metadata.team_name})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;