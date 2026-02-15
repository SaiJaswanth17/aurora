import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Discord-inspired dark theme
        discord: {
          primary: '#36393f',
          secondary: '#2f3136',
          tertiary: '#202225',
          quaternary: '#292b2f',
          accent: '#5865f2',
          'accent-hover': '#4752c4',
          text: '#dcddde',
          'text-muted': '#96989d',
          'text-link': '#00b0f4',
          interactive: '#b9bbbe',
          'interactive-hover': '#dcddde',
          background: '#36393f',
          'background-secondary': '#2f3136',
          'background-tertiary': '#202225',
          'background-floating': '#18191c',
        },
        // WhatsApp-inspired theme
        whatsapp: {
          green: '#075E54',
          'green-light': '#25D366',
          teal: '#128C7E',
          'teal-light': '#00a884',
          bg: '#efeae2',
          'bubble-own': '#dcf8c6',
          'bubble-other': '#ffffff',
          'header-bg': '#f0f2f5',
          'sidebar-bg': '#ffffff',
          text: '#111b21',
          'text-muted': '#667781',
          'border': '#e9edef',
          'active-item': '#f0f2f5',
        }
      },
      fontFamily: {
        sans: ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
