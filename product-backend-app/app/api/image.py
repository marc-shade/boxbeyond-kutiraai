import httpx
import io
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ..schemas.image import ImageGenerationRequest

router = APIRouter()

@router.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    """
    Generate an image using the FLUX.1-dev model
    """
    api_token = os.getenv("HUGGINGFACE_API_TOKEN", "HUGGINGFACE_API_TOKEN_PLACEHOLDER")
    
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
