-- ============================================================
-- Yoink It — Seed Data: 10 users + 20 items
-- Run in Supabase SQL editor AFTER running schema.sql
-- ============================================================
--
-- User ID reference:
--   u01  Sarah Chen       a1000000-0000-0000-0000-000000000001
--   u02  Marcus Williams  a1000000-0000-0000-0000-000000000002
--   u03  Emily Rodriguez  a1000000-0000-0000-0000-000000000003
--   u04  James Thompson   a1000000-0000-0000-0000-000000000004
--   u05  Aisha Patel      a1000000-0000-0000-0000-000000000005
--   u06  Derek Johnson    a1000000-0000-0000-0000-000000000006
--   u07  Nicole Foster    a1000000-0000-0000-0000-000000000007
--   u08  Ryan Park        a1000000-0000-0000-0000-000000000008
--   u09  Lucia Morales    a1000000-0000-0000-0000-000000000009
--   u10  Tom Bradley      a1000000-0000-0000-0000-00000000000a
--
-- Claiming relationships:
--   Sarah's KitchenAid Mixer    → claimed by Marcus,  waitlist: Emily, Aisha
--   Marcus's Bookshelf          → claimed by James,   waitlist: Nicole
--   James's Dell Monitor        → claimed by Ryan,    waitlist: Derek, Tom
--   Derek's Garden Tool Set     → claimed by Tom,     waitlist: (none)
--   Nicole's Baby Stroller      → claimed by Lucia,   waitlist: (none)
--   Ryan's Trek Mountain Bike   → claimed by Derek,   waitlist: Marcus
--   Tom's DeWalt Power Tools    → claimed by Sarah,   waitlist: Emily
-- ============================================================

-- ── 1. Auth users (needed for FK into public.profiles) ────────
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sarah.chen@seed.yoinkit',       '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','marcus.williams@seed.yoinkit',  '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emily.rodriguez@seed.yoinkit',  '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','james.thompson@seed.yoinkit',   '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','aisha.patel@seed.yoinkit',       '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','derek.johnson@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','nicole.foster@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ryan.park@seed.yoinkit',         '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lucia.morales@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tom.bradley@seed.yoinkit',       '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00')
on conflict (id) do nothing;

-- ── 2. Profiles ───────────────────────────────────────────────
insert into public.profiles (id, name, email, phone, default_address, item_visibility, friends) values

  ('a1000000-0000-0000-0000-000000000001', 'Sarah Chen', 'sarah.chen@seed.yoinkit', '+14155550101', '742 Evergreen Terrace, San Francisco, CA 94117', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000002', 'Marcus Williams', 'marcus.williams@seed.yoinkit', '+13105550102', '1600 Melrose Ave, Los Angeles, CA 90046', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000003', 'Emily Rodriguez', 'emily.rodriguez@seed.yoinkit', '+17185550103', '350 Fifth Ave, New York, NY 10118', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000004', 'James Thompson', 'james.thompson@seed.yoinkit', '+17735550104', '233 S Wacker Dr, Chicago, IL 60606', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000005', 'Aisha Patel', 'aisha.patel@seed.yoinkit', '+14695550105', '1 Main St, Austin, TX 78701', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000006', 'Derek Johnson', 'derek.johnson@seed.yoinkit', '+14045550106', '191 Peachtree St NE, Atlanta, GA 30303', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000007', 'Nicole Foster', 'nicole.foster@seed.yoinkit', '+12065550107', '400 Broad St, Seattle, WA 98109', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000008', 'Ryan Park', 'ryan.park@seed.yoinkit', '+16175550108', '1 Infinite Loop, Cambridge, MA 02139', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-000000000009', 'Lucia Morales', 'lucia.morales@seed.yoinkit', '+13035550109', '16th & Mission, Denver, CO 80202', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-00000000000a']::uuid[]),

  ('a1000000-0000-0000-0000-00000000000a', 'Tom Bradley', 'tom.bradley@seed.yoinkit', '+16025550110', '1 Renaissance Square, Phoenix, AZ 85004', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009']::uuid[])

on conflict (id) do nothing;

-- ── 3. Items ──────────────────────────────────────────────────
insert into public.items (
  id, donor_id, title, description, photos, condition,
  restrictions, pickup_location, pickup_window,
  disposal_date, disposal_method, claim_pickup_hours,
  status, claimed_by, claim_deadline, waitlist
) values

-- ── Sarah Chen (kitchen) ──────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'KitchenAid Artisan Stand Mixer',
  'Barely used KitchenAid Artisan 5-qt stand mixer in Empire Red. Comes with the dough hook, flat beater, and wire whisk. I upgraded to a larger model — this one is in perfect condition. Would love it to go to someone who bakes!',
  ARRAY[
    'https://picsum.photos/id/292/800/600',
    'https://picsum.photos/id/431/800/600',
    'https://picsum.photos/id/1060/800/600'
  ],
  'excellent',
  'Pick up only — it''s heavy! Please bring someone to help carry.',
  '742 Evergreen Terrace, San Francisco, CA 94117',
  'Weekends 10am–4pm or weekday evenings after 6pm',
  now() + interval '21 days',
  'goodwill',
  72,
  'available',
  'a1000000-0000-0000-0000-000000000002',
  now() + interval '3 days',
  ARRAY['a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005']::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Le Creuset 5.5qt Dutch Oven',
  'Classic Le Creuset enameled cast-iron Dutch oven in Marseille blue. A few minor cosmetic chips on the exterior enamel but the interior is pristine. Perfect for soups, stews, and bread baking. Retail is $400+.',
  ARRAY[
    'https://picsum.photos/id/766/800/600',
    'https://picsum.photos/id/1080/800/600'
  ],
  'good',
  null,
  '742 Evergreen Terrace, San Francisco, CA 94117',
  'Weekends 10am–4pm',
  now() + interval '28 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Marcus Williams (furniture) ───────────────────────────────

(
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  'Scandinavian Solid Oak Bookshelf',
  '6-shelf solid oak bookshelf, 72" tall x 32" wide. Danish modern style with clean lines. Some wear on the top shelf but otherwise sturdy and beautiful. Disassembles for transport — all hardware included.',
  ARRAY[
    'https://picsum.photos/id/1040/800/600',
    'https://picsum.photos/id/1030/800/600',
    'https://picsum.photos/id/1041/800/600'
  ],
  'good',
  'Must have a truck or large SUV — does not fit in a sedan.',
  '1600 Melrose Ave, Los Angeles, CA 90046',
  'Saturday or Sunday, anytime between 9am–5pm',
  now() + interval '14 days',
  'habitat',
  96,
  'available',
  'a1000000-0000-0000-0000-000000000004',
  now() + interval '4 days',
  ARRAY['a1000000-0000-0000-0000-000000000007']::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000002',
  'West Elm Leather Sectional Sofa',
  'West Elm Hamilton sectional in warm saddle leather. 3-seat sofa + chaise. Some scuffs consistent with normal use — leather conditioner will bring it right back. Moving overseas, cannot take it with me.',
  ARRAY[
    'https://picsum.photos/id/1037/800/600',
    'https://picsum.photos/id/1025/800/600'
  ],
  'fair',
  'Requires at least 3 people and a moving truck. I can help disassemble.',
  '1600 Melrose Ave, Los Angeles, CA 90046',
  'Flexible — just give 24hr notice',
  now() + interval '10 days',
  'salvation_army',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Emily Rodriguez (books) ───────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000003',
  'Complete Harry Potter Hardcover Set',
  'All 7 Harry Potter books in hardcover, US first edition prints. Books 1–5 are in excellent shape. Books 6–7 show spine wear from reading. No writing or highlighting inside. A complete set is hard to find!',
  ARRAY[
    'https://picsum.photos/id/24/800/600',
    'https://picsum.photos/id/374/800/600'
  ],
  'good',
  null,
  '350 Fifth Ave, New York, NY 10118',
  'Weekdays after 5pm, weekends anytime',
  now() + interval '30 days',
  'other_charity',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000003',
  'Art History Textbook Collection (20 books)',
  'My entire art history library from grad school — Janson''s, Stokstad, Gombrich, and 17 others. Mix of undergrad and graduate level texts. Heavy — plan accordingly. Great for students or serious collectors.',
  ARRAY[
    'https://picsum.photos/id/1029/800/600',
    'https://picsum.photos/id/247/800/600'
  ],
  'good',
  'These are heavy! Plan on two trips or bring a cart.',
  '350 Fifth Ave, New York, NY 10118',
  'Weekends only, 10am–3pm',
  now() + interval '21 days',
  'other_charity',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── James Thompson (electronics) ─────────────────────────────

(
  'b1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000004',
  'Dell 27" 4K UltraSharp Monitor',
  'Dell U2720Q 27-inch 4K USB-C monitor. Bought for WFH and now I''m back in office full-time. Minor scratch on the bezel (not on screen). Includes power cable and USB-C cable. Factory reset done.',
  ARRAY[
    'https://picsum.photos/id/180/800/600',
    'https://picsum.photos/id/119/800/600',
    'https://picsum.photos/id/442/800/600'
  ],
  'good',
  null,
  '233 S Wacker Dr, Chicago, IL 60606',
  'Mon–Fri 9am–6pm (lobby pickup)',
  now() + interval '14 days',
  'trash',
  72,
  'available',
  'a1000000-0000-0000-0000-000000000008',
  now() + interval '2 days',
  ARRAY['a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-00000000000a']::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000004',
  'Keychron K2 Mechanical Keyboard',
  'Keychron K2 v2 with Gateron Brown switches and white backlight. Hot-swappable. Great condition, used about 6 months. Includes original box, USB-C cable, and extra keycap set. Works with Mac and Windows.',
  ARRAY[
    'https://picsum.photos/id/0/800/600',
    'https://picsum.photos/id/159/800/600'
  ],
  'excellent',
  null,
  '233 S Wacker Dr, Chicago, IL 60606',
  'Weekdays 12pm–2pm or after 5pm',
  now() + interval '21 days',
  'keep',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Aisha Patel (clothing) ────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000005',
  'Burberry Wool Trench Coat (Size 8)',
  'Authentic Burberry Nova Check wool trench coat in camel, women''s size 8. Dry cleaned and stored properly. Belt and all buttons intact. Moving to Miami — this coat has no place in my new life!',
  ARRAY[
    'https://picsum.photos/id/1059/800/600',
    'https://picsum.photos/id/200/800/600'
  ],
  'excellent',
  'Women''s size 8 / EU 38. Please check sizing before claiming.',
  '1 Main St, Austin, TX 78701',
  'Evenings after 6pm or weekends',
  now() + interval '14 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

(
  'b1000000-0000-0000-0000-00000000000a',
  'a1000000-0000-0000-0000-000000000005',
  'Vintage Silk Scarf Collection (12 scarves)',
  'Curated collection of 12 vintage silk scarves — includes 2 Hermès-style prints, several Liberty of London florals, and a few geometric patterns. All in excellent condition. Great gift or closet addition.',
  ARRAY[
    'https://picsum.photos/id/219/800/600',
    'https://picsum.photos/id/1015/800/600'
  ],
  'excellent',
  null,
  '1 Main St, Austin, TX 78701',
  'Flexible — just message ahead',
  now() + interval '21 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Derek Johnson (outdoor/garden) ───────────────────────────

(
  'b1000000-0000-0000-0000-00000000000b',
  'a1000000-0000-0000-0000-000000000006',
  'Fiskars Garden Tool Set (7 pieces)',
  'Complete Fiskars garden set: pruning shears, loppers, trowel, cultivator, transplanter, weeder, and soil scoop. All in good working condition. Blades sharp. Moving to a condo — no garden anymore.',
  ARRAY[
    'https://picsum.photos/id/175/800/600',
    'https://picsum.photos/id/145/800/600'
  ],
  'good',
  null,
  '191 Peachtree St NE, Atlanta, GA 30303',
  'Weekends 8am–12pm',
  now() + interval '14 days',
  'goodwill',
  72,
  'available',
  'a1000000-0000-0000-0000-00000000000a',
  now() + interval '5 days',
  ARRAY[]::uuid[]
),

(
  'b1000000-0000-0000-0000-00000000000c',
  'a1000000-0000-0000-0000-000000000006',
  'Weber Performer Charcoal Grill',
  'Weber Performer Deluxe 22" charcoal grill with propane ignition and built-in work table. Grates clean, propane ignition works. One wheel has a slight wobble but it''s stable. Cover included.',
  ARRAY[
    'https://picsum.photos/id/984/800/600',
    'https://picsum.photos/id/674/800/600',
    'https://picsum.photos/id/488/800/600'
  ],
  'fair',
  'Very heavy — bring help and a truck.',
  '191 Peachtree St NE, Atlanta, GA 30303',
  'Saturday mornings 8am–11am only',
  now() + interval '10 days',
  'trash',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Nicole Foster (baby/kids) ─────────────────────────────────

(
  'b1000000-0000-0000-0000-00000000000d',
  'a1000000-0000-0000-0000-000000000007',
  'BOB Revolution Flex 3.0 Jogging Stroller',
  'BOB Revolution Flex 3.0 jogging stroller in yellow. Used for about 18 months, very well maintained. Air-filled tires recently pumped. Swivel lock for running, 5-point harness. Our daughter outgrew it.',
  ARRAY[
    'https://picsum.photos/id/453/800/600',
    'https://picsum.photos/id/395/800/600',
    'https://picsum.photos/id/1062/800/600'
  ],
  'good',
  null,
  '400 Broad St, Seattle, WA 98109',
  'Weekdays after 4pm, weekends anytime',
  now() + interval '21 days',
  'goodwill',
  72,
  'available',
  'a1000000-0000-0000-0000-000000000009',
  now() + interval '6 days',
  ARRAY[]::uuid[]
),

(
  'b1000000-0000-0000-0000-00000000000e',
  'a1000000-0000-0000-0000-000000000007',
  'Fisher-Price Jumperoo Baby Activity Center',
  'Fisher-Price Rainforest Jumperoo in excellent condition. Lights and sounds all work. Height-adjustable seat. Used for about 4 months. Washed and sanitized. Ideal for babies 6–9 months.',
  ARRAY[
    'https://picsum.photos/id/486/800/600',
    'https://picsum.photos/id/184/800/600'
  ],
  'excellent',
  null,
  '400 Broad St, Seattle, WA 98109',
  'Flexible — message to arrange',
  now() + interval '30 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Ryan Park (sports/fitness) ────────────────────────────────

(
  'b1000000-0000-0000-0000-00000000000f',
  'a1000000-0000-0000-0000-000000000008',
  'Trek Marlin 7 Mountain Bike (Medium)',
  'Trek Marlin 7 hardtail mountain bike, 2021, size medium (17.5"). Hydraulic disc brakes, 1x8 drivetrain, RockShox Judy fork. New tires installed last spring. Light surface scratches only. Helmet available too.',
  ARRAY[
    'https://picsum.photos/id/274/800/600',
    'https://picsum.photos/id/164/800/600',
    'https://picsum.photos/id/375/800/600'
  ],
  'good',
  'Best for riders 5''8" to 6''0".',
  '1 Infinite Loop, Cambridge, MA 02139',
  'Weekends 9am–2pm',
  now() + interval '14 days',
  'keep',
  72,
  'available',
  'a1000000-0000-0000-0000-000000000006',
  now() + interval '4 days',
  ARRAY['a1000000-0000-0000-0000-000000000002']::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000010',
  'a1000000-0000-0000-0000-000000000008',
  'Lululemon & Manduka Yoga Mat Bundle',
  'Two yoga mats: a Lululemon The Mat 5mm in purple (lightly used) and a Manduka PRO 6mm in black (barely used). Both cleaned and rolled. Plus 2 foam blocks and a strap. Perfect starter bundle.',
  ARRAY[
    'https://picsum.photos/id/1039/800/600',
    'https://picsum.photos/id/447/800/600'
  ],
  'excellent',
  null,
  '1 Infinite Loop, Cambridge, MA 02139',
  'Any day after 5pm or weekends',
  now() + interval '30 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Lucia Morales (home decor) ────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000009',
  'Gallery Wall Art Print Set (9 prints)',
  'Curated set of 9 art prints in 8x10 format — a mix of botanical illustrations, abstract watercolors, and vintage travel posters. All matted but unframed. Pulled them down when redecorating. They''re beautiful!',
  ARRAY[
    'https://picsum.photos/id/326/800/600',
    'https://picsum.photos/id/379/800/600',
    'https://picsum.photos/id/1074/800/600'
  ],
  'excellent',
  null,
  '16th & Mission, Denver, CO 80202',
  'Evenings 6–9pm or Saturday mornings',
  now() + interval '30 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000009',
  'Moroccan Pouf + Throw Pillow Set',
  'Genuine leather Moroccan pouf in teal (slightly flat, needs restuffing with cotton batting) plus 4 matching embroidered throw pillows in jewel tones. All hand-stitched. Upgrading my living room.',
  ARRAY[
    'https://picsum.photos/id/325/800/600',
    'https://picsum.photos/id/1025/800/600'
  ],
  'fair',
  'Pouf needs restuffing — about $10 of cotton batting from any craft store.',
  '16th & Mission, Denver, CO 80202',
  'Flexible — just text ahead',
  now() + interval '21 days',
  'other_charity',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- ── Tom Bradley (tools) ───────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-00000000000a',
  'DeWalt 20V MAX 7-Tool Combo Kit',
  'DeWalt DCK771D2 7-tool combo: drill/driver, impact driver, circular saw, jig saw, reciprocating saw, oscillating tool, and LED light. Two 2Ah batteries, charger, and case. Everything works great — retiring after 30 years of DIY!',
  ARRAY[
    'https://picsum.photos/id/162/800/600',
    'https://picsum.photos/id/442/800/600',
    'https://picsum.photos/id/279/800/600'
  ],
  'good',
  'Please only claim if you plan to actually use them — tools deserve a good home!',
  '1 Renaissance Square, Phoenix, AZ 85004',
  'Weekends 7am–12pm',
  now() + interval '14 days',
  'keep',
  72,
  'available',
  'a1000000-0000-0000-0000-000000000001',
  now() + interval '3 days',
  ARRAY['a1000000-0000-0000-0000-000000000003']::uuid[]
),

(
  'b1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-00000000000a',
  'Werner 28ft Extension Ladder',
  'Werner D1228-2 28-foot fiberglass extension ladder, Type I (250 lb rated). Solid condition, no bending or damage. Rubber feet in good shape. Just don''t need it anymore — bought it for a one-time project.',
  ARRAY[
    'https://picsum.photos/id/398/800/600',
    'https://picsum.photos/id/162/800/600'
  ],
  'good',
  'You''ll need a truck or at least a large roof rack.',
  '1 Renaissance Square, Phoenix, AZ 85004',
  'Saturday or Sunday mornings only',
  now() + interval '21 days',
  'keep',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
)

on conflict (id) do nothing;

-- ── 4. Fix: mark claimed items with correct status ─────────────
update public.items set status = 'claimed'
where id in (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000007',
  'b1000000-0000-0000-0000-00000000000b',
  'b1000000-0000-0000-0000-00000000000d',
  'b1000000-0000-0000-0000-00000000000f',
  'b1000000-0000-0000-0000-000000000013'
);

-- ============================================================
-- Additional 10 users (u11–u20) + 20 items
-- User ID reference:
--   u11  Priya Sharma     a1000000-0000-0000-0000-00000000000b
--   u12  Carlos Mendez   a1000000-0000-0000-0000-00000000000c
--   u13  Jessica Wu      a1000000-0000-0000-0000-00000000000d
--   u14  David Kim       a1000000-0000-0000-0000-00000000000e
--   u15  Rachel Green    a1000000-0000-0000-0000-00000000000f
--   u16  Omar Hassan     a1000000-0000-0000-0000-000000000010
--   u17  Stephanie Lee   a1000000-0000-0000-0000-000000000011
--   u18  Ben Torres      a1000000-0000-0000-0000-000000000012
--   u19  Megan O'Brien   a1000000-0000-0000-0000-000000000013
--   u20  Andre Jackson   a1000000-0000-0000-0000-000000000014
-- ============================================================

-- ── 5. Auth users ─────────────────────────────────────────────
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('a1000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','priya.sharma@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','carlos.mendez@seed.yoinkit',   '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000000','authenticated','authenticated','jessica.wu@seed.yoinkit',      '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-000000000000','authenticated','authenticated','david.kim@seed.yoinkit',       '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-00000000000f','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rachel.green@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','omar.hassan@seed.yoinkit',     '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','stephanie.lee@seed.yoinkit',   '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ben.torres@seed.yoinkit',      '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','megan.obrien@seed.yoinkit',    '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','andre.jackson@seed.yoinkit',   '','2024-01-01 00:00:00+00','{"provider":"email","providers":["email"]}','{}','2024-01-01 00:00:00+00','2024-01-01 00:00:00+00')
on conflict (id) do nothing;

-- ── 6. Profiles ───────────────────────────────────────────────
insert into public.profiles (id, name, email, phone, default_address, item_visibility, friends) values

  ('a1000000-0000-0000-0000-00000000000b', 'Priya Sharma', 'priya.sharma@seed.yoinkit', '+15035550105', '1234 NW Burnside St, Portland, OR 97209', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-00000000000c', 'Carlos Mendez', 'carlos.mendez@seed.yoinkit', '+13055550106', '800 Brickell Ave, Miami, FL 33131', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-00000000000d', 'Jessica Wu', 'jessica.wu@seed.yoinkit', '+17135550107', '1801 Main St, Houston, TX 77002', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-00000000000e', 'David Kim', 'david.kim@seed.yoinkit', '+16195550108', '1000 Kettner Blvd, San Diego, CA 92101', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-00000000000f', 'Rachel Green', 'rachel.green@seed.yoinkit', '+16155550109', '100 Broadway, Nashville, TN 37201', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-000000000010', 'Omar Hassan', 'omar.hassan@seed.yoinkit', '+16125550110', '100 Washington Ave S, Minneapolis, MN 55401', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-000000000011', 'Stephanie Lee', 'stephanie.lee@seed.yoinkit', '+15035550111', '2233 NW Westover Rd, Portland, OR 97210', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-000000000012', 'Ben Torres', 'ben.torres@seed.yoinkit', '+12155550112', '1500 Market St, Philadelphia, PA 19102', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-000000000013', 'Megan O''Brien', 'megan.obrien@seed.yoinkit', '+16175550113', '100 Boylston St, Boston, MA 02116', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000014']::uuid[]),

  ('a1000000-0000-0000-0000-000000000014', 'Andre Jackson', 'andre.jackson@seed.yoinkit', '+15045550114', '900 Canal St, New Orleans, LA 70112', 'both',
   ARRAY['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-00000000000a','a1000000-0000-0000-0000-00000000000b','a1000000-0000-0000-0000-00000000000c','a1000000-0000-0000-0000-00000000000d','a1000000-0000-0000-0000-00000000000e','a1000000-0000-0000-0000-00000000000f','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000013']::uuid[])

on conflict (id) do nothing;

-- ── 7. Make existing users friends with the 10 new users ──────
update public.profiles set friends = array(
  select distinct unnest(friends || ARRAY[
    'a1000000-0000-0000-0000-00000000000b'::uuid,
    'a1000000-0000-0000-0000-00000000000c'::uuid,
    'a1000000-0000-0000-0000-00000000000d'::uuid,
    'a1000000-0000-0000-0000-00000000000e'::uuid,
    'a1000000-0000-0000-0000-00000000000f'::uuid,
    'a1000000-0000-0000-0000-000000000010'::uuid,
    'a1000000-0000-0000-0000-000000000011'::uuid,
    'a1000000-0000-0000-0000-000000000012'::uuid,
    'a1000000-0000-0000-0000-000000000013'::uuid,
    'a1000000-0000-0000-0000-000000000014'::uuid
  ])
)
where id in (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-00000000000a'
);

-- ── 8. Give items from new users ──────────────────────────────
insert into public.items (
  id, donor_id, title, description, photos, condition,
  restrictions, pickup_location, pickup_window,
  disposal_date, disposal_method, claim_pickup_hours,
  status, claimed_by, claim_deadline, waitlist
) values

-- Priya Sharma
(
  'b1000000-0000-0000-0000-000000000015',
  'a1000000-0000-0000-0000-00000000000b',
  'Lululemon Yoga Mat + Block Set',
  'Lululemon The Mat 5mm in midnight navy (lightly used), two cork yoga blocks, a stretch strap, and a Manduka mat bag. Cleaned and ready to go. Switching to a studio practice.',
  ARRAY['https://picsum.photos/id/1039/800/600','https://picsum.photos/id/447/800/600'],
  'excellent',
  null,
  '1234 NW Burnside St, Portland, OR 97209',
  'Evenings after 6pm or weekends',
  now() + interval '14 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Carlos Mendez
(
  'b1000000-0000-0000-0000-000000000017',
  'a1000000-0000-0000-0000-00000000000c',
  '4-Piece Wicker Outdoor Patio Set',
  'All-weather resin wicker sectional — two loveseats, a coffee table, and an armchair. Cushions are weatherproof and clean. Selling the house, can''t take it with me.',
  ARRAY['https://picsum.photos/id/577/800/600','https://picsum.photos/id/280/800/600'],
  'good',
  'Must have a truck or large SUV for transport.',
  '800 Brickell Ave, Miami, FL 33131',
  'Saturday or Sunday mornings',
  now() + interval '10 days',
  'other_charity',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Jessica Wu
(
  'b1000000-0000-0000-0000-000000000019',
  'a1000000-0000-0000-0000-00000000000d',
  'Maternity Wardrobe Box (Size S/M)',
  'Box of 20+ maternity pieces — jeans, leggings, flowy tops, two work blouses, and a maxi dress. Brands include ASOS Maternity, H&M, and Motherhood. All washed and folded.',
  ARRAY['https://picsum.photos/id/1059/800/600','https://picsum.photos/id/200/800/600'],
  'good',
  'Size small/medium pre-pregnancy (fits up to 36 weeks).',
  '1801 Main St, Houston, TX 77002',
  'Any day after 5pm',
  now() + interval '21 days',
  'other_charity',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- David Kim
(
  'b1000000-0000-0000-0000-00000000001b',
  'a1000000-0000-0000-0000-00000000000e',
  'Shortboard Surfboard (6''2") + Wetsuit',
  'Firewire 6''2" shortboard in great shape — no delams, two small dings on the rail (repaired). Includes a 3/2mm O''Neill Psychofreak fullsuit (size medium) and a board sock.',
  ARRAY['https://picsum.photos/id/974/800/600','https://picsum.photos/id/875/800/600'],
  'good',
  'Best for intermediate surfers, ~150–185 lbs.',
  '1000 Kettner Blvd, San Diego, CA 92101',
  'Weekends, arrange by Friday',
  now() + interval '14 days',
  'keep',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Rachel Green
(
  'b1000000-0000-0000-0000-00000000001d',
  'a1000000-0000-0000-0000-00000000000f',
  'Yamaha FG800 Acoustic Guitar + Hard Case',
  'Yamaha FG800 dreadnought acoustic — solid spruce top, nato back and sides. Light pick marks near the soundhole, frets in great shape. Includes a TSA-lockable SKB hard case and a clip tuner.',
  ARRAY['https://picsum.photos/id/145/800/600','https://picsum.photos/id/1/800/600'],
  'good',
  null,
  '100 Broadway, Nashville, TN 37201',
  'Afternoons Mon–Sat',
  now() + interval '30 days',
  'goodwill',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Omar Hassan
(
  'b1000000-0000-0000-0000-00000000001f',
  'a1000000-0000-0000-0000-000000000010',
  'Salomon Cross-Country Ski Set (170cm)',
  'Complete classic XC ski set: Salomon 170cm skis, Salomon bindings, Escape 7 boots (size 10), and Swix carbon poles (140cm). Waxed and ready. Moving to Arizona.',
  ARRAY['https://picsum.photos/id/392/800/600','https://picsum.photos/id/384/800/600'],
  'good',
  'Fits approximately a size 10 ski boot / men''s 10 shoe.',
  '100 Washington Ave S, Minneapolis, MN 55401',
  'Weekends 9am–1pm',
  now() + interval '21 days',
  'goodwill',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Stephanie Lee
(
  'b1000000-0000-0000-0000-000000000021',
  'a1000000-0000-0000-0000-000000000011',
  'Vinyl Record Collection (75+ LPs)',
  'Curated collection of 75+ LPs — heavy on jazz (Coltrane, Miles, Monk), soul (Marvin Gaye, Aretha), and classic rock. Most are VG+ or better. Full tracklist available. Downsizing.',
  ARRAY['https://picsum.photos/id/493/800/600','https://picsum.photos/id/1074/800/600'],
  'good',
  null,
  '2233 NW Westover Rd, Portland, OR 97210',
  'Saturdays 11am–4pm',
  now() + interval '14 days',
  'other_charity',
  96,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Ben Torres
(
  'b1000000-0000-0000-0000-000000000023',
  'a1000000-0000-0000-0000-000000000012',
  'Herman Miller Aeron Chair (Size B)',
  'Fully loaded Aeron in graphite — PostureFit SL, adjustable arms, lumbar support. Size B (fits up to 6''2" / 185 lbs). Minor scuffs on the base, everything functions perfectly. Retail $1,400+.',
  ARRAY['https://picsum.photos/id/239/800/600','https://picsum.photos/id/160/800/600'],
  'good',
  'Bring help — it''s heavy.',
  '1500 Market St, Philadelphia, PA 19102',
  'Weekends only',
  now() + interval '21 days',
  'keep',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Megan O'Brien
(
  'b1000000-0000-0000-0000-000000000025',
  'a1000000-0000-0000-0000-000000000013',
  'XL Dog Crate + Orthopedic Bed',
  'Impact collapsible crate (42"L x 28"W x 30"H) — fits labs, goldens, border collies. Comes with an Orvis memory-foam orthopedic bed. Dog adopted a crate-free lifestyle. Both clean and like new.',
  ARRAY['https://picsum.photos/id/1062/800/600','https://picsum.photos/id/453/800/600'],
  'excellent',
  'Please only claim if you have a large breed. Crate won''t fit in a sedan.',
  '100 Boylston St, Boston, MA 02116',
  'Any morning before noon',
  now() + interval '30 days',
  'goodwill',
  48,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
),

-- Andre Jackson
(
  'b1000000-0000-0000-0000-000000000027',
  'a1000000-0000-0000-0000-000000000014',
  'Lodge Cast Iron Cookware Set (5 pieces)',
  'Lodge 5-piece set: 8" skillet, 10" skillet, 12" skillet with lid, and a 5-quart dutch oven with lid. All pre-seasoned and well-maintained. Moving into a smaller place with an induction cooktop.',
  ARRAY['https://picsum.photos/id/431/800/600','https://picsum.photos/id/292/800/600'],
  'good',
  null,
  '900 Canal St, New Orleans, LA 70112',
  'Evenings after 6pm or Saturday mornings',
  now() + interval '14 days',
  'other_charity',
  72,
  'available',
  null,
  null,
  ARRAY[]::uuid[]
)

on conflict (id) do nothing;

-- ── 9. Borrow items from new users ────────────────────────────
insert into public.items (
  id, donor_id, title, description, photos, condition,
  restrictions, pickup_location, pickup_window,
  disposal_date, disposal_method, claim_pickup_hours,
  status, waitlist, listing_type, borrow_requests, blocked_periods
) values

-- Priya Sharma
(
  'b1000000-0000-0000-0000-000000000016',
  'a1000000-0000-0000-0000-00000000000b',
  'Zojirushi Bread Machine',
  'Zojirushi BB-PDC20 2lb bread maker — programmed for everything from white to gluten-free. Measuring cup, spoon, and kneading blade included. Returns with the paddle clean, please.',
  ARRAY['https://picsum.photos/id/766/800/600'],
  'excellent',
  null,
  '1234 NW Burnside St, Portland, OR 97209',
  'Weekends 10am–4pm',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
),

-- Carlos Mendez
(
  'b1000000-0000-0000-0000-000000000018',
  'a1000000-0000-0000-0000-00000000000c',
  'Electric Pressure Washer (3000 PSI)',
  'Sun Joe SPX3001 3000 PSI pressure washer with 20-foot hose, five quick-connect nozzles, and onboard detergent tank. Great for driveways, fences, and patio furniture.',
  ARRAY['https://picsum.photos/id/116/800/600','https://picsum.photos/id/488/800/600'],
  'good',
  null,
  '800 Brickell Ave, Miami, FL 33131',
  'Weekdays after 5pm or weekends',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[{"start":"2026-06-14","end":"2026-06-21","note":"Out of town"}]'::jsonb
),

-- Jessica Wu
(
  'b1000000-0000-0000-0000-00000000001a',
  'a1000000-0000-0000-0000-00000000000d',
  'Nanit Pro Baby Monitor + Floor Stand',
  'Nanit Pro smart baby monitor with floor stand, breathing-wear band, and two months of Insights subscription remaining. HD video, sleep tracking, two-way audio. Return it with the stand folded.',
  ARRAY['https://picsum.photos/id/486/800/600','https://picsum.photos/id/184/800/600'],
  'excellent',
  'Families with infants under 12 months only.',
  '1801 Main St, Houston, TX 77002',
  'Evenings after 6pm',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
),

-- David Kim
(
  'b1000000-0000-0000-0000-00000000001c',
  'a1000000-0000-0000-0000-00000000000e',
  'Tern GSD Cargo E-Bike',
  'Tern GSD S10 long-tail cargo e-bike — dual battery, 400 lb payload, 10-speed Shimano Deore, hydraulic disc brakes. Can carry two kids or a week of groceries. Comes with two helmets.',
  ARRAY['https://picsum.photos/id/274/800/600','https://picsum.photos/id/164/800/600'],
  'excellent',
  null,
  '1000 Kettner Blvd, San Diego, CA 92101',
  'Weekends only',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[{"start":"2026-06-04","end":"2026-06-11","note":"In for tune-up"}]'::jsonb
),

-- Rachel Green
(
  'b1000000-0000-0000-0000-00000000001e',
  'a1000000-0000-0000-0000-00000000000f',
  'Brother SE700 Embroidery Machine',
  'Brother SE700 computerized sewing and embroidery machine with 135 built-in designs, 7"x5" hoop, and USB port for custom patterns. All accessories included. Please return threaded and cleaned.',
  ARRAY['https://picsum.photos/id/1060/800/600','https://picsum.photos/id/219/800/600'],
  'excellent',
  null,
  '100 Broadway, Nashville, TN 37201',
  'Evenings after 6pm or weekends',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
),

-- Omar Hassan
(
  'b1000000-0000-0000-0000-000000000020',
  'a1000000-0000-0000-0000-000000000010',
  'REI Co-op Half Dome 4-Person Tent',
  'REI Half Dome 4+ tent — freestanding double-wall design, 63" peak height, two doors and vestibules. Stakes, guylines, footprint, and stuff sack all included. Great for camping or backyard sleepovers.',
  ARRAY['https://picsum.photos/id/237/800/600','https://picsum.photos/id/1029/800/600'],
  'good',
  null,
  '100 Washington Ave S, Minneapolis, MN 55401',
  'Any day after 5pm',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[{"start":"2026-06-29","end":"2026-07-06","note":"Family camping trip"}]'::jsonb
),

-- Stephanie Lee
(
  'b1000000-0000-0000-0000-000000000022',
  'a1000000-0000-0000-0000-000000000011',
  'Sony A7III Mirrorless Camera Kit',
  'Sony A7III body with 28-70mm kit lens, 50mm f/1.8, two NP-FZ100 batteries, charger, 64GB card, and a Peak Design wrist strap. Great for events, portraits, or street photography. Return with batteries charged.',
  ARRAY['https://picsum.photos/id/119/800/600','https://picsum.photos/id/442/800/600'],
  'excellent',
  null,
  '2233 NW Westover Rd, Portland, OR 97210',
  'Evenings after 6pm',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[{"start":"2026-07-19","end":"2026-07-22","note":"Wedding shoot"}]'::jsonb
),

-- Ben Torres
(
  'b1000000-0000-0000-0000-000000000024',
  'a1000000-0000-0000-0000-000000000012',
  'Large Format Paper Cutter (24")',
  'Swingline ClassicCut 24" rotary trimmer — cuts up to 10 sheets at once, replacement blade included. Great for art projects, invitations, photos, or school presentations.',
  ARRAY['https://picsum.photos/id/0/800/600','https://picsum.photos/id/159/800/600'],
  'good',
  null,
  '1500 Market St, Philadelphia, PA 19102',
  'Any day after 4pm',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
),

-- Megan O'Brien
(
  'b1000000-0000-0000-0000-000000000026',
  'a1000000-0000-0000-0000-000000000013',
  'Drum Floor Sander (Clarke American EZ-8)',
  'Clarke American EZ-8 drum floor sander for refinishing hardwood floors. Comes with 60-grit and 100-grit sleeves (partially used) plus an edge sander. Return with the dust bag emptied.',
  ARRAY['https://picsum.photos/id/175/800/600','https://picsum.photos/id/145/800/600'],
  'good',
  null,
  '100 Boylston St, Boston, MA 02116',
  'Weekends only',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
),

-- Andre Jackson
(
  'b1000000-0000-0000-0000-000000000028',
  'a1000000-0000-0000-0000-000000000014',
  'Fender Semi-Hollow Electric Guitar + Amp',
  'Fender Starcaster semi-hollow in aged natural — coil-tapped humbuckers, great for jazz, blues, and indie. Paired with a Fender Frontman 15G practice amp. Both in great shape. Return with strings intact.',
  ARRAY['https://picsum.photos/id/145/800/600','https://picsum.photos/id/1/800/600'],
  'excellent',
  null,
  '900 Canal St, New Orleans, LA 70112',
  'Any evening or weekend',
  '2099-12-31T00:00:00.000Z',
  'keep',
  0,
  'available',
  ARRAY[]::uuid[],
  'borrow',
  '[]'::jsonb,
  '[]'::jsonb
)

on conflict (id) do nothing;

-- ============================================================
-- Section 10: Rich state updates — items in various stages
-- Run this block after sections 1–9 are already applied.
-- All dates relative to 2026-05-25.
-- ============================================================

-- ── Give items: update to interesting lifecycle states ────────

-- KitchenAid Mixer (Sarah → Marcus claimed, now pending pickup)
UPDATE public.items SET status = 'pending_pickup'
WHERE id = 'b1000000-0000-0000-0000-000000000001';

-- BOB Stroller (Nicole → Lucia successfully picked up — completed)
UPDATE public.items SET
  status         = 'picked_up',
  claimed_by     = 'a1000000-0000-0000-0000-000000000009',
  claim_deadline = NULL
WHERE id = 'b1000000-0000-0000-0000-00000000000d';

-- Trek Mountain Bike (Ryan → Derek pending pickup, Marcus on waitlist)
UPDATE public.items SET status = 'pending_pickup'
WHERE id = 'b1000000-0000-0000-0000-00000000000f';

-- ── Borrow items: add pending requests ───────────────────────

-- Zojirushi Bread Machine (Priya) — two friends want it for back-to-back weeks
UPDATE public.items SET
  borrow_requests = '[
    {"id":"br-seed-1","requesterId":"a1000000-0000-0000-0000-000000000003","startDate":"2026-05-28","endDate":"2026-06-01","status":"pending","createdAt":"2026-05-24T10:00:00.000Z"},
    {"id":"br-seed-2","requesterId":"a1000000-0000-0000-0000-000000000005","startDate":"2026-06-04","endDate":"2026-06-08","status":"pending","createdAt":"2026-05-24T11:30:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-000000000016';

-- Brother Embroidery Machine (Rachel) — pending request from James
UPDATE public.items SET
  borrow_requests = '[
    {"id":"br-seed-3","requesterId":"a1000000-0000-0000-0000-000000000004","startDate":"2026-05-29","endDate":"2026-06-05","status":"pending","createdAt":"2026-05-23T09:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-00000000001e';

-- Sony A7III Camera (Stephanie) — two competing requests for overlapping dates
UPDATE public.items SET
  borrow_requests = '[
    {"id":"br-seed-4","requesterId":"a1000000-0000-0000-0000-000000000002","startDate":"2026-06-06","endDate":"2026-06-10","status":"pending","createdAt":"2026-05-22T14:00:00.000Z"},
    {"id":"br-seed-5","requesterId":"a1000000-0000-0000-0000-000000000006","startDate":"2026-06-07","endDate":"2026-06-12","status":"pending","createdAt":"2026-05-23T16:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-000000000022';

-- ── Borrow items: active borrows ──────────────────────────────

-- Electric Pressure Washer (Carlos) — Marcus is currently borrowing it
UPDATE public.items SET
  status         = 'borrowed',
  borrowed_by    = 'a1000000-0000-0000-0000-000000000002',
  borrowed_until = (now() + interval '5 days')::date::text,
  borrow_requests = '[
    {"id":"br-seed-6","requesterId":"a1000000-0000-0000-0000-000000000002","startDate":"2026-05-22","endDate":"2026-05-30","status":"approved","createdAt":"2026-05-20T10:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-000000000018';

-- REI Tent (Omar) — Aisha is borrowing it through the weekend
UPDATE public.items SET
  status         = 'borrowed',
  borrowed_by    = 'a1000000-0000-0000-0000-000000000005',
  borrowed_until = (now() + interval '3 days')::date::text,
  borrow_requests = '[
    {"id":"br-seed-7","requesterId":"a1000000-0000-0000-0000-000000000005","startDate":"2026-05-23","endDate":"2026-05-28","status":"approved","createdAt":"2026-05-21T08:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-000000000020';

-- ── Borrow items: pending return confirmations ────────────────

-- Cargo E-Bike (David) — Derek borrowed it and has submitted a return
UPDATE public.items SET
  status         = 'pending_return',
  borrowed_by    = 'a1000000-0000-0000-0000-000000000006',
  borrowed_until = (now() - interval '1 day')::date::text,
  borrow_requests = '[
    {"id":"br-seed-8","requesterId":"a1000000-0000-0000-0000-000000000006","startDate":"2026-05-15","endDate":"2026-05-24","status":"approved","createdAt":"2026-05-12T10:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-00000000001c';

-- Large Format Paper Cutter (Ben) — Nicole borrowed it, submitted return
UPDATE public.items SET
  status         = 'pending_return',
  borrowed_by    = 'a1000000-0000-0000-0000-000000000007',
  borrowed_until = (now() - interval '2 days')::date::text,
  borrow_requests = '[
    {"id":"br-seed-9","requesterId":"a1000000-0000-0000-0000-000000000007","startDate":"2026-05-14","endDate":"2026-05-23","status":"approved","createdAt":"2026-05-12T15:00:00.000Z"}
  ]'::jsonb
WHERE id = 'b1000000-0000-0000-0000-000000000024';
