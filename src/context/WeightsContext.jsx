import { createContext, useContext, useState } from "react";

const defaultWeights = { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 };

const WeightsContext = createContext();

export function WeightsProvider({ children }) {
  const [weights, setWeights] = useState(defaultWeights);

  const resetWeights = () => setWeights({ ...defaultWeights });

  return (
    <WeightsContext.Provider value={{ weights, setWeights, resetWeights }}>
      {children}
    </WeightsContext.Provider>
  );
}

export function useWeights() {
  return useContext(WeightsContext);
}
