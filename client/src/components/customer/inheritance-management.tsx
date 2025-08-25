import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Crown, FileText, Clock, CheckCircle2, AlertCircle, Scroll, Upload, Download, Shield, Users } from 'lucide-react';

interface InheritanceProcess {
  id: string;
  deceasedUserId: string;
  initiatorId: string;
  status: 'pending' | 'in_review' | 'approved' | 'completed' | 'rejected';
  documents: InheritanceDocument[];
  beneficiaries: InheritanceBeneficiary[];
  accounts: InheritanceAccount[];
  totalValue: string;
  processingNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  deceased: {
    name: string;
    email: string;
  };
  initiator: {
    name: string;
    email: string;
  };
}

interface InheritanceDocument {
  id: string;
  inheritanceId: string;
  documentType: 'death_certificate' | 'will' | 'trust' | 'court_order' | 'power_of_attorney' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface InheritanceBeneficiary {
  id: string;
  inheritanceId: string;
  beneficiaryId: string;
  percentage: number;
  accountIds: string[];
  status: 'pending' | 'notified' | 'accepted' | 'rejected';
  notifiedAt?: string;
  respondedAt?: string;
  beneficiary: {
    name: string;
    email: string;
  };
}

interface InheritanceAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  distributionStatus: 'pending' | 'in_progress' | 'completed';
  distributedAmount?: string;
  distributedAt?: string;
}

export default function InheritanceManagement() {
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<InheritanceProcess | null>(null);
  const [formData, setFormData] = useState({
    deceasedEmail: '',
    relationship: '',
    deathDate: '',
    notes: '',
    documents: [] as File[]
  });

  const queryClient = useQueryClient();

  // Fetch inheritance processes
  const { data: inheritanceProcesses, isLoading } = useQuery<InheritanceProcess[]>({
    queryKey: ['inheritance-processes'],
    queryFn: async () => {
      const response = await fetch('/api/inheritance/processes');
      if (!response.ok) throw new Error('Failed to fetch inheritance processes');
      return response.json();
    },
  });

  // Initiate inheritance process mutation
  const initiateProcessMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inheritance/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to initiate inheritance process');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inheritance-processes'] });
      setShowInitiateDialog(false);
      resetForm();
      toast({
        title: "Inheritance Process Initiated",
        description: "Your inheritance claim has been submitted for review",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate inheritance process",
        variant: "destructive",
      });
    },
  });

  // Upload documents mutation
  const uploadDocumentsMutation = useMutation({
    mutationFn: async ({ processId, documents }: { processId: string; documents: File[] }) => {
      const formData = new FormData();
      formData.append('processId', processId);
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc);
      });

      const response = await fetch('/api/inheritance/documents', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload documents');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inheritance-processes'] });
      setShowUploadDialog(false);
      setSelectedProcess(null);
      toast({
        title: "Documents Uploaded",
        description: "Your inheritance documents have been uploaded for review",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  // Accept inheritance mutation
  const acceptInheritanceMutation = useMutation({
    mutationFn: async ({ processId, accept }: { processId: string; accept: boolean }) => {
      const response = await fetch(`/api/inheritance/respond/${processId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
      if (!response.ok) throw new Error('Failed to respond to inheritance');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inheritance-processes'] });
      toast({
        title: variables.accept ? "Inheritance Accepted" : "Inheritance Declined",
        description: variables.accept 
          ? "You have accepted the inheritance. Processing will continue."
          : "You have declined the inheritance.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to inheritance",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      deceasedEmail: '',
      relationship: '',
      deathDate: '',
      notes: '',
      documents: []
    });
  };

  const handleInitiateProcess = () => {
    if (!formData.deceasedEmail || !formData.relationship || !formData.deathDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    initiateProcessMutation.mutate({
      deceasedEmail: formData.deceasedEmail,
      relationship: formData.relationship,
      deathDate: formData.deathDate,
      notes: formData.notes
    });
  };

  const handleUploadDocuments = () => {
    if (!selectedProcess || formData.documents.length === 0) {
      toast({
        title: "Error",
        description: "Please select documents to upload",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentsMutation.mutate({
      processId: selectedProcess.id,
      documents: formData.documents
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="h-3 w-3 mr-1" />In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const documentTypes = [
    { value: 'death_certificate', label: 'Death Certificate' },
    { value: 'will', label: 'Last Will & Testament' },
    { value: 'trust', label: 'Trust Document' },
    { value: 'court_order', label: 'Court Order' },
    { value: 'power_of_attorney', label: 'Power of Attorney' },
    { value: 'other', label: 'Other Legal Document' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Inheritance Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage inheritance processes, documentation, and beneficiary claims
          </p>
        </div>
        
        <Dialog open={showInitiateDialog} onOpenChange={setShowInitiateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Initiate Inheritance Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Initiate Inheritance Process</DialogTitle>
              <DialogDescription>
                Start the inheritance process for a deceased account holder. Proper documentation will be required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="deceased-email" className="text-sm font-medium">Deceased Person's Email *</label>
                <Input
                  id="deceased-email"
                  value={formData.deceasedEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, deceasedEmail: e.target.value }))}
                  placeholder="Enter deceased person's email"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="relationship" className="text-sm font-medium">Relationship to Deceased *</label>
                <Select value={formData.relationship} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="beneficiary">Named Beneficiary</SelectItem>
                    <SelectItem value="executor">Estate Executor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="death-date" className="text-sm font-medium">Date of Death *</label>
                <Input
                  id="death-date"
                  type="date"
                  value={formData.deathDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Additional Information</label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Provide any additional relevant information"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Shield className="h-4 w-4" />
                  <p className="font-medium">Required Documentation</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  After submitting this claim, you'll need to upload legal documentation including death certificate, 
                  will, trust documents, or court orders as applicable.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInitiateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInitiateProcess} disabled={initiateProcessMutation.isPending}>
                {initiateProcessMutation.isPending ? "Submitting..." : "Submit Claim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inheritance Processes List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading inheritance processes...</p>
            </div>
          </div>
        ) : inheritanceProcesses?.length === 0 ? (
          <Card className="p-8 text-center">
            <Scroll className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inheritance Processes</h3>
            <p className="text-gray-600 mb-4">
              You don't have any active inheritance processes. If someone has passed away and you believe you're entitled to their assets, you can initiate a claim.
            </p>
            <Button onClick={() => setShowInitiateDialog(true)} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Initiate First Claim
            </Button>
          </Card>
        ) : (
          inheritanceProcesses?.map((process) => (
            <Card key={process.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      Inheritance Process #{process.id.slice(-6)}
                    </CardTitle>
                    <CardDescription>
                      Deceased: {process.deceased.name} • Total Value: ${parseFloat(process.totalValue || '0').toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(process.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Process Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Initiated By</p>
                      <p className="text-gray-600">{process.initiator.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Date Initiated</p>
                      <p className="text-gray-600">{new Date(process.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  {process.documents && process.documents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents ({process.documents.length})
                      </h4>
                      <div className="space-y-2">
                        {process.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{doc.fileName}</p>
                                {getDocumentStatusBadge(doc.status)}
                              </div>
                              <p className="text-sm text-gray-600">
                                {documentTypes.find(t => t.value === doc.documentType)?.label || doc.documentType}
                              </p>
                              <p className="text-xs text-gray-400">
                                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beneficiaries */}
                  {process.beneficiaries && process.beneficiaries.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Beneficiaries ({process.beneficiaries.length})
                      </h4>
                      <div className="space-y-2">
                        {process.beneficiaries.map((beneficiary) => (
                          <div key={beneficiary.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{beneficiary.beneficiary.name}</p>
                                {getStatusBadge(beneficiary.status)}
                              </div>
                              <p className="text-sm text-gray-600">{beneficiary.beneficiary.email}</p>
                              <p className="text-xs text-gray-500">
                                {beneficiary.percentage}% of estate • {beneficiary.accountIds.length} accounts
                              </p>
                            </div>
                            {beneficiary.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => acceptInheritanceMutation.mutate({ processId: process.id, accept: true })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => acceptInheritanceMutation.mutate({ processId: process.id, accept: false })}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accounts */}
                  {process.accounts && process.accounts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Affected Accounts ({process.accounts.length})
                      </h4>
                      <div className="space-y-2">
                        {process.accounts.map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">Account #{account.accountNumber}</p>
                                {getStatusBadge(account.distributionStatus)}
                              </div>
                              <p className="text-sm text-gray-600">
                                {account.accountType} • Balance: ${parseFloat(account.balance).toLocaleString()}
                              </p>
                              {account.distributedAmount && (
                                <p className="text-xs text-gray-500">
                                  Distributed: ${parseFloat(account.distributedAmount).toLocaleString()} on {account.distributedAt ? new Date(account.distributedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Processing Notes */}
                  {process.processingNotes && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">Processing Notes</p>
                      <p className="text-sm text-blue-800 mt-1">{process.processingNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {(process.status === 'pending' || process.status === 'in_review') && (
                      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProcess(process)}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Documents
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Upload Inheritance Documents</DialogTitle>
                            <DialogDescription>
                              Upload required legal documentation to support your inheritance claim.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <label htmlFor="documents" className="text-sm font-medium">Documents *</label>
                              <input
                                id="documents"
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setFormData(prev => ({ ...prev, documents: files }));
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              <p className="text-xs text-gray-500">
                                Accepted formats: PDF, JPEG, PNG, DOC, DOCX. Max 10MB per file.
                              </p>
                            </div>

                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-800">
                                <FileText className="h-4 w-4" />
                                <p className="font-medium">Required Documents</p>
                              </div>
                              <ul className="text-sm text-green-700 mt-1 space-y-1">
                                <li>• Death Certificate (certified copy)</li>
                                <li>• Last Will & Testament (if available)</li>
                                <li>• Trust Documents (if applicable)</li>
                                <li>• Court Orders (if applicable)</li>
                                <li>• Government-issued ID</li>
                              </ul>
                            </div>

                            {formData.documents.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Selected Files:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {formData.documents.map((file, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      {file.name} ({Math.round(file.size / 1024)}KB)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUploadDocuments} disabled={uploadDocumentsMutation.isPending}>
                              {uploadDocumentsMutation.isPending ? "Uploading..." : "Upload Documents"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}