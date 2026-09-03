import { createContext, type ReactNode, useContext } from 'react';

import { container, type AppContainer } from './container';

const ContainerContext = createContext<AppContainer | null>(null);

export function ContainerProvider({
  children,
  value = container,
}: {
  children: ReactNode;
  value?: AppContainer;
}) {
  return (
    <ContainerContext.Provider value={value}>
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainer(): AppContainer {
  const value = useContext(ContainerContext);
  if (!value)
    throw new Error('useContainer must be used within ContainerProvider');
  return value;
}
