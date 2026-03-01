"use client";

import { useTransition } from "react";
import { toggleTask } from "./actions";

export function TaskCheckbox({ noteId, contactId, isCompleted }: { noteId: string, contactId: string, isCompleted: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={isCompleted}
      onChange={() => {
        startTransition(() => {
          toggleTask(noteId, contactId, isCompleted);
        });
      }}
      disabled={isPending}
      className="w-6 h-6 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 mt-1"
    />
  );
}