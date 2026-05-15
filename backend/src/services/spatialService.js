/**
 * Spatial Service — PostGIS query operations
 */
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Find reports within radius using PostGIS ST_DWithin (duplicate detection)
 */
exports.findNearbyReports = async (latitude, longitude, radiusMeters = 10, issueType = null) => {
  try {
    const result = await db.query('SELECT * FROM find_nearby_reports($1, $2, $3, $4)', [
      latitude, longitude, radiusMeters, issueType || null,
    ]);
    return result.rows;
  } catch (err) {
    logger.error(`Spatial query failed: ${err.message}`);
    throw err;
  }
};

/**
 * Get heatmap data for admin visualization
 */
exports.getHeatmapData = async (daysBack = 30, issueType = null) => {
  try {
    const result = await db.query('SELECT * FROM get_heatmap_data($1, $2)', [daysBack, issueType || null]);
    return result.rows;
  } catch (err) {
    logger.error(`Heatmap query failed: ${err.message}`);
    throw err;
  }
};

/**
 * Ward statistics from view
 */
exports.getWardStatistics = async () => {
  try {
    const result = await db.query('SELECT * FROM vw_ward_statistics ORDER BY total_reports DESC');
    return result.rows;
  } catch (err) {
    logger.error(`Ward statistics query failed: ${err.message}`);
    throw err;
  }
};

/**
 * Cluster analysis using PostGIS grid snapping
 */
exports.getReportClusters = async (zoomLevel = 12) => {
  try {
    const gridSize = Math.pow(2, -(zoomLevel - 1)) * 0.01;
    const result = await db.query(`
      SELECT
        ST_Y(ST_Centroid(ST_Collect(location))) as latitude,
        ST_X(ST_Centroid(ST_Collect(location))) as longitude,
        COUNT(*) as count,
        array_agg(DISTINCT issue_type) as issue_types,
        MAX(priority_score) as max_priority
      FROM reports
      WHERE status NOT IN ('resolved', 'closed')
      GROUP BY ST_SnapToGrid(location, $1)
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `, [gridSize]);
    return result.rows;
  } catch (err) {
    logger.error(`Cluster query failed: ${err.message}`);
    throw err;
  }
};
