from django.urls import path

from .views import ExportView

urlpatterns = [path("exports/<str:resource>/", ExportView.as_view(), name="export")]
