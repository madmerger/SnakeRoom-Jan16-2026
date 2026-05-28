"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getCustomer, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: number;
  name: string;
  age: number;
  annual_income: number;
  total_assets: number;
  investment_experience: number;
  risk_tolerance: string;
  family_size: number;
  life_plan_notes: string | null;
  created_at: string;
  updated_at: string;
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

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const id = Number(params.id);
    getCustomer(id)
      .then(setCustomer)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <Badge variant={riskVariant[customer.risk_tolerance]} className="text-sm">
            {riskLabel[customer.risk_tolerance]}
          </Badge>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">年齢</dt>
                <dd className="text-lg font-medium">{customer.age}歳</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">年収</dt>
                <dd className="text-lg font-medium">
                  {(customer.annual_income / 10000).toLocaleString()}万円
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">総資産</dt>
                <dd className="text-lg font-medium">
                  {(customer.total_assets / 10000).toLocaleString()}万円
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">投資経験</dt>
                <dd className="text-lg font-medium">{customer.investment_experience}年</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">家族人数</dt>
                <dd className="text-lg font-medium">{customer.family_size}人</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">リスク許容度</dt>
                <dd className="text-lg font-medium">{riskLabel[customer.risk_tolerance]}</dd>
              </div>
            </dl>
            {customer.life_plan_notes && (
              <div className="mt-4 border-t pt-4">
                <dt className="text-sm text-muted-foreground mb-1">ライフプランメモ</dt>
                <dd className="text-sm">{customer.life_plan_notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline">編集</Button>
          </Link>
          <Link href={`/customers/${customer.id}/recommend`}>
            <Button>レコメンド算出</Button>
          </Link>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            一覧に戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
