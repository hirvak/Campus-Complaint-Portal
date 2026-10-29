import requests
import io
from PIL import Image

BASE_URL = "http://localhost:8000"

def test_all():
    print("==================================================")
    print("RUNNING CAMPUSCARE IMAGE UPLOAD TEST SUITE")
    print("==================================================")

    # 1. Login as Student
    print("\n1. Logging in as student (hirva@gmail.com)...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "hirva@gmail.com",
        "password": "Password@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {token}"}
    print("   [PASS] Student login successful.")

    # 2. Fetch categories to get valid category_id
    cat_res = requests.get(f"{BASE_URL}/categories/", headers=student_headers)
    assert cat_res.status_code == 200, f"Failed to get categories: {cat_res.text}"
    categories = cat_res.json()
    assert len(categories) > 0, "No categories found"
    cat_id = categories[0]["id"]
    print(f"   [INFO] Using Category ID: {cat_id} ({categories[0]['name']})")

    # 3. Create Complaint WITHOUT image (multipart/form-data)
    print("\n2. Creating complaint WITHOUT image...")
    form_data_no_img = {
        "title": "Broken window in Room 101",
        "description": "The window lock is broken and cannot close properly.",
        "category_id": str(cat_id),
        "location": "Room 101, Main Building"
    }
    res_no_img = requests.post(
        f"{BASE_URL}/complaints/",
        data=form_data_no_img,
        headers=student_headers
    )
    assert res_no_img.status_code == 201, f"Create without image failed: {res_no_img.status_code} {res_no_img.text}"
    c1 = res_no_img.json()
    assert c1["image_url"] is None, f"Expected image_url to be None, got: {c1['image_url']}"
    print(f"   [PASS] Complaint #{c1['id']} created without image. image_url is None.")

    # 4. Create Complaint WITH valid PNG image
    print("\n3. Creating complaint WITH valid PNG image...")
    png_buf = io.BytesIO()
    img_png = Image.new("RGB", (200, 200), color=(255, 0, 0))
    img_png.save(png_buf, format="PNG")
    png_bytes = png_buf.getvalue()

    files = {
        "image": ("window_damage.png", png_bytes, "image/png")
    }
    form_data_with_img = {
        "title": "Damaged ceiling tile in Lab 3",
        "description": "Ceiling tile fell down after rain.",
        "category_id": str(cat_id),
        "location": "Computer Lab 3"
    }
    res_with_png = requests.post(
        f"{BASE_URL}/complaints/",
        data=form_data_with_img,
        files=files,
        headers=student_headers
    )
    assert res_with_png.status_code == 201, f"Create with PNG failed: {res_with_png.status_code} {res_with_png.text}"
    c2 = res_with_png.json()
    assert c2["image_url"] is not None, "Expected image_url to not be None"
    assert c2["image_url"].startswith("/uploads/complaints/complaint_"), f"Unexpected path: {c2['image_url']}"
    assert c2["image_url"].endswith(".png"), f"Expected .png extension: {c2['image_url']}"
    print(f"   [PASS] Complaint #{c2['id']} created with PNG. image_url: {c2['image_url']}")

    # 5. Verify static file serving
    print("\n4. Verifying uploaded image is accessible via StaticFiles...")
    img_res = requests.get(f"{BASE_URL}{c2['image_url']}")
    assert img_res.status_code == 200, f"Static fetch failed: {img_res.status_code}"
    assert len(img_res.content) == len(png_bytes), "Content size mismatch"
    print(f"   [PASS] Image fetched successfully. HTTP 200, length {len(img_res.content)} bytes.")

    # 6. Create Complaint WITH valid JPEG image
    print("\n5. Creating complaint WITH valid JPEG image...")
    jpg_buf = io.BytesIO()
    img_jpg = Image.new("RGB", (300, 300), color=(0, 128, 255))
    img_jpg.save(jpg_buf, format="JPEG")
    jpg_bytes = jpg_buf.getvalue()

    files_jpg = {
        "image": ("water_leak.jpg", jpg_bytes, "image/jpeg")
    }
    res_with_jpg = requests.post(
        f"{BASE_URL}/complaints/",
        data={
            "title": "Water leak near library entrance",
            "description": "Continuous water dripping from the AC unit.",
            "category_id": str(cat_id),
            "location": "Library Entrance"
        },
        files=files_jpg,
        headers=student_headers
    )
    assert res_with_jpg.status_code == 201, f"Create with JPG failed: {res_with_jpg.status_code} {res_with_jpg.text}"
    c3 = res_with_jpg.json()
    assert c3["image_url"].endswith(".jpg"), f"Expected .jpg extension: {c3['image_url']}"
    print(f"   [PASS] Complaint #{c3['id']} created with JPG. image_url: {c3['image_url']}")

    # 7. Test rejection of oversized image (> 5 MB)
    print("\n6. Testing rejection of oversized image (> 5 MB)...")
    large_bytes = b"0" * (5 * 1024 * 1024 + 1024)  # 5 MB + 1 KB
    files_large = {
        "image": ("huge_photo.jpg", large_bytes, "image/jpeg")
    }
    res_large = requests.post(
        f"{BASE_URL}/complaints/",
        data={
            "title": "Large image test",
            "description": "This should be rejected due to image size.",
            "category_id": str(cat_id),
            "location": "Test Area"
        },
        files=files_large,
        headers=student_headers
    )
    assert res_large.status_code == 400, f"Expected 400 for large image, got {res_large.status_code}: {res_large.text}"
    print(f"   [PASS] Oversized image rejected with HTTP 400: {res_large.json().get('detail')}")

    # 8. Test rejection of fake/corrupted image
    print("\n7. Testing rejection of fake/corrupt image...")
    fake_bytes = b"This is a disguised shell or text file, not a real image."
    files_fake = {
        "image": ("exploit.jpg", fake_bytes, "image/jpeg")
    }
    res_fake = requests.post(
        f"{BASE_URL}/complaints/",
        data={
            "title": "Fake image test",
            "description": "This should be rejected due to invalid image content.",
            "category_id": str(cat_id),
            "location": "Test Area"
        },
        files=files_fake,
        headers=student_headers
    )
    assert res_fake.status_code == 400, f"Expected 400 for fake image, got {res_fake.status_code}: {res_fake.text}"
    print(f"   [PASS] Corrupted/fake image rejected with HTTP 400: {res_fake.json().get('detail')}")

    # 9. Test standalone upload endpoint
    print("\n8. Testing standalone /complaints/upload-image endpoint...")
    res_upload = requests.post(
        f"{BASE_URL}/complaints/upload-image",
        files={"file": ("direct_upload.png", png_bytes, "image/png")},
        headers=student_headers
    )
    assert res_upload.status_code == 201, f"Standalone upload failed: {res_upload.status_code} {res_upload.text}"
    uploaded_url = res_upload.json()["image_url"]
    assert uploaded_url.startswith("/uploads/complaints/"), f"Unexpected uploaded URL: {uploaded_url}"
    print(f"   [PASS] Standalone upload endpoint returned: {uploaded_url}")

    # 10. Login as Facility Officer and view Complaint Details
    print("\n9. Testing Facility Officer details view for Complaint with photo...")
    fo_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "facility@campus.com",
        "password": "Facility@123"
    })
    assert fo_login.status_code == 200, f"Facility officer login failed: {fo_login.text}"
    fo_headers = {"Authorization": f"Bearer {fo_login.json()['access_token']}"}
    
    fo_complaint_res = requests.get(f"{BASE_URL}/complaints/{c2['id']}", headers=fo_headers)
    assert fo_complaint_res.status_code == 200, f"FO get complaint failed: {fo_complaint_res.text}"
    fo_data = fo_complaint_res.json()
    assert fo_data["image_url"] == c2["image_url"], "FO view missing complaint image_url"
    print(f"   [PASS] Facility Officer successfully retrieved complaint #{c2['id']} with photo URL: {fo_data['image_url']}")

    # 11. Assign to Maintenance Team and view assigned complaint with photo
    print("\n10. Assigning complaint to Maintenance Team and testing view...")
    # Get Ramesh
    users_res = requests.get(f"{BASE_URL}/users/", headers=fo_headers)
    maint_users = [u for u in users_res.json() if u["email"] == "ramesh@campus.com"]
    assert len(maint_users) > 0, "Ramesh maintenance team user not found"
    maint_user = maint_users[0]

    assign_res = requests.post(
        f"{BASE_URL}/complaints/{c2['id']}/assign",
        json={
            "assigned_to": maint_user["id"],
            "priority": "High"
        },
        headers=fo_headers
    )
    assert assign_res.status_code == 200, f"Assignment failed: {assign_res.text}"

    # Login as Maintenance user (Ramesh)
    maint_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "ramesh@campus.com",
        "password": "Ramesh@123"
    })
    assert maint_login.status_code == 200, f"Maintenance login failed: {maint_login.text}"
    maint_headers = {"Authorization": f"Bearer {maint_login.json()['access_token']}"}

    # Maintenance checks assigned list
    maint_assigned = requests.get(f"{BASE_URL}/complaints/assigned", headers=maint_headers)
    assert maint_assigned.status_code == 200, f"Get assigned failed: {maint_assigned.text}"
    found = [c for c in maint_assigned.json() if c["id"] == c2["id"]]
    assert len(found) > 0, f"Complaint #{c2['id']} not in maintenance assigned list"
    assert found[0]["image_url"] == c2["image_url"]
    print(f"   [PASS] Maintenance Team successfully retrieved assigned complaint #{c2['id']} with photo URL: {found[0]['image_url']}")

    print("\n==================================================")
    print("ALL 10 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
