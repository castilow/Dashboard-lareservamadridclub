// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjubucsutewkkupmywrt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWJ1Y3N1dGV3a2t1cG15d3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExOTQzNDYsImV4cCI6MjA0Njc3MDM0Nn0.gf96CNQR_C0zv9xaUOFHkJ1C0WgqcZcide3--3WNBgk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);