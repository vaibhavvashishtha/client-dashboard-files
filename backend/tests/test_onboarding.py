from app import models, database

def test_seed_demo_users(client):
    db = database.SessionLocal()
    users = db.query(models.User).all()
    clients = db.query(models.Client).all()
    db.close()
    assert len(users) >= 3
    assert len(clients) >= 1
