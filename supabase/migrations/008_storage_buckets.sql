-- Create a storage bucket for chat attachments
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket

-- Allow authenticated users to upload files
create policy "Authenticated users can upload chat attachments"
on storage.objects for insert
with check (
  bucket_id = 'chat-attachments' and
  auth.role() = 'authenticated'
);

-- Allow public access to view files (since we want them to be easily displayable)
-- Alternatively, we could restrict to authenticated users, but public is easier for now
create policy "Public can view chat attachments"
on storage.objects for select
using ( bucket_id = 'chat-attachments' );

-- Allow users to delete their own files (optional, but good practice)
create policy "Users can delete their own chat attachments"
on storage.objects for delete
using (
  bucket_id = 'chat-attachments' and
  auth.uid() = owner
);
