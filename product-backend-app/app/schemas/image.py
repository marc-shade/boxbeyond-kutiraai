from pydantic import BaseModel

class ImageGenerationRequest(BaseModel):
    inputs: str
