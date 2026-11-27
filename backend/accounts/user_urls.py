from rest_framework.routers import DefaultRouter

from .views import AccessRequestViewSet, UserViewSet

router = DefaultRouter()
router.register("", UserViewSet, basename="user")
access_request_router = DefaultRouter()
access_request_router.register("access-requests", AccessRequestViewSet, basename="access-request")
urlpatterns = access_request_router.urls + router.urls

