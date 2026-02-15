const config = {
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
            },
            fontFamily: {
                sans: ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
//# sourceMappingURL=tailwind.config.js.map