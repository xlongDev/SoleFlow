import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner'
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Orders } from "@/pages/Orders";
import { NewOrder } from "@/pages/NewOrder";
import { EditOrder } from "@/pages/EditOrder";
import { CalendarPage } from "@/pages/Calendar";
import { SettingsPage } from "@/pages/Settings";

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<NewOrder />} />
            <Route path="/orders/:id/edit" element={<EditOrder />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
