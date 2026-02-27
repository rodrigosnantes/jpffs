-- Atualiza a trigger para ler o plan selecionado no painel Admin ao criar o usuário

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_plan text;
BEGIN
    -- Captura o plan da chamada auth.signUp (fallback para 'Amateur')
    final_plan := COALESCE(new.raw_user_meta_data->>'plan', 'Amateur');

    -- Tenta garantir a criação do Profile
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'name', 
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;

    -- Tenta garantir a criação do Player e atrela ao Profile, com o novo plan
    INSERT INTO public.players (
        profile_id, 
        name, 
        position, 
        level, 
        stats, 
        attributes,
        plan -- <-- NOVA COLUNA AQUI
    )
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'name', 
        'Line', 
        3, 
        '{"goals":0,"assists":0,"matches_played":0,"wins":0,"draws":0,"losses":0,"yellow_cards":0,"red_cards":0}', 
        '{"attack":50,"defense":50,"pace":50,"shooting":50,"physical":50,"passing":50}',
        final_plan -- <-- O RAW VALUE REPASSADO DO FRONT
    )
    ON CONFLICT (profile_id) DO NOTHING;

    RETURN new;
END;
$$;
