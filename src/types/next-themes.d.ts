declare module 'next-themes' {
  export * from 'next-themes';
  export const useTheme: () => { theme: string; setTheme: (theme: string) => void };
}
