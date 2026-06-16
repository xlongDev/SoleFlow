import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner'
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { lazy, Suspense } from "react";

// 使用动态导入进行代码分割
const Dashboard = lazy(() => import("@/pages/Dashboard").then(mod => ({ default: mod.Dashboard })));
const Orders = lazy(() => import("@/pages/Orders").then(mod => ({ default: mod.Orders })));
const NewOrder = lazy(() => import("@/pages/NewOrder").then(mod => ({ default: mod.NewOrder })));
const EditOrder = lazy(() => import("@/pages/EditOrder").then(mod => ({ default: mod.EditOrder })));
const CalendarPage = lazy(() => import("@/pages/Calendar").then(mod => ({ default: mod.CalendarPage })));
const SettingsPage = lazy(() => import("@/pages/Settings").then(mod => ({ default: mod.SettingsPage })));

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          className: "rounded-[2.5rem] backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-4 px-6 font-bold tracking-tight !text-center",
          classNames: {
            title: "w-full text-center",
            description: "w-full text-center",
            content: "w-full items-center text-center"
          },
          style: {
            borderRadius: '2.5rem',
            textAlign: 'center',
            justifyContent: 'center',
          }
        }}
      />
      <BrowserRouter basename="/SoleFlow/">
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route 
              path="/" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <Dashboard />
                </Suspense>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <Orders />
                </Suspense>
              } 
            />
            <Route 
              path="/orders/new" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <NewOrder />
                </Suspense>
              } 
            />
            <Route 
              path="/orders/:id/edit" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <EditOrder />
                </Suspense>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <CalendarPage />
                </Suspense>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <SettingsPage />
                </Suspense>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
