"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

export default function NewCustomerPage() {
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
      age: Number(form.get("age")),
      annual_income: Number(form.get("annual_income")),
      total_assets: Number(form.get("total_assets")),
      investment_experience: Number(form.get("investment_experience")),
      risk_tolerance: form.get("risk_tolerance") as string,
      family_size: Number(form.get("family_size")),
      life_plan_notes: (form.get("life_plan_notes") as string) || undefined,
    };

    try {
      const customer = await createCustomer(data);
      router.push(`/customers/${customer.id}`);
    } catch {
      setError("顧客の登録に失敗しました");
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
            <CardTitle>顧客プロファイル登録</CardTitle>
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
                  <Label htmlFor="name">氏名</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">年齢</Label>
                  <Input id="age" name="age" type="number" min={0} max={150} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual_income">年収（円）</Label>
                  <Input id="annual_income" name="annual_income" type="number" min={0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_assets">総資産（円）</Label>
                  <Input id="total_assets" name="total_assets" type="number" min={0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment_experience">投資経験（年）</Label>
                  <Input
                    id="investment_experience"
                    name="investment_experience"
                    type="number"
                    min={0}
                    defaultValue={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_tolerance">リスク許容度</Label>
                  <select
                    id="risk_tolerance"
                    name="risk_tolerance"
                    defaultValue="moderate"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="conservative">保守的</option>
                    <option value="moderate">中立的</option>
                    <option value="aggressive">積極的</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family_size">家族人数</Label>
                  <Input
                    id="family_size"
                    name="family_size"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="life_plan_notes">ライフプランメモ</Label>
                <textarea
                  id="life_plan_notes"
                  name="life_plan_notes"
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
