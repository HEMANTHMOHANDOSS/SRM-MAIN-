import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/PythonAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { 
  BookOpen, 
  Calendar, 
  LogOut, 
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface ChoiceForm {
  id: string;
  title: string;
  description: string;
  open_date: string;
  close_date: string;
  has_submitted: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Submission {
  id: string;
  form_title: string;
  form_status: string;
  subject_preferences: string;
  additional_notes: string;
  submitted_at: string;
}

const EnhancedStaffDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // State
  const [choiceForms, setChoiceForms] = useState<ChoiceForm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [myTimetable, setMyTimetable] = useState<any>({});
  
  // Form states
  const [selectedForm, setSelectedForm] = useState<ChoiceForm | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  
  // Chatbot state
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchChoiceForms(),
        fetchSubjects(),
        fetchSubmissions(),
        fetchMyTimetable()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChoiceForms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-staff/choice-forms/available', {
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

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-staff/my-submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchMyTimetable = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/enhanced-staff/my-timetable', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setMyTimetable(data.timetable || {});
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  const handleFormSubmission = async () => {
    if (!selectedForm || selectedSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/enhanced-staff/choice-forms/${selectedForm.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_preferences: selectedSubjects,
          additional_notes: additionalNotes
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Subject preferences submitted successfully",
        });
        setShowSubmissionDialog(false);
        setSelectedSubjects([]);
        setAdditionalNotes('');
        fetchChoiceForms();
        fetchSubmissions();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit preferences",
        variant: "destructive",
      });
    }
  };

  const openSubmissionDialog = (form: ChoiceForm) => {
    setSelectedForm(form);
    setSelectedSubjects([]);
    setAdditionalNotes('');
    setShowSubmissionDialog(true);
  };

  const handleSubjectToggle = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const handleChatQuery = async () => {
    if (!chatQuery.trim()) return;
    
    setChatLoading(true);
    try {
      const responses = {
        'choice': 'To submit subject choices: Go to Choice Forms tab, find an open form, click "Submit Preferences", select your preferred subjects in order, and submit.',
        'timetable': 'To view your timetable: Go to My Timetable tab to see your assigned classes, timings, and classrooms once the department admin generates the timetable.',
        'submission': 'To view your submissions: Go to My Submissions tab to see all your submitted subject preferences and their status.',
        'deadline': 'Form deadlines are shown on each choice form. Make sure to submit before the close date to ensure your preferences are considered.',
        'help': 'Available features: 1) Submit Subject Choices 2) View My Timetable 3) Track Submissions. Ask about any specific feature!'
      };
      
      const query_lower = chatQuery.toLowerCase();
      let response = responses['help'];
      
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Staff Dashboard</h1>
              <p className="text-sm text-gray-600">Subject Choice & Timetable Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">
                {user?.staff_role?.replace('_', ' ').toUpperCase() || 'Staff Member'}
              </p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="choices">Choice Forms</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="timetable">My Timetable</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Forms</CardTitle>
                  <BookOpen className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {choiceForms.filter(f => !f.has_submitted).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submitted Forms</CardTitle>
                  <CheckCircle className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Forms</CardTitle>
                  <Clock className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {choiceForms.filter(f => !f.has_submitted).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                  <Calendar className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(myTimetable.schedule || {}).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common staff tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab('choices')}
                    className="h-20 flex flex-col bg-green-600 hover:bg-green-700"
                  >
                    <BookOpen className="h-6 w-6 mb-2" />
                    <span className="text-xs">Submit Choices</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('submissions')}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    <span className="text-xs">View Submissions</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('timetable')}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-xs">My Timetable</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('assistant')}
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Bot className="h-6 w-6 mb-2" />
                    <span className="text-xs">Get Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="choices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Choice Forms</CardTitle>
                <CardDescription>Submit your subject preferences</CardDescription>
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
                            Deadline: {new Date(form.close_date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-col">
                          {form.has_submitted ? (
                            <Badge variant="default">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Submitted
                            </Badge>
                          ) : (
                            <Button 
                              onClick={() => openSubmissionDialog(form)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit Preferences
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {choiceForms.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No choice forms available at the moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>Track your submitted preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{submission.form_title}</h3>
                          <p className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          {submission.additional_notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              Notes: {submission.additional_notes}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            submission.form_status === 'open' ? 'default' :
                            submission.form_status === 'closed' ? 'secondary' : 'outline'
                          }
                        >
                          {submission.form_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {submissions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Timetable</CardTitle>
                <CardDescription>Your assigned classes and schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {myTimetable.schedule && Object.keys(myTimetable.schedule).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-3 bg-gray-50">Time</th>
                          {daysOfWeek.map(day => (
                            <th key={day} className="border border-gray-300 p-3 bg-gray-50">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map(timeSlot => (
                          <tr key={timeSlot}>
                            <td className="border border-gray-300 p-3 font-medium bg-gray-50">
                              {timeSlot}
                            </td>
                            {daysOfWeek.map(day => {
                              const daySchedule = myTimetable.schedule[day];
                              const classInfo = daySchedule ? daySchedule[timeSlot] : null;
                              
                              return (
                                <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-3">
                                  {classInfo ? (
                                    <div className="space-y-1">
                                      <Badge variant="default" className="text-xs">
                                        {classInfo.subject}
                                      </Badge>
                                      <div className="text-xs text-gray-600">
                                        {classInfo.classroom}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-center">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No timetable available</p>
                    <p className="text-sm">Your timetable will appear here once generated by the department admin</p>
                  </div>
                )}
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
                  Get help with subject choices and timetable features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask about choice forms, submissions, timetable, deadlines..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChatQuery()}
                  />
                  <Button onClick={handleChatQuery} disabled={chatLoading}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {chatLoading ? 'Thinking...' : 'Ask'}
                  </Button>
                </div>
                
                {chatResponse && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <Bot className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-900">{chatResponse}</div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Try asking: "How to submit choices?", "When is the deadline?", "How to view my timetable?"
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Subject Choice Dialog */}
        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Subject Preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select your preferred subjects (in order of preference):</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={subject.id}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                      />
                      <label htmlFor={subject.id} className="flex-1 cursor-pointer">
                        <div>
                          <span className="font-medium">{subject.name}</span>
                          <span className="text-sm text-gray-600 ml-2">({subject.code})</span>
                          <span className="text-sm text-gray-600 ml-2">{subject.credits} credits</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea 
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional preferences or notes..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFormSubmission}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Preferences
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedStaffDashboard;