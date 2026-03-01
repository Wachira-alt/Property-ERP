"use client";

import { useState } from "react";
import { addContact } from "@/app/actions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AddContactModal({ agents }: { agents: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    
    const result = await addContact(formData);
    
    setIsPending(false);

    if (result?.error) {
      if (typeof result.error === "string") {
        setError(result.error);
      } else {
        setError("Invalid inputs. Ensure the email is valid and phone has at least 5 digits.");
      }
    } else {
      setOpen(false); 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Register New Client</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name</Label><Input name="firstName" required /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input name="lastName" required /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-2"><Label>Phone Number</Label><Input name="phone" required /></div>
          
          <div className="space-y-2">
            <Label>Assigned Agent</Label>
            <select name="agentId" className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
              <option value="">-- No Agent --</option>
              {agents && agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
            {isPending ? "Saving..." : "Save Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}