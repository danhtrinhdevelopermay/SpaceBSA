import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ToastContainer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import SharedPage from "@/pages/shared";
import RecentPage from "@/pages/recent";
import StarredPage from "@/pages/starred";
import CategoryPage from "@/pages/categories";
import TrashPage from "@/pages/trash";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import FileViewPage from "@/pages/file-view";
import InfrastructurePage from "@/pages/infrastructure";
import AdminConsole from "@/pages/AdminConsole";
import DatabaseMonitor from "@/pages/DatabaseMonitor";
import DatabaseAdmin from "@/pages/DatabaseAdmin";
import ShareLinkPage from "@/pages/share-link";
import NotFound from "@/pages/not-found";
import AlertShowcase from "@/components/AlertShowcase";
import DoorTransition from "@/components/DoorTransition";
import StartupLoader from "@/components/StartupLoader";
import { useState, useEffect } from "react";

function Router() {
  const { firebaseUser, loading, showDoorTransition, resetDoorTransition } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => (
    <Switch>
      <Route path="/">
        {firebaseUser ? <Dashboard /> : <LandingPage />}
      </Route>
      <Route path="/auth">
        {firebaseUser ? <Dashboard /> : <AuthPage />}
      </Route>
      <Route path="/dashboard">
        {firebaseUser ? <Dashboard /> : <AuthPage />}
      </Route>
      <Route path="/shared">
        {firebaseUser ? <SharedPage /> : <AuthPage />}
      </Route>
      <Route path="/recent">
        {firebaseUser ? <RecentPage /> : <AuthPage />}
      </Route>
      <Route path="/starred">
        {firebaseUser ? <StarredPage /> : <AuthPage />}
      </Route>
      <Route path="/category/:category">
        {firebaseUser ? <CategoryPage /> : <AuthPage />}
      </Route>
      <Route path="/trash">
        {firebaseUser ? <TrashPage /> : <AuthPage />}
      </Route>
      <Route path="/settings">
        {firebaseUser ? <SettingsPage /> : <AuthPage />}
      </Route>
      <Route path="/profile">
        {firebaseUser ? <ProfilePage /> : <AuthPage />}
      </Route>
      <Route path="/file/:fileId">
        {firebaseUser ? <FileViewPage /> : <AuthPage />}
      </Route>
      <Route path="/infrastructure">
        <InfrastructurePage />
      </Route>
      <Route path="/system/admin/console/secure">
        {firebaseUser ? <AdminConsole /> : <AuthPage />}
      </Route>
      <Route path="/system/database/monitor">
        {firebaseUser ? <DatabaseMonitor /> : <AuthPage />}
      </Route>
      <Route path="/system/database/admin">
        {firebaseUser ? <DatabaseAdmin /> : <AuthPage />}
      </Route>
      <Route path="/demo/alerts">
        <AlertShowcase />
      </Route>
      <Route path="/share/:token">
        <ShareLinkPage />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );

  return (
    <>
      {showDoorTransition && firebaseUser ? (
        <DoorTransition 
          isOpen={true} 
          onComplete={() => {
            resetDoorTransition();
          }}
        >
          <Dashboard />
        </DoorTransition>
      ) : (
        renderContent()
      )}
    </>
  );
}

function App() {
  const [showStartupLoader, setShowStartupLoader] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <TooltipProvider>
            <Toaster />
            {showStartupLoader ? (
              <StartupLoader onLoadComplete={() => setShowStartupLoader(false)} />
            ) : (
              <Router />
            )}
          </TooltipProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
