from django.urls import path

from .views import UploadImagesView

urlpatterns = [
    path("uploads/images/", UploadImagesView.as_view()),
]
