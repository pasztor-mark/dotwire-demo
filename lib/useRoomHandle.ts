"use client";

import type { DotwireRoomHandle } from "@dotwire/client";
import { useDotwireClient } from "@dotwire/react";
import { useEffect, useState } from "react";

/**
 * One room handle per component, released on unmount. `client.room()` registers every handle it
 * creates, so calling it per send or per render would leak them.
 */
export function useRoomHandle(roomId: string): DotwireRoomHandle | null {
  const client = useDotwireClient();
  const [handle, setHandle] = useState<DotwireRoomHandle | null>(null);

  useEffect(() => {
    if (!client) return;
    const h = client.room(roomId);
    setHandle(h);
    return () => {
      h.release();
      setHandle(null);
    };
  }, [client, roomId]);

  return handle;
}
