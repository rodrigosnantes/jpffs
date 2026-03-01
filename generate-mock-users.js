import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpvmbtbdercgyoeacslw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdm1idGJkZXJjZ3lvZWFjc2x3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1MjI0MiwiZXhwIjoyMDg3MDI4MjQyfQ.To66Eb-Whdxcvhw6ZpjJsBCZx5PlgoXCUdDK-Rz-4vk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockUsers = [
    { name: 'Josue', email: 'Josue@teste.com', position: 'Line', level: 4 },
    { name: 'Terixeira', email: 'Terixeira@teste.com', position: 'Line', level: 4 },
    { name: 'Valmar', email: 'Valmar@teste.com', position: 'Goalkeeper', level: 5 },
    { name: 'Marcelo Marques', email: 'Marcelo@teste.com', position: 'Line', level: 2 },
    { name: 'Brabo Filho', email: 'Brabo@teste.com', position: 'Goalkeeper', level: 4 },
    { name: 'Felipe Assis', email: 'FelipeAssis@teste.com', position: 'Line', level: 5 },
    { name: 'Bostonildo', email: 'Bostonildo@teste.com', position: 'Line', level: 2 },
    { name: 'Bostonildo Rafael', email: 'BostonildoR@teste.com', position: 'Line', level: 4 },
    { name: 'josé', email: 'jose@teste.com', position: 'Line', level: 2 },
    { name: 'Edenilson', email: 'edenilson@teste.com', position: 'Line', level: 3 },
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
