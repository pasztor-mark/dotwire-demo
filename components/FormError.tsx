"use client";

export function FormError({ error }: { error: { message: string; expired: boolean } | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-center gap-2 pl-[22px] text-danger">
      {error.message}
      {error.expired && (
        <button type="button" onClick={() => location.reload()} className="underline">
          Reload
        </button>
      )}
    </p>
  );
}
