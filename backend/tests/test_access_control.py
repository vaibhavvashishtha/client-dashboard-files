from app import database, models


def login(client, username, password):
    response = client.post('/auth/login', data={'username': username, 'password': password})
    assert response.status_code == 200
    return response.json()['access_token']


def test_admin_can_access_clients(client):
    token = login(client, 'admin', 'admin123')
    r = client.get('/admin/clients', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_client_cannot_access_admin_routes(client):
    token = login(client, 'client1', 'client123')
    r = client.get('/admin/clients', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 403
