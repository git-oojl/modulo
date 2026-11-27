from rest_framework.routers import DefaultRouter

from .views import AdvisorViewSet

router = DefaultRouter()
router.register("", AdvisorViewSet, basename="agent")
urlpatterns = router.urls
