"use client";

import { createContext, ReactNode, useContext } from "react";

interface PlatformData {
  financial: {
    totalPaid: number;
    total: number;
    remaining: number;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  user: {
    name: string;
    role: string;
    country: string;
  };
}

const defaultData: PlatformData = {
  financial: {
    totalPaid: 15000,
    total: 50000,
    remaining: 35000,
  },
  documents: [
    {
      id: "1",
      name: "Passaporte",
      type: "Documento de Identidade",
      status: "Aprovado",
    },
    {
      id: "2",
      name: "Visto",
      type: "Documento de Imigração",
      status: "Pendente",
    },
    {
      id: "3",
      name: "Certidão de Nascimento",
      type: "Documento Civil",
      status: "Aprovado",
    },
  ],
  tasks: [
    {
      id: "1",
      title: "Renovar passaporte",
      status: "Concluída",
      priority: "Alta",
    },
    {
      id: "2",
      title: "Traduzir documentos",
      status: "Em andamento",
      priority: "Média",
    },
    {
      id: "3",
      title: "Agendar entrevista",
      status: "Pendente",
      priority: "Alta",
    },
  ],
  user: {
    name: "Alan Guerra",
    role: "Admin",
    country: "Brasil",
  },
};

interface PlatformDataContextType {
  data: PlatformData;
}

const PlatformDataContext = createContext<PlatformDataContextType | undefined>(
  undefined,
);

export function PlatformDataProvider({ children }: { children: ReactNode }) {
  return (
    <PlatformDataContext.Provider value={{ data: defaultData }}>
      {children}
    </PlatformDataContext.Provider>
  );
}

export function usePlatformData() {
  const context = useContext(PlatformDataContext);
  if (context === undefined) {
    throw new Error(
      "usePlatformData must be used within a PlatformDataProvider",
    );
  }
  return context;
}
