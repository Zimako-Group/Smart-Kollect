// components/NotesInterface.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  StickyNote,
  Plus,
  Search,
  Calendar,
  Clock,
  Star,
  StarOff,
  Edit,
  Trash2,
  AlertCircle,
  CreditCard,
  Phone,
  Scale,
  FileText,
  Lock,
  Unlock,
  Filter,
  X,
  Check,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRedux } from "@/hooks/useRedux";
import { 
  openDialog, 
  closeDialog, 
  addNote, 
  deleteNote, 
  editNote, 
  setActiveCategory,
  fetchNotes,
  createNote,
  updateNote,
  removeNote
} from "@/lib/redux/features/notes/notesSlice";
import { format, formatDistance } from "date-fns";
import { useAppSelector } from "@/lib/redux/store";
import { RootState } from "@/lib/redux/store";

// Import auth context to get the current user
import { useAuth } from "@/contexts/AuthContext";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy");
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "h:mm a");
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  return formatDistance(date, new Date(), { addSuffix: true });
};

// Category icons and colors
const categoryConfig = {
  general: { icon: <FileText className="h-4 w-4" />, color: "text-blue-400", bgColor: "bg-blue-400/20" },
  payment: { icon: <CreditCard className="h-4 w-4" />, color: "text-green-400", bgColor: "bg-green-400/20" },
  contact: { icon: <Phone className="h-4 w-4" />, color: "text-amber-400", bgColor: "bg-amber-400/20" },
  legal: { icon: <Scale className="h-4 w-4" />, color: "text-rose-400", bgColor: "bg-rose-400/20" },
  other: { icon: <StickyNote className="h-4 w-4" />, color: "text-purple-400", bgColor: "bg-purple-400/20" },
};

export default function NotesInterface() {
  // Get the current authenticated user
  const { user } = useAuth();
  
  // Redux state and dispatch
  const { dispatch } = useRedux();
  const notesState = useAppSelector((state: RootState) => state.notes);
  const selectedAccount = notesState.selectedAccount;
  const notes = notesState.notes;
  const activeCategory = notesState.activeCategory;
  const notesStatus = notesState.status;
  
  // Local state
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<"general" | "payment" | "contact" | "legal" | "other">("general");
  const [isImportant, setIsImportant] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<"general" | "payment" | "contact" | "legal" | "other">("general");
  const [editIsImportant, setEditIsImportant] = useState(false);
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  
  // Fetch notes when the dialog opens with a selected account
  React.useEffect(() => {
    if (notesState.isDialogOpen && selectedAccount) {
      dispatch(fetchNotes(selectedAccount.id));
    }
  }, [notesState.isDialogOpen, selectedAccount, dispatch]);

  // Handle adding a new note
  const handleAddNote = () => {
    if (newNoteContent.trim() && selectedAccount && user) {
      dispatch(
        createNote({
          content: newNoteContent.trim(),
          customerId: selectedAccount.id,
          createdBy: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: user.role
          },
          category: newNoteCategory,
          isImportant,
          isPrivate
        })
      );
      
      // Reset form
      setNewNoteContent("");
      setNewNoteCategory("general");
      setIsImportant(false);
      setIsPrivate(false);
    }
  };
  
  // Start editing a note
  const startEditingNote = (note: any) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditIsImportant(note.isImportant);
    setEditIsPrivate(note.isPrivate);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingNote(null);
  };
  
  // Save edited note
  const saveEditedNote = () => {
    if (editingNote && editContent.trim()) {
      dispatch(
        updateNote({
          id: editingNote,
          content: editContent.trim(),
          category: editCategory,
          isImportant: editIsImportant,
          isPrivate: editIsPrivate
        })
      );
      setEditingNote(null);
    }
  };
  
  // Handle deleting a note
  const handleDeleteNote = (id: string) => {
    dispatch(removeNote(id));
  };
  
  // Filter notes by category and search query
  const filteredNotes = notes.filter(note => {
    const matchesCategory = activeCategory === 'all' || note.category === activeCategory;
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <Dialog open={notesState.isDialogOpen} onOpenChange={(open) => !open && dispatch(closeDialog())}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-slate-900 border-slate-800 text-slate-200 p-0">
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <StickyNote className="h-5 w-5 mr-2 text-amber-400" />
            Notes for {selectedAccount?.name || "Account"}
            {selectedAccount?.accountNumber && (
              <Badge className="ml-2 bg-slate-800 text-slate-300 px-1.5 py-0 h-5 text-[10px]">
                {selectedAccount.accountNumber}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[80vh]">
          {/* Left side - Add Note Form */}
          <div className="w-1/3 border-r border-slate-800 p-4 flex flex-col">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Plus className="h-4 w-4 mr-1 text-amber-400" />
              Add New Note
            </h3>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Enter note content..."
                className="min-h-[120px] bg-slate-800/50 border-slate-700 text-slate-200 resize-none"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs text-slate-400">Category</Label>
                  <Select
                    value={newNoteCategory}
                    onValueChange={(value: any) => setNewNoteCategory(value)}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectItem value="general" className="focus:bg-slate-700 focus:text-slate-200">
                        <div className="flex items-center">
                          <div className="bg-blue-400/20 p-1 rounded mr-2">
                            <FileText className="h-3 w-3 text-blue-400" />
                          </div>
                          General
                        </div>
                      </SelectItem>
                      <SelectItem value="payment" className="focus:bg-slate-700 focus:text-slate-200">
                        <div className="flex items-center">
                          <div className="bg-green-400/20 p-1 rounded mr-2">
                            <CreditCard className="h-3 w-3 text-green-400" />
                          </div>
                          Payment
                        </div>
                      </SelectItem>
                      <SelectItem value="contact" className="focus:bg-slate-700 focus:text-slate-200">
                        <div className="flex items-center">
                          <div className="bg-amber-400/20 p-1 rounded mr-2">
                            <Phone className="h-3 w-3 text-amber-400" />
                          </div>
                          Contact
                        </div>
                      </SelectItem>
                      <SelectItem value="legal" className="focus:bg-slate-700 focus:text-slate-200">
                        <div className="flex items-center">
                          <div className="bg-rose-400/20 p-1 rounded mr-2">
                            <Scale className="h-3 w-3 text-rose-400" />
                          </div>
                          Legal
                        </div>
                      </SelectItem>
                      <SelectItem value="other" className="focus:bg-slate-700 focus:text-slate-200">
                        <div className="flex items-center">
                          <div className="bg-purple-400/20 p-1 rounded mr-2">
                            <StickyNote className="h-3 w-3 text-purple-400" />
                          </div>
                          Other
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="important"
                      checked={isImportant}
                      onCheckedChange={setIsImportant}
                      className="data-[state=checked]:bg-amber-500"
                    />
                    <Label htmlFor="important" className="text-xs cursor-pointer flex items-center">
                      <Star className={`h-3.5 w-3.5 mr-1 ${isImportant ? 'text-amber-400' : 'text-slate-400'}`} />
                      Mark as Important
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                      className="data-[state=checked]:bg-rose-500"
                    />
                    <Label htmlFor="private" className="text-xs cursor-pointer flex items-center">
                      <Lock className={`h-3.5 w-3.5 mr-1 ${isPrivate ? 'text-rose-400' : 'text-slate-400'}`} />
                      Private Note
                    </Label>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>
          </div>
          
          {/* Right side - Notes List */}
          <div className="w-2/3 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search notes..."
                    className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={activeCategory}
                  onValueChange={(value: any) => dispatch(setActiveCategory(value))}
                >
                  <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectItem value="all" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                        All Notes
                      </div>
                    </SelectItem>
                    <SelectItem value="general" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-2 text-blue-400" />
                        General
                      </div>
                    </SelectItem>
                    <SelectItem value="payment" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <CreditCard className="h-3.5 w-3.5 mr-2 text-green-400" />
                        Payment
                      </div>
                    </SelectItem>
                    <SelectItem value="contact" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-2 text-amber-400" />
                        Contact
                      </div>
                    </SelectItem>
                    <SelectItem value="legal" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <Scale className="h-3.5 w-3.5 mr-2 text-rose-400" />
                        Legal
                      </div>
                    </SelectItem>
                    <SelectItem value="other" className="focus:bg-slate-700 focus:text-slate-200">
                      <div className="flex items-center">
                        <StickyNote className="h-3.5 w-3.5 mr-2 text-purple-400" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Notes List */}
            <ScrollArea className="flex-1 p-4 bg-slate-900">
              {notesStatus === 'loading' ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="animate-spin h-8 w-8 border-2 border-amber-500 rounded-full border-t-transparent mb-2"></div>
                  <p className="text-sm">Loading notes...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <StickyNote className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No notes found</p>
                  <p className="text-xs mt-1">
                    {searchQuery 
                      ? "Try a different search term" 
                      : "Add a note to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-lg border ${
                        note.isImportant 
                          ? 'border-amber-500/30 bg-amber-500/5' 
                          : 'border-slate-800 bg-slate-800/50'
                      }`}
                    >
                      {editingNote === note.id ? (
                        // Edit mode
                        (<div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-slate-800/80 border-slate-700 text-slate-200 resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <Select
                              value={editCategory}
                              onValueChange={(value: any) => setEditCategory(value)}
                            >
                              <SelectTrigger className="bg-slate-800/80 border-slate-700 text-slate-200 h-8 text-xs">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                <SelectItem value="general" className="focus:bg-slate-700 focus:text-slate-200">
                                  <div className="flex items-center">
                                    <FileText className="h-3 w-3 mr-1 text-blue-400" />
                                    General
                                  </div>
                                </SelectItem>
                                <SelectItem value="payment" className="focus:bg-slate-700 focus:text-slate-200">
                                  <div className="flex items-center">
                                    <CreditCard className="h-3 w-3 mr-1 text-green-400" />
                                    Payment
                                  </div>
                                </SelectItem>
                                <SelectItem value="contact" className="focus:bg-slate-700 focus:text-slate-200">
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1 text-amber-400" />
                                    Contact
                                  </div>
                                </SelectItem>
                                <SelectItem value="legal" className="focus:bg-slate-700 focus:text-slate-200">
                                  <div className="flex items-center">
                                    <Scale className="h-3 w-3 mr-1 text-rose-400" />
                                    Legal
                                  </div>
                                </SelectItem>
                                <SelectItem value="other" className="focus:bg-slate-700 focus:text-slate-200">
                                  <div className="flex items-center">
                                    <StickyNote className="h-3 w-3 mr-1 text-purple-400" />
                                    Other
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-8 w-8 p-0 ${editIsImportant ? 'text-amber-400' : 'text-slate-400'} hover:text-amber-400 hover:bg-slate-800`}
                                      onClick={() => setEditIsImportant(!editIsImportant)}
                                    >
                                      {editIsImportant ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p className="text-xs">{editIsImportant ? 'Remove importance' : 'Mark as important'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <div className="flex items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-8 w-8 p-0 ${editIsPrivate ? 'text-rose-400' : 'text-slate-400'} hover:text-rose-400 hover:bg-slate-800`}
                                      onClick={() => setEditIsPrivate(!editIsPrivate)}
                                    >
                                      {editIsPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p className="text-xs">{editIsPrivate ? 'Make public' : 'Make private'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                                onClick={cancelEditing}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={saveEditedNote}
                                disabled={!editContent.trim()}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>)
                      ) : (
                        // View mode
                        (<>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`p-1.5 rounded mr-2 ${categoryConfig[note.category].bgColor}`}>
                                {categoryConfig[note.category].icon}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <span className={`text-xs font-medium ${categoryConfig[note.category].color}`}>
                                    {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                                  </span>
                                  {note.isImportant && (
                                    <Badge className="ml-2 bg-amber-500/20 text-amber-300 px-1.5 py-0 h-4 text-[10px]">
                                      <Star className="h-2.5 w-2.5 mr-0.5" />
                                      Important
                                    </Badge>
                                  )}
                                  {note.isPrivate && (
                                    <Badge className="ml-2 bg-rose-500/20 text-rose-300 px-1.5 py-0 h-4 text-[10px]">
                                      <Lock className="h-2.5 w-2.5 mr-0.5" />
                                      Private
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center text-[10px] text-slate-400 mt-0.5">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(note.createdAt)}
                                  <Clock className="h-3 w-3 ml-2 mr-1" />
                                  {formatTime(note.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-200">
                                  <DropdownMenuItem 
                                    className="text-xs cursor-pointer hover:bg-slate-700 focus:bg-slate-700"
                                    onClick={() => startEditingNote(note)}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    Edit Note
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  <DropdownMenuItem 
                                    className="text-xs cursor-pointer text-rose-400 hover:bg-slate-700 focus:bg-slate-700 hover:text-rose-400"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Note
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="text-sm text-slate-200 whitespace-pre-wrap">
                            {note.content}
                          </div>
                          <div className="mt-3 flex items-center text-xs text-slate-400">
                            <Avatar className="h-5 w-5 mr-1.5">
                              {note.createdBy.avatar ? (
                                <AvatarImage src={note.createdBy.avatar} alt={note.createdBy.name} />
                              ) : (
                                <AvatarFallback className="bg-amber-600/20 text-amber-200 text-[10px]">
                                  {note.createdBy.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span>{note.createdBy.name}</span>
                            <span className="mx-1">•</span>
                            <span>{formatRelativeTime(note.createdAt)}</span>
                          </div>
                        </>)
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
