from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(MEDIA_ROOT="/tmp/wambai-test-media")
class UploadImagesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = get_user_model().objects.create_user(email="vendor-upload@example.com", password="pass", is_vendor=True)
        self.buyer = get_user_model().objects.create_user(email="buyer-upload@example.com", password="pass", is_vendor=False)

    def test_upload_requires_authentication(self):
        response = self.client.post("/api/uploads/images/")
        self.assertEqual(response.status_code, 401)

    def test_upload_requires_vendor(self):
        self.client.force_authenticate(self.buyer)
        file_obj = SimpleUploadedFile("a.png", b"\x89PNG\r\n\x1a\n", content_type="image/png")
        response = self.client.post("/api/uploads/images/", {"files": [file_obj]}, format="multipart")
        self.assertEqual(response.status_code, 403)

    def test_upload_rejects_non_image(self):
        self.client.force_authenticate(self.vendor)
        file_obj = SimpleUploadedFile("a.txt", b"hello", content_type="text/plain")
        response = self.client.post("/api/uploads/images/", {"files": [file_obj]}, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_upload_accepts_image(self):
        self.client.force_authenticate(self.vendor)
        file_obj = SimpleUploadedFile("a.png", b"\x89PNG\r\n\x1a\n", content_type="image/png")
        response = self.client.post("/api/uploads/images/", {"files": [file_obj]}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data.get("urls", [])), 1)
        self.assertIn("/media/uploads/", response.data["urls"][0])
