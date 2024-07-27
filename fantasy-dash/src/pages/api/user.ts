// pages/api/user.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const response = await fetch(`https://api.sleeper.app/v1/user/${username}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user data');
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
}