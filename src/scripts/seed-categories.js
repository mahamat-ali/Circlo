// Script to seed categories table with sample data
import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleCategories = [
  { name: 'Electronics' },
  { name: 'Fashion' },
  { name: 'Home & Garden' },
  { name: 'Books' },
  { name: 'Sports & Outdoors' },
  { name: 'Automotive' },
  { name: 'Health & Beauty' },
  { name: 'Gaming' },
  { name: 'Music & Instruments' },
  { name: 'Toys & Games' }
];

async function seedCategories() {
  try {
    console.log('Starting to seed categories...');
    
    // First, check if categories already exist
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching existing categories:', fetchError);
      return;
    }
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('Categories already exist:', existingCategories.length);
      return;
    }
    
    // Insert sample categories
    const { data, error } = await supabase
      .from('categories')
      .insert(sampleCategories)
      .select();
    
    if (error) {
      console.error('Error inserting categories:', error);
    } else {
      console.log('Successfully seeded categories:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedCategories();