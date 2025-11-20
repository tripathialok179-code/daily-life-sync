import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Alok.dailylife',
  appName: 'daily-life-sync',
  webDir: 'dist', // <--- MAKE SURE THIS COMMA IS HERE

  // --- PASTE THIS SECTION ---
  plugins: {
    SplashScreen: {
      backgroundColor: "#111827", // Change this to match your App's dark background color
      launchShowDuration: 2000,
      launchAutoHide: true,
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
  // --------------------------
};

export default config;
