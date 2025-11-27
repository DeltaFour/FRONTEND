export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#1e2c6b", // Base para Sidebar e elementos escuros (Cores: #1e2c69 / #1e2c6b)
        "brand-background": "#f4f8fb", // Fundo principal (Cores: #f4f8fb)
        "brand-accent": "#d79b3b", // Cor de destaque para botões e links (#d79b3b ou #cd9d4f)
        "brand-text": "#272323", // Cor padrão para textos (#272323)
      },
    },
  },
  plugins: [],
};
