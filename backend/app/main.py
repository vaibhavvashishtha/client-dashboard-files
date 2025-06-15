from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import auth, files, analytics, admin

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def root():
    return {"message": "API running!"}

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow requests from frontend
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Only allow needed HTTP methods
    allow_headers=["Authorization", "Content-Type"],  # Only allow needed headers
)


# Routers
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(analytics.router)
app.include_router(admin.router)
