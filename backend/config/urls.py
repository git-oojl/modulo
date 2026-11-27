"""Rutas del proyecto y contrato OpenAPI."""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config.views import health_check
from core.dashboard import DashboardView
from properties.public_views import PublicCatalogueStatusView, PublicInquiryView
from properties.views import PublicPropertyViewSet
from rest_framework.routers import DefaultRouter

public_router = DefaultRouter()
public_router.register("properties", PublicPropertyViewSet, basename="public-property")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health'),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/users/', include('accounts.user_urls')),
    path('api/v1/agents/', include('accounts.agent_urls')),
    path('api/v1/contacts/', include('contacts.urls')),
    path('api/v1/properties/', include('properties.urls')),
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/closings/', include('closings.urls')),
    path('api/v1/organization/', include('organizations.urls')),
    path('api/v1/sources/', include('organizations.source_urls')),
    path('api/v1/integrations/', include('integrations.urls')),
    path('api/v1/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/v1/public/catalogue-status/', PublicCatalogueStatusView.as_view(), name='public-catalogue-status'),
    path('api/v1/public/inquiries/', PublicInquiryView.as_view(), name='public-inquiry'),
    path('api/v1/public/', include(public_router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
