"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUserId, getUserName, setUser } from "@/lib/user";

interface UserContextValue {
  userId: string;
  userName: string;
  setUser: (id: string, name: string) => void;
  isReady: boolean;
}

const UserContext = createContext<UserContextValue>({
  userId: "",
  userName: "",
  setUser: () => {},
  isReady: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState("");
  const [userName, setUserNameState] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setUserId(getUserId());
      setUserNameState(getUserName());
      setIsReady(true);
    });
  }, []);

  const updateUser = (id: string, name: string) => {
    setUser(id, name);
    setUserId(id);
    setUserNameState(name);
  };

  return (
    <UserContext.Provider value={{ userId, userName, setUser: updateUser, isReady }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
