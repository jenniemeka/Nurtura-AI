
-- Antenatal appointments / reminders
CREATE TABLE public.antenatal_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  kind text NOT NULL DEFAULT 'appointment',
  scheduled_at timestamptz NOT NULL,
  reminder_minutes integer DEFAULT 60,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.antenatal_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own appts all" ON public.antenatal_appointments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_appts_user_sched ON public.antenatal_appointments(user_id, scheduled_at);

-- Polymorphic pregnancy logs (mood, symptom, kick_session, contraction_session, sleep, weight)
CREATE TABLE public.pregnancy_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pregnancy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own preg logs all" ON public.pregnancy_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_preg_logs_user_kind ON public.pregnancy_logs(user_id, kind, logged_at DESC);

-- Hospital bag checklist
CREATE TABLE public.hospital_bag_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'mom',
  packed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hospital_bag_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bag all" ON public.hospital_bag_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Birth plan: one per user
CREATE TABLE public.birth_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.birth_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan all" ON public.birth_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed pregnancy reels (no author -> visible because moderation_status defaults to approved)
INSERT INTO public.reels (title, description, category, expert_name, video_url, thumbnail_url, duration_seconds, likes_count) VALUES
  ('What to expect at your 20-week scan', 'A gentle walkthrough of the anatomy scan.', 'antenatal', 'Dr. Amina', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1518578-pregnancy', 45, 0),
  ('Pregnancy nutrition: 5 essentials', 'Iron, folate, calcium, omega-3, and hydration.', 'nutrition', 'Maya, RDN', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', NULL, 60, 0),
  ('Safe prenatal stretches', 'Three gentle moves to ease back tension.', 'prenatal-exercise', 'Lara, PT', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', NULL, 50, 0),
  ('Counting kicks: when and how', 'A simple method for daily kick counts.', 'antenatal', 'Dr. Amina', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', NULL, 40, 0),
  ('Hospital bag must-haves', 'What you actually need (and what you don''t).', 'birth-prep', 'Nurtura team', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', NULL, 55, 0),
  ('Calming breathwork for labor', 'A 90-second box breathing demo.', 'birth-prep', 'Lara, PT', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', NULL, 35, 0);

-- Seed pregnancy articles
INSERT INTO public.articles (slug, title, excerpt, category, body, read_minutes) VALUES
  ('antenatal-care-basics', 'Antenatal care: the basics', 'A week-by-week guide to checkups, scans, and what to ask your provider.', 'antenatal', 'Antenatal care helps keep you and your baby healthy throughout pregnancy. Most providers recommend a checkup every 4 weeks until 28 weeks, every 2 weeks until 36 weeks, then weekly until birth. Typical visits include blood pressure, weight, urine tests, and listening to baby''s heartbeat.', 5),
  ('pregnancy-nutrition-guide', 'Eating well in pregnancy', 'Practical nutrition tips that work even when you''re tired or queasy.', 'nutrition', 'Focus on whole foods: leafy greens, lean proteins, whole grains, dairy or fortified alternatives, and plenty of water. Prenatal vitamins help fill gaps. Foods to avoid include raw fish, unpasteurized dairy, and high-mercury fish.', 4),
  ('safe-prenatal-exercise', 'Safe movement during pregnancy', 'Gentle exercise that supports energy, sleep, and birth recovery.', 'prenatal-exercise', 'Aim for 150 minutes a week of moderate activity like walking, swimming, or prenatal yoga. Stop if you feel dizzy, short of breath, or notice unusual pain or bleeding, and call your provider.', 4)
ON CONFLICT (slug) DO NOTHING;
