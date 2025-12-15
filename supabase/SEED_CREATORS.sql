-- ============================================
-- SEED YOUR 43 LINKED CREATORS
-- ============================================
-- Run this AFTER running SETUP.sql
-- This adds all your agency-linked creators
-- ============================================

INSERT INTO linked_creators (tiktok_handle, display_name, notes, status) VALUES
  ('missxkenshin', 'missxkenshin', 'Top performer - $35K GMV', 'active'),
  ('shopaholicismyname', 'shopaholicismyname', 'Top performer - $22K GMV', 'active'),
  ('theebomeister', 'theebomeister', 'Strong performer - $16K GMV', 'active'),
  ('justkeedah', 'justkeedah', 'Strong performer - $12K GMV', 'active'),
  ('jace_rio', 'jace_rio', NULL, 'active'),
  ('kanariiskitchen', 'kanariiskitchen', 'High video CTR (13%)', 'active'),
  ('ksdealz', 'ksdealz', NULL, 'active'),
  ('biobalancehacks', 'biobalancehacks', NULL, 'active'),
  ('sarasgoodfinds', 'sarasgoodfinds', NULL, 'active'),
  ('melissa.hs77', 'melissa.hs77', NULL, 'active'),
  ('amandabeautypanda', 'amandabeautypanda', 'LIVE focused creator', 'active'),
  ('mitchhod', 'mitchhod', NULL, 'active'),
  ('levidoesdeals', 'levidoesdeals', 'LIVE focused creator', 'active'),
  ('ttshopl', 'ttshopl', NULL, 'active'),
  ('brittvibing', 'brittvibing', NULL, 'active'),
  ('chloevanscoder', 'chloevanscoder', NULL, 'active'),
  ('dealswithbrayden', 'dealswithbrayden', 'High video CTR (12%)', 'active'),
  ('ravenvaldeskenworthy', 'ravenvaldeskenworthy', NULL, 'active'),
  ('theshopplug_', 'theshopplug_', NULL, 'active'),
  ('clicked_it_bought_it', 'clicked_it_bought_it', 'High video CTR (12%)', 'active'),
  ('beachmomshopaholic', 'beachmomshopaholic', NULL, 'active'),
  ('jcshopss', 'jcshopss', NULL, 'active'),
  ('jackieboyle13', 'jackieboyle13', NULL, 'active'),
  ('minashopstoomuch', 'minashopstoomuch', NULL, 'active'),
  ('contentcreatorshop', 'contentcreatorshop', NULL, 'active'),
  ('cloverlane1111', 'cloverlane1111', 'High video CTR (11%)', 'active'),
  ('king_thurs', 'king_thurs', NULL, 'active'),
  ('gia00777', 'gia00777', 'New/inactive', 'active'),
  ('faultcod', 'faultcod', 'New/inactive', 'active'),
  ('shopwdayton', 'shopwdayton', 'New/inactive', 'active'),
  ('toptikokdeals', 'toptikokdeals', 'New/inactive', 'active'),
  ('ravenkenworthy', 'ravenkenworthy', 'New/inactive', 'active'),
  ('bestshopfindsz', 'bestshopfindsz', 'New/inactive', 'active'),
  ('simplethreadss', 'simplethreadss', 'New/inactive', 'active'),
  ('eduardosttshop', 'eduardosttshop', 'New/inactive', 'active'),
  ('sophiefleno', 'sophiefleno', 'New/inactive', 'active'),
  ('tanyarecommends', 'tanyarecommends', 'New/inactive', 'active'),
  ('dreseaj', 'dreseaj', 'New/inactive', 'active'),
  ('findsbyzan', 'findsbyzan', 'New/inactive', 'active'),
  ('justbridget5', 'justbridget5', 'New/inactive', 'active'),
  ('lindsey.stone7', 'lindsey.stone7', 'New/inactive', 'active'),
  ('gigimonique777', 'gigimonique777', 'New/inactive', 'active'),
  ('juglifts', 'juglifts', 'New/inactive', 'active')
ON CONFLICT (tiktok_handle) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Verify the insert
SELECT COUNT(*) as total_linked_creators FROM linked_creators;
