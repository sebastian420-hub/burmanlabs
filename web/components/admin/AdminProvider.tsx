"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { checkAdminAuth, loginAdmin, logoutAdmin } from "@/lib/adminClient";
import { AdminBar } from "./AdminBar";
import { LoginModal } from "./LoginModal";
import { EditDrawer } from "./EditDrawer";
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

  // Check auth on mount & listen to keyboard shortcuts
  useEffect(() => {
    let mounted = true;

    checkAdminAuth().then((authenticated) => {
      if (mounted) {
        setIsAdmin(authenticated);
        setIsLoading(false);

        // Check if query param ?admin=1 is set
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("admin") === "1" || params.get("edit") === "1") {
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

      // ⌘ + Shift + E: toggle Manager or open Login
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

  async function handleLogin(password: string) {
    const res = await loginAdmin(password);
    if (res.ok) {
      setIsAdmin(true);
      setLoginModalOpen(false);
      setIsManagerOpen(true);
    }
    return res;
  }

  async function handleLogout() {
    await logoutAdmin();
    setIsAdmin(false);
    setActiveEdit(null);
    setIsManagerOpen(false);
  }

  function handleOpenEdit(target: EditTarget) {
    setActiveEdit(target);
    setIsManagerOpen(true);
  }

  function handleOpenManager() {
    setActiveEdit(null);
    setIsManagerOpen(true);
  }

  function handleCloseDrawer() {
    setActiveEdit(null);
    setIsManagerOpen(false);
  }

  const value: AdminContextType = {
    isAdmin,
    isLoading,
    isLoginModalOpen,
    setLoginModalOpen,
    activeEdit,
    isManagerOpen,
    openEdit: handleOpenEdit,
    openManager: handleOpenManager,
    closeEdit: handleCloseDrawer,
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
      />
    </AdminContext.Provider>
  );
}
