from app import database, models

def login(client, username, password):
    response = client.post('/auth/login', data={'username': username, 'password': password})
    assert response.status_code == 200
    return response.json()['access_token']

def test_upload_and_no_overwrite(client, tmp_path):
    token = login(client, 'admin', 'admin123')
    data = {'start_date': '2024-01-01', 'end_date': '2024-01-02', 'client_id': 1}

    file_content1 = b'data1'
    files = {'file': ('test.xlsx', file_content1, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    r1 = client.post('/files/upload', headers={'Authorization': f'Bearer {token}'}, data=data, files=files)
    assert r1.status_code == 200
    id1 = r1.json()['file_id']

    file_content2 = b'data2'
    files2 = {'file': ('test.xlsx', file_content2, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    r2 = client.post('/files/upload', headers={'Authorization': f'Bearer {token}'}, data=data, files=files2)
    assert r2.status_code == 200
    id2 = r2.json()['file_id']
    assert id1 != id2

    db = database.SessionLocal()
    count = db.query(models.FileMeta).count()
    paths = [f.path for f in db.query(models.FileMeta).all()]
    db.close()
    assert count == 2
    assert len(set(paths)) == 2
