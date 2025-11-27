import axios from "axios";
// O AuthContext precisa do history para redirecionar após o logout forçado
// Assumindo que você usa react-router-dom v6 (com useNavigate)
// Você precisará de uma forma de acessar o contexto AuthContext ou a função logout.
// Para manter a simplicidade, faremos o interceptor aqui, mas a função de logout será importada do AuthContext.

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

// Função que processa a fila de requisições falhas após o refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Resposta: Tenta renovar o token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Verifica se é erro 401 e se já não tentamos renovar
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já estiver renovando, adiciona a requisição na fila de espera
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          // 🏆 1. Chama a rota de refresh
          const response = await api.post("/auth/refresh-token");

          // Sucesso: O backend deve ter definido um novo cookie JWT e, opcionalmente,
          // retornado o novo token de acesso no corpo/header (embora com cookies, ele está pronto)

          isRefreshing = false;
          processQueue(null); // Processa as requisições em fila
          resolve(api(originalRequest)); // Repete a requisição original
        } catch (err) {
          // 2. Se o refresh falhar (Refresh Token inválido/expirado)
          isRefreshing = false;
          processQueue(err, null);

          // 3. Força o logout
          window.location.href = "/login"; // Redireciona para login (solução simples para apps React)
          reject(err);
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
