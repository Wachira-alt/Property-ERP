"use client";

import { useRef, useState } from "react";
import { addNote } from "./actions";
import { Send, CheckSquare, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddNoteForm({ contactId }: { contactId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isTask, setIsTask] = useState(false); // Tracks if the checkbox is checked

  return (
    <form 
      ref={formRef} 
      action={async (formData) => {
        await addNote(contactId, formData);
        formRef.current?.reset();
        setIsTask(false); // Reset the calendar hide/show state
      }} 
      className="mt-4"
    >
      <div className="flex gap-3">
        <input 
          type="text" 
          name="content"
          placeholder="Log a call, meeting summary, or action item..." 
          className="flex-1 border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          required
        />
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm">
          Save <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      <div className="mt-3 flex items-center gap-4 px-1">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            name="isTask" 
            value="true" 
            id="isTask"
            checked={isTask}
            onChange={(e) => setIsTask(e.target.checked)} // Triggers the calendar
            className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="isTask" className="text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors">
            <CheckSquare className="w-4 h-4" /> Schedule Follow-up
          </label>
        </div>

        {/* SMART CALENDAR: Only shows if "Schedule Follow-up" is checked */}
        {isTask && (
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 animate-in fade-in slide-in-from-left-4 duration-300">
            <CalendarDays className="w-4 h-4 text-amber-600" />
            <input 
              type="date" 
              name="dueDate" 
              required
              className="bg-transparent border-none text-sm font-bold text-amber-900 outline-none cursor-pointer p-0"
            />
          </div>
        )}
      </div>
    </form>
  );
}