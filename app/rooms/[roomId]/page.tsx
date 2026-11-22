import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatRoom } from "@/components/ChatRoom";
import { host } from "@/lib/dotwire";
import { formatCode } from "@/lib/inviteCode";
import { getCurrentUserFromCookies } from "@/lib/session";
import { store } from "@/lib/store";

export default function RoomPage({ params }: PageProps<"/rooms/[roomId]">) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Opening room…</p>}>
      <Room params={params} />
    </Suspense>
  );
}

async function Room({ params }: { params: PageProps<"/rooms/[roomId]">["params"] }) {
  const { roomId } = await params;
  const user = await getCurrentUserFromCookies();
  if (!user) redirect("/");

  const room = store.rooms.get(roomId);
  // dotwire enforces membership itself; this check only avoids rendering a room you can't open.
  if (!room || !(await host().getUserRooms(user)).includes(roomId)) notFound();

  return (
    <ChatRoom
      roomId={roomId}
      name={room.name}
      code={room.createdBy === user ? formatCode(room.code) : undefined}
      username={user}
    />
  );
}
