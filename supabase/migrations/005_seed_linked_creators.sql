-- ============================================
-- SEED LINKED CREATORS (45 agency creators)
-- These are the TikTok handles linked to the Titans agency
-- ============================================

-- Insert all 45 linked creator handles
INSERT INTO linked_creators (tiktok_handle, status) VALUES
  ('missxkenshin', 'active'),
  ('shopaholicismyname', 'active'),
  ('theebomeister', 'active'),
  ('justkeedah', 'active'),
  ('jace_rio', 'active'),
  ('kanariiskitchen', 'active'),
  ('ksdealz', 'active'),
  ('biobalancehacks', 'active'),
  ('sarasgoodfinds', 'active'),
  ('melissa.hs77', 'active'),
  ('amandabeautypanda', 'active'),
  ('mitchhod', 'active'),
  ('levidoesdeals', 'active'),
  ('ttshopl', 'active'),
  ('brittvibing', 'active'),
  ('chloevanscoder', 'active'),
  ('dealswithbrayden', 'active'),
  ('ravenvaldeskenworthy', 'active'),
  ('theshopplug_', 'active'),
  ('clicked_it_bought_it', 'active'),
  ('beachmomshopaholic', 'active'),
  ('jcshopss', 'active'),
  ('jackieboyle13', 'active'),
  ('minashopstoomuch', 'active'),
  ('contentcreatorshop', 'active'),
  ('cloverlane1111', 'active'),
  ('king_thurs', 'active'),
  ('gia00777', 'active'),
  ('faultcod', 'active'),
  ('shopwdayton', 'active'),
  ('toptikokdeals', 'active'),
  ('ravenkenworthy', 'active'),
  ('bestshopfindsz', 'active'),
  ('simplethreadss', 'active'),
  ('eduardosttshop', 'active'),
  ('sophiefleno', 'active'),
  ('tanyarecommends', 'active'),
  ('dreseaj', 'active'),
  ('findsbyzan', 'active'),
  ('justbridget5', 'active'),
  ('lindsey.stone7', 'active'),
  ('gigimonique777', 'active'),
  ('juglifts', 'active'),
  ('britty.finds', 'active')
ON CONFLICT (tiktok_handle) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- NOTES
-- ============================================
-- These 43+ handles are from the linked_creators.csv file
-- Add additional creators as they join the agency:
-- INSERT INTO linked_creators (tiktok_handle) VALUES ('newcreator');
-- ============================================
