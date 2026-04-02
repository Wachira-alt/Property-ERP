"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react"

type Props = {
  content:   string
  onChange:  (html: string) => void
  className?: string
}

export function RichEditor({ content, onChange, className }: Props) {
  const editor = useEditor({
    immediatelyRender: false, 
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick:       false,
        HTMLAttributes:    { class: "text-blue-400 underline cursor-pointer" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[280px] prose prose-invert max-w-none",
      },
    },
  })

  if (!editor) return null

  function setLink() {
    const url = window.prompt("Enter URL:")
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  const toolbarBtn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#1f6feb] text-white"
          : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className={`border border-[#30363d] rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-[#161b22] border-b border-[#30363d]">
        {toolbarBtn(
          editor.isActive("bold"),
          () => editor.chain().focus().toggleBold().run(),
          <Bold size={13} />,
          "Bold"
        )}
        {toolbarBtn(
          editor.isActive("italic"),
          () => editor.chain().focus().toggleItalic().run(),
          <Italic size={13} />,
          "Italic"
        )}
        {toolbarBtn(
          editor.isActive("underline"),
          () => editor.chain().focus().toggleUnderline().run(),
          <UnderlineIcon size={13} />,
          "Underline"
        )}

        <div className="w-px h-4 bg-[#30363d] mx-1" />

        {toolbarBtn(
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          <Heading2 size={13} />,
          "Heading 2"
        )}
        {toolbarBtn(
          editor.isActive("heading", { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          <Heading3 size={13} />,
          "Heading 3"
        )}

        <div className="w-px h-4 bg-[#30363d] mx-1" />

        {toolbarBtn(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          <List size={13} />,
          "Bullet list"
        )}
        {toolbarBtn(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          <ListOrdered size={13} />,
          "Numbered list"
        )}

        <div className="w-px h-4 bg-[#30363d] mx-1" />

        {toolbarBtn(
          editor.isActive({ textAlign: "left" }),
          () => editor.chain().focus().setTextAlign("left").run(),
          <AlignLeft size={13} />,
          "Align left"
        )}
        {toolbarBtn(
          editor.isActive({ textAlign: "center" }),
          () => editor.chain().focus().setTextAlign("center").run(),
          <AlignCenter size={13} />,
          "Align center"
        )}
        {toolbarBtn(
          editor.isActive({ textAlign: "right" }),
          () => editor.chain().focus().setTextAlign("right").run(),
          <AlignRight size={13} />,
          "Align right"
        )}

        <div className="w-px h-4 bg-[#30363d] mx-1" />

        {toolbarBtn(
          editor.isActive("link"),
          setLink,
          <LinkIcon size={13} />,
          "Insert link"
        )}

        <div className="w-px h-4 bg-[#30363d] mx-1" />

        {toolbarBtn(
          false,
          () => editor.chain().focus().undo().run(),
          <Undo size={13} />,
          "Undo"
        )}
        {toolbarBtn(
          false,
          () => editor.chain().focus().redo().run(),
          <Redo size={13} />,
          "Redo"
        )}
      </div>

      {/* Editor body */}
      <div className="px-4 py-3 bg-[#0d1117] text-[#e6edf3] text-sm">
        <style>{`
          .ProseMirror p { margin-bottom: 10px; }
          .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; margin: 16px 0 8px; color: #e6edf3; }
          .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 14px 0 6px; color: #e6edf3; }
          .ProseMirror ul { list-style: disc; padding-left: 20px; margin-bottom: 10px; }
          .ProseMirror ol { list-style: decimal; padding-left: 20px; margin-bottom: 10px; }
          .ProseMirror li { margin-bottom: 4px; }
          .ProseMirror a { color: #58a6ff; text-decoration: underline; }
          .ProseMirror strong { font-weight: 600; }
          .ProseMirror em { font-style: italic; }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #484f58;
            pointer-events: none;
            position: absolute;
          }
          .ProseMirror:focus { outline: none; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}