// pages/api/user/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import userData from '../../../db/fplDB.json';

type UserData = {
  avatar: string;
  display_name: string;
  user_id: string;
  metadata: {
    team_name: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserData | { error: string }>
) {
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const user = userData.find(user => user.user_id === id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch additional user data from Sleeper API if needed
      const sleeperResponse = await fetch(`https://api.sleeper.app/v1/user/${id}`);
      const sleeperData = await sleeperResponse.json();

      // Combine local data with Sleeper API data
      const combinedUserData = { ...user, ...sleeperData };

      res.status(200).json(combinedUserData);
    } catch (error) {
      res.status(500).json({ error: `Error fetching user data: ${error}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}