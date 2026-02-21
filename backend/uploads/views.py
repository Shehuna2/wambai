import os
import uuid

from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


class UploadImagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not request.user.is_vendor:
            return Response({"detail": "Vendor account required"}, status=status.HTTP_403_FORBIDDEN)

        files = request.FILES.getlist("files")
        if not files:
            return Response({"detail": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)

        urls = []
        for file_obj in files:
            ext = ALLOWED_IMAGE_TYPES.get(file_obj.content_type)
            if not ext:
                return Response({"detail": f"Unsupported file type: {file_obj.content_type}"}, status=status.HTTP_400_BAD_REQUEST)
            if file_obj.size > MAX_FILE_SIZE:
                return Response({"detail": f"File too large: {file_obj.name}"}, status=status.HTTP_400_BAD_REQUEST)

            upload_path = os.path.join("uploads", str(request.user.id), f"{uuid.uuid4().hex}{ext}")
            saved_path = default_storage.save(upload_path, file_obj)
            urls.append(request.build_absolute_uri(default_storage.url(saved_path)))

        return Response({"urls": urls}, status=status.HTTP_201_CREATED)
