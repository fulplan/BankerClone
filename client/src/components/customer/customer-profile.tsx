import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { User, CustomerProfile } from "@shared/schema";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  ssn: string;
  employmentStatus: string;
  annualIncome: string;
}

const employmentStatuses = [
  'Employed Full-Time',
  'Employed Part-Time',
  'Self-Employed',
  'Unemployed',
  'Retired',
  'Student',
  'Other'
];

const usStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function CustomerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    ssn: '',
    employmentStatus: '',
    annualIncome: '',
  });

  const { data: profile, isLoading: profileLoading } = useQuery<CustomerProfile | null>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  // Update form state when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || 'United States',
        ssn: profile.ssn || '',
        employmentStatus: profile.employmentStatus || '',
        annualIncome: profile.annualIncome || '',
      });
    }
  }, [profile, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileForm>) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ documentType, file }: { documentType: string; file: File }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      
      const response = await fetch('/api/profile/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsDocumentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleDocumentUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const documentType = formData.get('documentType') as string;
    const file = formData.get('document') as File;
    
    if (!file || !documentType) {
      toast({
        title: "Error",
        description: "Please select a document and specify its type",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({ documentType, file });
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Profile</h2>
          <p className="text-gray-600">Manage your personal information and verification status</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                <i className="fas fa-upload mr-2"></i>
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Verification Documents</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDocumentUpload} className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select name="documentType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Government ID (Driver's License/Passport)</SelectItem>
                      <SelectItem value="address">Proof of Address (Utility Bill/Bank Statement)</SelectItem>
                      <SelectItem value="income">Proof of Income (Pay Stub/Tax Return)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document">Select Document</Label>
                  <Input
                    id="document"
                    name="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, JPG, PNG (max 10MB)
                  </p>
                </div>

                <Alert>
                  <i className="fas fa-shield-alt text-blue-600"></i>
                  <AlertDescription>
                    Your documents are encrypted and securely stored. We use bank-level security to protect your information.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full bg-finora-primary hover:bg-finora-primary/90"
                  disabled={uploadDocumentMutation.isPending}
                >
                  {uploadDocumentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <i className="fas fa-upload mr-2"></i>
                  )}
                  Upload Document
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="bg-finora-primary hover:bg-finora-primary/90"
          >
            <i className={`fas ${isEditingProfile ? 'fa-times' : 'fa-edit'} mr-2`}></i>
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-shield-check text-finora-primary"></i>
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Identity Verification</span>
              <Badge className={getVerificationStatusColor(profile?.idVerificationStatus || 'pending')}>
                {profile?.idVerificationStatus || 'pending'}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">KYC Status</span>
              <Badge className={getKycStatusColor(profile?.kycStatus || 'pending')}>
                {profile?.kycStatus || 'pending'}
              </Badge>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <i className={`fas fa-circle text-xs ${profile?.idDocumentUrl ? 'text-green-500' : 'text-gray-300'}`}></i>
                <span className="text-sm">Government ID</span>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas fa-circle text-xs ${profile?.proofOfAddressUrl ? 'text-green-500' : 'text-gray-300'}`}></i>
                <span className="text-sm">Proof of Address</span>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas fa-circle text-xs ${profile?.ssn ? 'text-green-500' : 'text-gray-300'}`}></i>
                <span className="text-sm">SSN Verification</span>
              </div>
            </div>

            {(profile?.idVerificationStatus === 'pending' || profile?.kycStatus === 'pending') && (
              <Alert className="mt-4">
                <i className="fas fa-clock text-yellow-600"></i>
                <AlertDescription>
                  Your verification is in progress. This typically takes 1-2 business days.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              <TabsTrigger value="financial">Financial Info</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        disabled={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ssn">Social Security Number</Label>
                    <Input
                      id="ssn"
                      type={isEditingProfile ? "text" : "password"}
                      value={isEditingProfile ? profileForm.ssn : (profile?.ssn ? '***-**-' + profile.ssn.slice(-4) : '')}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, ssn: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="XXX-XX-XXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for account verification and tax reporting
                    </p>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleUpdateProfile}
                        className="bg-finora-primary hover:bg-finora-primary/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <i className="fas fa-save mr-2"></i>
                        )}
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select 
                        value={profileForm.state} 
                        onValueChange={(value) => setProfileForm(prev => ({ ...prev, state: value }))}
                        disabled={!isEditingProfile}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {usStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={profileForm.zipCode}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, zipCode: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={profileForm.country} 
                      onValueChange={(value) => setProfileForm(prev => ({ ...prev, country: value }))}
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleUpdateProfile}
                        className="bg-finora-primary hover:bg-finora-primary/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <i className="fas fa-save mr-2"></i>
                        )}
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select 
                      value={profileForm.employmentStatus} 
                      onValueChange={(value) => setProfileForm(prev => ({ ...prev, employmentStatus: value }))}
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="annualIncome">Annual Income (USD)</Label>
                    <Input
                      id="annualIncome"
                      type="number"
                      step="1000"
                      value={profileForm.annualIncome}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, annualIncome: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="50000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This information helps us provide appropriate financial products and services
                    </p>
                  </div>

                  <Alert>
                    <i className="fas fa-lock text-green-600"></i>
                    <AlertDescription>
                      All financial information is encrypted and stored securely. We never share your personal data with third parties without your consent.
                    </AlertDescription>
                  </Alert>

                  {isEditingProfile && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleUpdateProfile}
                        className="bg-finora-primary hover:bg-finora-primary/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <i className="fas fa-save mr-2"></i>
                        )}
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}