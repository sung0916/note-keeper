export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', '"ImHyeMin"', 'sans-serif'],
      },
      colors: {
        'splash-bg': '#FFF5F0',
      },
      keyframes: {
        'scale-down': {
          '0%': { transform: 'scale(1.2)' }, // 1.3배 크기에서 시작
          '100%': { transform: 'scale(1)' }, // 원래 크기로 돌아옴
        }
      },
      animation: {
        'logo-scale': 'scale-down 2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
