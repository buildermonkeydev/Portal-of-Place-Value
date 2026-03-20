'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  Mail, 
  FileText, 
  Plus,
  Users,
  Send,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Inbox,
  FileUp,
  Copy,
  Shield
} from 'lucide-react';
import {
  useSendInvitations,
  useSendInvitationsFromFile,
} from '@/lib/hooks/useUsers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvitationModal({ isOpen, onClose }: InvitationModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendInvitationsMutation = useSendInvitations();
  const sendInvitationsFromFileMutation = useSendInvitationsFromFile();

  if (!isOpen) return null;

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleManualSubmit = async () => {
    const validEmails = emails.filter((email) => email.trim() !== '');

    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(
      (email) => !emailRegex.test(email)
    );

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      await sendInvitationsMutation.mutateAsync({
        emails: validEmails,
        message: message.trim() || undefined,
      });
      toast.success(`Invitations sent to ${validEmails.length} users`);
      handleClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Please upload a .txt file');
      return;
    }

    try {
      await sendInvitationsFromFileMutation.mutateAsync(file);
      toast.success('Invitations sent from file successfully');
      handleClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Please upload a .txt file');
      return;
    }

    try {
      await sendInvitationsFromFileMutation.mutateAsync(file);
      toast.success('Invitations sent from file successfully');
      handleClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    setEmails(['']);
    setMessage('');
    setActiveTab('manual');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const validEmailCount = emails.filter(e => e.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
        <Sparkles className="h-20 w-20 text-indigo-400" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
        <Inbox className="h-20 w-20 text-orange-400" />
      </div>

      <div className="relative bg-[#0C0C10] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 bg-gradient-to-b from-indigo-400 to-orange-400 rounded-full"></div>
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-400" />
                  Invite Users
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Send invitations to new users via email or file upload
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 p-1 bg-white/5 rounded-xl mb-6">
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-zinc-400 transition-all"
              >
                <Mail className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-zinc-400 transition-all"
              >
                <FileText className="h-4 w-4" />
                File Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-5">
              {/* Email List Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Email Addresses</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Add email addresses manually. Each email will receive an invitation.
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl"
                        />
                      </div>
                      {emails.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveEmail(index)}
                          className="bg-white/5 border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl px-3 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleAddEmail}
                    className="w-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl py-2.5 mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Email
                  </Button>

                  {/* Email Count Indicator */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (validEmailCount / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">
                      {validEmailCount} email{validEmailCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Optional Message</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Add a personal message to include with the invitation.
                  </p>
                </div>
                <div className="p-5">
                  <Textarea
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl px-5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={sendInvitationsMutation.isPending}
                  className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5 min-w-[140px]"
                >
                  {sendInvitationsMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Send Invitations</span>
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-5">
              {/* File Upload Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Upload Email List</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Upload a .txt file with one email address per line.
                  </p>
                </div>
                <div className="p-5">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                      isDragging 
                        ? "border-indigo-400 bg-indigo-500/10" 
                        : "border-white/10 hover:border-indigo-500/50 bg-white/5"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {isDragging ? (
                        <FileUp className="h-8 w-8 text-indigo-400 animate-bounce" />
                      ) : (
                        <Upload className="h-8 w-8 text-indigo-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">
                        {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Only .txt files are supported
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-4 bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl"
                    >
                      Choose File
                    </Button>
                  </div>

                  {/* File Format Hint */}
                  <div className="mt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-400">File format requirements:</p>
                        <p className="text-xs text-amber-400/70">One email address per line, no commas or special formatting</p>
                      </div>
                    </div>
                  </div>

                  {/* Example Format */}
                  <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Copy className="h-3.5 w-3.5 text-zinc-500" />
                      <p className="text-xs text-zinc-500">Example format:</p>
                    </div>
                    <code className="text-xs text-zinc-400 block font-mono">
                      user1@example.com<br />
                      user2@example.com<br />
                      user3@example.com
                    </code>
                  </div>
                </div>
              </div>

              {/* Message Card */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Optional Message</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 ml-6">
                    Add a personal message to include with all invitations.
                  </p>
                </div>
                <div className="p-5">
                  <Textarea
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl px-5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendInvitationsFromFileMutation.isPending}
                  className="bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl px-5 min-w-[140px]"
                >
                  {sendInvitationsFromFileMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload & Send</span>
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs text-zinc-500">Invitations are sent immediately</span>
            </div>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}