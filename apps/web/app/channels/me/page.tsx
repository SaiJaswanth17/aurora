import { AppShell } from '@/components/layout/app-shell';
import { FriendsList } from '@/components/social/friends-list';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <AppShell>
      <FriendsList />
    </AppShell>
  );
}
