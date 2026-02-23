import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024
EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class ImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_vendor:
            return Response({"detail": "Vendor account required"}, status=status.HTTP_403_FORBIDDEN)

        files = request.FILES.getlist("files")
        if not files:
            return Response({"detail": "No files uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        urls = []
        for uploaded in files:
            if uploaded.content_type not in ALLOWED_CONTENT_TYPES:
                return Response({"detail": f"Unsupported file type: {uploaded.content_type}"}, status=status.HTTP_400_BAD_REQUEST)
            if uploaded.size > MAX_FILE_SIZE:
                return Response({"detail": f"File too large: {uploaded.name}"}, status=status.HTTP_400_BAD_REQUEST)

            ext = EXT_BY_TYPE[uploaded.content_type]
            filename = f"uploads/{request.user.id}/{uuid.uuid4().hex}{ext}"
            stored_path = default_storage.save(filename, uploaded)
            url = f"{request.scheme}://{request.get_host()}{settings.MEDIA_URL}{stored_path}"
            urls.append(url)

        return Response({"urls": urls}, status=status.HTTP_201_CREATED)
