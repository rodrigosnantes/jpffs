-- DISABLE ROW LEVEL SECURITY (The "Nuclear Option" to fix 401 errors)
alter table profiles disable row level security;
alter table players disable row level security;
alter table matches disable row level security;
alter table match_events disable row level security;

-- Verify it worked by checking policies (Optional, mainly for you to know)
-- If this runs successfully, you should be able to insert data immediately.
