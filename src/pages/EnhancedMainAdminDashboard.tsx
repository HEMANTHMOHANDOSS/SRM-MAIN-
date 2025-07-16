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
  Sparkles
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Analytics {
  total_departments: number;
  total_staff: number;
  pending_approvals: number;
  timetable_generations: number;
  total_dept_admins: number;
  pending_credentials: number;
  total_notifications: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  recipient_type: string;
  created_by_name: string;
  created_at: string;
}

interface SyllabusUpload {
  id: string;
  filename: string;
  original_filename: string;
  department_name: string;
  uploaded_by_name: string;
  status: string;
  uploaded_at: string;
  review_notes?: string;
}

interface TimetableLog {
  id: string;
  department_name: string;
  generation_type: string;
  generated_by_name: string;
  status: string;
  entries_count: number;
  generated_at: string;
}

const EnhancedMainAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syllabusUploads, setSyllabusUploads] = useState<SyllabusUpload[]>([]);
  const [timetableLogs, setTimetableLogs] = useState<TimetableLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    recipient_type: ''
  });
  
  // Chatbot states
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchNotifications();
    fetchSyllabusUploads();
    fetchTimetableLogs();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/analytics', {
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
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/notifications/send', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.recent_notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSyllabusUploads = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/syllabus/review', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSyllabusUploads(data.uploads || []);
      }
    } catch (error) {
      console.error('Error fetching syllabus uploads:', error);
    }
  };

  const fetchTimetableLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/timetables/logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setTimetableLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching timetable logs:', error);
    }
  };

  const generateCredentials = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/credentials/generate', {
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
      const response = await fetch('http://localhost:5000/admin/credentials/export', {
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
        a.download = `user_credentials_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Credentials exported successfully",
        });
      } else {
        const data = await response.json();
        throw new Error(data.error);
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

  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/notifications/send', {
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

  const handleSyllabusAction = async (uploadId: string, action: 'approve' | 'reject', notes: string = '') => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/admin/syllabus/${action}/${uploadId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_notes: notes }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchSyllabusUploads();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing syllabus:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} syllabus`,
        variant: "destructive",
      });
    }
  };

  const handleChatQuery = async () => {
    if (!chatQuery.trim()) return;
    
    setChatLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/admin/chatbot/query', {
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
      console.error('Error querying chatbot:', error);
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
              <p className="text-sm text-gray-600">Advanced SRM Timetable Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="syllabus">Syllabus Review</TabsTrigger>
            <TabsTrigger value="logs">Timetable Logs</TabsTrigger>
            <TabsTrigger value="chatbot">AI Assistant</TabsTrigger>
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

            {/* Additional Stats */}
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
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Credential Generator
                </CardTitle>
                <CardDescription>
                  Generate secure credentials for staff and department admins
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
                    Export Credentials
                  </Button>
                </div>
                
                {analytics?.pending_credentials && analytics.pending_credentials > 0 && (
                  <Alert>
                    <AlertDescription>
                      {analytics.pending_credentials} credentials are ready for export.
                    </AlertDescription>
                  </Alert>
                )}
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
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant="outline">
                          {notification.recipient_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="text-xs text-gray-500">
                        By {notification.created_by_name} • {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="syllabus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Syllabus Review Panel
                </CardTitle>
                <CardDescription>
                  Review and approve uploaded syllabus files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syllabusUploads.map((upload) => (
                    <div key={upload.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{upload.original_filename}</h3>
                          <p className="text-sm text-gray-600">
                            {upload.department_name} • Uploaded by {upload.uploaded_by_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(upload.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            upload.status === 'approved' ? 'default' :
                            upload.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {upload.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {upload.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleSyllabusAction(upload.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleSyllabusAction(upload.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {upload.review_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Review Notes:</strong> {upload.review_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Timetable Generation Logs
                </CardTitle>
                <CardDescription>
                  View all timetable generation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timetableLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{log.department_name}</h3>
                          <p className="text-sm text-gray-600">
                            Type: {log.generation_type} • Generated by {log.generated_by_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.generated_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              log.status === 'completed' ? 'default' :
                              log.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {log.status.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {log.entries_count} entries
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chatbot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get help with dashboard features and system management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask about credentials, analytics, notifications, etc..."
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
                  Try asking: "How to generate credentials?", "What are analytics?", "How to send notifications?"
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedMainAdminDashboard;