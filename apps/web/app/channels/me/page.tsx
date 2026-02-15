import { AppShell } from '@/components/layout/app-shell';
import { FriendsList } from '@/components/social/friends-list';

export default function HomePage() {
  return (
    <AppShell>
      <FriendsList />
    </AppShell>
  );
}
