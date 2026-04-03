// File: src/pages/customer/CustomerDashboard.tsx
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeContent from "@/components/landing/HomeContent";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";
import { getUser, logout } from "@/lib/auth";
import { customerMenu } from "@/components/config/Menu";

export default function CustomerDashboard() {
  const user = getUser();

  return (
    <PageTransition>
      <Navbar user={user} notificationCount={3} onLogout={logout} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <HomeContent />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <Footer />
      </motion.div>

      <BottomNav menuItems={customerMenu} user={user} onLogout={logout} />
    </PageTransition>
  );
}