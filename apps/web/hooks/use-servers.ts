'use client';

import { useEffect, useState } from 'react';
import { useServerStore } from '@/stores/server-store';

export function useServers() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { servers, setServers } = useServerStore();

  useEffect(() => {
    async function fetchServers() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/servers');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch servers');
        }

        setServers(data.servers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch servers');
      } finally {
        setIsLoading(false);
      }
    }

    fetchServers();
  }, [setServers]);

  const serverList = Object.values(servers);

  return {
    servers: serverList,
    isLoading,
    error,
  };
}

export function useChannels(serverId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { channels, setChannels } = useServerStore();

  useEffect(() => {
    async function fetchChannels() {
      if (!serverId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/channels?serverId=${serverId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch channels');
        }

        setChannels(serverId, data.channels);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChannels();
  }, [serverId, setChannels]);

  return {
    channels: serverId ? channels[serverId] || [] : [],
    isLoading,
    error,
  };
}
