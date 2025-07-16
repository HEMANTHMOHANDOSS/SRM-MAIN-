import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/PythonAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  LogOut, 
  Plus, 
  Settings,
  Send,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Bot,
  Sparkles,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface StaffRequest {
  id: string;
  name: string;
  employee_id: string;
  email: string;
  staff_role: string;
  contact_number?: string;
  status: string;
  created_at: string;
}

interface Constraint {
  id: string;
  role: string;
  max_subjects: number;
  max_hours_per_week: number;
  subject_types: string[];
  lab_faculty_required: number;
}

interface ChoiceForm {
  id: string;
  title: string;
  description: string;
  open_date: string;
  close_date: string;
  status: string;
  submission_count: number;
}

interface Query {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface TimetableConfig {
  period_duration: number;
  periods_per_day: number;
  college_start_time: string;
  college_end_time: string;
  break_times: string[];
  working_days: string[];
}

const EnhancedDepartmentAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // State for different features
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [choiceForms, setChoiceForms] = useState<ChoiceForm[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [timetableConfig, setTimetableConfig] = useState<TimetableConfig>({
    period_duration: 60,
    periods_per_day: 7,
    college_start_time: '09:00',
    college_end_time: '17:00',
    break_times: ['11:00-11:15', '13:00-14:00'],
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  
  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    staff_role: '',
    contact_number: ''
  });
  
  const [constraintForm, setConstraintForm] = useState({
    role: '',
    max_subjects: 1,
    max_hours_per_week: 8,
    subject_types: [],
    lab_faculty_required: 1
  });
  
  const [choiceFormData, setChoiceFormData] = useState({
    title: '',
    description: '',
    open_date: '',
    close_date: ''
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const toggleSubject = (id: string) => {
  setSelectedSubjects((prev) =>
    prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
  );
};
  const [queryForm, setQueryForm] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  
  // Dialog states
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showConstraintDialog, setShowConstraintDialog] = useState(false);
  const [showChoiceFormDialog, setShowChoiceFormDialog] = useState(false);
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [showTimetableDialog, setShowTimetableDialog] = useState(false);
  
  // Chatbot state
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const staffRoles = [
    'assistant_professor',
    'associate_professor', 
    'professor',
    'hod',
    'vp',
    'dean',
    'guest_lecturer'
  ];

  const subjectTypes = ['theory', 'lab', 'elective'];
  const priorities = ['low', 'medium', 'high'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStaffRequests(),
        fetchConstraints(),
        fetchChoiceForms(),
        fetchQueries()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/staff-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setStaffRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching staff requests:', error);
    }
  };

  const fetchConstraints = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/constraints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setConstraints(data.constraints || []);
      }
    } catch (error) {
      console.error('Error fetching constraints:', error);
    }
  };

  const fetchChoiceForms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/choice-forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setChoiceForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching choice forms:', error);
    }
  };

  const fetchQueries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/queries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setQueries(data.queries || []);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    }
  };

  const handleStaffRegistration = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/staff-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Staff registration request submitted successfully",
        });
        setStaffForm({
          name: '',
          employee_id: '',
          email: '',
          staff_role: '',
          contact_number: ''
        });
        setShowStaffDialog(false);
        fetchStaffRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit staff registration request",
        variant: "destructive",
      });
    }
  };

  const handleConstraintCreation = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/constraints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(constraintForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Constraint created successfully",
        });
        setConstraintForm({
          role: '',
          max_subjects: 1,
          max_hours_per_week: 8,
          subject_types: [],
          lab_faculty_required: 1
        });
        setShowConstraintDialog(false);
        fetchConstraints();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create constraint",
        variant: "destructive",
      });
    }
  };

  const handleChoiceFormCreation = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/choice-forms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(choiceFormData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Choice form created successfully",
        });
        setChoiceFormData({
          title: '',
          description: '',
          open_date: '',
          close_date: ''
        });
        setShowChoiceFormDialog(false);
        fetchChoiceForms();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create choice form",
        variant: "destructive",
      });
    }
  };

  const handleQuerySubmission = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/queries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Query submitted successfully",
        });
        setQueryForm({
          title: '',
          description: '',
          priority: 'medium'
        });
        setShowQueryDialog(false);
        fetchQueries();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit query",
        variant: "destructive",
      });
    }
  };

  const toggleChoiceForm = async (formId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/enhanced-admin/choice-forms/${formId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchChoiceForms();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update form status",
        variant: "destructive",
      });
    }
  };

  const generateTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-admin/timetable/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "AI Timetable generated successfully",
        });
        setShowTimetableDialog(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate timetable",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportChoiceSubmissions = async (formId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/enhanced-admin/export/choice-submissions/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `choice_submissions_${formId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Choice submissions exported successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export submissions",
        variant: "destructive",
      });
    }
  };

  const handleChatQuery = async () => {
    if (!chatQuery.trim()) return;
    
    setChatLoading(true);
    try {
      // Simple rule-based responses for department admin queries
      const responses = {
        'staff': 'To register staff: Go to Staff Management tab, click "Register Staff", fill the form and submit. The request will be sent to Main Admin for approval.',
        'constraint': 'To set constraints: Go to Constraints tab, click "Add Constraint", select role and set limits for subjects, hours, and lab requirements.',
        'choice': 'To create choice forms: Go to Choice Forms tab, click "Create Form", set title, dates, and release to staff for subject selection.',
        'timetable': 'To generate timetable: Go to Timetable Generator tab, ensure all constraints and choices are set, then click "Generate AI Timetable".',
        'query': 'To send queries to Main Admin: Go to Queries tab, click "Send Query", describe your issue and submit.',
        'help': 'Available features: 1) Staff Registration 2) Constraint Management 3) Choice Forms 4) Timetable Generation 5) Query System. Ask about any specific feature!'
      };
      
      const query_lower = chatQuery.toLowerCase();
      let response = responses['help']; // default
      
      for (const [key, value] of Object.entries(responses)) {
        if (query_lower.includes(key)) {
          response = value;
          break;
        }
      }
      
      setChatResponse(response);
    } catch (error) {
      setChatResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Department Admin</h1>
              <p className="text-sm text-gray-600">Advanced Department Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">Department Administrator</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="choices">Choice Forms</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staff Requests</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{staffRequests.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Constraints</CardTitle>
                  <Settings className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{constraints.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Choice Forms</CardTitle>
                  <BookOpen className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{choiceForms.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Queries</CardTitle>
                  <MessageSquare className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {queries.filter(q => q.status === 'open').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common department management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setShowStaffDialog(true)}
                    className="h-20 flex flex-col bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-xs">Register Staff</span>
                  </Button>
                  <Button 
                    onClick={() => setShowConstraintDialog(true)}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="text-xs">Add Constraint</span>
                  </Button>
                  <Button 
                    onClick={() => setShowChoiceFormDialog(true)}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <BookOpen className="h-6 w-6 mb-2" />
                    <span className="text-xs">Create Form</span>
                  </Button>
                  <Button 
                    onClick={() => setShowTimetableDialog(true)}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-xs">Generate Timetable</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Staff Management</CardTitle>
                    <CardDescription>Register and manage department staff</CardDescription>
                  </div>
                  <Button onClick={() => setShowStaffDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{request.name}</h3>
                          <p className="text-sm text-gray-600">
                            {request.employee_id} • {request.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Role: {request.staff_role.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI Timetable Constraints</CardTitle>
                    <CardDescription>Define rules for timetable generation</CardDescription>
                  </div>
                  <Button onClick={() => setShowConstraintDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Constraint
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {constraints.map((constraint) => (
                    <div key={constraint.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">
                            {constraint.role.replace('_', ' ').toUpperCase()}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Max Subjects: {constraint.max_subjects}</p>
                            <p>Max Hours/Week: {constraint.max_hours_per_week}</p>
                            <p>Lab Faculty Required: {constraint.lab_faculty_required}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="choices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Subject Choice Forms</CardTitle>
                    <CardDescription>Manage staff subject preference forms</CardDescription>
                  </div>
                  <Button onClick={() => setShowChoiceFormDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Form
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {choiceForms.map((form) => (
                    <div key={form.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{form.title}</h3>
                          <p className="text-sm text-gray-600">{form.description}</p>
                          <p className="text-sm text-gray-600">
                            Open: {new Date(form.open_date).toLocaleDateString()} - 
                            Close: {new Date(form.close_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Submissions: {form.submission_count}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-col">
                          <Badge 
                            variant={
                              form.status === 'open' ? 'default' :
                              form.status === 'closed' ? 'destructive' : 'secondary'
                            }
                          >
                            {form.status.toUpperCase()}
                          </Badge>
                          <div className="flex gap-1">
                            {form.status === 'draft' && (
                              <Button 
                                size="sm" 
                                onClick={() => toggleChoiceForm(form.id, 'open')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {form.status === 'open' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toggleChoiceForm(form.id, 'closed')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportChoiceSubmissions(form.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Timetable Generator</CardTitle>
                <CardDescription>Generate optimized timetables using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Ensure all constraints and choice forms are completed before generating timetables.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Timetable Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Period Duration (minutes)</Label>
                          <Input 
                            type="number" 
                            value={timetableConfig.period_duration}
                            onChange={(e) => setTimetableConfig({
                              ...timetableConfig, 
                              period_duration: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>Periods per Day</Label>
                          <Input 
                            type="number" 
                            value={timetableConfig.periods_per_day}
                            onChange={(e) => setTimetableConfig({
                              ...timetableConfig, 
                              periods_per_day: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>College Start Time</Label>
                          <Input 
                            type="time" 
                            value={timetableConfig.college_start_time}
                            onChange={(e) => setTimetableConfig({
                              ...timetableConfig, 
                              college_start_time: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label>College End Time</Label>
                          <Input 
                            type="time" 
                            value={timetableConfig.college_end_time}
                            onChange={(e) => setTimetableConfig({
                              ...timetableConfig, 
                              college_end_time: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generation Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        onClick={generateTimetable}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {loading ? 'Generating...' : 'Generate AI Timetable'}
                      </Button>
                      
                      <div className="text-sm text-gray-600">
                        <p>This will generate 4 types of timetables:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Student Timetable</li>
                          <li>Staff Timetable</li>
                          <li>Classroom Timetable</li>
                          <li>Lab Timetable</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Department Queries</CardTitle>
                    <CardDescription>Send queries to Main Admin</CardDescription>
                  </div>
                  <Button onClick={() => setShowQueryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Send Query
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queries.map((query) => (
                    <div key={query.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{query.title}</h3>
                          <p className="text-sm text-gray-600">{query.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {query.priority.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant={
                                query.status === 'resolved' ? 'default' :
                                query.status === 'in_progress' ? 'secondary' : 'outline'
                              }
                            >
                              {query.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(query.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get help with department management features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask about staff registration, constraints, choice forms, timetable generation..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChatQuery()}
                  />
                  <Button onClick={handleChatQuery} disabled={chatLoading}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {chatLoading ? 'Thinking...' : 'Ask'}
                  </Button>
                </div>
                
                {chatResponse && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">{chatResponse}</div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Try asking: "How to register staff?", "How to set constraints?", "How to create choice forms?"
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input 
                  value={staffForm.employee_id}
                  onChange={(e) => setStaffForm({...staffForm, employee_id: e.target.value})}
                  placeholder="Employee ID"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Staff Role</Label>
                <Select 
                  value={staffForm.staff_role} 
                  onValueChange={(value) => setStaffForm({...staffForm, staff_role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input 
                  value={staffForm.contact_number}
                  onChange={(e) => setStaffForm({...staffForm, contact_number: e.target.value})}
                  placeholder="Contact number"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowStaffDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStaffRegistration}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showConstraintDialog} onOpenChange={setShowConstraintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Constraint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Staff Role</Label>
                <Select 
                  value={constraintForm.role} 
                  onValueChange={(value) => setConstraintForm({...constraintForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Subjects</Label>
                  <Input 
                    type="number"
                    value={constraintForm.max_subjects}
                    onChange={(e) => setConstraintForm({...constraintForm, max_subjects: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Max Hours/Week</Label>
                  <Input 
                    type="number"
                    value={constraintForm.max_hours_per_week}
                    onChange={(e) => setConstraintForm({...constraintForm, max_hours_per_week: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label>Lab Faculty Required</Label>
                <Input 
                  type="number"
                  value={constraintForm.lab_faculty_required}
                  onChange={(e) => setConstraintForm({...constraintForm, lab_faculty_required: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConstraintDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConstraintCreation}>
                  Create Constraint
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showChoiceFormDialog} onOpenChange={setShowChoiceFormDialog}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Create Choice Form</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input
            value={choiceFormData.title}
            onChange={(e) =>
              setChoiceFormData({ ...choiceFormData, title: e.target.value })
            }
            placeholder="Form title"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={choiceFormData.description}
            onChange={(e) =>
              setChoiceFormData({
                ...choiceFormData,
                description: e.target.value,
              })
            }
            placeholder="Form description"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Open Date</Label>
          <Input
            type="datetime-local"
            value={choiceFormData.open_date}
            onChange={(e) =>
              setChoiceFormData({
                ...choiceFormData,
                open_date: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label>Close Date</Label>
          <Input
            type="datetime-local"
            value={choiceFormData.close_date}
            onChange={(e) =>
              setChoiceFormData({
                ...choiceFormData,
                close_date: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* ✅ Subject Selection Table */}
      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">Select</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Hours</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Credits</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="p-2 border text-center">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                  />
                </td>
                <td className="p-2 border">{subject.name}</td>
                <td className="p-2 border">{subject.code}</td>
                <td className="p-2 border">{subject.hours}</td>
                <td className="p-2 border">{subject.type}</td>
                <td className="p-2 border">{subject.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => setShowChoiceFormDialog(false)}>
          Cancel
        </Button>
        <Button onClick={handleChoiceFormCreation}>Create Form</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>


        <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Query to Main Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={queryForm.title}
                  onChange={(e) => setQueryForm({...queryForm, title: e.target.value})}
                  placeholder="Query title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={queryForm.description}
                  onChange={(e) => setQueryForm({...queryForm, description: e.target.value})}
                  placeholder="Describe your query"
                  rows={4}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select 
                  value={queryForm.priority} 
                  onValueChange={(value) => setQueryForm({...queryForm, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowQueryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleQuerySubmission}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Query
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedDepartmentAdminDashboard;