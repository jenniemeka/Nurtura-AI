
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS concerns_notes text,
  ADD COLUMN IF NOT EXISTS support_level int CHECK (support_level BETWEEN 1 AND 5);

-- Seed sample video URLs for the existing reels (public sample MP4s)
UPDATE public.reels SET
  video_url = 'https://download.samplelib.com/mp4/sample-5s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=70'
WHERE title = 'Safe sleep in 60 seconds';

UPDATE public.reels SET
  video_url = 'https://download.samplelib.com/mp4/sample-10s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=70'
WHERE title = 'Tummy time made easy';

UPDATE public.reels SET
  video_url = 'https://download.samplelib.com/mp4/sample-15s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=600&q=70'
WHERE title = 'Is this poop normal?';

UPDATE public.reels SET
  video_url = 'https://download.samplelib.com/mp4/sample-5s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600&q=70'
WHERE title = 'Burping techniques that work';

UPDATE public.reels SET
  video_url = 'https://download.samplelib.com/mp4/sample-10s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1535185384036-28bbc8035f28?w=600&q=70'
WHERE title = 'Soothing a fussy evening';
