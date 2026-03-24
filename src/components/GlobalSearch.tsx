"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { globalSearch } from "@/app/actions/admin";
import { Search, User, Building2, GitMerge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState({ contacts: [], properties: [], deals: [] });

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch search results as the user types
  React.useEffect(() => {
    const fetchResults = async () => {
      if (query.length >= 2) {
        const data = await globalSearch(query);
        setResults(data as any);
      } else {
        setResults({ contacts: [], properties: [], deals: [] });
      }
    };
    
    // Simple debounce to prevent spamming the database
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Clickable Search Bar Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors w-64 border border-slate-200"
      >
        <Search className="w-4 h-4" />
        <span>Search ERP...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* The Actual Search Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg border-0 sm:max-w-[600px]">
          {/* By applying shouldFilter directly to Command, it is guaranteed to work */}
          <Command shouldFilter={false} className="w-full">
            <CommandInput 
              placeholder="Type a name, unit number, or project..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {query.length >= 2 && 
               results.contacts.length === 0 && 
               results.properties.length === 0 && 
               results.deals.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              
              {results.contacts.length > 0 && (
                <CommandGroup heading="Contacts">
                  {results.contacts.map((contact: any) => (
                    <CommandItem key={contact.id} onSelect={() => handleSelect('/contacts')}>
                      <User className="mr-2 h-4 w-4 text-blue-500" />
                      <span>{contact.firstName} {contact.lastName}</span>
                      <span className="ml-2 text-xs text-slate-400">{contact.phone}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.properties.length > 0 && (
                <CommandGroup heading="Inventory">
                  {results.properties.map((prop: any) => (
                    <CommandItem key={prop.id} onSelect={() => handleSelect('/properties')}>
                      <Building2 className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>Unit {prop.unitNumber}</span>
                      <span className="ml-2 text-xs text-slate-400">{prop.projectName}</span>
                      <span className="ml-auto text-xs text-emerald-600 font-medium">${Number(prop.price).toLocaleString()}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.deals.length > 0 && (
                <CommandGroup heading="Pipeline Deals">
                  {results.deals.map((deal: any) => (
                    <CommandItem key={deal.id} onSelect={() => handleSelect('/opportunities')}>
                      <GitMerge className="mr-2 h-4 w-4 text-amber-500" />
                      <span>{deal.contact.firstName} {deal.contact.lastName}</span>
                      <span className="ml-2 text-xs text-slate-400">Unit {deal.property.unitNumber}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] uppercase">{deal.status.replace("_", " ")}</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}