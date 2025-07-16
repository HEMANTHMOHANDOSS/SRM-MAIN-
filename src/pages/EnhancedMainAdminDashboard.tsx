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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users, 
  Building2, 
  BookOpen, 
  Calendar, 
  LogOut, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  BarChart3,
  Key,
  Bell,
  FileText,
  Clock,
  Bot,
  Sparkles,
  Plus,
  RefreshCw
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import * as XLSX from 'xlsx';

interface Analytics {
  total_departments: number;
  total_staff: number;
  pending_approvals: number;
  timetable_generations: number;
  total_dept_admins: number;
  pending_credentials: number;
  total_notifications: number;
}

interface PendingStaff {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  staff_role: string;
  contact_number: string;
  department_name: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
  is_read: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
  college: string;
  programme: string;
}

const EnhancedMainAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    college: '',
    programme: 'UG'
  });
  
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    recipient_type: ''
  });
  
  // Dialog states
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  
  // Chatbot states
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
    // Set up real-time polling
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchPendingStaff(),
        fetchNotifications(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPendingStaff = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/staff/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setPendingStaff(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending staff:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const generateCredentials = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/credentials/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchAnalytics(); // Refresh analytics
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating credentials:', error);
      toast({
        title: "Error",
        description: "Failed to generate credentials",
        variant: "destructive",
      });
    }
  };

  const exportCredentials = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/credentials/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        // Create Excel file using XLSX
        const worksheet = XLSX.utils.json_to_sheet(data.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Credentials');
        
        // Download file
        XLSX.writeFile(workbook, `user_credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast({
          title: "Success",
          description: "Credentials exported successfully",
        });
        
        fetchAnalytics(); // Refresh analytics
      } else {
        throw new Error(data.error || 'No credentials to export');
      }
    } catch (error) {
      console.error('Error exporting credentials:', error);
      toast({
        title: "Error",
        description: "Failed to export credentials",
        variant: "destructive",
      });
    }
  };

  const createDepartment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/departments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Department created successfully! Admin credentials: ${data.data.admin_credentials.email} / ${data.data.admin_credentials.password}`,
        });
        setDepartmentForm({ name: '', code: '', college: '', programme: 'UG' });
        setShowDepartmentDialog(false);
        fetchAllData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive",
      });
    }
  };

  const approveStaff = async (staffId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/staff/approve/${staffId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Staff approved successfully",
        });
        fetchAllData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error approving staff:', error);
      toast({
        title: "Error",
        description: "Failed to approve staff",
        variant: "destructive",
      });
    }
  };

  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Notification sent successfully",
        });
        setNotificationForm({ title: '', message: '', recipient_type: '' });
        fetchNotifications();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleChatQuery = async () => {
    if (!chatQuery.trim()) return;
    
    setChatLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: chatQuery }),
      });

      const data = await response.json();
      if (data.success) {
        setChatResponse(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error querying AI assistant:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Main Admin Dashboard</h1>
              <p className="text-sm text-gray-600">SRM Timetable Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={fetchAllData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">Main Administrator</p>
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
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="staff">Staff Approval</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Departments</CardTitle>
                  <Building2 className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_departments || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_staff || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.pending_approvals || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Timetables Generated</CardTitle>
                  <Calendar className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.timetable_generations || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setShowDepartmentDialog(true)}
                    className="h-20 flex flex-col bg-blue-600 hover:bg-blue-700"
                  >
                    <Building2 className="h-6 w-6 mb-2" />
                    <span className="text-xs">Add Department</span>
                  </Button>
                  <Button 
                    onClick={generateCredentials}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Key className="h-6 w-6 mb-2" />
                    <span className="text-xs">Generate Credentials</span>
                  </Button>
                  <Button 
                    onClick={exportCredentials}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span className="text-xs">Export Credentials</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('assistant')}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Bot className="h-6 w-6 mb-2" />
                    <span className="text-xs">AI Assistant</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Staff Approvals</CardTitle>
                  <CardDescription>Staff members awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pendingStaff.slice(0, 5).map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{staff.name}</h3>
                          <p className="text-sm text-gray-600">{staff.email}</p>
                          <p className="text-sm text-gray-600">{staff.department_name}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => approveStaff(staff.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    ))}
                    {pendingStaff.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending approvals</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Latest system notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge variant={notification.is_read ? "secondary" : "default"}>
                            {notification.is_read ? "Read" : "New"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="text-xs text-gray-500">
                          From {notification.sender_name} • {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Department Management</CardTitle>
                    <CardDescription>Manage academic departments and create admin accounts</CardDescription>
                  </div>
                  <Button onClick={() => setShowDepartmentDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <Card key={dept.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{dept.name}</h3>
                          <Badge variant="outline">{dept.code}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">College: {dept.college}</p>
                        <p className="text-sm text-gray-600">Programme: {dept.programme}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Approval Management</CardTitle>
                <CardDescription>Review and approve staff registration requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingStaff.map((staff) => (
                    <div key={staff.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{staff.name}</h3>
                          <p className="text-sm text-gray-600">
                            {staff.employee_id} • {staff.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Role: {staff.staff_role.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Department: {staff.department_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Contact: {staff.contact_number}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => approveStaff(staff.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(staff.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {pendingStaff.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending staff approvals</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Credential Management
                </CardTitle>
                <CardDescription>
                  Generate and export secure credentials for users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={generateCredentials} className="bg-blue-600 hover:bg-blue-700">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Credentials
                  </Button>
                  <Button onClick={exportCredentials} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
                
                {analytics?.pending_credentials && analytics.pending_credentials > 0 && (
                  <Alert>
                    <AlertDescription>
                      {analytics.pending_credentials} credentials are ready for export.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>1. Click "Generate Credentials" to create login credentials for approved users</p>
                    <p>2. Click "Export to Excel" to download the credentials file</p>
                    <p>3. Share the credentials securely with the respective users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Send Notification
                </CardTitle>
                <CardDescription>
                  Send notifications to staff, department admins, or all users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient">Recipients</Label>
                    <Select 
                      value={notificationForm.recipient_type} 
                      onValueChange={(value) => setNotificationForm({...notificationForm, recipient_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff Only</SelectItem>
                        <SelectItem value="dept_admin">Department Admins Only</SelectItem>
                        <SelectItem value="all">All Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    placeholder="Notification message"
                    rows={4}
                  />
                </div>
                
                <Button onClick={sendNotification} className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant={notification.is_read ? "secondary" : "default"}>
                          {notification.is_read ? "Read" : "New"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="text-xs text-gray-500">
                        From {notification.sender_name} • {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive system statistics and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Department Admins</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.total_dept_admins || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Credentials</CardTitle>
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.pending_credentials || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.total_notifications || 0}</div>
                    </CardContent>
                  </Card>
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
                  Get help with system management and administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask about departments, staff management, credentials, analytics..."
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
                  Try asking: "How to create departments?", "How to approve staff?", "How to generate credentials?"
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Department Creation Dialog */}
        <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Department Name</Label>
                <Input
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                  placeholder="e.g., Computer Science Engineering"
                />
              </div>
              <div>
                <Label>Department Code</Label>
                <Input
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({...departmentForm, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., CSE"
                />
              </div>
              <div>
                <Label>College</Label>
                <Input
                  value={departmentForm.college}
                  onChange={(e) => setDepartmentForm({...departmentForm, college: e.target.value})}
                  placeholder="e.g., SRM College of Engineering"
                />
              </div>
              <div>
                <Label>Programme</Label>
                <Select 
                  value={departmentForm.programme} 
                  onValueChange={(value) => setDepartmentForm({...departmentForm, programme: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UG">Undergraduate (UG)</SelectItem>
                    <SelectItem value="PG">Postgraduate (PG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createDepartment}>
                  Create Department & Admin
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedMainAdminDashboard;