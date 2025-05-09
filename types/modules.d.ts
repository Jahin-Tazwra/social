declare module '@/hooks/useLocation' {
  export function useLocation(): {
    errorMsg: string | null;
    requestLocationPermission: () => Promise<boolean>;
    getCurrentLocation: () => Promise<Location.LocationObject | null>;
  };
}

declare module '@/lib/supabase' {
  export const supabase: any;
} 