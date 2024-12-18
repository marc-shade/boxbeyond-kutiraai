from fastapi import FastAPI
from app.api import configuration, dataset_master, dataset_output, dataset_template, finetune
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(configuration.router, prefix="/api/v1", tags=["configurations"])
app.include_router(dataset_master.router, prefix="/api/v1", tags=["dataset_masters"])
app.include_router(dataset_output.router, prefix="/api/v1", tags=["dataset_outputs"])
app.include_router(dataset_template.router, prefix="/api/v1", tags=["dataset_templates"])
app.include_router(finetune.router, prefix="/api/v1", tags=["finetune"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}