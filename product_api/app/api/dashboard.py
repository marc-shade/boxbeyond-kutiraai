from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from typing import Dict, Any, List
import os
from datetime import datetime, timedelta
import logging

from app.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection configurations
def get_workflow_db_connection():
    """Get connection to workflow database"""
    DB_USER = os.getenv("WORKFLOW_POSTGRES_USER", "workflow_user")
    DB_PASSWORD = os.getenv("WORKFLOW_POSTGRES_PASSWORD", "workflow_secure_password_123")
    DB_HOST = "postgres-workflow"  # Docker service name
    DB_PORT = "5432"  # Internal Docker port
    DB_NAME = os.getenv("WORKFLOW_POSTGRES_DB", "workflow_db")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(DATABASE_URL)
    return engine

def get_n8n_db_connection():
    """Get connection to n8n database"""
    DB_USER = os.getenv("N8N_POSTGRES_USER", "root")
    DB_PASSWORD = os.getenv("N8N_POSTGRES_PASSWORD", "password")
    DB_HOST = "postgres-n8n"  # Docker service name
    DB_PORT = "5432"  # Internal Docker port
    DB_NAME = os.getenv("N8N_POSTGRES_DB", "n8n")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(DATABASE_URL)
    return engine

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics from multiple databases
    """
    try:
        stats = {}
        
        # Get counts from product database (current connection)
        try:
            # Dataset Configs count
            dataset_count = db.execute(text("SELECT COUNT(*) FROM dataset_master_table")).scalar()
            # For datasets, let's consider anything that's not 'Pending' as active
            active_dataset_count = 0
            try:
                # First, get all distinct status values to see what's available
                status_values = db.execute(text("SELECT DISTINCT dataset_status FROM dataset_master_table WHERE dataset_status IS NOT NULL")).fetchall()
                available_statuses = [row[0] for row in status_values]
                logger.info(f"Available dataset status values: {available_statuses}")

                # Count datasets that are NOT in pending status (assuming these are active/usable)
                pending_variations = ['Pending', 'pending', 'PENDING', 'Draft', 'draft', 'DRAFT']

                # Count all datasets that are not in pending status
                pending_count = 0
                for pending_status in pending_variations:
                    if pending_status in available_statuses:
                        count = db.execute(text(f"SELECT COUNT(*) FROM dataset_master_table WHERE dataset_status = '{pending_status}'")).scalar() or 0
                        pending_count += count
                        logger.info(f"Found {count} datasets with pending status '{pending_status}'")

                # Active = Total - Pending
                active_dataset_count = dataset_count - pending_count

                # If we still have 0 active but have total datasets, let's try specific active statuses
                if active_dataset_count <= 0 and dataset_count > 0:
                    active_status_variations = ['Active', 'active', 'ACTIVE', 'Completed', 'completed', 'COMPLETED', 'Ready', 'ready', 'READY', 'Published', 'published', 'PUBLISHED']

                    for status in active_status_variations:
                        if status in available_statuses:
                            count = db.execute(text(f"SELECT COUNT(*) FROM dataset_master_table WHERE dataset_status = '{status}'")).scalar() or 0
                            if count > 0:
                                active_dataset_count += count
                                logger.info(f"Found {count} datasets with active status '{status}'")

                logger.info(f"Dataset summary: Total={dataset_count}, Active={active_dataset_count}, Pending={pending_count}")

            except Exception as status_error:
                logger.error(f"Error checking dataset status: {status_error}")
                active_dataset_count = 0

            stats["dataset_configs"] = {
                "total": dataset_count,
                "active": active_dataset_count
            }
            
            # Fine Tune Configs count
            finetune_count = db.execute(text("SELECT COUNT(*) FROM finetune_master_table")).scalar()
            # Try different possible status values for completed fine-tune configs
            completed_count = 0
            try:
                # Try with capital C
                completed_count = db.execute(text("SELECT COUNT(*) FROM finetune_master_table WHERE status = 'Completed'")).scalar() or 0
                if completed_count == 0:
                    # Try with lowercase c
                    completed_count = db.execute(text("SELECT COUNT(*) FROM finetune_master_table WHERE status = 'completed'")).scalar() or 0
                if completed_count == 0:
                    # Try with COMPLETED
                    completed_count = db.execute(text("SELECT COUNT(*) FROM finetune_master_table WHERE status = 'COMPLETED'")).scalar() or 0
            except Exception as status_error:
                logger.error(f"Error checking finetune status: {status_error}")
                completed_count = 0

            stats["finetune_configs"] = {
                "total": finetune_count,
                "active": completed_count
            }
            
        except Exception as e:
            logger.error(f"Error fetching product database stats: {e}")
            stats["dataset_configs"] = {"total": 0, "active": 0}
            stats["finetune_configs"] = {"total": 0, "active": 0}
        
        # Get counts from workflow database
        try:
            workflow_engine = get_workflow_db_connection()
            with workflow_engine.connect() as conn:
                # Total Agents count (from workflows table)
                workflow_count = conn.execute(text("SELECT COUNT(*) FROM workflows")).scalar()
                active_workflows = conn.execute(text("SELECT COUNT(*) FROM workflows WHERE is_active = true")).scalar() or 0

                logger.info(f"Workflow database - Total: {workflow_count}, Active: {active_workflows}")

                stats["total_agents"] = {
                    "total": workflow_count,
                    "active": active_workflows
                }
        except Exception as e:
            logger.error(f"Error fetching workflow database stats: {e}")
            # Try to provide more detailed error information
            try:
                workflow_engine = get_workflow_db_connection()
                with workflow_engine.connect() as conn:
                    # Test basic connectivity
                    conn.execute(text("SELECT 1")).scalar()
                    logger.error("Workflow database connection works, but workflows table might not exist")
            except Exception as conn_error:
                logger.error(f"Workflow database connection failed: {conn_error}")
            stats["total_agents"] = {"total": 0, "active": 0}
        
        # Get counts from n8n database
        try:
            n8n_engine = get_n8n_db_connection()
            with n8n_engine.connect() as conn:
                # First, let's check what tables exist in n8n database
                try:
                    # Try different possible table names for n8n workflows
                    table_names = ["workflow_entity", "workflows", "workflow"]
                    n8n_workflows = 0
                    active_n8n_workflows = 0

                    for table_name in table_names:
                        try:
                            # Check if table exists and get count
                            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                            if result is not None:
                                n8n_workflows = result
                                # Try to get active count - different tables might have different active column names
                                try:
                                    active_result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name} WHERE active = true")).scalar()
                                    active_n8n_workflows = active_result or 0
                                except:
                                    # If 'active' column doesn't exist, try other common column names
                                    try:
                                        active_result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name} WHERE status = 'active'")).scalar()
                                        active_n8n_workflows = active_result or 0
                                    except:
                                        # If no active column, assume all are active
                                        active_n8n_workflows = n8n_workflows
                                break
                        except Exception as table_error:
                            logger.debug(f"Table {table_name} not found or error: {table_error}")
                            continue

                    stats["process_flows"] = {
                        "total": n8n_workflows,
                        "active": active_n8n_workflows
                    }
                except Exception as inner_e:
                    logger.error(f"Error querying n8n tables: {inner_e}")
                    stats["process_flows"] = {"total": 0, "active": 0}

        except Exception as e:
            logger.error(f"Error connecting to n8n database: {e}")
            stats["process_flows"] = {"total": 0, "active": 0}
        
        return {
            "status": "success",
            "data": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard statistics: {str(e)}")

@router.get("/dashboard/chart-data")
async def get_dashboard_chart_data(db: Session = Depends(get_db)):
    """
    Get chart data for dashboard visualization - showing actual current counts
    """
    try:
        # Get actual current counts from all databases
        chart_data = {
            "current": {
                "categories": ["Total Agents", "Process Flows", "Fine Tune Configs", "Dataset Configs"],
                "series": []
            }
        }
        
        # Get actual current counts for chart data
        try:
            # Get counts from product database
            dataset_count = db.execute(text("SELECT COUNT(*) FROM dataset_master_table")).scalar() or 0
            finetune_count = db.execute(text("SELECT COUNT(*) FROM finetune_master_table")).scalar() or 0

            logger.info(f"Chart data - Dataset count: {dataset_count}, Finetune count: {finetune_count}")

            # Get workflow count
            workflow_count = 0
            try:
                workflow_engine = get_workflow_db_connection()
                with workflow_engine.connect() as conn:
                    workflow_count = conn.execute(text("SELECT COUNT(*) FROM workflows")).scalar() or 0
            except:
                pass

            # Get n8n workflow count
            n8n_count = 0
            try:
                n8n_engine = get_n8n_db_connection()
                with n8n_engine.connect() as conn:
                    # Try different possible table names for n8n workflows
                    table_names = ["workflow_entity", "workflows", "workflow"]
                    for table_name in table_names:
                        try:
                            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                            if result is not None:
                                n8n_count = result
                                break
                        except:
                            continue
            except:
                pass

            # Create chart data with actual current counts
            chart_data["current"]["series"] = [
                {
                    "name": "Platform Overview",
                    "data": [workflow_count, n8n_count, finetune_count, dataset_count]
                }
            ]

        except Exception as e:
            logger.error(f"Error generating chart data: {e}")
            # Fallback to default data
            chart_data["current"]["series"] = [
                {
                    "name": "Platform Overview",
                    "data": [0, 0, 0, 0]
                }
            ]
        
        return {
            "status": "success",
            "data": chart_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_chart_data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart data: {str(e)}")

@router.get("/dashboard/test-connections")
async def test_database_connections(db: Session = Depends(get_db)):
    """
    Test connectivity to all databases
    """
    results = {}

    # Test product database
    try:
        result = db.execute(text("SELECT 1")).scalar()
        results["product_db"] = {"status": "connected", "test_result": result}
    except Exception as e:
        results["product_db"] = {"status": "failed", "error": str(e)}

    # Test workflow database
    try:
        workflow_engine = get_workflow_db_connection()
        with workflow_engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            # Check if workflows table exists
            try:
                table_check = conn.execute(text("SELECT COUNT(*) FROM workflows")).scalar()
                results["workflow_db"] = {
                    "status": "connected",
                    "test_result": result,
                    "workflows_table": "exists",
                    "workflow_count": table_check
                }
            except Exception as table_error:
                results["workflow_db"] = {
                    "status": "connected",
                    "test_result": result,
                    "workflows_table": "missing",
                    "table_error": str(table_error)
                }
    except Exception as e:
        results["workflow_db"] = {"status": "failed", "error": str(e)}

    # Test n8n database
    try:
        n8n_engine = get_n8n_db_connection()
        with n8n_engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            # List all tables in n8n database
            try:
                tables_result = conn.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """)).fetchall()
                table_names = [row[0] for row in tables_result]
                results["n8n_db"] = {
                    "status": "connected",
                    "test_result": result,
                    "available_tables": table_names
                }
            except Exception as table_error:
                results["n8n_db"] = {
                    "status": "connected",
                    "test_result": result,
                    "table_list_error": str(table_error)
                }
    except Exception as e:
        results["n8n_db"] = {"status": "failed", "error": str(e)}

    return {
        "status": "success",
        "data": results,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/dashboard/debug-status")
async def debug_status_values(db: Session = Depends(get_db)):
    """
    Debug endpoint to check actual status values in database tables
    """
    try:
        debug_info = {}

        # Check finetune status values
        try:
            finetune_statuses = db.execute(text("SELECT DISTINCT status FROM finetune_master_table WHERE status IS NOT NULL")).fetchall()
            debug_info["finetune_statuses"] = [row[0] for row in finetune_statuses]

            # Get sample records
            sample_finetune = db.execute(text("SELECT id, status FROM finetune_master_table LIMIT 5")).fetchall()
            debug_info["sample_finetune"] = [{"id": row[0], "status": row[1]} for row in sample_finetune]
        except Exception as e:
            debug_info["finetune_error"] = str(e)

        # Check dataset status values
        try:
            dataset_statuses = db.execute(text("SELECT DISTINCT dataset_status FROM dataset_master_table WHERE dataset_status IS NOT NULL")).fetchall()
            debug_info["dataset_statuses"] = [row[0] for row in dataset_statuses]

            # Get sample records
            sample_dataset = db.execute(text("SELECT id, dataset_status FROM dataset_master_table LIMIT 5")).fetchall()
            debug_info["sample_dataset"] = [{"id": row[0], "dataset_status": row[1]} for row in sample_dataset]
        except Exception as e:
            debug_info["dataset_error"] = str(e)

        return {
            "status": "success",
            "data": debug_info,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in debug_status_values: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch debug info: {str(e)}")

@router.get("/dashboard/test-dataset-status")
async def test_dataset_status(db: Session = Depends(get_db)):
    """
    Test endpoint specifically for dataset status debugging
    """
    try:
        result = {}

        # Get total count
        total_count = db.execute(text("SELECT COUNT(*) FROM dataset_master_table")).scalar() or 0
        result["total_datasets"] = total_count

        # Get all records with their status
        all_datasets = db.execute(text("SELECT id, dataset_name, dataset_status FROM dataset_master_table")).fetchall()
        result["all_datasets"] = [{"id": row[0], "name": row[1], "status": row[2]} for row in all_datasets]

        # Get distinct statuses
        statuses = db.execute(text("SELECT DISTINCT dataset_status FROM dataset_master_table WHERE dataset_status IS NOT NULL")).fetchall()
        result["distinct_statuses"] = [row[0] for row in statuses]

        # Count by status
        status_counts = {}
        for status_row in statuses:
            status = status_row[0]
            count = db.execute(text(f"SELECT COUNT(*) FROM dataset_master_table WHERE dataset_status = '{status}'")).scalar() or 0
            status_counts[status] = count
        result["status_counts"] = status_counts

        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in test_dataset_status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to test dataset status: {str(e)}")
