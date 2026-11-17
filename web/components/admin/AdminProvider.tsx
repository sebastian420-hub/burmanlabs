"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { checkAdminAuth, loginAdmin, logoutAdmin } from "@/lib/adminClient";
import { AdminBar } from "./AdminBar";
import { LoginModal } from "./LoginModal";
import { EditDrawer } from "./EditDrawer";
import { CortexDispatcher } from "./CortexDispatcher";
import type { AdminContextType, EditTarget } from "./types";

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState<EditTarget | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isCortexOpen, setIsCortexOpen] = useState(false);

  // Check auth on mount & listen to keyboard shortcuts
  useEffect(() => {
    let mounted = true;

    checkAdminAuth().then((authenticated) => {
      if (mounted) {
        setIsAdmin(authenticated);
        setIsLoading(false);

        // Check if query params ?admin=1 or ?cortex=1 are set
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("cortex") === "1") {
            if (authenticated) {
              setIsCortexOpen(true);
            } else {
              setLoginModalOpen(true);
            }
          } else if (params.get("admin") === "1" || params.get("edit") === "1") {
            if (authenticated) {
              setIsManagerOpen(true);
            } else {
              setLoginModalOpen(true);
            }
          }
        }
      }
    });

    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // ⌘ + Shift + C: Toggle Cortex Dispatcher
      if (isCmdOrCtrl && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setIsAdmin((prev) => {
          if (!prev) {
            setLoginModalOpen(true);
            return prev;
          }
          setIsCortexOpen((c) => !c);
          return prev;
        });
      }

      // ⌘ + Shift + E: Toggle Manager or open Login
      if (isCmdOrCtrl && e.shiftKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setIsAdmin((prev) => {
          if (!prev) {
            setLoginModalOpen(true);
            return prev;
          }
          setIsManagerOpen((m) => !m);
          return prev;
        });
      }

      // ⌘ + Shift + F: Open Universal Content Search
      if (isCmdOrCtrl && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setIsAdmin((prev) => {
          if (!prev) {
            setLoginModalOpen(true);
            return prev;
          }
          setActiveEdit(null);
          setIsManagerOpen(true);
          return prev;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      mounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogin(password: string, rememberMe = true) {
    const res = await loginAdmin(password, rememberMe);
    if (res.ok) {
      setIsAdmin(true);
      setLoginModalOpen(false);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("cortex") === "1") {
          setIsCortexOpen(true);
          return res;
        }
      }
      setIsManagerOpen(true);
    }
    return res;
  }

  async function handleLogout() {
    await logoutAdmin();
    setIsAdmin(false);
    setActiveEdit(null);
    setIsManagerOpen(false);
    setIsCortexOpen(false);
  }

  function handleOpenEdit(target: EditTarget) {
    setActiveEdit(target);
    setIsCortexOpen(false);
    setIsManagerOpen(true);
  }

  function handleOpenManager() {
    setActiveEdit(null);
    setIsCortexOpen(false);
    setIsManagerOpen(true);
  }

  function handleCloseDrawer() {
    setActiveEdit(null);
    setIsManagerOpen(false);
  }

  function handleOpenCortex() {
    setActiveEdit(null);
    setIsManagerOpen(false);
    setIsCortexOpen(true);
  }

  function handleCloseCortex() {
    setIsCortexOpen(false);
  }

  const value: AdminContextType = {
    isAdmin,
    isLoading,
    isLoginModalOpen,
    setLoginModalOpen,
    activeEdit,
    isManagerOpen,
    isCortexOpen,
    openEdit: handleOpenEdit,
    openManager: handleOpenManager,
    closeEdit: handleCloseDrawer,
    openCortex: handleOpenCortex,
    closeCortex: handleCloseCortex,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
      <AdminBar
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenManager={handleOpenManager}
        onOpenCortex={handleOpenCortex}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <EditDrawer
        isOpen={isManagerOpen || activeEdit !== null}
        activeTarget={activeEdit}
        onClose={handleCloseDrawer}
        onSelectTarget={(target) => setActiveEdit(target)}
        onLogout={handleLogout}
        onOpenCortex={handleOpenCortex}
      />
      <CortexDispatcher
        isOpen={isCortexOpen}
        onClose={handleCloseCortex}
        onOpenManager={handleOpenManager}
        onLogout={handleLogout}
      />
    </AdminContext.Provider>
  );
}
