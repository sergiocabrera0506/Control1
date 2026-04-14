import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ComplexNum {
  real: number;
  imag: number;
}

export interface AnalysisResult {
  frequencies: number[];
  magnitude_db: number[];
  phase_deg: number[];
  poles: ComplexNum[];
  zeros: ComplexNum[];
  is_stable: boolean;
  gain_margin_db: number | null;
  phase_margin_deg: number | null;
  gain_crossover_freq: number | null;
  phase_crossover_freq: number | null;
  order: number;
  numerator: number[];
  denominator: number[];
}

export interface AppConfig {
  freqMin: number;
  freqMax: number;
  numPoints: number;
  showGrid: boolean;
  showAsymptotes: boolean;
  showPhaseMarkers: boolean;
}

export interface CursorData {
  frequency: number;
  magnitude: number;
  phase: number;
}

interface AppContextType {
  numerator: number[];
  setNumerator: (n: number[]) => void;
  denominator: number[];
  setDenominator: (d: number[]) => void;
  result: AnalysisResult | null;
  setResult: (r: AnalysisResult | null) => void;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
  cursor: CursorData | null;
  setCursor: (c: CursorData | null) => void;
}

const defaultConfig: AppConfig = {
  freqMin: 0.01,
  freqMax: 100000,
  numPoints: 1024,
  showGrid: true,
  showAsymptotes: false,
  showPhaseMarkers: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [numerator, setNumerator] = useState([0, 0, 1, 1.2]);
  const [denominator, setDenominator] = useState([0, 0, 1, 0.45, 1]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<CursorData | null>(null);

  return (
    <AppContext.Provider value={{
      numerator, setNumerator,
      denominator, setDenominator,
      result, setResult,
      config, setConfig,
      isLoading, setIsLoading,
      cursor, setCursor,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be within AppProvider');
  return ctx;
}
