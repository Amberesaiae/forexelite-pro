"""
EA Generator Service
GLM-5 API Integration
"""

import asyncio
import httpx
from app.core.config import get_settings


MQL5_SYSTEM_PROMPT = """You are an expert MQL5 programmer. Your task is to generate valid, production-ready MQL5 code for Expert Advisors (EAs).

Requirements:
1. Output ONLY the MQL5 code, no markdown, no explanations
2. Use MQL5 syntax - NOT MQL4:
   - Use `#include <Trade/Trade.mqh>` for order management
   - Use `CTrade trade` object for all trade operations
   - Use `SymbolInfoDouble(_Symbol, SYMBOL_ASK)` and `SymbolInfoDouble(_Symbol, SYMBOL_BID)` - NOT Ask/Bid
   - Use `AccountInfoDouble(ACCOUNT_BALANCE)` - NOT AccountBalance()
   - Use `ORDER_TYPE_BUY` and `ORDER_TYPE_SELL` - NOT OP_BUY/OP_SELL
3. Use proper MQL5 syntax and best practices
4. Include proper error handling
5. Follow trading EA conventions (OnTick, OnInit, OnDeinit)
6. Include input parameters for external configuration
7. Implement proper money management and risk controls
8. OnTick() must check for new bar using iTime() or BarsIsShifted()
9. Output valid, compilable MQL5 code only

Generate the complete MQL5 code now."""


async def generate_mql5(description: str, project_name: str) -> str:
    """
    Generate MQL5 code using GLM-5 API.

    Args:
        description: User's strategy description
        project_name: Name of the EA project

    Returns:
        Generated MQL5 source code

    Raises:
        Exception if generation fails
    """
    settings = get_settings()

    if not settings.GLM5_API_KEY:
        # Return valid MQL5 placeholder for demo
        return f"""// ForexElite Pro — EA Generated
// Project: {project_name}
// Description: {description}

#property copyright "ForexElite Pro 2026"
#property version   "1.00"
#property strict

#include <Trade/Trade.mqh>

// Input parameters
input double Lots = 0.01;
input int    MagicNumber = 123456;
input int    Slippage = 3;
input int    StopLoss = 200;       // Stop loss in points
input int    TakeProfit = 400;     // Take profit in points
input double RiskPercent = 1.0;   // Risk percentage

CTrade trade;

datetime lastBarTime = 0;

int OnInit()
{{
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(Slippage);
   Print("EA Initialized: ", "{project_name}");
   return(INIT_SUCCEEDED);
}}

void OnDeinit(const int reason)
{{
   Print("EA Deinitialized: ", reason);
}}

void OnTick()
{{
   // Check for new bar
   if(IsNewBar())
   {{
      // Entry logic placeholder
      // Add your strategy logic here
      
      Print("New bar detected at ", TimeCurrent());
   }}
}}

bool IsNewBar()
{{
   datetime currentBar = iTime(_Symbol, PERIOD_CURRENT, 0);
   
   if(currentBar != lastBarTime)
   {{
      lastBarTime = currentBar;
      return true;
   }}
   return false;
}}

double GetLotSize(double riskPercent)
{{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double lot = NormalizeDouble(balance * riskPercent / 10000.0, 2);
   return MathMax(0.01, MathMin(lot, 1.0));
}}

bool ExecuteTrade(ENUM_ORDER_TYPE direction, double volume, double sl, double tp)
{{
   double price = (direction == ORDER_TYPE_BUY) ? 
      SymbolInfoDouble(_Symbol, SYMBOL_ASK) : 
      SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   trade.SetType(direction);
   trade.SetVolume(volume);
   trade.SetSymbol(_Symbol);
   trade.SetPrice(price);
   trade.SetSL(sl);
   trade.SetTP(tp);
   
   if(trade.ResultRetcode() != TRADE_RETCODE_DONE)
   {{
      Print("Order failed: ", trade.ResultRetcodeDescription());
      return false;
   }}
   
   return true;
}}
"""

    # Call GLM-5 API
    url = f"{settings.GLM5_API_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GLM5_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "glm-4",
        "messages": [
            {"role": "system", "content": MQL5_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Project: {project_name}\n\nStrategy: {description}",
            },
        ],
        "temperature": 0.7,
        "max_tokens": 8000,
    }

    retryable_codes = {429, 500, 502, 503, 504}
    non_retryable_codes = {400, 401, 403}
    max_attempts = 3
    backoff = 1

    for attempt in range(max_attempts):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code in non_retryable_codes:
                    raise Exception(
                        f"GLM-5 API error: {response.status_code} - {response.text}"
                    )

                if (
                    response.status_code in retryable_codes
                    and attempt < max_attempts - 1
                ):
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue

                if response.status_code != 200:
                    raise Exception(f"GLM-5 API error: {response.status_code}")

                result = response.json()

                # Extract code from response
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0].get("message", {}).get("content", "")

                    # Clean up markdown if present
                    if content.startswith("```"):
                        lines = content.split("\n")
                        content = "\n".join(
                            lines[1:-1] if lines[-1].startswith("```") else lines[1:]
                        )

                    return content

                raise Exception("No completion returned from GLM-5")

        except httpx.TimeoutException:
            if attempt < max_attempts - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
            else:
                raise Exception("GLM-5 API timeout")
        except Exception as e:
            if "API error" in str(e) and attempt < max_attempts - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
            else:
                raise Exception(f"GLM-5 generation failed: {str(e)}")

    raise Exception("GLM-5 generation failed after all retries")
