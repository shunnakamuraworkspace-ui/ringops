-- Expose the RINGOPS schema through Supabase Data API.
-- Keep public and graphql_public available alongside the application schema.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, ringops';
notify pgrst, 'reload config';
