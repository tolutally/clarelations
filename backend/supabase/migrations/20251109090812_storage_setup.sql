-- Create the deal-attachments storage bucket
insert into storage.buckets (id, name, public)
values ('deal-attachments', 'deal-attachments', true);

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload files
create policy "Authenticated users can upload deal attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'deal-attachments');

-- Allow public read access to files
create policy "Public can read deal attachments"
on storage.objects for select
to public
using (bucket_id = 'deal-attachments');

-- Allow authenticated users to delete their uploaded files
create policy "Authenticated users can delete deal attachments"
on storage.objects for delete
to authenticated
using (bucket_id = 'deal-attachments');

-- Add attachments column to deals table if it doesn't exist
alter table deals 
add column if not exists attachments jsonb;

comment on column deals.attachments is 'Array of attachment objects with name, url, size, and type';
