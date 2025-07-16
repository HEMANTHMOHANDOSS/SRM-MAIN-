import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/PythonAuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Building2, BookOpen, Calendar, LogOut, Plus } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import CreateDepartmentDialog from '../components/CreateDepartmentDialog';
import StaffRegistrationForm from '@/components/admin/StaffRegistrationForm'; // adjust path as needed


interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  department_name?: string;
}

const MainAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalSubjects: 0,
    totalTimetables: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch departments
      const deptRes = await fetch('http://localhost:5000/api/departments', { headers });
      const deptJson = await deptRes.json();
      setDepartments(deptJson || []);

      // Fetch users
      const userRes = await fetch('http://localhost:5000/api/users', { headers });
      const userJson = await userRes.json();
      setUsers(userJson || []);

      // Fetch subjects count
      const subjectRes = await fetch('http://localhost:5000/api/subjects', { headers });
      const subjectJson = await subjectRes.json();

      // Fetch timetable stats
      const timetableRes = await fetch('http://localhost:5000/api/timetables/stats', { headers });
      const timetableJson = await timetableRes.json();

      setStats({
        totalUsers: userJson?.length || 0,
        totalDepartments: deptJson?.length || 0,
        totalSubjects: subjectJson?.length || 0,
        totalTimetables: timetableJson?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch dashboard data', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({ 
      title: 'Logged Out', 
      description: 'You have been successfully logged out' 
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
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="SRM Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Main Admin Dashboard</h1>
              <p className="text-sm text-gray-600">SRM Timetable Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">Main Administrator</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/enhanced-admin'}
              variant="outline" 
              size="sm"
            >
              Enhanced Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Users', icon: <Users />, value: stats.totalUsers },
            { title: 'Departments', icon: <Building2 />, value: stats.totalDepartments },
            { title: 'Total Subjects', icon: <BookOpen />, value: stats.totalSubjects },
            { title: 'Timetables', icon: <Calendar />, value: stats.totalTimetables },
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Departments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage academic departments</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowCreateDepartment(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{dept.name}</h3>
                      <p className="text-sm text-gray-600">Code: {dept.code}</p>
                    </div>
                    <Badge variant="secondary">{dept.code}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
      {/* Section: Staff Registration */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Register New Staff</h2>
        <StaffRegistrationForm />
      </div>

          {/* Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Users</CardTitle>
                  <CardDescription>Manage user accounts and roles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.department_name || 'No Department'}</p>
                    </div>
                    <Badge
                      variant={
                        user.role === 'main_admin' ? 'default' :
                        user.role === 'dept_admin' ? 'secondary' : 'outline'}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateDepartmentDialog 
        open={showCreateDepartment} 
        onOpenChange={setShowCreateDepartment} 
        onDepartmentCreated={fetchData} 
      />
    </div>
  );
};

export default MainAdminDashboard;