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
  Sun,
  Cloud,
  CheckCircle
} from 'lucide-react';
import {
  useSendInvitations,
  useSendInvitationsFromFile,
} from '@/lib/hooks/useUsers';
import { toast } from 'sonner';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvitationModal({ isOpen, onClose }: InvitationModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
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

    // Validate email format
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

  const handleClose = () => {
    setEmails(['']);
    setMessage('');
    setActiveTab('manual');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Decorative Elements */}
      <div className="fixed top-10 right-10 opacity-5 pointer-events-none">
        <Sun className="h-20 w-20 text-orange-300" />
      </div>
      <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
        <Cloud className="h-20 w-20 text-sky-300" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-orange-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 bg-gradient-to-b from-sky-400 to-orange-400 rounded-full"></div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-sky-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Mail className="h-5 w-5 text-sky-500" />
                  Invite Users
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Send invitations to new users via email or file upload
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 p-1 bg-sky-50/50 rounded-xl mb-6">
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all"
              >
                <Mail className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger 
                value="file" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all"
              >
                <FileText className="h-4 w-4" />
                File Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6">
              {/* Email List Card */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50/30 to-orange-50/30 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Email Addresses
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 ml-6">
                    Add email addresses manually. Each email will receive an invitation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="pl-10 border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm"
                        />
                      </div>
                      {emails.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveEmail(index)}
                          className="border-red-200 hover:bg-red-50 text-red-600 rounded-xl px-3 opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleAddEmail}
                    className="w-full border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl py-2.5 text-sm font-medium mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Email
                  </Button>

                  {/* Email Count Indicator */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-gradient-to-r from-sky-200 to-orange-200 rounded-full">
                      <div 
                        className="h-1 bg-gradient-to-r from-sky-500 to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (emails.filter(e => e.trim()).length / 10) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {emails.filter(e => e.trim()).length} email{emails.filter(e => e.trim()).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Message Card */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50/30 to-sky-50/30 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Optional Message
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 ml-6">
                    Add a personal message to include with the invitation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <Textarea
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none"
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={sendInvitationsMutation.isPending}
                  className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm"
                >
                  {sendInvitationsMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Send Invitations</span>
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-6">
              {/* File Upload Card */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-50/30 to-orange-50/30 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Upload Email List
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 ml-6">
                    Upload a .txt file with one email address per line.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div 
                    className="border-2 border-dashed border-sky-200 rounded-xl p-8 text-center hover:border-sky-400 transition-colors bg-gradient-to-b from-sky-50/30 to-orange-50/30 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="h-16 w-16 bg-gradient-to-br from-sky-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-sky-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        Only .txt files are supported
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-4 border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                      Choose File
                    </Button>
                  </div>

                  {/* File Format Hint */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">File format requirements:</p>
                        <p className="text-xs text-amber-600">One email address per line, no commas or special formatting</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Card */}
              <Card className="border-sky-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50/30 to-sky-50/30 border-b border-sky-100 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Optional Message
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 ml-6">
                    Add a personal message to include with all invitations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <Textarea
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="border-sky-200 focus:border-sky-400 rounded-xl bg-white/80 text-sm resize-none"
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendInvitationsFromFileMutation.isPending}
                  className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm"
                >
                  {sendInvitationsFromFileMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
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
        <div className="px-6 py-3 border-t border-sky-100 bg-gradient-to-r from-sky-50/30 to-orange-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-sky-300"></span>
              <span className="text-xs text-gray-400">Invitations are sent immediately</span>
              <span className="h-1 w-1 rounded-full bg-orange-300"></span>
            </div>
            <CheckCircle className="h-4 w-4 text-sky-400" />
          </div>
        </div>
      </div>
    </div>
  );
}