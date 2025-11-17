import { FaUser, FaLock } from "react-icons/fa";
import tailwindcss from "@tailwindcss/vite";

const Login = () => {
  return (
    <div className="container">
      <form>
        <h2>Login</h2>
        <div>
          <input type="email" placeholder="E-mail" />
          <FaUser className="icon" />
        </div>
        <div>
          <input type="password" placeholder="Senha" />
          <FaLock className="icon" />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
