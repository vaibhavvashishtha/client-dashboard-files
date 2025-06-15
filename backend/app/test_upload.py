import os
import requests

def create_test_file():
    with open("test.xlsx", "w") as f:
        f.write("Name\tAge\nJohn\t30\nJane\t25")
    print("Created test file: test.xlsx")

def test_upload():
    # Login first to get token
    login_url = "http://127.0.0.1:8000/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    login_response = requests.post(login_url, data=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print(f"Login successful. Token: {token}")

    # Upload file
    upload_url = "http://127.0.0.1:8000/files/upload"
    
    with open("test.xlsx", "rb") as file:
        files = {"file": ("test.xlsx", file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data = {
            "start_date": "2025-06-15",
            "end_date": "2025-06-15"
        }
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(upload_url, headers=headers, files=files, data=data)
        
        print("\n=== Upload Response ===")
        print(f"Status code: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error parsing JSON: {str(e)}")
            print(f"Raw response: {response.text}")

if __name__ == "__main__":
    create_test_file()
    test_upload()
