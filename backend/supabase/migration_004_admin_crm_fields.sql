-- TONTO Clothing — migration_004: the admin desk's own columns
-- Run AFTER schema.sql and migration_003_security_and_integrity.sql. Idempotent.
--
-- WHY THIS EXISTS
--   Studio Admin edits fields the database never had a column for:
--     * leads    — stage, interest, estimated value, notes (the whole CRM the
--                  Leads tab renders and the CSV export writes)
--     * enquiries— colour, plus the two labels the status picker offers
--                  ("Dispatched", "Completed") that the CHECK in migration_003
--                  does not allow
--     * promos   — the campaign label shown next to each code
--   Those writes used to stop at localStorage[tonto_admin_*], which is why nobody
--   noticed: the storefront reads the API, so the owner's edits were never meant
--   to leave the browser. Pointing the desk at the API without these columns
--   would drop them on the floor instead — Supabase rejects unknown columns on
--   insert/update — so the columns come first.
--
-- Also gives `POST /api/leads/claim-offer` a way to record WHERE the address
-- came from (footer Drop Alerts vs the welcome modal) instead of stamping every
-- row 'offer-modal'.

begin;

-- ===========================================================================
-- 1. Leads — CRM fields the desk edits.
-- ===========================================================================
alter table public.leads add column if not exists stage text not null default 'New';
alter table public.leads add column if not exists interest text default '';
alter table public.leads add column if not exists estimated_value integer not null default 0;
alter table public.leads add column if not exists notes text default '';
alter table public.leads add column if not exists updated_at timestamptz not null default now();

-- Labels the Leads tab offers. Anything else (a hand-edited row) stays readable:
-- the API normalises unknown values to 'New' rather than rejecting the write.
alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads add constraint leads_stage_check
  check (stage in ('New','In Discussion','Converted','Lost'));

create index if not exists idx_leads_stage on public.leads (stage);
create index if not exists idx_leads_source on public.leads (source);

drop trigger if exists trg_leads_touch on public.leads;
create trigger trg_leads_touch before update on public.leads
  for each row execute function touch_updated_at();

-- ===========================================================================
-- 2. Enquiries — colour is shown in the desk and currently lost on insert,
--    and the picker offers two lifecycle labels the CHECK rejected.
-- ===========================================================================
alter table public.enquiries add column if not exists colour text default '';
alter table public.enquiries add column if not exists notes text default '';
alter table public.enquiries add column if not exists updated_at timestamptz not null default now();

-- Widening only: every token migration_003 allowed is still allowed, so this is
-- safe whether or not the desk has written anything yet.
alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new','pending','in_discussion','contacted','payment_received',
                    'hold_reserved','dispatched','completed','closed','resolved'));

drop trigger if exists trg_enquiries_touch on public.enquiries;
create trigger trg_enquiries_touch before update on public.enquiries
  for each row execute function touch_updated_at();

-- ===========================================================================
-- 3. Promos — the free-text campaign label ("Private Drop Access").
-- ===========================================================================
alter table public.promos add column if not exists type text default '';

-- Label the three built-in codes the way the desk has always shown them. Only
-- fills blanks, so a campaign name the owner typed over is never reverted.
update public.promos set type = 'Welcome Privilege'
  where type = '' and upper(code) = 'TONTO15';
update public.promos set type = 'Private Drop Access'
  where type = '' and upper(code) = 'TONTOVIP';
update public.promos set type = 'Return Customer'
  where type = '' and upper(code) = 'ARCHIVE10';

-- ===========================================================================
-- 4. Source vocabulary for claim-offer (footer Drop Alerts must not be
--    indistinguishable from the welcome modal in the owner's CRM).
-- ===========================================================================
-- No CHECK on purpose: `source` is a display label, and the storefront has been
-- sending free-form ones since day one. Values are normalised in the API
-- (controllers/leads.controller.js SOURCE_MAP).

commit;

-- After running this:
--   1. Restart the API so PostgREST reloads its schema cache, or the new columns
--      answer PGRST202/42703 until it does.
--   2. Studio Admin → Leads / Enquiries / Promos: edits should survive a reload
--      in a different browser. If a write answers "no such column", this
--      migration has not been applied to the project you are pointed at.
