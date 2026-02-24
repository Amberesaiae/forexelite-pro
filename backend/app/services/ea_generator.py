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
2. Use proper MQL5 syntax and best practices
3. Include proper error handling
4. Follow trading EA conventions (OnTick, OnInit, OnDeinit)
5. Include input parameters for external configuration
6. Implement proper money management and risk controls
7. Output valid, compilable MQL5 code only

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
        # Return placeholder for demo
        return f"""// ForexElite Pro — EA Generated
// Project: {project_name}
// Description: {description}

#property copyright "ForexElite Pro 2026"
#property version   "1.00"
#property strict

// Input parameters
input double Lots = 0.01;
input int    MagicNumber = 12345;
input int    Slippage = 3;
input int    StopLoss = 20;
input int    TakeProfit = 40;

// Global variables
int g_ticket = 0;

int OnInit()
{{
   Print("EA Initialized: ", project_name);
   return(INIT_SUCCEEDED);
}}

void OnDeinit(const int reason)
{{
   Print("EA Deinitialized: ", reason);
}}

void OnTick()
{{
   // Strategy: {description}
   
   // Check for new bar
   if(IsNewBar())
   {{
      // Entry logic placeholder
      // Add your strategy logic here
      
      Print("New bar detected");
   }}
}}

bool IsNewBar()
{{
   static datetime lastBar = 0;
   datetime currentBar = iTime(_Symbol, PERIOD_CURRENT, 0);
   
   if(currentBar != lastBar)
   {{
      lastBar = currentBar;
      return true;
   }}
   return false;
}}

// Helper functions
double GetLotSize(double risk)
{{
   double balance = AccountBalance();
   double lot = NormalizeDouble(balance * risk / 10000, 2);
   return MathMax(0.01, MathMin(lot, 1.0));
}}

bool ExecuteTrade(string direction, double volume, int sl, int tp)
{{
   int cmd = (direction == "buy") ? OP_BUY : OP_SELL;
   double price = (direction == "buy") ? Ask : Bid;
   double stopLoss = (direction == "buy") ? price - sl * _Point : price + sl * _Point;
   double takeProfit = (direction == "buy") ? price + tp * _Point : price - tp * _Point;
   
   g_ticket = OrderSend(_Symbol, cmd, volume, price, Slippage, stopLoss, takeProfit, 
                       project_name, MagicNumber, 0, (direction == "buy") ? clrGreen : clrRed);
   
   if(g_ticket < 0)
   {{
      Print("Order failed: ", GetLastError());
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
        "model": "glm-5",
        "messages": [
            {"role": "system", "content": MQL5_SYSTEM_PROMPT},
            {"role": "user", "content": f"Project: {project_name}\n\nStrategy: {description}"}
        ],
        "temperature": 0.7,
        "max_tokens": 8000,
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"GLM-5 API error: {response.status_code}")
            
            result = response.json()
            
            # Extract code from response
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0].get("message", {}).get("content", "")
                
                # Clean up markdown if present
                if content.startswith("```"):
                    lines = content.split("\n")
                    content = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                
                return content
            
            raise Exception("No completion returned from GLM-5")
    
    except httpx.TimeoutException:
        raise Exception("GLM-5 API timeout")
    except Exception as e:
        raise Exception(f"GLM-5 generation failed: {str(e)}")
