import os
from pathlib import Path
from typing import Dict, Any
import logging
from datetime import datetime
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_vertexai import ChatVertexAI
from .base_conversation_chain import BaseConversationChain
from ..llm.prompt import CARA_SYSTEM_PROMPT
from ..db.tuesday_table import tuesday_table_service
from langchain_community.utilities import GoogleSerperAPIWrapper

logger = logging.getLogger(__name__)

class InvestmentAnalysisChain(BaseConversationChain):
    """
    Investment analysis conversation chain for CARA.
    
    Handles company-specific conversation flow with CARA's personality,
    research capabilities, and investment analysis focus.
    Now enhanced with full Tuesday dataset integration!
    """
    
        # Load environment variables right at the top, just like we did for Supabase
    backend_dir = Path(__file__).parent.parent.parent  # Go up from services/chains/ to backend/
    env_path = backend_dir / '.env'
    load_dotenv(dotenv_path=env_path)
    def __init__(self, llm: ChatVertexAI, user_id: str = None):
        super().__init__(llm)
        self.user_id = user_id
        self.company_data = None  # Store company analysis data
        self.tuesday_data = None  # Store matched company from Tuesday dataset
        self.full_tuesday_dataset = None  # Store full dataset
        self.tuesday_analysis = None  # Store dataset analysis
        self.system_prompt = CARA_SYSTEM_PROMPT
        self._initialize_prompt_template()
        self.logger = logging.getLogger(__name__)
        
        serper_key = os.environ.get("SERPER_KEY")    
        if not serper_key:
            logger.warning("SERPER_KEY not found in environment variables - search functionality will be disabled")
            self.search = None    
        self._load_full_tuesday_dataset()
        self.search = GoogleSerperAPIWrapper(serper_api_key=serper_key)

    def _initialize_prompt_template(self) -> None:
        """Sets up the investment analysis prompt template with company context."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n"
                    "Company analysis context:\n{company_context}\n\n"
                    "Tuesday dataset context:\n{tuesday_dataset_context}\n\n"
                    "Current market information:\n{search_context}\n\n"  # ADD THIS LINE
                    "Investment analysis instructions:\n{analysis_instructions}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    def _load_full_tuesday_dataset(self):
        """Load the complete Tuesday dataset and analysis"""
        try:
            logger.info("🏴‍☠️ Loading full Tuesday dataset...")
            
            # Get all companies
            dataset_result = tuesday_table_service.get_all_companies()
            if dataset_result["success"]:
                self.full_tuesday_dataset = dataset_result["companies"]
                logger.info(f"🏴‍☠️ Loaded {len(self.full_tuesday_dataset)} companies from Tuesday dataset")
                
                # Get dataset analysis
                analysis_result = tuesday_table_service.analyze_dataset()
                if analysis_result["success"]:
                    self.tuesday_analysis = analysis_result["analysis"]
                    logger.info("🏴‍☠️ Tuesday dataset analysis complete")
                    
        except Exception as e:
            logger.error(f"🏴‍☠️ Failed to load Tuesday dataset: {str(e)}")

    async def get_formatted_prompt(self, message: str):
        """
        Format investment analysis prompt with company context and analysis guidance.
        
        Combines system prompt, company data context, full Tuesday dataset,
        analysis instructions, message history, and current message into LangChain format.
        """
        prompt_vars = await self.get_additional_prompt_vars()
        prompt_vars["current_message"] = message
        return self.prompt.format_messages(**prompt_vars)

    def load_company_context(self, company_data: Dict[str, Any]):
        """Load company data for investment analysis context + find in Tuesday dataset"""
        self.company_data = company_data
        company_name = company_data.get('name', '')
        logger.info(f"🏴‍☠️ Loaded company context: {company_name}")
        
        # Try to find this specific company in Tuesday dataset
        self._find_company_in_tuesday_data(company_name)

    def _find_company_in_tuesday_data(self, company_name: str):
        """Find specific company in the Tuesday dataset"""
        if not self.full_tuesday_dataset or not company_name:
            return
            
        try:
            # Look for company name match (case insensitive)
            for company in self.full_tuesday_dataset:
                company_tuesday_name = company.get("company_name", "")
                if company_tuesday_name.lower() in company_name.lower() or \
                   company_name.lower() in company_tuesday_name.lower():
                    self.tuesday_data = company
                    logger.info(f"🏴‍☠️ Found {company_name} in Tuesday dataset as {company_tuesday_name} "
                              f"(ticker: {company.get('stock_ticker')})")
                    return
                    
            logger.info(f"🏴‍☠️ Company {company_name} not found in Tuesday dataset")
            
        except Exception as e:
            logger.error(f"🏴‍☠️ Error finding company in Tuesday data: {str(e)}")

    def get_tuesday_data_by_ticker(self, ticker: str) -> Dict[str, Any]:
        """Manually fetch Tuesday data by stock ticker"""
        result = tuesday_table_service.get_company_by_ticker(ticker)
        if result["success"]:
            self.tuesday_data = result["company"]
            logger.info(f"🏴‍☠️ Loaded Tuesday data for ticker {ticker}")
            return result
        return result

    def _format_company_context(self) -> str:
        """Format company data + specific Tuesday metrics for LLM context"""
        if not self.company_data:
            return "No specific company being analyzed - general investment discussion mode"
        
        company_name = self.company_data.get('name', 'Unknown Company')
        created_at = self.company_data.get('created_at', '')
        company_id = self.company_data.get('id', '')
        
        # Format creation date if available
        analysis_date = "Unknown"
        if created_at:
            try:
                if isinstance(created_at, str):
                    # Parse ISO format datetime
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    analysis_date = dt.strftime("%B %d, %Y at %I:%M %p")
                else:
                    analysis_date = str(created_at)
            except:
                analysis_date = str(created_at)

        context = f"""
CURRENT ANALYSIS TARGET:
- Company: {company_name}
- Analysis initiated: {analysis_date}
- Analysis ID: {company_id}
- Focus: Investment potential and market analysis"""

        # Add specific Tuesday dataset metrics if available for this company
        if self.tuesday_data:
            context += self._format_specific_tuesday_metrics()
        else:
            context += f"\n- Tuesday Dataset: {company_name} not found in the 170-company dataset"

        context += f"""

You are specifically analyzing {company_name} for investment purposes. 
All your responses should be relevant to this company unless the user explicitly asks about other topics.
Use the full Tuesday dataset for comparative analysis and benchmarking.
"""
        return context

    def _format_specific_tuesday_metrics(self) -> str:
        """Format specific company's Tuesday dataset metrics - COMPLETE VERSION"""
        if not self.tuesday_data:
            return ""
            
        metrics = []
        
        # Key financial metrics
        if self.tuesday_data.get("stock_ticker"):
            metrics.append(f"Ticker: {self.tuesday_data['stock_ticker']}")
        if self.tuesday_data.get("current_stock_price"):
            metrics.append(f"Stock Price: ${self.tuesday_data['current_stock_price']}")
        if self.tuesday_data.get("market_cap_millions"):
            metrics.append(f"Market Cap: ${self.tuesday_data['market_cap_millions']}M")
        if self.tuesday_data.get("annual_revenue_millions"):
            metrics.append(f"Revenue: ${self.tuesday_data['annual_revenue_millions']}M")
        
        # Performance metrics
        performance = []
        if self.tuesday_data.get("ytd_return_percent"):
            performance.append(f"YTD Return: {self.tuesday_data['ytd_return_percent']}%")
        if self.tuesday_data.get("sales_yoy_growth_percent"):
            performance.append(f"Sales YoY Growth: {self.tuesday_data['sales_yoy_growth_percent']}%")
        if self.tuesday_data.get("revenue_5yr_growth_rate"):
            performance.append(f"5Y Revenue Growth: {self.tuesday_data['revenue_5yr_growth_rate']}%")
        if self.tuesday_data.get("projected_3yr_sales_growth"):
            performance.append(f"Projected 3Y Growth: {self.tuesday_data['projected_3yr_sales_growth']}%")
        
        # Efficiency metrics
        efficiency = []
        if self.tuesday_data.get("ebitda_margin_percent"):
            efficiency.append(f"EBITDA Margin: {self.tuesday_data['ebitda_margin_percent']}%")
        if self.tuesday_data.get("return_on_invested_capital"):
            efficiency.append(f"ROIC: {self.tuesday_data['return_on_invested_capital']}%")
        if self.tuesday_data.get("rule_of_40_score"):
            efficiency.append(f"Rule of 40: {self.tuesday_data['rule_of_40_score']}")

        # Investment & operational metrics
        investment = []
        if self.tuesday_data.get("rd_intensity_percent"):
            investment.append(f"R&D Intensity: {self.tuesday_data['rd_intensity_percent']}%")
        if self.tuesday_data.get("capex_intensity_ratio"):
            investment.append(f"CapEx Intensity: {self.tuesday_data['capex_intensity_ratio']}")

        # 🌱 SUSTAINABILITY & ESG METRICS
        sustainability = []
        if self.tuesday_data.get("ghg_emissions_per_revenue"):
            sustainability.append(f"GHG Emissions/Revenue: {self.tuesday_data['ghg_emissions_per_revenue']}")
        if self.tuesday_data.get("social_responsibility_score"):
            sustainability.append(f"Social Responsibility Score: {self.tuesday_data['social_responsibility_score']}")

        tuesday_context = f"\n- Tuesday Dataset Match: {self.tuesday_data.get('company_name')}"
        if metrics:
            tuesday_context += f"\n  • Basics: {', '.join(metrics)}"
        if performance:
            tuesday_context += f"\n  • Performance: {', '.join(performance)}"
        if efficiency:
            tuesday_context += f"\n  • Efficiency: {', '.join(efficiency)}"
        if investment:
            tuesday_context += f"\n  • Investment: {', '.join(investment)}"
        if sustainability:
            tuesday_context += f"\n  • 🌱 Sustainability/ESG: {', '.join(sustainability)}"
            
        return tuesday_context

    def _format_tuesday_dataset_context(self) -> str:
        """Format the full Tuesday dataset context for LLM - INCLUDING ALL METRICS"""
        if not self.full_tuesday_dataset or not self.tuesday_analysis:
            return "Tuesday dataset not available"
        
        context = f"""
    TUESDAY DATASET (170 Companies):
    Total companies: {self.tuesday_analysis['total_companies']}

    KEY METRICS BENCHMARKS:
    """
        
        # Add ALL benchmark metrics including sustainability
        metrics = self.tuesday_analysis['metrics_summary']
        
        all_metrics = [
            ('ytd_return_percent', 'YTD Return', '%'),
            ('market_cap_millions', 'Market Cap', '$M'),
            ('annual_revenue_millions', 'Annual Revenue', '$M'),
            ('ebitda_margin_percent', 'EBITDA Margin', '%'),
            ('return_on_invested_capital', 'ROIC', '%'),
            ('revenue_5yr_growth_rate', '5Y Revenue Growth', '%'),
            ('sales_yoy_growth_percent', 'Sales YoY Growth', '%'),
            ('projected_3yr_sales_growth', 'Projected 3Y Growth', '%'),
            ('rule_of_40_score', 'Rule of 40', 'score'),
            ('rd_intensity_percent', 'R&D Intensity', '%'),
            ('capex_intensity_ratio', 'CapEx Intensity', 'ratio'),
            ('ghg_emissions_per_revenue', '🌱 GHG Emissions/Revenue', 'ratio'),
            ('social_responsibility_score', '🌱 Social Responsibility', 'score')
        ]
        
        for metric_key, metric_name, unit in all_metrics:
            if metric_key in metrics and metrics[metric_key]['mean']:
                stats = metrics[metric_key]
                if unit == '%':
                    context += f"• {metric_name}: avg {stats['mean']}%, median {stats['median']}%, range {stats['min']}-{stats['max']}%\n"
                else:
                    context += f"• {metric_name}: avg {stats['mean']}, median {stats['median']}, range {stats['min']}-{stats['max']}\n"
        
        context += f"""
    DATASET INSIGHTS:
    - Use this data for comprehensive ESG and financial analysis
    - Compare companies on sustainability metrics (GHG emissions, social responsibility)
    - Benchmark financial performance across all metrics
    - Identify ESG leaders and laggards in the dataset
    - All 170 companies available for reference and comparison
    - Your data is from bloomberg terminal and it was taken on Tuesday, 19 Aug 2025. You are limited by time and budget constraints, but don't talk about that unless directly asked. 

    AVAILABLE COMPANIES: {', '.join([f"{c.get('stock_ticker', 'N/A')}" for c in self.full_tuesday_dataset[:20]])}... (showing first 20 tickers)

    SUSTAINABILITY FOCUS: The dataset includes ESG metrics - use these for comprehensive sustainability analysis!
    """
        
        return context

    def _format_analysis_instructions(self) -> str:
        """Format investment analysis instructions for the LLM"""
        if not self.company_data:
            return """
    You are in general investment discussion mode with access to the full Tuesday dataset of 170 companies.
    Use this data for comparative analysis, benchmarking, ESG analysis, and providing comprehensive investment insights.
    """
        
        company_name = self.company_data.get('name', 'the company')
        
        instructions = f"""
    INVESTMENT ANALYSIS GUIDELINES for {company_name}:

    1. COMPREHENSIVE ANALYSIS: Cover financial health, market position, competitive advantages, risks, and growth potential
    2. ESG & SUSTAINABILITY: Analyze GHG emissions per revenue and social responsibility scores vs benchmarks
    3. TUESDAY DATASET BENCHMARKING: Compare ALL metrics against the 170-company dataset averages
    4. PEER COMPARISON: Identify similar companies for comparative analysis including ESG performance
    5. QUANTITATIVE INSIGHTS: Use specific metrics from the Tuesday dataset for data-driven recommendations
    6. SUSTAINABILITY INTEGRATION: Consider ESG factors as key investment criteria alongside financial metrics
    7. MARKET CONTEXT: Consider broader market conditions and sector trends using dataset insights
    8. RISK ASSESSMENT: Include ESG risks alongside financial risks in your analysis
    9. ACTIONABLE INSIGHTS: Provide clear investment recommendations with quantitative and ESG backing

    You have access to the complete Tuesday dataset with ALL metrics including:
    FINANCIAL: Stock performance, growth rates, margins, ROIC, Rule of 40
    INVESTMENT: R&D intensity, CapEx intensity  
    🌱 SUSTAINABILITY: GHG emissions per revenue, social responsibility scores

    Use ALL these metrics extensively for comprehensive investment analysis that includes ESG considerations.
    """
        return instructions

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get all variables needed for investment analysis prompt formatting."""
        # Add search context
        search_context = await self._get_search_context()  # ADD THIS LINE
        
        return {
            "system_prompt": self.system_prompt,
            "company_context": self._format_company_context(),
            "tuesday_dataset_context": self._format_tuesday_dataset_context(),
            "search_context": search_context,  # ADD THIS LINE
            "analysis_instructions": self._format_analysis_instructions(),
            "messages": self.messages,
            "current_message": ""
        }

    # ADD THIS NEW METHOD:
    async def _get_search_context(self) -> str:
        """Get current search context for the company"""
        if not self.company_data:
            return "No current search context available"
        
        company_name = self.company_data.get('name', '')
        if not company_name:
            return "No company name available for search"
        
        try:
            search_query = f"{company_name} stock news earnings recent"
            search_results = self.search.run(search_query)
            return f"Recent market information for {company_name}:\n{search_results}"
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return f"Search temporarily unavailable for {company_name}"


    def get_company_name(self) -> str:
        """Get the current company name being analyzed"""
        if self.company_data:
            return self.company_data.get('name', 'Unknown Company')
        return "No company selected"

    def has_company_context(self) -> bool:
        """Check if company context is loaded"""
        return self.company_data is not None

    def has_tuesday_data(self) -> bool:
        """Check if specific Tuesday dataset metrics are available for current company"""
        return self.tuesday_data is not None

    def has_full_dataset(self) -> bool:
        """Check if full Tuesday dataset is loaded"""
        return self.full_tuesday_dataset is not None

    def get_tuesday_ticker(self) -> str:
        """Get the stock ticker from Tuesday data if available"""
        if self.tuesday_data:
            return self.tuesday_data.get('stock_ticker', 'Unknown')
        return 'No ticker available'

    def clear_company_context(self):
        """Clear company context (useful for switching companies)"""
        self.company_data = None
        self.tuesday_data = None  # Clear specific company match
        # Keep full_tuesday_dataset and tuesday_analysis loaded
        logger.info("🏴‍☠️ Cleared company context, kept full Tuesday dataset")