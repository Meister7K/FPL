document.addEventListener("DOMContentLoaded", async function () {
    const tableBody = document.getElementById("playerTable");
    const detailsDiv = document.getElementById("playerDetails");
    const positionFilter = document.getElementById("positionFilter");

    let playerStats = [];
    let sortDirection = 'desc'; // Default sort direction (highest to lowest)
    
    // Track charts for fullscreen functionality
    let activeCharts = [];

    // Fetch stats.json
    async function loadStats() {
        try {
            const response = await fetch("stats.json");
            playerStats = await response.json();
            console.log(playerStats[0].stats[0].stats[1].stats.pts_ppr);
            displayPlayers();
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    }

    function calculateAverage(stats) {
        const totalGames = stats.reduce((acc, year) => acc + (year.stats.length || 0), 0);
        if (totalGames === 0) return "N/A";

        let totalPoints = stats.reduce((sum, year) => sum + (year.stats.total_points || 0), 0);
        return (totalPoints / totalGames).toFixed(2);
    }

    function getLatestFullYearStats(player) {
        // Sort years in descending order
        const sortedYears = [...player.stats].sort((a, b) => b.year - a.year);
        
        // Find the latest year with actual stats
        for (const yearData of sortedYears) {
            if (Object.keys(yearData.stats).length > 0) {
                const allPPRPoints = [];
                const weeklyStats = yearData.stats;
                
                // Loop through each week in the year
                for (const weekKey in weeklyStats) {
                    const weekData = weeklyStats[weekKey];
                    
                    // Make sure week data exists and has PPR points
                    if (weekData && weekData.stats && 'pts_ppr' in weekData.stats) {
                        allPPRPoints.push({
                            ppr: weekData.stats.pts_ppr
                        });
                    }
                }
                
                if (allPPRPoints.length > 0) {
                    const avgPPR = allPPRPoints.reduce((sum, point) => sum + point.ppr, 0) / allPPRPoints.length;
                    return {
                        year: yearData.year,
                        average: avgPPR,
                        gamesPlayed: allPPRPoints.length
                    };
                }
            }
        }
        
        return {
            year: null,
            average: 0,
            gamesPlayed: 0
        };
    }

    function sortPlayersByAverage(players, direction = 'desc') {
        return [...players].sort((a, b) => {
            const aPoints = calculatePlayerAvgPPR(a);
            const bPoints = calculatePlayerAvgPPR(b);
            
            if (direction === 'asc') {
                return aPoints - bPoints;
            } else {
                return bPoints - aPoints;
            }
        });
    }

    function calculatePlayerAvgPPR(player) {
        const allPPRPoints = [];
        player.stats.forEach(yearData => {
            const weeklyStats = yearData.stats;
            
            // Skip years with no stats
            if (Object.keys(weeklyStats).length === 0) {
                return;
            }
            
            // Loop through each week in the year
            for (const weekKey in weeklyStats) {
                const weekData = weeklyStats[weekKey];
                
                // Make sure week data exists and has PPR points
                if (weekData && weekData.stats && 'pts_ppr' in weekData.stats) {
                    allPPRPoints.push({
                        ppr: weekData.stats.pts_ppr
                    });
                }
            }
        });

        if (allPPRPoints.length > 0) {
            return allPPRPoints.reduce((sum, point) => sum + point.ppr, 0) / allPPRPoints.length;
        }
        return 0;
    }

    function displayPlayers() {
        const selectedPosition = positionFilter.value;
        tableBody.innerHTML = "";

        // Filter players by position first
        let filteredPlayers = playerStats.filter(player => {
            const position = player.playerPosition || "N/A";
            return selectedPosition === "all" || position === selectedPosition;
        });
        
        // Sort the filtered players
        filteredPlayers = sortPlayersByAverage(filteredPlayers, sortDirection);

        filteredPlayers.forEach(player => {
            const position = player.playerPosition || "N/A";
            const avgPPRPoints = calculatePlayerAvgPPR(player);
            
            // Get latest year stats
            const latestYearStats = getLatestFullYearStats(player);
            const latestAvg = latestYearStats.average;
            const trend = latestAvg > avgPPRPoints ? 'up' : (latestAvg < avgPPRPoints ? 'down' : 'same');
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${player.playerName || "Unknown"}</td>
                <td>${position}</td>
                <td>${avgPPRPoints.toFixed(2)}</td>
                <td class="trend-${trend}" title="${latestYearStats.year || 'No data'} (${latestYearStats.gamesPlayed} games)">
                    ${latestAvg.toFixed(2)}
                </td>
                <td><button onclick="showDetails('${player.playerId}')">View</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Collect yearly averages for a player
    function getYearlyAverages(player) {
        const yearlyData = [];
        
        // Sort years chronologically
        const sortedYears = [...player.stats].sort((a, b) => a.year - b.year);
        
        sortedYears.forEach(yearData => {
            if (Object.keys(yearData.stats).length === 0) return; // Skip empty years
            
            const allPPRPoints = [];
            const weeklyStats = yearData.stats;
            
            // Loop through each week in the year
            for (const weekKey in weeklyStats) {
                const weekData = weeklyStats[weekKey];
                
                // Make sure week data exists and has PPR points
                if (weekData && weekData.stats && 'pts_ppr' in weekData.stats) {
                    allPPRPoints.push({
                        ppr: weekData.stats.pts_ppr
                    });
                }
            }
            
            if (allPPRPoints.length > 0) {
                const avgPPR = allPPRPoints.reduce((sum, point) => sum + point.ppr, 0) / allPPRPoints.length;
                yearlyData.push({
                    year: yearData.year,
                    average: avgPPR,
                    gamesPlayed: allPPRPoints.length
                });
            }
        });
        
        return yearlyData;
    }
    
    // Collect game-by-game data for a player
    function getGameByGameData(player) {
        const gameData = [];
        
        // Sort years chronologically
        const sortedYears = [...player.stats].sort((a, b) => a.year - b.year);
        
        let gameCount = 0;
        
        sortedYears.forEach(yearData => {
            if (Object.keys(yearData.stats).length === 0) return; // Skip empty years
            
            const weeklyStats = yearData.stats;
            
            // Sort weeks numerically
            const sortedWeeks = Object.keys(weeklyStats).sort((a, b) => parseInt(a) - parseInt(b));
            
            sortedWeeks.forEach(week => {
                const weekData = weeklyStats[week];
                if (!weekData || !weekData.stats || !('pts_ppr' in weekData.stats)) return;
                
                gameCount++;
                
                gameData.push({
                    gameNumber: gameCount,
                    year: yearData.year,
                    week: weekData.week || week,
                    opponent: weekData.opponent || 'N/A',
                    date: weekData.date || `${yearData.year}-W${week}`,
                    ppr: weekData.stats.pts_ppr
                });
            });
        });
        
        return gameData;
    }
    
    // Linear regression for trendline calculation
    function calculateTrendline(data, xAccessor, yAccessor) {
        const n = data.length;
        if (n < 2) return { slope: 0, intercept: 0 };
        
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        
        data.forEach((d, i) => {
            const x = xAccessor(d, i);
            const y = yAccessor(d);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });
        
        const denominator = n * sumXX - sumX * sumX;
        
        // Check if denominator is zero or very close to zero
        if (Math.abs(denominator) < 0.0001) {
            return { slope: 0, intercept: sumY / n };
        }
        
        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
    
    // Function to toggle fullscreen for a chart
    function toggleFullscreen(canvas) {
        if (!document.fullscreenElement) {
            // Save the original dimensions
            canvas.dataset.originalWidth = canvas.style.width;
            canvas.dataset.originalHeight = canvas.style.height;
            canvas.dataset.originalMaxHeight = canvas.style.maxHeight;
            
            // Enter fullscreen
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
            } else if (canvas.msRequestFullscreen) {
                canvas.msRequestFullscreen();
            }
            
            // Adjust for fullscreen
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.maxHeight = 'none';
            
            // Add event for exiting fullscreen
            document.addEventListener('fullscreenchange', exitHandler);
            document.addEventListener('webkitfullscreenchange', exitHandler);
            document.addEventListener('mozfullscreenchange', exitHandler);
            document.addEventListener('MSFullscreenChange', exitHandler);
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    // Handle fullscreen exit event
    function exitHandler() {
        if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            // Restore original dimensions for all active charts
            activeCharts.forEach(canvas => {
                if (canvas.dataset.originalWidth) {
                    canvas.style.width = canvas.dataset.originalWidth;
                    canvas.style.height = canvas.dataset.originalHeight;
                    canvas.style.maxHeight = canvas.dataset.originalMaxHeight;
                }
            });
            
            // Remove the event listeners
            document.removeEventListener('fullscreenchange', exitHandler);
            document.removeEventListener('webkitfullscreenchange', exitHandler);
            document.removeEventListener('mozfullscreenchange', exitHandler);
            document.removeEventListener('MSFullscreenChange', exitHandler);
        }
    }
    
    // Function to draw enhanced yearly chart as an area chart with statistics and trendline
// Function to draw enhanced yearly chart as an area chart with statistics and trendline
function drawYearlyChart(player, container) {
    const yearlyData = getYearlyAverages(player);
    if (yearlyData.length === 0) {
        container.innerHTML = "<p>No yearly data available for chart</p>";
        return;
    }
    
    // Create chart wrapper with fullscreen icon
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    container.appendChild(chartWrapper);
    
    // Add fullscreen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'fullscreen-btn';
    fullscreenBtn.innerHTML = '⤢';
    fullscreenBtn.title = 'Toggle fullscreen';
    chartWrapper.appendChild(fullscreenBtn);
    
    // Create chart canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxHeight = '300px';
    chartWrapper.appendChild(canvas);
    
    // Store this canvas in active charts
    activeCharts.push(canvas);
    
    // Add click event to fullscreen button
    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen(canvas);
    });
    
    // Add click event to canvas itself for fullscreen
    canvas.addEventListener('click', function() {
        toggleFullscreen(canvas);
    });
    
    const ctx = canvas.getContext('2d');
    
    // Chart dimensions
    const padding = 50;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Calculate statistics
    const values = yearlyData.map(d => d.average);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // For median, sort the values first
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
    
    const highPoint = Math.max(...values);
    const lowPoint = Math.min(...values);
    
    // Find max value for scaling (with some padding)
    const maxValue = Math.max(highPoint, mean) * 1.2;
    
    // X and Y scales
    const xScale = chartWidth / (yearlyData.length - 1 || 1);
    const yScale = chartHeight / maxValue;
    
    // Calculate trendline
    const trendline = calculateTrendline(
        yearlyData, 
        (d, i) => i, // X is the index/position
        d => d.average // Y is the average value
    );
    console.log(trendline);
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Create area chart path
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    
    yearlyData.forEach((data, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (data.average * yScale);
        ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding + ((yearlyData.length - 1) * xScale), canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.fill();
    
    // Draw line for the area chart
    ctx.beginPath();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    
    yearlyData.forEach((data, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (data.average * yScale);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw trendline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange color for trendline
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    
    // Calculate start and end points of trendline
    const startX = padding;
    const startY = canvas.height - padding - ((0 * trendline.slope + trendline.intercept) * yScale);
    const endX = padding + ((yearlyData.length - 1) * xScale);
    const endY = canvas.height - padding - (((yearlyData.length - 1) * trendline.slope + trendline.intercept) * yScale);
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
    
    // Draw data points with high and low highlights
    yearlyData.forEach((data, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (data.average * yScale);
        
        // Determine if this is a high or low point
        const isHighPoint = data.average === highPoint;
        const isLowPoint = data.average === lowPoint;
        
        // Draw larger circles for high/low points
        ctx.beginPath();
        ctx.fillStyle = isHighPoint ? '#ff5722' : (isLowPoint ? '#f44336' : '#4CAF50');
        ctx.arc(x, y, isHighPoint || isLowPoint ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add labels for high/low points
        if (isHighPoint || isLowPoint) {
            ctx.fillStyle = isHighPoint ? '#ff5722' : '#f44336';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(data.average.toFixed(1), x, y - 10);
        }
        
        // Add year label
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.year, x, canvas.height - (padding / 2));
    });
    
    // Draw mean line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    const meanY = canvas.height - padding - (mean * yScale);
    ctx.moveTo(padding, meanY);
    ctx.lineTo(canvas.width - padding, meanY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label for mean
    ctx.fillStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Mean: ${mean.toFixed(1)}`, canvas.width - padding - 5, meanY - 5);
    
    // Draw median line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(156, 39, 176, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 2]);
    const medianY = canvas.height - padding - (median * yScale);
    ctx.moveTo(padding, medianY);
    ctx.lineTo(canvas.width - padding, medianY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label for median
    ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Median: ${median.toFixed(1)}`, canvas.width - padding - 5, medianY - 20);
    
    // Add chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Yearly PPR Averages', canvas.width / 2, 20);
    
    // Add Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    
    // Draw 5 Y-axis labels
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = canvas.height - padding - (value * yScale);
        ctx.fillText(value.toFixed(1), padding - 5, y + 3);
        
        // Draw horizontal grid line
        ctx.beginPath();
        ctx.strokeStyle = '#eee';
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Add legend
    const legendY = 40;
    const legendX = padding + 10;
    
    // Mean legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.setLineDash([5, 3]);
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Mean', legendX + 25, legendY + 3);
    
    // Median legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(156, 39, 176, 0.8)';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(legendX, legendY + 15);
    ctx.lineTo(legendX + 20, legendY + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Median', legendX + 25, legendY + 18);
    
    // Trendline legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(legendX, legendY + 30);
    ctx.lineTo(legendX + 20, legendY + 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Trend', legendX + 25, legendY + 33);
    
    // High point legend item
    ctx.beginPath();
    ctx.fillStyle = '#ff5722';
    ctx.arc(legendX + 10, legendY + 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('High Point', legendX + 25, legendY + 48);
    
    // Low point legend item
    ctx.beginPath();
    ctx.fillStyle = '#f44336';
    ctx.arc(legendX + 10, legendY + 60, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('Low Point', legendX + 25, legendY + 63);
}

// Function to draw enhanced game-by-game chart as an area chart with trendline
function drawGameByGameChart(player, container) {
    const gameData = getGameByGameData(player);
    if (gameData.length === 0) {
        container.innerHTML = "<p>No game data available for chart</p>";
        return;
    }
    
    // Create chart wrapper with fullscreen icon
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    container.appendChild(chartWrapper);
    
    // Add fullscreen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'fullscreen-btn';
    fullscreenBtn.innerHTML = '⤢';
    fullscreenBtn.title = 'Toggle fullscreen';
    chartWrapper.appendChild(fullscreenBtn);
    
    // Create chart canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxHeight = '300px';
    chartWrapper.appendChild(canvas);
    
    // Store this canvas in active charts
    activeCharts.push(canvas);
    
    // Add click event to fullscreen button
    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen(canvas);
    });
    
    // Add click event to canvas itself for fullscreen
    canvas.addEventListener('click', function() {
        toggleFullscreen(canvas);
    });
    
    const ctx = canvas.getContext('2d');
    
    // Chart dimensions
    const padding = 50;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Extract PPR points
    const pprValues = gameData.map(d => d.ppr);
    
    // Calculate statistics
    const mean = pprValues.reduce((a, b) => a + b, 0) / pprValues.length;
    
    // For median, sort the values first
    const sortedValues = [...pprValues].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
    
    const highPoint = Math.max(...pprValues);
    const lowPoint = Math.min(...pprValues);
    
    // Find max value for scaling (with some padding)
    const maxValue = Math.max(highPoint, mean) * 1.2;
    
    // X and Y scales
    const xScale = chartWidth / (gameData.length - 1 || 1);
    const yScale = chartHeight / maxValue;
    
    // Calculate trendline
    const trendline = calculateTrendline(
        gameData, 
        (d, i) => i, // X is the index/position
        d => d.ppr // Y is the PPR value
    );
    console.log(trendline);
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Create area chart
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    
    gameData.forEach((game, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (game.ppr * yScale);
        ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding + ((gameData.length - 1) * xScale), canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
    ctx.fill();
    
    // Draw line for points
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
    ctx.lineWidth = 2;
    
    gameData.forEach((game, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (game.ppr * yScale);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw trendline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange color for trendline
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    
    // Calculate start and end points of trendline
    const startX = padding;
    const startY = canvas.height - padding - ((0 * trendline.slope + trendline.intercept) * yScale);
    const endX = padding + ((gameData.length - 1) * xScale);
    const endY = canvas.height - padding - (((gameData.length - 1) * trendline.slope + trendline.intercept) * yScale);
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
    
    // Draw mean line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    const meanY = canvas.height - padding - (mean * yScale);
    ctx.moveTo(padding, meanY);
    ctx.lineTo(canvas.width - padding, meanY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label for mean
    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Mean: ${mean.toFixed(1)}`, canvas.width - padding - 5, meanY - 5);
    
    // Draw median line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 2]);
    const medianY = canvas.height - padding - (median * yScale);
    ctx.moveTo(padding, medianY);
    ctx.lineTo(canvas.width - padding, medianY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label for median
    ctx.fillStyle = 'rgba(155, 89, 182, 0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Median: ${median.toFixed(1)}`, canvas.width - padding - 5, medianY - 20);
    
    // Draw data points, highlight high and low points
    gameData.forEach((game, i) => {
        const x = padding + (i * xScale);
        const y = canvas.height - padding - (game.ppr * yScale);
        
        // Determine if this is a high or low point
        const isHighPoint = game.ppr === highPoint;
        const isLowPoint = game.ppr === lowPoint;
        
        ctx.beginPath();
        ctx.fillStyle = isHighPoint ? '#ff5722' : (isLowPoint ? '#f44336' : '#3498db');
        ctx.arc(x, y, isHighPoint || isLowPoint ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add labels for high/low points
        if (isHighPoint || isLowPoint) {
            ctx.fillStyle = isHighPoint ? '#ff5722' : '#f44336';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(game.ppr.toFixed(1), x, y - 10);
            ctx.fillText(`G${game.gameNumber}`, x, y - 22);
        }
        
        // Add year markers at start of each season
        if (i === 0 || (i > 0 && game.year !== gameData[i-1].year)) {
            ctx.beginPath();
            ctx.strokeStyle = '#999';
            ctx.setLineDash([2, 2]);
            ctx.moveTo(x, canvas.height - padding);
            ctx.lineTo(x, padding);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(game.year, x, canvas.height - 15);
        }
    });
    
    // Add chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game-by-Game PPR Points', canvas.width / 2, 20);
    
    // Add Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    
    // Draw 5 Y-axis labels
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = canvas.height - padding - (value * yScale);
        ctx.fillText(value.toFixed(1), padding - 5, y + 3);
        
        // Draw horizontal grid line
        ctx.beginPath();
        ctx.strokeStyle = '#eee';
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Add legend
    const legendY = 40;
    const legendX = padding + 10;
    
    // Mean legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.setLineDash([5, 3]);
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Mean', legendX + 25, legendY + 3);
    
    // Median legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(legendX, legendY + 15);
    ctx.lineTo(legendX + 20, legendY + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Median', legendX + 25, legendY + 18);
    
    // Trendline legend item
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(legendX, legendY + 30);
    ctx.lineTo(legendX + 20, legendY + 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Trend', legendX + 25, legendY + 33);
    
    // High point legend item
    ctx.beginPath();
    ctx.fillStyle = '#ff5722';
    ctx.arc(legendX + 10, legendY + 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('High Point', legendX + 25, legendY + 48);
    
    // Low point legend item
    ctx.beginPath();
    ctx.fillStyle = '#f44336';
    ctx.arc(legendX + 10, legendY + 60, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('Low Point', legendX + 25, legendY + 63);
}

    // Show player stats by year in a cleaner format with charts
    window.showDetails = function (playerId) {
        const player = playerStats.find(p => p.playerId === playerId);
        if (!player) return;

        detailsDiv.innerHTML = `
            <h3>Stats for ${player.playerName} (${player.playerPosition || 'N/A'})</h3>
            
            <div class="charts-container">
                <div class="chart-section">
                    <h4>Yearly Averages</h4>
                    <div id="yearlyChart"></div>
                </div>
                <div class="chart-section">
                    <h4>Game-by-Game Performance</h4>
                    <div id="gameByGameChart"></div>
                </div>
            </div>
            
            <div class="details-container"></div>
        `;
        
        // Draw charts
        drawYearlyChart(player, document.getElementById('yearlyChart'));
        drawGameByGameChart(player, document.getElementById('gameByGameChart'));
        
        const detailsContainer = detailsDiv.querySelector(".details-container");
        
        // Sort years in descending order (most recent first)
        const sortedYears = [...player.stats].sort((a, b) => b.year - a.year);
        
        sortedYears.forEach(yearData => {
            if (Object.keys(yearData.stats).length === 0) return; // Skip empty years
            
            const yearDiv = document.createElement("div");
            yearDiv.className = "year-stats";
            yearDiv.innerHTML = `<h4>${yearData.year} Season</h4>`;
            
            const weeklyTable = document.createElement("table");
            weeklyTable.border = "1";
            weeklyTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Date</th>
                        <th>Opponent</th>
                        <th>PPR Points</th>
                        <th>Receptions</th>
                        <th>Rec Yards</th>
                        <th>Targets</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tableBody = weeklyTable.querySelector("tbody");
            
            // Sort weeks numerically
            const sortedWeeks = Object.keys(yearData.stats)
                .sort((a, b) => parseInt(a) - parseInt(b));
            
            let totalPPR = 0;
            let totalReceptions = 0;
            let totalYards = 0;
            let totalTargets = 0;
            let weekCount = 0;
            
            sortedWeeks.forEach(week => {
                const weekData = yearData.stats[week];
                if (!weekData || !weekData.stats) return;
                
                const stats = weekData.stats;
                weekCount++;
                
                // Add to totals
                totalPPR += stats.pts_ppr || 0;
                totalReceptions += stats.rec || 0;
                totalYards += stats.rec_yd || 0;
                totalTargets += stats.rec_tgt || 0;
                
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${weekData.week || week}</td>
                    <td>${weekData.date || 'N/A'}</td>
                    <td>${weekData.opponent || 'N/A'}</td>
                    <td>${stats.pts_ppr ? stats.pts_ppr.toFixed(1) : 'N/A'}</td>
                    <td>${stats.rec || 0}</td>
                    <td>${stats.rec_yd || 0}</td>
                    <td>${stats.rec_tgt || 0}</td>
                `;
                tableBody.appendChild(row);
            });
            
            // Add summary row
            if (weekCount > 0) {
                const summaryRow = document.createElement("tr");
                summaryRow.className = "summary-row";
                summaryRow.innerHTML = `
                    <td colspan="3"><strong>Season Average</strong></td>
                    <td><strong>${(totalPPR / weekCount).toFixed(1)}</strong></td>
                    <td><strong>${(totalReceptions / weekCount).toFixed(1)}</strong></td>
                    <td><strong>${(totalYards / weekCount).toFixed(1)}</strong></td>
                    <td><strong>${(totalTargets / weekCount).toFixed(1)}</strong></td>
                `;
                tableBody.appendChild(summaryRow);
            }
            
            yearDiv.appendChild(weeklyTable);
            detailsContainer.appendChild(yearDiv);
        });
    };

    // Add sorting functionality
    const addSortButton = () => {
        const tableHeader = document.querySelector("table thead tr");
        const avgHeader = tableHeader.querySelector("th:nth-child(3)");
        
        // Update the average stats header to include a sort button
        avgHeader.innerHTML = `
            Average Stats
            <button id="sortButton">
                ${sortDirection === 'desc' ? '↓' : '↑'}
            </button>
        `;
        
        document.getElementById("sortButton").addEventListener("click", () => {
            // Toggle sort direction
            sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
            document.getElementById("sortButton").textContent = sortDirection === 'desc' ? '↓' : '↑';
            displayPlayers();
        });
    };

    // Update table header to include the new column
    const updateTableHeader = () => {
        const tableHeader = document.querySelector("table thead tr");
        if (!tableHeader.querySelector("th:nth-child(4)")) {
            const viewDetailsHeader = tableHeader.querySelector("th:nth-child(4)");
            const latestYearHeader = document.createElement("th");
            latestYearHeader.textContent = "Latest Year Avg";
            tableHeader.insertBefore(latestYearHeader, viewDetailsHeader);
        }
    };

    // Filter by position
    positionFilter.addEventListener("change", displayPlayers);

    // Load data
    await loadStats();
    
    // Update table structure and add sort button
    updateTableHeader();
    addSortButton();
});