import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import MyPatients from "@/pages/MyPatients";
import PatientInfo from "@/pages/PatientInfo";
import DiseasePredictor from "@/pages/DiseasePredictor";
import ModelValidation from "@/pages/ModelValidation";
import Layout from "@/components/Layout";
import { LoaderPinwheel } from "lucide-react";

// Protected route wrapper component
function ProtectedRoute({ component: Component, ...props }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderPinwheel className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // If authenticated, render the protected component
  return <Component {...props} />;
}

function Router() {
  const [isBase] = useRoute("/");
  const [isLogin] = useRoute("/login");
  const [isRegister] = useRoute("/register");
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already logged in and trying to access login/register/home
  if (isAuthenticated && (isBase || isLogin || isRegister)) {
    return <Route path="/" component={() => {
      const [, navigate] = useLocation();
      navigate("/dashboard");
      return null;
    }} />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      <Route path="/chat/:id?" component={(props) => <ProtectedRoute component={Chat} {...props} />} />
      <Route path="/profile" component={(props) => <ProtectedRoute component={Profile} {...props} />} />
      <Route path="/my-patients" component={(props) => <ProtectedRoute component={MyPatients} {...props} />} />
      <Route path="/patient-info/:patientId" component={(props) => <ProtectedRoute component={PatientInfo} {...props} />} />
      <Route path="/disease-predictor" component={(props) => <ProtectedRoute component={DiseasePredictor} {...props} />} />
      <Route path="/model-validation" component={(props) => <ProtectedRoute component={ModelValidation} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Layout>
            <Router />
          </Layout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;