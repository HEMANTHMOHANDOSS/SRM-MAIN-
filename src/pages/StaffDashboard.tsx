import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/PythonAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { BookOpen, Calendar, LogOut, Clock, Users, GraduationCap } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Constraint {
  id: string;
  role: string;
  subject_type: string;
  max_subjects: number;
  max_hours: number;
}

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.department_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch subjects for the department
      const subjectRes = await fetch('http://localhost:5000/api/subjects', { headers });
      const subjectData = await subjectRes.json();

      // Fetch constraints for staff role
      const constraintRes = await fetch('http://localhost:5000/api/constraints', { headers });
      const constraintData = await constraintRes.json();

      setSubjects(subjectData || []);
      setConstraints(constraintData || []);

      // Load selected subjects if locked
      if (user?.subjects_locked && user?.subjects_selected) {
        setSelectedSubjects(user.subjects_selected);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getApplicableConstraints = () => {
    return constraints.filter(constraint => 
      constraint.role === user?.staff_role
    );
  };

  const canSelectMoreSubjects = () => {
    const applicableConstraints = getApplicableConstraints();
    if (applicableConstraints.length === 0) return true;
    
    const maxSubjects = Math.max(...applicableConstraints.map(c => c.max_subjects));
    return selectedSubjects.length < maxSubjects;
  };

  const getMaxSubjectsAllowed = () => {
    const applicableConstraints = getApplicableConstraints();
    if (applicableConstraints.length === 0) return 5; // Default fallback
    
    return Math.max(...applicableConstraints.map(c => c.max_subjects));
  };

  const getMaxHoursAllowed = () => {
    const applicableConstraints = getApplicableConstraints();
    if (applicableConstraints.length === 0) return 20; // Default fallback
    
    return Math.max(...applicableConstraints.map(c => c.max_hours));
  };

  const handleSubjectToggle = (subjectId: string) => {
    if (user?.subjects_locked) return;

    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      if (canSelectMoreSubjects()) {
        setSelectedSubjects([...selectedSubjects, subjectId]);
      } else {
        toast({
          title: "Limit Reached",
          description: `You can only select up to ${getMaxSubjectsAllowed()} subjects`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveSelection = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/subjects/select', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_ids: selectedSubjects
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject selection saved and locked successfully!",
        });

        // Refresh the page to get updated user data
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to save selection');
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: "Error",
        description: "Failed to save selection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-600">SRM Timetable Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">
                {user?.staff_role?.replace('_', ' ').toUpperCase() || 'Staff Member'}
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/enhanced-staff'}
              variant="outline" 
              size="sm"
            >
              Enhanced Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Constraints Info */}
        {constraints.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Constraints
              </CardTitle>
              <CardDescription>
                Subject selection limits based on your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Max Subjects: {getMaxSubjectsAllowed()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Max Hours per Week: {getMaxHoursAllowed()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subject Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subject Selection</CardTitle>
                <CardDescription>
                  {user?.subjects_locked 
                    ? "Your subject selection is locked"
                    : `Select subjects to teach (${selectedSubjects.length}/${getMaxSubjectsAllowed()})`
                  }
                </CardDescription>
              </div>
              {!user?.subjects_locked && selectedSubjects.length > 0 && (
                <Button onClick={handleSaveSelection} disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Lock Selection'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {user?.subjects_locked ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ Your subject selection has been saved and locked.
                  </p>
                </div>
                <div className="grid gap-4">
                  {subjects
                    .filter(subject => user?.subjects_selected?.includes(subject.id))
                    .map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div>
                          <h3 className="font-medium">{subject.name}</h3>
                          <p className="text-sm text-gray-600">Code: {subject.code}</p>
                        </div>
                        <Badge variant="default">Selected</Badge>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No subjects available for your department.</p>
                ) : (
                  subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={subject.id}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                        disabled={
                          !selectedSubjects.includes(subject.id) && !canSelectMoreSubjects()
                        }
                      />
                      <label htmlFor={subject.id} className="flex-1 cursor-pointer">
                        <div>
                          <h3 className="font-medium">{subject.name}</h3>
                          <p className="text-sm text-gray-600">
                            Code: {subject.code} | Credits: {subject.credits}
                          </p>
                        </div>
                      </label>
                      {selectedSubjects.includes(subject.id) && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.subjects_locked ? user.subjects_selected?.length || 0 : selectedSubjects.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.subjects_locked ? (
                  <Badge variant="default">Locked</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;