-- Washington Trail Finder: tables
-- Run by db/load.js (it drops and recreates them, then fills them with rows).
-- Database: kbui04_myapp

DROP TABLE IF EXISTS dbo.TripReports;
DROP TABLE IF EXISTS dbo.Trails;
DROP TABLE IF EXISTS dbo.Regions;

-- One row per area of the state (Snoqualmie Pass, Mount Rainier, ...)
CREATE TABLE dbo.Regions (
  RegionID    INT IDENTITY(1,1) PRIMARY KEY,
  Name        NVARCHAR(50)  NOT NULL UNIQUE,
  Description NVARCHAR(200) NULL
);

-- One row per trail. Each trail is in exactly one region.
CREATE TABLE dbo.Trails (
  TrailID         INT IDENTITY(1,1) PRIMARY KEY,
  RegionID        INT NOT NULL REFERENCES dbo.Regions(RegionID),
  Name            NVARCHAR(100) NOT NULL UNIQUE,
  DistanceMiles   DECIMAL(4,1)  NOT NULL CHECK (DistanceMiles > 0),      -- round trip
  ElevationGainFt INT           NOT NULL CHECK (ElevationGainFt >= 0),
  Difficulty      NVARCHAR(10)  NOT NULL CHECK (Difficulty IN ('easy','moderate','hard')),
  DogFriendly     BIT           NOT NULL,
  Rating          DECIMAL(2,1)  NOT NULL CHECK (Rating BETWEEN 0 AND 5)
);

-- One row per hiker's trip report. Each report is about one trail.
CREATE TABLE dbo.TripReports (
  ReportID   INT IDENTITY(1,1) PRIMARY KEY,
  TrailID    INT NOT NULL REFERENCES dbo.Trails(TrailID),
  HikerName  NVARCHAR(50)  NOT NULL,
  HikeDate   DATE          NOT NULL,
  Conditions NVARCHAR(50)  NOT NULL,
  Comment    NVARCHAR(300) NOT NULL
);
