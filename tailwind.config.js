/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
