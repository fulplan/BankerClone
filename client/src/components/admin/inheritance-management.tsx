import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Heart, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, User, Crown, Shield, Search, Filter, Gavel } from 'lucide-react';

interface InheritanceProcess {
  id: string;
  deceasedUserId: string;
  deathCertificateUrl?: string;
  status: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InheritanceManagement() {
  const [selectedProcess, setSelectedProcess] = useState<InheritanceProcess | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch inheritance processes
  const { data: processes, isLoading } = useQuery<InheritanceProcess[]>({
    queryKey: ['admin-inheritance'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inheritance');
      if (!response.ok) throw new Error('Failed to fetch inheritance processes');
      return response.json();
    },
  });

  // Update inheritance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/admin/inheritance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update inheritance process');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inheritance'] });
      setShowReviewDialog(false);
      setSelectedProcess(null);
      setReviewStatus('');
      setReviewNotes('');
      toast({
        title: "Success",
        description: "Inheritance process updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inheritance process",
        variant: "destructive",
      });
    },
  });

  const handleReviewProcess = (process: InheritanceProcess) => {
    setSelectedProcess(process);
    setReviewStatus(process.status === 'pending' ? 'approved' : process.status);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedProcess || !reviewStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      id: selectedProcess.id,
      status: reviewStatus,
      notes: reviewNotes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter processes
  const filteredProcesses = processes?.filter((process) => {
    const matchesStatus = filterStatus === 'all' || process.status === filterStatus;
    const matchesSearch = !searchQuery || 
      process.deceasedUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const pendingCount = processes?.filter(p => p.status === 'pending').length || 0;
  const approvedCount = processes?.filter(p => p.status === 'approved' || p.status === 'completed').length || 0;
  const rejectedCount = processes?.filter(p => p.status === 'rejected').length || 0;
  const underReviewCount = processes?.filter(p => p.status === 'under_review').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Inheritance & Estate Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage account inheritance processes, estate transfers, and beneficiary disputes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting legal review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{underReviewCount}</div>
            <p className="text-xs text-muted-foreground">Active investigation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Transfer completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Legal issues found</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Process</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by process ID or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading inheritance processes...</p>
            </div>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <Card className="p-8 text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inheritance Processes Found</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all'
                ? "No processes match your current filters."
                : "No inheritance processes have been submitted yet."
              }
            </p>
          </Card>
        ) : (
          filteredProcesses.map((process) => (
            <Card key={process.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Inheritance Process #{process.id.slice(-6)}
                      </CardTitle>
                      <CardDescription>
                        Deceased User: {process.deceasedUserId.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(process.status)}
                    <Button 
                      size="sm"
                      onClick={() => handleReviewProcess(process)}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Gavel className="h-4 w-4" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Process ID</p>
                    <p className="text-gray-600 font-mono">{process.id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submitted</p>
                    <p className="text-gray-600">
                      {new Date(process.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Status</p>
                    <p className="text-gray-600 capitalize">{process.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Last Updated</p>
                    <p className="text-gray-600">
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {process.deathCertificateUrl && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Death Certificate</p>
                      <p className="text-blue-600 text-sm flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Document provided
                      </p>
                    </div>
                  )}
                  {process.processedBy && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Processed By</p>
                      <p className="text-gray-600">{process.processedBy}</p>
                    </div>
                  )}
                </div>
                
                {/* Risk Assessment */}
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Risk Assessment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-amber-700">Documentation Status</p>
                      <p className="font-medium text-amber-900">
                        {process.deathCertificateUrl ? 'Complete' : 'Incomplete'}
                      </p>
                    </div>
                    <div>
                      <p className="text-amber-700">Legal Review Required</p>
                      <p className="font-medium text-amber-900">
                        {process.status === 'pending' ? 'Yes' : 'Complete'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Inheritance Process</DialogTitle>
            <DialogDescription>
              Review and update the status of inheritance process #{selectedProcess?.id.slice(-6)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcess && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Process ID</p>
                  <p className="text-gray-600 font-mono">{selectedProcess.id}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Deceased User ID</p>
                  <p className="text-gray-600 font-mono">{selectedProcess.deceasedUserId}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Current Status</p>
                  {getStatusBadge(selectedProcess.status)}
                </div>
                <div>
                  <p className="font-medium text-sm">Submitted</p>
                  <p className="text-gray-600">{new Date(selectedProcess.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-sm">Documentation</p>
                  <p className="text-gray-600">
                    {selectedProcess.deathCertificateUrl ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Death certificate provided
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Death certificate missing
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Decision *</label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Under Review
                      </div>
                    </SelectItem>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Approve Inheritance
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Reject Process
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-600" />
                        Mark as Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Legal Notes & Rationale *</label>
                <Textarea
                  id="notes"
                  placeholder="Provide detailed notes about your decision, legal requirements met/unmet, and any follow-up actions needed..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
              
              {reviewStatus === 'approved' && (
                <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">Inheritance Approval</p>
                    <p className="text-green-700 text-sm">
                      This will initiate the automatic inheritance transfer process. All accounts and assets 
                      belonging to the deceased will be transferred to designated beneficiaries according 
                      to their will or legal inheritance laws.
                    </p>
                  </div>
                </div>
              )}
              
              {reviewStatus === 'rejected' && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 text-sm">Process Rejection</p>
                    <p className="text-red-700 text-sm">
                      The inheritance process will be rejected. Beneficiaries will be notified and may need 
                      to provide additional documentation or resolve legal issues before resubmitting.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={updateStatusMutation.isPending || !reviewNotes.trim()}
            >
              {updateStatusMutation.isPending ? "Processing..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}