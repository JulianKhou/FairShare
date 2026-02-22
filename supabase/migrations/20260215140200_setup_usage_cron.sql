-- Migration: Set up daily cron job for usage reporting
-- Requires pg_cron and pg_net extensions (available on Supabase Pro plans).
--
-- This job calls the report-usage Edge Function once per day to fetch
-- current YouTube view counts and report them to Stripe as metered usage.
-- Stripe then uses this data for quarterly invoicing.
--
-- ⚠️  IMPORTANT: pg_cron is only available on Supabase Pro plans.
-- If you're on the Free plan, use an external cron service (e.g., n8n, GitHub Actions)
-- to call the report-usage function daily.

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: Every day at 03:00 UTC (avoids peak hours)
-- Calls the report-usage Edge Function via HTTP
SELECT cron.schedule(
    'report-usage-daily',          -- Job name (unique identifier)
    '0 3 * * *',                   -- Cron expression: daily at 03:00 UTC
    $$
    SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/report-usage',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job WHERE jobname = 'report-usage-daily';

-- To check execution history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'report-usage-daily') ORDER BY start_time DESC LIMIT 10;

-- To remove the job if needed:
-- SELECT cron.unschedule('report-usage-daily');
