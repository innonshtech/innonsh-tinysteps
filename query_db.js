const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("--- Users ---");
  const users = await supabase.from('users').select('*');
  console.log(users.data);
  
  console.log("--- Students ---");
  const students = await supabase.from('students').select('*');
  console.log(students.data);
  
  console.log("--- Student Parents ---");
  const parents = await supabase.from('student_parents').select('*');
  console.log(parents.data);
}
check();
