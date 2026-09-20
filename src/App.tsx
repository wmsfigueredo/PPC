
import { useEffect, useState } from "react";
import { api } from "./services/api";
import type { CreatePointInput, Page, Point, User, UserRole } from "./types";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import {
  OccurrencesPage,
  ListPage,
  MapPage,
  ProfilePage,
  RegisterPage,
  SupplyPage,
} from "./pages/DashboardPages";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("ppc-user");
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
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
      if (data.length > 0) {
        setSelectedPoint((current) =>
          current && data.some((p) => p.id === current.id)
            ? data.find((p) => p.id === current.id) || data[0]
            : data[0]
        );
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchPoints();
    }
  }, [user]);

  const authenticate = async (
    mode: "login" | "register",
    data: { name?: string; email: string; password: string; role?: UserRole }
  ): Promise<User> => {
    const authenticatedUser =
      mode === "login"
        ? await api.login(data.email, data.password)
        : await api.register(data.name || "", data.email, data.password, data.role || "user");

    localStorage.setItem("ppc-user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = () => {
    localStorage.removeItem("ppc-user");
    setUser(null);
    setPoints([]);
    setSelectedPoint(null);
  };

  const createPoint = async (point: CreatePointInput) => {
    await api.createPoint(point);
    await fetchPoints();
    setCurrentPage("mapa");
    showToast("Ponto cadastrado com sucesso.");
  };

  const handleDeletePoint = async (id: number) => {
    const confirmed = window.confirm("Tem certeza que deseja remover este ponto comunitário?");
    if (!confirmed) return;

    try {
      await api.deletePoint(id);
      showToast("Ponto removido com sucesso.");
      await fetchPoints();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao excluir o ponto.");
    }
  };

  if (!user) {
    return <AuthScreen authenticate={authenticate} onAuthenticated={setUser} />;
 }

  const renderContent = () => {
    if (loading && points.length === 0) {
      return <div style={{ padding: 40, textAlign: "center" }}>Carregando dados do mapa...</div>;
      
    }

    if (currentPage === "mapa") {
      return (
        <MapPage
          points={points}
          currentPoint={selectedPoint || points[0]}
          onSelectPoint={setSelectedPoint}
          onNavigate={setCurrentPage}
          notify={showToast}
          onDeletePoint={handleDeletePoint}
          user={user}
        />
      );
    }

    if (currentPage === "meus") {
      return <ListPage points={points} onNavigate={setCurrentPage} />;
    }

    if (currentPage === "cadastro") {
      return <RegisterPage notify={showToast} onCreate={createPoint} />;
    }


    if (currentPage === "abastecimento") {
      return selectedPoint ? (
        <SupplyPage
          point={selectedPoint}
          notify={showToast}
          onConfirm={async (water, food, notes) => {
            await api.registerSupply({
              point_id: selectedPoint.id,
              supplied_water: water,
              supplied_food: food,
              notes,
            });
            await fetchPoints();
            setCurrentPage("mapa");
            showToast("Abastecimento registrado com sucesso.");
          }}
        />
      ) : (
        <div style={{ padding: 20 }}>Selecione um ponto no mapa primeiro.</div>
      );
    }

    if (currentPage === "ocorrencias") {
      return <OccurrencesPage user={user} points={points} notify={showToast} />;
    }

    if (currentPage === "perfil") {
      return <ProfilePage user={user} onLogout={logout} notify={showToast} />;
    }

    return null;
    
  };
  return (
    <AppShell
      page={currentPage}
      onNavigate={setCurrentPage}
      onLogout={logout}
      user={user}
      notify={showToast}
    >
      {renderContent()}
      {toastMessage && <div className="toast" role="status">{toastMessage}</div>}
    </AppShell>
  );
}