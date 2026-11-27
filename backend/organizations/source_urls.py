from rest_framework.routers import DefaultRouter

from .views import LeadSourceViewSet

router = DefaultRouter()
router.register("", LeadSourceViewSet, basename="source")
urlpatterns = router.urls
