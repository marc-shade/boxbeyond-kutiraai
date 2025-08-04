import httpx
import io
import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from ..schemas.image import ImageGenerationRequest
from typing import Optional

router = APIRouter()

@router.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    """
    Generate an image using the FLUX.1-dev model
    """
    api_token = os.getenv("HUGGINGFACE_API_TOKEN")
    if not api_token:
        raise HTTPException(
            status_code=500,
            detail="HUGGINGFACE_API_TOKEN environment variable is required"
        )
    
    url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json={"inputs": request.inputs},
                timeout=300.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error from Hugging Face API: {response.text}"
                )
            
            return StreamingResponse(
                io.BytesIO(response.content),
                media_type="image/png"
            )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timed out while generating image"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/models")
async def get_huggingface_models(
    author: Optional[str] = Query(None, description="Filter models by author"),
    search: Optional[str] = Query(None, description="Search term for models"),
    limit: int = Query(5, description="Number of models to return"),
    full: bool = Query(True, description="Return full model information"),
    config: bool = Query(True, description="Include model configuration")
):
    """
    Proxy endpoint for Hugging Face models API
    """
    api_token = os.getenv("HUGGINGFACE_API_TOKEN")
    if not api_token:
        raise HTTPException(
            status_code=500,
            detail="HUGGINGFACE_API_TOKEN environment variable is required"
        )

    # Build query parameters
    params = {
        "limit": limit,
        "full": str(full).lower(),
        "config": str(config).lower()
    }

    if author:
        params["author"] = author
    if search:
        params["search"] = search

    url = "https://huggingface.co/api/models"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error from Hugging Face API: {response.text}"
                )

            return response.json()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timed out while fetching models"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )
