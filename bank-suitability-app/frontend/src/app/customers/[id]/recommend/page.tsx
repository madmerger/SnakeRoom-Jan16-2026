"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRecommendations, isLoggedIn } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Recommendation {
  product_id: number;
  product_name: string;
  category: string;
  risk_level: number;
  score: number;
  reasons: string[];
  is_suitable: boolean;
}

interface RecommendationData {
  customer_id: number;
  customer_name: string;
  recommendations: Recommendation[];
}

const categoryIcon: Record<string, string> = {
  投資信託: "📈",
  保険: "🛡️",
  ローン: "🏠",
  預金: "💰",
};

export default function RecommendPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    getRecommendations(Number(params.id))
      .then(setData)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-muted-foreground">スコア算出中...</p>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{data.customer_name} さんへのレコメンド</h1>
          <p className="mt-1 text-muted-foreground">
            全商品の適合性スコアをスコア順に表示しています
          </p>
        </div>

        <div className="space-y-4">
          {data.recommendations.map((rec) => (
            <Card
              key={rec.product_id}
              className={rec.is_suitable ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-400"}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryIcon[rec.category] || "📦"}</span>
                    <CardTitle className="text-lg">{rec.product_name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {rec.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      リスク {rec.risk_level}
                    </Badge>
                  </div>
                  <Badge variant={rec.is_suitable ? "success" : "destructive"}>
                    {rec.is_suitable ? "適合" : "不適合"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">適合性スコア</span>
                    <span className="text-lg font-bold">{rec.score}点</span>
                  </div>
                  <Progress value={rec.score} />
                </div>
                {rec.reasons.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {rec.reasons.map((reason, i) => (
                      <p key={i} className="text-sm text-red-600">
                        ・{reason}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/customers/${data.customer_id}`)}>
            顧客詳細に戻る
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            ダッシュボードに戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
