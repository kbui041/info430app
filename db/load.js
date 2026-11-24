// Washington Trail Finder: creates the tables (db/schema.sql) in your database and fills them.
// Run with: node db/load.js     (safe to run again: it drops and recreates the tables)
// Trail numbers are approximate round-trip distances and gains; ratings and trip reports are made up.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const regions = [
  ['Snoqualmie Pass',   'I-90 corridor east of Seattle: closest trails to the city.'],
  ['Mount Rainier',     'Mount Rainier National Park: Paradise, Sunrise, Mowich, Longmire. No dogs on park trails.'],
  ['Olympic Peninsula', 'Olympic National Park and National Forest: rainforest, ridges, and waterfalls.'],
  ['North Cascades',    'Highway 20 and the Cascade River Road: big alpine scenery. Highway 20 closes in winter.']
];

// [name, region, miles, gainFt, difficulty, dogFriendly, rating]
const trails = [
  ['Rattlesnake Ledge',             'Snoqualmie Pass',    4.0, 1160, 'moderate', 1, 4.3],
  ['Mount Si',                      'Snoqualmie Pass',    8.0, 3150, 'hard',     1, 4.4],
  ['Mailbox Peak (New Trail)',      'Snoqualmie Pass',    9.4, 4000, 'hard',     1, 4.5],
  ['Snow Lake',                     'Snoqualmie Pass',    7.2, 1800, 'moderate', 1, 4.7],
  ['Franklin Falls',                'Snoqualmie Pass',    2.0,  400, 'easy',     1, 4.4],
  ['Twin Falls',                    'Snoqualmie Pass',    2.6,  500, 'easy',     1, 4.4],
  ['Kendall Katwalk',               'Snoqualmie Pass',   12.0, 2600, 'hard',     1, 4.7],
  ['Annette Lake',                  'Snoqualmie Pass',    7.5, 1800, 'moderate', 1, 4.5],
  ['Skyline Trail Loop',            'Mount Rainier',      5.5, 1700, 'moderate', 0, 4.9],
  ['Naches Peak Loop',              'Mount Rainier',      3.2,  600, 'easy',     0, 4.8],
  ['Tolmie Peak Lookout',           'Mount Rainier',      5.6, 1100, 'moderate', 0, 4.7],
  ['Burroughs Mountain',            'Mount Rainier',      9.0, 2500, 'hard',     0, 4.8],
  ['Comet Falls',                   'Mount Rainier',      3.8, 1250, 'moderate', 0, 4.6],
  ['Spray Park',                    'Mount Rainier',      8.0, 1700, 'moderate', 0, 4.7],
  ['Trail of the Shadows',          'Mount Rainier',      0.7,   50, 'easy',     0, 4.1],
  ['Hurricane Hill',                'Olympic Peninsula',  3.2,  700, 'easy',     0, 4.7],
  ['Hoh River to Five Mile Island', 'Olympic Peninsula', 10.6,  300, 'moderate', 0, 4.6],
  ['Hall of Mosses',                'Olympic Peninsula',  1.1,  100, 'easy',     0, 4.6],
  ['Marymere Falls',                'Olympic Peninsula',  1.8,  400, 'easy',     0, 4.5],
  ['Mount Storm King',              'Olympic Peninsula',  4.4, 2100, 'hard',     0, 4.6],
  ['Mount Townsend',                'Olympic Peninsula',  8.0, 3000, 'hard',     1, 4.6],
  ['Maple Pass Loop',               'North Cascades',     7.2, 2000, 'moderate', 1, 4.9],
  ['Blue Lake',                     'North Cascades',     4.4, 1050, 'easy',     1, 4.7],
  ['Cascade Pass',                  'North Cascades',     7.4, 1800, 'moderate', 0, 4.8],
  ['Thunder Knob',                  'North Cascades',     3.6,  635, 'easy',     1, 4.4],
  ['Diablo Lake Trail',             'North Cascades',     7.6, 1400, 'moderate', 1, 4.4],
  ['Hidden Lake Lookout',           'North Cascades',     8.0, 3300, 'hard',     0, 4.8]
];

// [trail, hiker, date, conditions, comment]
const reports = [
  ['Rattlesnake Ledge', 'Maya L.', '2026-10-25', 'Wet', 'Fog the whole way up, then it cleared at the ledge. Parking full by 9.'],
  ['Rattlesnake Ledge', 'Jordan P.', '2026-11-15', 'Muddy', 'Busy by 10am, views worth it. Roots are slick.'],
  ['Mount Si', 'Chris T.', '2026-10-18', 'Clear', 'Steady grind. Stopped below the haystack scramble.'],
  ['Mount Si', 'Priya S.', '2026-11-08', 'Snow above 3,000 ft', 'A few inches of snow near the top. Microspikes helped.'],
  ['Mailbox Peak (New Trail)', 'Alex R.', '2026-10-04', 'Clear', 'Brutal but fun. Signed the mailbox and saw Rainier.'],
  ['Mailbox Peak (New Trail)', 'Sam K.', '2026-11-09', 'Snow above 3,500 ft', 'Microspikes needed near the top. Cold wind on the summit.'],
  ['Snow Lake', 'Hannah W.', '2026-09-27', 'Clear', 'Lake was glassy. Huckleberries mostly done.'],
  ['Snow Lake', 'Diego M.', '2026-11-01', 'Patchy snow', 'Snow on the upper switchbacks. Quiet day.'],
  ['Franklin Falls', 'Emily C.', '2026-10-12', 'Clear', 'Great short walk with my parents. Falls were flowing well.'],
  ['Franklin Falls', 'Kenji O.', '2026-11-16', 'Icy', 'Last stretch to the falls is icy and steep. Go slow.'],
  ['Twin Falls', 'Grace H.', '2026-10-30', 'Wet', 'Mossy and green, the falls were loud after the rain.'],
  ['Twin Falls', 'Tom B.', '2026-11-18', 'Muddy', 'Easy morning hike, the bridge view is the best part.'],
  ['Kendall Katwalk', 'Leah N.', '2026-09-14', 'Clear', 'Long day on the PCT. The Katwalk is wider than it looks.'],
  ['Kendall Katwalk', 'Marcus J.', '2026-10-11', 'Frosty', 'Frost on the Katwalk in the morning, fine by noon.'],
  ['Annette Lake', 'Sofia G.', '2026-10-19', 'Wet', 'Forest the whole way, lake was misty and moody.'],
  ['Annette Lake', 'Ben A.', '2026-11-14', 'Patchy snow', 'Snow near the lake, trail easy to follow.'],
  ['Skyline Trail Loop', 'Olivia F.', '2026-08-30', 'Clear', 'Wildflowers and marmots everywhere. Panorama Point was unreal.'],
  ['Skyline Trail Loop', 'Ryan D.', '2026-10-05', 'Clear', 'Fall colors in the meadows. Started early to get parking.'],
  ['Naches Peak Loop', 'Ava M.', '2026-09-20', 'Clear', 'Go clockwise for the Rainier view. Blueberry bushes turning red.'],
  ['Naches Peak Loop', 'Noah E.', '2026-10-26', 'Snow', 'Chinook Pass may close soon, check the road before driving.'],
  ['Tolmie Peak Lookout', 'Zoe K.', '2026-09-06', 'Clear', 'Eunice Lake is a perfect lunch spot. Mowich road is rough gravel.'],
  ['Tolmie Peak Lookout', 'Ethan V.', '2026-10-03', 'Hazy', 'Some smoke but Rainier still showed up from the lookout.'],
  ['Burroughs Mountain', 'Lily S.', '2026-09-13', 'Clear', 'Felt like walking on the moon. Very windy up top.'],
  ['Burroughs Mountain', 'Owen H.', '2026-09-28', 'Snowfield', 'One steep snowfield early, poles helped.'],
  ['Comet Falls', 'Chloe R.', '2026-09-21', 'Clear', 'The falls are huge. Last part is steep and rocky.'],
  ['Comet Falls', 'Lucas W.', '2026-10-17', 'Wet', 'Mist from the falls soaked us. Worth it.'],
  ['Spray Park', 'Mia T.', '2026-08-23', 'Clear', 'Meadows full of flowers, mosquitoes too.'],
  ['Spray Park', 'Henry L.', '2026-09-26', 'Clear', 'The Spray Falls side trip is a must.'],
  ['Trail of the Shadows', 'Aria B.', '2026-10-10', 'Clear', 'Short loop with history signs. Good for kids.'],
  ['Trail of the Shadows', 'Jack P.', '2026-11-12', 'Rain', 'Quick walk while waiting for the rain to stop.'],
  ['Hurricane Hill', 'Leo C.', '2026-09-15', 'Clear', 'Paved and easy, views of the Strait and Mount Olympus.'],
  ['Hurricane Hill', 'Nora G.', '2026-10-28', 'Clear', 'Saw marmots and deer. Check that Hurricane Ridge Road is open first.'],
  ['Hoh River to Five Mile Island', 'Ella F.', '2026-10-08', 'Rain', 'Rainforest at its best. Saw elk by the river.'],
  ['Hoh River to Five Mile Island', 'Isaac M.', '2026-11-02', 'Wet', 'Almost flat, just long. Bring rain gear.'],
  ['Hall of Mosses', 'Ruby D.', '2026-10-21', 'Wet', 'Short but magical. Moss everywhere.'],
  ['Hall of Mosses', 'Caleb N.', '2026-11-11', 'Rain', 'Small crowds in the rain. Kids loved it.'],
  ['Marymere Falls', 'Stella J.', '2026-10-14', 'Clear', 'Easy walk to a tall waterfall near Lake Crescent.'],
  ['Marymere Falls', 'Wyatt R.', '2026-11-19', 'Wet', 'Stairs at the end are slippery, the falls were roaring.'],
  ['Mount Storm King', 'Layla K.', '2026-09-24', 'Clear', 'Rope section at the top is sketchy. Stopped before it, still great.'],
  ['Mount Storm King', 'Gabe S.', '2026-10-31', 'Wet', 'Very steep and muddy. View of Lake Crescent is the payoff.'],
  ['Mount Townsend', 'Iris T.', '2026-09-07', 'Clear', 'Big views of Puget Sound and Mount Baker. My dog loved it.'],
  ['Mount Townsend', 'Miles A.', '2026-10-24', 'Frosty', 'Cold on top but sunny, worth the drive.'],
  ['Maple Pass Loop', 'Hazel W.', '2026-10-03', 'Clear', 'Larches were golden. Very busy, still amazing.'],
  ['Maple Pass Loop', 'Eli B.', '2026-10-18', 'Patchy snow', 'Snow on the ridge, go counterclockwise.'],
  ['Blue Lake', 'Violet E.', '2026-09-29', 'Clear', 'The lake really is that blue. Easy and gorgeous.'],
  ['Blue Lake', 'Julian H.', '2026-10-21', 'Snow', 'Light snow at the lake. Highway 20 still open that day.'],
  ['Cascade Pass', 'Aurora L.', '2026-09-12', 'Clear', 'Lots of switchbacks, then the best pass view in the state.'],
  ['Cascade Pass', 'Theo G.', '2026-10-06', 'Clear', 'Saw mountain goats. The road to the trailhead is long gravel.'],
  ['Thunder Knob', 'Nina P.', '2026-10-01', 'Clear', 'Short with a great view of Diablo Lake.'],
  ['Thunder Knob', 'Felix O.', '2026-10-27', 'Wet', 'Easy and quiet. Good warmup hike.'],
  ['Diablo Lake Trail', 'Elena R.', '2026-09-19', 'Clear', 'Ended at the dam, the lake color was unreal.'],
  ['Diablo Lake Trail', 'Max F.', '2026-10-12', 'Clear', 'Some ups and downs, nice fall colors.'],
  ['Hidden Lake Lookout', 'Clara S.', '2026-09-05', 'Clear', 'Hardest hike I have done. The lookout view is incredible.'],
  ['Hidden Lake Lookout', 'Adam Y.', '2026-10-02', 'Snowfield', 'Snowfield below the lookout, needed an ice axe.']
];

(async () => {
  let pool;
  try {
    pool = await sql.connect({
      server: process.env.DB_SERVER,
      port: Number(process.env.DB_PORT || 1433),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      options: { encrypt: true, trustServerCertificate: true }
    });

    // 1) Create the tables (drops old copies first).
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.request().batch(schema);
    console.log('Created tables Regions, Trails, TripReports.');

    // 2) Regions. Remember each new RegionID by name.
    const regionId = {};
    for (const [name, description] of regions) {
      const r = await pool.request()
        .input('name', sql.NVarChar(50), name)
        .input('description', sql.NVarChar(200), description)
        .query('INSERT INTO dbo.Regions (Name, Description) OUTPUT INSERTED.RegionID VALUES (@name, @description);');
      regionId[name] = r.recordset[0].RegionID;
    }

    // 3) Trails. Remember each new TrailID by name.
    const trailId = {};
    for (const [name, region, miles, gain, difficulty, dogs, rating] of trails) {
      const r = await pool.request()
        .input('regionId', sql.Int, regionId[region])
        .input('name', sql.NVarChar(100), name)
        .input('miles', sql.Decimal(4, 1), miles)
        .input('gain', sql.Int, gain)
        .input('difficulty', sql.NVarChar(10), difficulty)
        .input('dogs', sql.Bit, dogs)
        .input('rating', sql.Decimal(2, 1), rating)
        .query(`INSERT INTO dbo.Trails (RegionID, Name, DistanceMiles, ElevationGainFt, Difficulty, DogFriendly, Rating)
                OUTPUT INSERTED.TrailID
                VALUES (@regionId, @name, @miles, @gain, @difficulty, @dogs, @rating);`);
      trailId[name] = r.recordset[0].TrailID;
    }

    // 4) Trip reports.
    for (const [trail, hiker, date, conditions, comment] of reports) {
      if (!trailId[trail]) throw new Error(`Trip report names an unknown trail: ${trail}`);
      await pool.request()
        .input('trailId', sql.Int, trailId[trail])
        .input('hiker', sql.NVarChar(50), hiker)
        .input('date', sql.Date, date)
        .input('conditions', sql.NVarChar(50), conditions)
        .input('comment', sql.NVarChar(300), comment)
        .query(`INSERT INTO dbo.TripReports (TrailID, HikerName, HikeDate, Conditions, Comment)
                VALUES (@trailId, @hiker, @date, @conditions, @comment);`);
    }

    console.log(`OK: loaded ${regions.length} regions, ${trails.length} trails, ${reports.length} trip reports into ${process.env.DB_NAME}.`);
  } catch (err) {
    console.log('FAILED: ' + err.message);
    console.log('Check: are you on UW Wi-Fi or Husky OnNet? Does npm run check say OK?');
    process.exitCode = 1;
  } finally {
    if (pool) await pool.close();
  }
})();
