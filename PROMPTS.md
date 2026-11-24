# What I asked the AI

Keep a short log. One entry per prompt is enough.

I used Claude (claude.ai, connected to this folder) instead of Copilot.

| What I asked (paste or summarize) | What happened | What I had to fix or check |
| --- | --- | --- |
| "What are some project ideas for this project?" then "something interesting, maybe hiking or sports or travel" | Got idea lists; I picked a Washington trail finder. Claude filled in IDEA.md with my domain and user story. | Checked the user story matched what I wanted. |
| Set up my laptop (step 3), gave my NetID kbui04 | Claude made .env with DB_NAME=kbui04_myapp and left the password blank. I ran npm install, create-db, and check. | Pasted the Canvas password into .env myself. npm run check printed OK. |
| Build step 4a: page + server with made-up rows | Claude wrote web/index.html (filters + 3 sample trails) and server/server.js (serves the page). | npm start failed with EADDRINUSE: an old server was already on port 3000. Stopped it and restarted. |
| Build step 4b: tables, data, query, API | Claude wrote db/schema.sql (Regions, Trails, TripReports with PK/FK), db/load.js (27 real WA trails, 54 made-up trip reports), db/queries.sql, and /api/trails + /api/regions in server.js using parameters. | Ran node db/load.js. Checked Snoqualmie Pass, 8 mi, 2,500 ft returns 5 trails and not Mount Si/Mailbox. Typed ' OR 1=1 -- and got no rows. Dog-friendly hides all Rainier trails. |
| "Make the UI/UX look better" | Claude redesigned the page: mountain header, sliders, difficulty buttons, dog toggle, trail cards, sort menu, loading/empty/error states, phone layout. | Reloaded the page and checked the filters still use the database. |
