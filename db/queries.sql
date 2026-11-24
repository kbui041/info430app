-- Washington Trail Finder: the queries the app runs.
-- Open in VS Code (SQL Server extension), connect to kbui04_myapp, change the values, and run.

-- 1) The user story: trails that fit my limits, best rated first, with the latest trip report.
--    NULL means "no limit" for that filter.
DECLARE @region     NVARCHAR(50) = N'Snoqualmie Pass';  -- or NULL for any region
DECLARE @maxMiles   DECIMAL(4,1) = 8;                   -- or NULL
DECLARE @maxGain    INT          = 2500;                -- or NULL
DECLARE @difficulty NVARCHAR(10) = NULL;                -- 'easy', 'moderate', 'hard', or NULL
DECLARE @dogsOnly   BIT          = 0;                   -- 1 = dog-friendly trails only

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
ORDER BY t.Rating DESC, t.Name;

-- 2) Region list for the dropdown.
SELECT Name FROM dbo.Regions ORDER BY Name;
