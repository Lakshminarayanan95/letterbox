import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vkeqqzmbjdvgejqxllgz.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

export const supabase = createClient('https://vkeqqzmbjdvgejqxllgz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZXFxem1iamR2Z2VqcXhsbGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTA4NzMsImV4cCI6MjA4ODU2Njg3M30.loWzoRK356OIZ_PAz-Iq4ilnS333MeZte2QGzEMQKKk')