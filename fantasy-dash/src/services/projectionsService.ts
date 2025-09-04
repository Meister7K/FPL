interface SleeperProjectionData {
  player_id: string;
  week: number;
  season: string;
  stats?: {
    pts_half_ppr?: number;
    pts_ppr?: number;
    pts_std?: number;
    [key: string]: any;
  };
  // Direct stats properties (for when stats are at root level)
  pts_half_ppr?: number;
  pts_ppr?: number;
  pts_std?: number;
  category?: string;
  [key: string]: any;
}

interface ProjectionCache {
  [key: string]: {
    data: Record<string, any>; // Store the full season data by week
    timestamp: number;
    expiry: number;
  };
}

class ProjectionsService {
  private cache: ProjectionCache = {};
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CONCURRENT_REQUESTS = 5;
  private readonly REQUEST_DELAY = 200; // 200ms between requests

  private extractFantasyPoints(data: SleeperProjectionData): number {
    console.log('Extracting fantasy points from:', data);

    // Check if stats are nested in a stats object (primary format based on console output)
    if (data.stats && typeof data.stats.pts_half_ppr === 'number') {
      console.log(`Found pts_half_ppr in stats: ${data.stats.pts_half_ppr}`);
      return data.stats.pts_half_ppr;
    }

    // Check if stats are at root level (fallback)
    if (typeof data.pts_half_ppr === 'number') {
      console.log(`Found pts_half_ppr at root: ${data.pts_half_ppr}`);
      return data.pts_half_ppr;
    }

    // Fallback to PPR if half PPR not available
    if (data.stats && typeof data.stats.pts_ppr === 'number') {
      console.log(`Found pts_ppr in stats: ${data.stats.pts_ppr}`);
      return data.stats.pts_ppr;
    }

    if (typeof data.pts_ppr === 'number') {
      console.log(`Found pts_ppr at root: ${data.pts_ppr}`);
      return data.pts_ppr;
    }

    // Fallback to standard if nothing else available
    if (data.stats && typeof data.stats.pts_std === 'number') {
      console.log(`Found pts_std in stats: ${data.stats.pts_std}`);
      return data.stats.pts_std;
    }

    if (typeof data.pts_std === 'number') {
      console.log(`Found pts_std at root: ${data.pts_std}`);
      return data.pts_std;
    }

    console.log('No fantasy points found in data:', data);
    return 0;
  }

  private getCacheKey(playerId: string, year: number): string {
    return `projections_${playerId}_${year}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    return cached && Date.now() < cached.expiry;
  }

  async fetchPlayerSeasonData(
    playerId: string,
    year: number,
    retries = 2
  ): Promise<Record<string, any>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Fetch full season projections - this returns ALL weeks in one call
      const projectionsUrl = `https://api.sleeper.com/projections/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;
      console.log(`Fetching full season projections for player ${playerId}, year ${year} from: ${projectionsUrl}`);

      let response = await fetch(projectionsUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`Rate limited for player ${playerId}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          throw new Error('Rate limited');
        }

        // If projections fail, try stats endpoint as fallback
        console.log(`Projections failed (${response.status}), trying stats endpoint for player ${playerId}`);
        const statsUrl = `https://api.sleeper.com/stats/nfl/player/${playerId}?season_type=regular&season=${year}&grouping=week`;

        const statsController = new AbortController();
        const statsTimeoutId = setTimeout(() => statsController.abort(), 8000);

        response = await fetch(statsUrl, {
          signal: statsController.signal,
          headers: {
            'Accept': 'application/json',
          }
        });

        clearTimeout(statsTimeoutId);

        if (!response.ok) {
          console.log(`Both projections and stats failed for player ${playerId}: HTTP ${response.status}`);
          throw new Error(`HTTP ${response.status}`);
        }
      }

      const data = await response.json();
      console.log(`Fetched full season data for player ${playerId}:`, Object.keys(data).filter(k => data[k] !== null));

      // Return the full season data (keyed by week)
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data;
      } else {
        console.log(`Unexpected data format for player ${playerId}:`, data);
        return {};
      }
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying player ${playerId}, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchPlayerSeasonData(playerId, year, retries - 1);
      }
      console.warn(`Failed to fetch season data for player ${playerId}:`, error);
      return {};
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getProjections(
    playerIds: string[],
    week: number,
    year: number,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    let completed = 0;

    // Process each player individually
    for (let i = 0; i < playerIds.length; i += this.MAX_CONCURRENT_REQUESTS) {
      const batch = playerIds.slice(i, i + this.MAX_CONCURRENT_REQUESTS);

      const batchPromises = batch.map(async (playerId) => {
        const projection = await this.getPlayerProjectionForWeek(playerId, year, week);
        result[playerId] = projection;
        completed++;
        onProgress?.(completed, playerIds.length);
        return playerId;
      });

      await Promise.all(batchPromises);

      // Add delay between batches
      if (i + this.MAX_CONCURRENT_REQUESTS < playerIds.length) {
        await this.delay(this.REQUEST_DELAY);
      }
    }

    return result;
  }

  private async getPlayerProjectionForWeek(
    playerId: string,
    year: number,
    week: number
  ): Promise<number> {
    const cacheKey = this.getCacheKey(playerId, year);

    // Check if we have cached season data for this player
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache[cacheKey];
      const weekKey = week.toString();

      if (cached.data[weekKey] && cached.data[weekKey] !== null) {
        const weeklyData = cached.data[weekKey];
        return this.extractFantasyPoints(weeklyData);
      } else {
        console.log(`Week ${week} not available for cached player ${playerId}`);
        return 0;
      }
    }

    // Fetch full season data for this player
    const seasonData = await this.fetchPlayerSeasonData(playerId, year);

    // Cache the full season data
    this.cache[cacheKey] = {
      data: seasonData,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_DURATION
    };

    // Extract the specific week
    const weekKey = week.toString();
    if (seasonData[weekKey] && seasonData[weekKey] !== null) {
      return this.extractFantasyPoints(seasonData[weekKey]);
    } else {
      console.log(`Week ${week} not available for player ${playerId}`);
      return 0;
    }
  }



  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiry < now) {
        delete this.cache[key];
      }
    });
  }

  // Force clear all cache
  clearCache(): void {
    this.cache = {};
  }

  // Get cache stats for debugging
  getCacheStats(): { keys: number; totalSize: number } {
    const keys = Object.keys(this.cache).length;
    const totalSize = Object.values(this.cache).reduce(
      (sum, entry) => sum + Object.keys(entry.data).length,
      0
    );
    return { keys, totalSize };
  }
}

// Export singleton instance
export const projectionsService = new ProjectionsService();
export default projectionsService;