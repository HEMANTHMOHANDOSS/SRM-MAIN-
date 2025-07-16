// App.tsx
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import DepartmentAdminDashboard from "./pages/DepartmentAdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TimetableGenerator from "./pages/TimetableGenerator";
import DepartmentWorkspace from "./pages/DepartmentWorkspace";
import NotFound from "./pages/NotFound";
import EnhancedAdminRoute from "./components/EnhancedAdminRoute";
import EnhancedDepartmentAdminDashboard from "./pages/EnhancedDepartmentAdminDashboard";
import EnhancedStaffDashboard from "./pages/EnhancedStaffDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/main-admin"
            element={
              <ProtectedRoute requiredRole="main_admin">
                <MainAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enhanced-admin"
            element={<EnhancedAdminRoute />}
          />
          <Route
            path="/enhanced-dept-admin"
            element={
              <ProtectedRoute requiredRole="dept_admin">
                <EnhancedDepartmentAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-admin"
            element={
              <ProtectedRoute requiredRole="dept_admin">
                <DepartmentAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enhanced-staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <EnhancedStaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable-generator"
            element={
              <ProtectedRoute>
                <TimetableGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/:deptId"
            element={
              <ProtectedRoute>
                <DepartmentWorkspace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;