from django.urls import path

from .views import OrganizationView

urlpatterns = [path("", OrganizationView.as_view(), name="organization")]
