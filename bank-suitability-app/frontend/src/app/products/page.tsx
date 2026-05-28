"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProducts, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  category: string;
  risk_level: number;
  min_investment_amount: number;
  fee_rate: number;
  description: string | null;
  is_active: boolean;
}

const riskColor = (level: number) => {
  if (level <= 2) return "success" as const;
  if (level <= 3) return "warning" as const;
  return "destructive" as const;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">商品一覧</h1>
            <p className="mt-1 text-muted-foreground">取扱商品の管理</p>
          </div>
          <Link href="/products/new">
            <Button>商品登録</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground">読み込み中...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <Badge variant={riskColor(p.risk_level)}>リスク {p.risk_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                    <dt>カテゴリ</dt>
                    <dd className="text-foreground">{p.category}</dd>
                    <dt>最低投資額</dt>
                    <dd className="text-foreground">
                      {p.min_investment_amount > 0
                        ? `${(p.min_investment_amount / 10000).toLocaleString()}万円`
                        : "なし"}
                    </dd>
                    <dt>手数料率</dt>
                    <dd className="text-foreground">{(p.fee_rate * 100).toFixed(1)}%</dd>
                  </dl>
                  {p.description && (
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
