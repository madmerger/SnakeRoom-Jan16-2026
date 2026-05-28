"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCustomers, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: number;
  name: string;
  age: number;
  risk_tolerance: string;
  annual_income: number;
  total_assets: number;
  investment_experience: number;
}

const riskLabel: Record<string, string> = {
  conservative: "保守的",
  moderate: "中立的",
  aggressive: "積極的",
};

const riskVariant: Record<string, "success" | "warning" | "destructive"> = {
  conservative: "success",
  moderate: "warning",
  aggressive: "destructive",
};

export default function DashboardPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    getCustomers()
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
            <p className="mt-1 text-muted-foreground">顧客一覧とクイックアクション</p>
          </div>
          <div className="flex gap-2">
            <Link href="/customers/new">
              <Button>顧客登録</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">商品一覧</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">読み込み中...</p>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">顧客がまだ登録されていません</p>
              <Link href="/customers/new">
                <Button>最初の顧客を登録</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <Badge variant={riskVariant[c.risk_tolerance]}>
                      {riskLabel[c.risk_tolerance]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                    <dt>年齢</dt>
                    <dd className="text-foreground">{c.age}歳</dd>
                    <dt>年収</dt>
                    <dd className="text-foreground">{(c.annual_income / 10000).toLocaleString()}万円</dd>
                    <dt>総資産</dt>
                    <dd className="text-foreground">{(c.total_assets / 10000).toLocaleString()}万円</dd>
                    <dt>投資経験</dt>
                    <dd className="text-foreground">{c.investment_experience}年</dd>
                  </dl>
                  <div className="flex gap-2">
                    <Link href={`/customers/${c.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        詳細
                      </Button>
                    </Link>
                    <Link href={`/customers/${c.id}/recommend`} className="flex-1">
                      <Button size="sm" className="w-full">
                        レコメンド
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
