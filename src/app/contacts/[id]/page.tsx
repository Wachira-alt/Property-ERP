import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, MessageSquare, UserCircle, Briefcase, FileText, Download, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddNoteForm } from "./AddNoteForm";
import { TaskCheckbox } from "./TaskCheckbox";
import { uploadDocument } from "./actions";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id: id },
    include: {
      agent: true,
      notes: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } } // Pull the documents!
    }
  });

  if (!contact) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/contacts" className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{contact.firstName} {contact.lastName}</h1>
          <p className="text-slate-500 mt-1">Client Profile & Activity Timeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: DETAILS & VAULT */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{contact.firstName} {contact.lastName}</h2>
              <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 tracking-wider">
                {contact.type.replace("_", " ")}
              </Badge>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900">{contact.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900">{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Agent: <span className="text-slate-900">{contact.agent?.name || "Unassigned"}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Added: {new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* THE NEW DOCUMENT VAULT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Document Vault
            </h3>

            {/* Document List */}
            <div className="space-y-3 mb-5">
              {contact.documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No files stored. Upload an ID or Contract below.</p>
              ) : (
                contact.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{doc.name}</span>
                    <a 
                      href={`data:${doc.mimeType};base64,${doc.fileData}`} 
                      download={doc.name}
                      className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>

            {/* Upload Button */}
            <form action={uploadDocument.bind(null, contact.id)} className="flex flex-col gap-3">
              <input 
                type="file" 
                name="file" 
                required 
                className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
              />
              <button type="submit" className="bg-slate-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <UploadCloud className="w-4 h-4" /> Save to Vault
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY TIMELINE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" /> Interaction Notes
            </h3>
            <AddNoteForm contactId={contact.id} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Activity Timeline</h3>
            
            <div className="space-y-6">
              {contact.notes.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
                  No notes recorded yet. Log your first interaction above.
                </div>
              ) : (
                contact.notes.map((note) => (
                  <div key={note.id} className={`flex gap-4 transition-all ${note.isCompleted ? 'opacity-60 grayscale' : ''}`}>
                    
                    {/* Checkbox OR Icon */}
                    <div>
                      {note.isTask ? (
                        <TaskCheckbox noteId={note.id} contactId={contact.id} isCompleted={note.isCompleted} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mt-1">
                          <UserCircle className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* The Note Body */}
                    <div className={`flex-1 rounded-lg p-4 border shadow-sm ${
                      note.isTask 
                        ? (note.isCompleted ? 'bg-slate-50 border-slate-200 line-through' : 'bg-amber-50 border-amber-200') 
                        : 'bg-white border-slate-200'
                    }`}>
                      <p className="text-slate-800 text-sm leading-relaxed">{note.content}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 block flex flex-wrap items-center gap-2">
    {note.isTask && !note.isCompleted && <span className="text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">PENDING ACTION</span>}
    {note.isTask && note.isCompleted && <span className="text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">COMPLETED</span>}
    
    {/* NEW: Displays the Scheduled Due Date */}
    {note.dueDate && (
      <span className={`px-1.5 py-0.5 rounded ${note.isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
        DUE: {new Date(note.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    )}

    <span className="ml-auto text-slate-300">Logged: {new Date(note.createdAt).toLocaleDateString()}</span>
  </span>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}