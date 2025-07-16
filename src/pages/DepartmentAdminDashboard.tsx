import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/PythonAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, BookOpen, Calendar, LogOut, Plus, MapPin } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
}

interface StaffMember {
  id: string;
  name: string;
  staff_role: string;
  subjects_selected?: string;
  subjects_locked?: boolean;
}

const DepartmentAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalClassrooms: 0,
    totalStaff: 0,
    activeTimetables: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.department_id) {
      fetchDepartmentData();
    }
  }, [user]);

  const fetchDepartmentData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch subjects
      const subjectRes = await fetch('http://localhost:5000/api/subjects', { headers });
      const subjectData = await subjectRes.json();

      // Fetch classrooms
      const classroomRes = await fetch('http://localhost:5000/api/classrooms', { headers });
      const classroomData = await classroomRes.json();

      // Fetch staff
      const staffRes = await fetch('http://localhost:5000/api/staff', { headers });
      const staffData = await staffRes.json();

      // Fetch timetable count
      const timetableRes = await fetch('http://localhost:5000/api/timetables/stats', { headers });
      const timetableStats = await timetableRes.json();

      setSubjects(subjectData || []);
      setClassrooms(classroomData || []);
      setStaff(staffData || []);
      setStats({
        totalSubjects: subjectData?.length || 0,
        totalClassrooms: classroomData?.length || 0,
        totalStaff: staffData?.length || 0,
        activeTimetables: timetableStats?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching department data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch department data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Department Admin</h1>
              <p className="text-sm text-gray-600">Department Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">Department Administrator</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/enhanced-dept-admin'}
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timetables</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTimetables}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subjects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Subjects</CardTitle>
                  <CardDescription>Manage subjects and curriculum</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-sm text-gray-600">Code: {subject.code}</p>
                    </div>
                    <Badge variant="outline">{subject.credits} Credits</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Classrooms */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Classrooms</CardTitle>
                  <CardDescription>Manage classroom resources</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Classroom
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {classrooms.map((classroom) => (
                  <div key={classroom.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{classroom.name}</h3>
                      <p className="text-sm text-gray-600">Capacity: {classroom.capacity} students</p>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          

          {/* Staff Members */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Members</CardTitle>
                  <CardDescription>Manage department faculty</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-600">
                        {member.staff_role?.replace('_', ' ').toUpperCase() || 'Staff'}
                      </p>
                    </div>
                    <Badge 
                      variant={member.subjects_locked ? "default" : "outline"}
                    >
                      {member.subjects_locked ? "Locked" : "Available"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Department management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Generate Timetable
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <BookOpen className="h-6 w-6 mb-2" />
                  Manage Subjects
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Staff Assignment
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <MapPin className="h-6 w-6 mb-2" />
                  Room Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;