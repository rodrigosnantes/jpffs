import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
// Replace with your project URL and your SERVICE_ROLE key
// IMPORTANT: Use the SERVICE_ROLE key, not the anon key, to bypass RLS and create users safely.
const supabaseUrl = 'https://tpvmbtbdercgyoeacslw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdm1idGJkZXJjZ3lvZWFjc2x3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1MjI0MiwiZXhwIjoyMDg3MDI4MjQyfQ.To66Eb-Whdxcvhw6ZpjJsBCZx5PlgoXCUdDK-Rz-4vk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockUsers = [
    { name: 'Ricardinho', email: 'ricardinho@teste.com', position: 'Line', level: 3 },
    { name: 'Gledson', email: 'gledson@teste.com', position: 'Line', level: 4 },
    // { name: 'Marcos Souza', email: 'marcos.souza@teste.com', position: 'Goalkeeper', level: 5 },
    // { name: 'Lucas Santos', email: 'lucas.santos@teste.com', position: 'Line', level: 2 },
    // { name: 'Rafael Costa', email: 'rafael.costa@teste.com', position: 'Goalkeeper', level: 4 },
    // { name: 'Felipe Melo', email: 'felipe.melo@teste.com', position: 'Line', level: 5 },
];

async function generateMockUsers() {
    console.log('Starting mock users generation...');
    let successCount = 0;
    let errorCount = 0;

    for (const user of mockUsers) {
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: 'password123', // Senha padrão para todos os mocks
                email_confirm: true, // Auto-confirmar email
                user_metadata: {
                    name: user.name,
                    position: user.position,
                    level: user.level
                }
            });

            if (error) {
                console.error(`Failed to create user ${user.email}:`, error.message);
                errorCount++;
            } else {
                console.log(`Successfully created user: ${user.email}`);

                // Wait briefly for the Database Trigger to create Profile and Player
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update the auto-created player's level since the trigger defaults to 3
                if (data.user) {
                    const { error: updateError } = await supabase
                        .from('players')
                        .update({ level: user.level })
                        .eq('profile_id', data.user.id);

                    if (updateError) {
                        console.error(`  - Failed to update level for ${user.email}:`, updateError.message);
                    } else {
                        console.log(`  - Updated level to ${user.level} for ${user.email}`);
                    }
                }

                successCount++;
            }
        } catch (err) {
            console.error(`Unexpected error for ${user.email}:`, err);
            errorCount++;
        }
    }

    console.log(`\nGeneration Complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

generateMockUsers();
