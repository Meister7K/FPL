// @ts-nocheck
import playerdb from '../data/player_db.json';


const allowedPositions = new Set(["TE", "QB", "RB", "WR", "FB"]);

const filteredData = Object.fromEntries(
    Object.entries(playerDB).filter(([_, player]) => allowedPositions.has(player.position))
  );

  console.log(filteredData);