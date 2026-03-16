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
      <Toaster position="top-center" richColors />
      <BrowserRouter>
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
