const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }
  return res;
}

export async function login(email: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("ログインに失敗しました");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function register(email: string, password: string, name: string, role: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, role }),
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return res.json();
}

export async function getCustomers() {
  const res = await apiFetch("/customers");
  if (!res.ok) throw new Error("顧客一覧の取得に失敗しました");
  return res.json();
}

export async function getCustomer(id: number) {
  const res = await apiFetch(`/customers/${id}`);
  if (!res.ok) throw new Error("顧客情報の取得に失敗しました");
  return res.json();
}

export async function createCustomer(data: Record<string, unknown>) {
  const res = await apiFetch("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("顧客の登録に失敗しました");
  return res.json();
}

export async function updateCustomer(id: number, data: Record<string, unknown>) {
  const res = await apiFetch(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("顧客の更新に失敗しました");
  return res.json();
}

export async function getProducts() {
  const res = await apiFetch("/products");
  if (!res.ok) throw new Error("商品一覧の取得に失敗しました");
  return res.json();
}

export async function getProduct(id: number) {
  const res = await apiFetch(`/products/${id}`);
  if (!res.ok) throw new Error("商品情報の取得に失敗しました");
  return res.json();
}

export async function createProduct(data: Record<string, unknown>) {
  const res = await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("商品の登録に失敗しました");
  return res.json();
}

export async function calculateSuitability(customerId: number, productId: number) {
  const res = await apiFetch("/suitability/calculate", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId, product_id: productId }),
  });
  if (!res.ok) throw new Error("適合性スコアの算出に失敗しました");
  return res.json();
}

export async function getRecommendations(customerId: number) {
  const res = await apiFetch(`/suitability/recommend/${customerId}`);
  if (!res.ok) throw new Error("レコメンドの取得に失敗しました");
  return res.json();
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
