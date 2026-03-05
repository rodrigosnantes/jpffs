import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
// Replace with your project URL and your SERVICE_ROLE key
// IMPORTANT: Use the SERVICE_ROLE key, not the anon key, to bypass RLS and create users safely.
const supabaseUrl = 'https://tpvmbtbdercgyoeacslw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdm1idGJkZXJjZ3lvZWFjc2x3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1MjI0MiwiZXhwIjoyMDg3MDI4MjQyfQ.To66Eb-Whdxcvhw6ZpjJsBCZx5PlgoXCUdDK-Rz-4vk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockUsers = [
    { name: 'ADALBERTO FONTOURA', email: 'adalberto@teste.com', position: 'Line', level: 3 },
    { name: 'AGOSTINHO CARVALHO MARIM', email: 'agostinho@teste.com', position: 'Line', level: 4 },
    { name: 'ALESSON ARAUJO', email: 'alesson@teste.com', position: 'Line', level: 4 },
    { name: 'ALEX THALIS DE SOUZA PROCOPIO', email: 'alexThalis@teste.com', position: 'Line', level: 4 },
    { name: 'ALEXANDRE MARQUES DE ANDRADE', email: 'alexandre@teste.com', position: 'Line', level: 4 },
    { name: 'ANDERSON DOS SANTOS NEPOMUCENA', email: 'andersonSantos@teste.com', position: 'Line', level: 4 },
    { name: 'ANDERSON LUIZ KRUG', email: 'andersonLuiz@teste.com', position: 'Line', level: 4 },
    { name: 'ANDRÉ LUIZ ÁLVARES', email: 'andre@teste.com', position: 'Line', level: 4 },
    { name: 'ANTÔNIO DIVINO DE ALMEIRA NETO', email: 'antoniode@teste.com', position: 'Line', level: 4 },
    { name: 'CARLOS HENRIQUE ESPINDOLA', email: 'carlos@teste.com', position: 'Line', level: 4 },
    { name: 'CARLOS HENRIQUE OLIVEIRA DOS SANTOS', email: 'carloshenrique@teste.com', position: 'Line', level: 4 },
    { name: 'CLÁUDIO LUIZ VASQUEZ DOS SANTOS', email: 'claudio@teste.com', position: 'Line', level: 4 },
    { name: 'CLEBER CHRISTIANES SOUZA DA SILVA', email: 'cleber@teste.com', position: 'Line', level: 4 },
    { name: 'DANIEL DA SILVA MORAIS', email: 'daniel@teste.com', position: 'Line', level: 4 },
    { name: 'DEIVE DENER CESPEDE', email: 'deive@teste.com', position: 'Line', level: 4 },
    { name: 'DIEGO COLMAN', email: 'diego@teste.com', position: 'Line', level: 4 },
    { name: 'EDER PEREIRA DE ANDRADE', email: 'eder@teste.com', position: 'Line', level: 4 },
    { name: 'EDRIANIO DA ROSA JUNIOR', email: 'edrianio@teste.com', position: 'Line', level: 4 },
    { name: 'ELIVAN UEHARA QUEIROZ', email: 'elivan@teste.com', position: 'Line', level: 4 },
    { name: 'EMERSON SANCHES NOGUEIRA', email: 'emerson@teste.com', position: 'Line', level: 4 },
    { name: 'ENTONY GOMES DE ALMEIDA', email: 'tony@teste.com', position: 'Line', level: 4 },
    { name: 'FABIANO RODRIGUES PISSURNO', email: 'fabiano@teste.com', position: 'Line', level: 4 },
    { name: 'FELIPE KLING', email: 'felipe@teste.com', position: 'Line', level: 4 },
    { name: 'FELIPE VILALBA PARREIRA', email: 'felipeVilalba@teste.com', position: 'Line', level: 4 },
    { name: 'FINIEZER CAMPOS', email: 'finiez@teste.com', position: 'Line', level: 4 },
    { name: 'FLÁVIO ORTEGA BATEL JUNIOR', email: 'flavioOrtega@teste.com', position: 'Line', level: 4 },
    { name: 'FLÁVIO ROQUE DE AZEVEDO', email: 'flavio@teste.com', position: 'Line', level: 4 },
    { name: 'FRANCYSMAR BATISTA LIMA', email: 'francysmar@teste.com', position: 'Line', level: 4 },
    { name: 'GABRIEL ANTUNES DE CARVALHO', email: 'gabriel@teste.com', position: 'Line', level: 4 },
    { name: 'GILMAR DE ALMEIDA', email: 'gilmar@teste.com', position: 'Line', level: 4 },
    { name: 'GLEDSON ALVES DE SOUZA', email: 'gledson@teste.com', position: 'Line', level: 4 },
    { name: 'GUSTAVO GILBERT BASTOS', email: 'gustavo@teste.com', position: 'Line', level: 4 },
    { name: 'HENDOR FELIPE LUBAS DE AGUIAR', email: 'hendor@teste.com', position: 'Line', level: 4 },
    { name: 'HUDSON NOGUEIRA DE SOUZA', email: 'hudson@teste.com', position: 'Line', level: 4 },
    { name: 'JACY RAMOS', email: 'jacyRamos@teste.com', position: 'Line', level: 4 },
    { name: 'JEAN CARLOS DA SILVA MARTINEZ', email: 'jeanCarlos@teste.com', position: 'Line', level: 4 },
    { name: 'JEFERSON DE JESUS DA SILVA MELGAR', email: 'jefersonJesus@teste.com', position: 'Line', level: 4 },
    { name: 'JOÃO PAULO RODRIGUES ANTUNES', email: 'joaopaulo@teste.com', position: 'Line', level: 4 },
    { name: 'JOÃO VITOR FERREIRA LEMOS', email: 'joaovitor@teste.com', position: 'Line', level: 4 },
    { name: 'JUDSON ESCOBAR', email: 'judson@teste.com', position: 'Line', level: 4 },
    { name: 'LÁZARO DE OLIVEIRA NETO', email: 'lazaro@teste.com', position: 'Line', level: 4 },
    { name: 'LEOMAR DOMINGUES', email: 'leomar@teste.com', position: 'Line', level: 4 },
    { name: 'LOTHAR MATEUS DA SILVA CABALHEIRO', email: 'lothar@teste.com', position: 'Line', level: 4 },
    { name: 'LUCAS FERREIRA', email: 'lucas@teste.com', position: 'Line', level: 4 },
    { name: 'LUCIANO LOPEZ', email: 'luciano@teste.com', position: 'Line', level: 4 },
    { name: 'LUIS FERNANDO ARAUJO SOUSA', email: 'luisfernando@teste.com', position: 'Line', level: 4 },
    { name: 'LUÍS FERNANDO BULHÕES DE SOUZA', email: 'luisfernandobulhe@teste.com', position: 'Line', level: 4 },
    { name: 'LUIS PAULO SANTOS DA SILVA', email: 'luispaulo@teste.com', position: 'Line', level: 4 },
    { name: 'MARKS WILLIAN CASTELLANI VIACEK', email: 'marks@teste.com', position: 'Line', level: 4 },
    { name: 'MATHEUS CUNHA FLORES MONTEIRO', email: 'matheuscunha@teste.com', position: 'Line', level: 4 },
    { name: 'ODINEY RONALDO ZARACHO', email: 'odiney@teste.com', position: 'Line', level: 4 },
    { name: 'PATRICK OLIVEIRA DA SILVA', email: 'patrick@teste.com', position: 'Line', level: 4 },
    { name: 'PAULO CÉSAR NASCIMENTO ROCHA', email: 'paulo@teste.com', position: 'Line', level: 4 },
    { name: 'PIETRO TERUYA VIANA', email: 'pietro@teste.com', position: 'Line', level: 4 },
    { name: 'RAFAEL ANTUNES DELGADO CABRAL', email: 'rafael@teste.com', position: 'Line', level: 4 },
    { name: 'RENAN BARBOSA SARAIVA', email: 'renan@teste.com', position: 'Line', level: 4 },
    { name: 'RENATO GONÇALVES MARTINS', email: 'renato@teste.com', position: 'Line', level: 4 },
    { name: 'RICARDO DA SILVA BARROS', email: 'ricardo@teste.com', position: 'Line', level: 4 },
    { name: 'RODRIGO LEON ALENCAR GONÇALVES', email: 'rodrigoLeon@teste.com', position: 'Line', level: 4 },
    { name: 'RODRIGO MONTEIRO DA COSTA', email: 'rodrigoMonteiro@teste.com', position: 'Line', level: 4 },
    { name: 'SAMUEL ACOSTA DA SILVA', email: 'samuel@teste.com', position: 'Line', level: 4 },
    { name: 'VICTOR EMANUEL ROCHA ARGUELHO', email: 'victorEmanuel@teste.com', position: 'Line', level: 4 },
    { name: 'VICTOR MORAES MIRANDA', email: 'victorMoraes@teste.com', position: 'Line', level: 4 },
    { name: 'VINICIUS DE OLIVEIRA BARBOZA', email: 'vinicius@teste.com', position: 'Line', level: 4 },
    { name: 'WASHLEY ROGER DOS REIS MACHADO', email: 'washley@teste.com', position: 'Line', level: 4 },
    { name: 'WELLINGTON ALEXANDRE PEREIRA DE MOURA', email: 'wellington@teste.com', position: 'Line', level: 4 },
    { name: 'WELLK FERREIRA DOS SANTOS', email: 'wellk@teste.com', position: 'Line', level: 4 },
    { name: 'WESLLEY TERUYA NOGUEIRA', email: 'weslley@teste.com', position: 'Line', level: 4 },
    { name: 'WESLEY ALVES MACHADO JUNIOR', email: 'wsleyAlevs@teste.com', position: 'Line', level: 4 },
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
