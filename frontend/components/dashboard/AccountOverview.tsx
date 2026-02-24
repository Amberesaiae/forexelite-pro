import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const accountData = {
  balance: "$24,580.00",
  equity: "$25,120.50",
  margin: "$1,200.00",
  freeMargin: "$23,920.50",
  marginLevel: "2093%",
  todayPnL: "+$540.50",
  weeklyPnL: "+$1,890.00",
  winRate: "68%",
  profitFactor: "2.4",
  broker: "IC Markets",
  accountNumber: "26489175",
  accountType: "Live" as const,
  server: "ICMarkets-Demo",
}

export function AccountOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.balance}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Equity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.equity}
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-[#090F1E] border-l-4 border-l-[#C9A84C]"
        style={{ borderLeftColor: "#C9A84C" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.margin}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Free Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.freeMargin}
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-[#090F1E] border-l-4 border-l-[#C9A84C]"
        style={{ borderLeftColor: "#C9A84C" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Margin Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#C9A84C]">
            {accountData.marginLevel}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Today's P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {accountData.todayPnL}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Weekly P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {accountData.weeklyPnL}
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-[#090F1E] border-l-4 border-l-[#C9A84C]"
        style={{ borderLeftColor: "#C9A84C" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.winRate}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Profit Factor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {accountData.profitFactor}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#090F1E] border-slate-800 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Broker:</span>
            <span className="text-white font-medium">{accountData.broker}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Account:</span>
            <span className="text-white font-medium">{accountData.accountNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Type:</span>
            <Badge
              variant={accountData.accountType === "Live" ? "default" : "secondary"}
              className={accountData.accountType === "Live" ? "bg-green-600" : "bg-amber-600"}
            >
              {accountData.accountType}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Server:</span>
            <span className="text-white font-medium">{accountData.server}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
