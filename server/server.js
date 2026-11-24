// Washington Trail Finder: the middle tier.
// Serves the page in web/ and the /api routes, which run SQL and return JSON.
// Run with: npm start   then open http://localhost:3000
require('dotenv').config();
const path = require('path');
const express = require('express');
const sql = require('mssql');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// One shared connection pool, opened the first time a route needs it.
let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect({
      server: process.env.DB_SERVER,
      port: Number(process.env.DB_PORT || 1433),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      options: { encrypt: true, trustServerCertificate: true }
    }).catch(err => { poolPromise = null; throw err; });
  }
  return poolPromise;
}

// Turn a query-string value into a number, or null if it is empty or not a number.
function numberOrNull(v) {
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Serve web/index.html (and anything else in web/) as static files.
app.use(express.static(path.join(__dirname, '..', 'web')));

// GET /api/regions -> ["Mount Rainier", "North Cascades", ...]  (for the dropdown)
app.get('/api/regions', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT Name FROM dbo.Regions ORDER BY Name;');
    res.json(r.recordset.map(row => row.Name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load regions: ' + err.message });
  }
});

// GET /api/trails?region=&maxMiles=&maxGain=&difficulty=&dogs=1
// The user story: trails that fit my limits, best rated first, with the latest trip report.
// Every value from the user goes in as a parameter (@region, @maxMiles, ...), never pasted into the SQL.
app.get('/api/trails', async (req, res) => {
  const region = req.query.region ? String(req.query.region).slice(0, 50) : null;
  const maxMiles = numberOrNull(req.query.maxMiles);
  const maxGain = numberOrNull(req.query.maxGain);
  const difficulty = ['easy', 'moderate', 'hard'].includes(req.query.difficulty) ? req.query.difficulty : null;
  const dogsOnly = req.query.dogs === '1';

  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('region', sql.NVarChar(50), region)
      .input('maxMiles', sql.Decimal(6, 1), maxMiles)
      .input('maxGain', sql.Int, maxGain === null ? null : Math.min(Math.round(maxGain), 2000000000))
      .input('difficulty', sql.NVarChar(10), difficulty)
      .input('dogsOnly', sql.Bit, dogsOnly)
      .query(`
        SELECT
          t.Name            AS name,
          r.Name            AS region,
          t.DistanceMiles   AS miles,
          t.ElevationGainFt AS gain_ft,
          t.Difficulty      AS difficulty,
          t.DogFriendly     AS dog_friendly,
          t.Rating          AS rating,
          CONVERT(VARCHAR(10), lr.HikeDate, 23) AS report_date,
          lr.Conditions     AS report_conditions,
          lr.Comment        AS report_comment
        FROM dbo.Trails t
        JOIN dbo.Regions r ON r.RegionID = t.RegionID
        OUTER APPLY (
          SELECT TOP (1) tr.HikeDate, tr.Conditions, tr.Comment
          FROM dbo.TripReports tr
          WHERE tr.TrailID = t.TrailID
          ORDER BY tr.HikeDate DESC
        ) lr
        WHERE (@region     IS NULL OR r.Name = @region)
          AND (@maxMiles   IS NULL OR t.DistanceMiles   <= @maxMiles)
          AND (@maxGain    IS NULL OR t.ElevationGainFt <= @maxGain)
          AND (@difficulty IS NULL OR t.Difficulty = @difficulty)
          AND (@dogsOnly = 0 OR t.DogFriendly = 1)
        ORDER BY t.Rating DESC, t.Name;`);
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not search trails: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Trail Finder running at http://localhost:${PORT}`);
});
