"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      category: form.get("category") as string,
      risk_level: Number(form.get("risk_level")),
      min_investment_amount: Number(form.get("min_investment_amount")),
      fee_rate: Number(form.get("fee_rate")),
      description: (form.get("description") as string) || undefined,
    };

    try {
      await createProduct(data);
      router.push("/products");
    } catch {
      setError("商品の登録に失敗しました（管理者権限が必要です）");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>商品登録（管理者用）</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">商品名</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="投資信託">投資信託</option>
                    <option value="保険">保険</option>
                    <option value="ローン">ローン</option>
                    <option value="預金">預金</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_level">リスクレベル（1-5）</Label>
                  <Input
                    id="risk_level"
                    name="risk_level"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_investment_amount">最低投資額（円）</Label>
                  <Input
                    id="min_investment_amount"
                    name="min_investment_amount"
                    type="number"
                    min={0}
                    defaultValue={0}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fee_rate">手数料率（小数, 例: 0.01 = 1%）</Label>
                  <Input
                    id="fee_rate"
                    name="fee_rate"
                    type="number"
                    step="0.001"
                    min={0}
                    max={1}
                    defaultValue={0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "登録中..." : "登録する"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
