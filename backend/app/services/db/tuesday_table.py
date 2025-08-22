from app.core.supabase.client import supabase_client
import logging
from typing import Dict, Any
import pandas as pd

logger = logging.getLogger(__name__)

class TuesdayTableService:
    def __init__(self):
        self.supabase = supabase_client.get_client()
        logger.info("🏴‍☠️ TuesdayTableService ready for financial treasure hunting!")
    
    def get_all_companies(self) -> Dict[str, Any]:
        """Retrieve all companies from tuesday_dataset - the complete treasure map!"""
        try:
            logger.info("🏴‍☠️ Fetching all Tuesday dataset companies")
            result = self.supabase.table("tuesday_dataset").select('*').execute()
            
            if result.data:
                logger.info(f"🏴‍☠️ Found {len(result.data)} companies in the dataset")
                return {
                    "success": True,
                    "companies": result.data,
                    "count": len(result.data)
                }
            else:
                return {"success": False, "error": "No companies found"}
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to fetch companies: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_company_by_ticker(self, ticker: str) -> Dict[str, Any]:
        """Find a specific company by stock ticker"""
        try:
            logger.info(f"🏴‍☠️ Searching for ticker: {ticker}")
            result = self.supabase.table("tuesday_dataset").select('*').eq('stock_ticker', ticker.upper()).execute()
            
            if result.data and len(result.data) > 0:
                company = result.data[0]
                logger.info(f"🏴‍☠️ Found company: {company['company_name']}")
                return {"success": True, "company": company}
            else:
                return {"success": False, "error": f"No company found with ticker {ticker}"}
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to get company by ticker: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_top_performers(self, metric: str = "ytd_return_percent", limit: int = 10) -> Dict[str, Any]:
        """Get top performing companies by specified metric"""
        try:
            logger.info(f"🏴‍☠️ Finding top {limit} performers by {metric}")
            
            # Get all data first, then sort (since Supabase text fields need conversion)
            all_data = self.get_all_companies()
            if not all_data["success"]:
                return all_data
            
            # Convert to DataFrame for easier analysis
            df = pd.DataFrame(all_data["companies"])
            
            # Convert metric to numeric (handling text fields)
            if metric in df.columns:
                df[f"{metric}_numeric"] = pd.to_numeric(df[metric], errors='coerce')
                top_companies = df.nlargest(limit, f"{metric}_numeric").to_dict('records')
                
                return {
                    "success": True,
                    "top_performers": top_companies,
                    "metric": metric,
                    "count": len(top_companies)
                }
            else:
                return {"success": False, "error": f"Metric {metric} not found"}
                
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to get top performers: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def analyze_dataset(self) -> Dict[str, Any]:
        """Perform basic analysis on the entire dataset"""
        try:
            logger.info("🏴‍☠️ Running dataset analysis")
            
            all_data = self.get_all_companies()
            if not all_data["success"]:
                return all_data
            
            df = pd.DataFrame(all_data["companies"])
            
            # Convert numeric fields
            numeric_fields = [
                'current_stock_price', 'ytd_return_percent', 'market_cap_millions',
                'rule_of_40_score', 'ebitda_margin_percent', 'return_on_invested_capital',
                'revenue_5yr_growth_rate', 'sales_yoy_growth_percent', 'projected_3yr_sales_growth',
                'capex_intensity_ratio', 'rd_intensity_percent', 'annual_revenue_millions'
            ]
            
            analysis = {
                "total_companies": len(df),
                "metrics_summary": {}
            }
            
            for field in numeric_fields:
                if field in df.columns:
                    numeric_series = pd.to_numeric(df[field], errors='coerce')
                    analysis["metrics_summary"][field] = {
                        "mean": round(numeric_series.mean(), 2) if not numeric_series.isna().all() else None,
                        "median": round(numeric_series.median(), 2) if not numeric_series.isna().all() else None,
                        "min": round(numeric_series.min(), 2) if not numeric_series.isna().all() else None,
                        "max": round(numeric_series.max(), 2) if not numeric_series.isna().all() else None,
                        "valid_entries": numeric_series.count()
                    }
            
            return {"success": True, "analysis": analysis}
            
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to analyze dataset: {str(e)}")
            return {"success": False, "error": str(e)}

# Single instance, ready to sail!
tuesday_table_service = TuesdayTableService()