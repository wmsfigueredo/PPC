import { useEffect, useState } from "react";
import { api } from "./services/api";
import type { Point, User } from "./types";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import {
  ListPage,
  MapPage,
  OccurrencesPage,
  ProfilePage,
  RegisterPage,
  SupplyPage,
} from "./pages/DashboardPages";

type Page = "mapa" | "meus" | "cadastro" | "ocorrencias" | "abastecimento" | "perfil";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("ppc-user");
    return saved ? JSON.parse(saved) as User : null;
  });
  const [currentPage, setCurrentPage] = useState<Page>("mapa");
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2600);
  };

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const data = await api.getPoints();
      setPoints(data);
      setSelectedPoint(current => current && data.some(point => point.id === current.id) ? data.find(point => point.id === current.id) || data[0] : data[0] || null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void fetchPoints();
  }, [user]);

  const authenticate = async (mode: "login" | "register", data: { name?: string; email: string; password: string }): Promise<User> => {
    const authenticatedUser = mode === "login"
      ? await api.login(data.email, data.password)
      : await api.register(data.name || "", data.email, data.password);
    localStorage.setItem("ppc-user", JSON.stringify(authenticatedUser));
    return authenticatedUser;
  };

  const logout = () => {
    localStorage.removeItem("ppc-user");
    setUser(null);
    setPoints([]);
    setSelectedPoint(null);
  };

  const createPoint = async (point: Omit<Point, "id">) => {
    await api.createPoint(point);
    await fetchPoints();
    setCurrentPage("mapa");
    showToast("Ponto cadastrado com sucesso.");
  };

  if (!user) return <AuthScreen authenticate={authenticate} onAuthenticated={setUser} />;
  if (loading) return <div style={{ padding: 20 }}>Carregando dados do banco...</div>;

  const page = selectedPoint
    ? currentPage === "mapa" ? <MapPage points={points} currentPoint={selectedPoint} onSelectPoint={setSelectedPoint} onNavigate={setCurrentPage} notify={showToast} />
      : currentPage === "meus" ? <ListPage points={points} onNavigate={setCurrentPage} />
        : currentPage === "cadastro" ? <RegisterPage notify={showToast} onCreate={createPoint} />
          : currentPage === "abastecimento" ? <SupplyPage point={selectedPoint} notify={showToast} onConfirm={async (water, food, notes) => { await api.registerSupply({ point_id: selectedPoint.id, supplied_water: water, supplied_food: food, notes }); await fetchPoints(); setCurrentPage("mapa"); showToast("Abastecimento registrado com sucesso."); }} />
            : currentPage === "ocorrencias" ? <OccurrencesPage notify={showToast} />
              : <ProfilePage user={user} />
    : <RegisterPage notify={showToast} onCreate={createPoint} />;

  return <AppShell page={currentPage} onNavigate={setCurrentPage} onLogout={logout}>
    {page}
    {toastMessage && <div className="toast" role="status">{toastMessage}</div>}
  </AppShell>;
}
