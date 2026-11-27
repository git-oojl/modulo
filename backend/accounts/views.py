from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdmin

from .models import AccessRequest, User
from .serializers import AccessRequestSerializer, CurrentUserSerializer, LoginSerializer, PublicAccessRequestSerializer, UserAdminSerializer


@extend_schema(request=None, responses=None, tags=["Autenticación"])
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def csrf(request):
    return Response({"csrfToken": get_token(request)})


@extend_schema(request=LoginSerializer, responses=CurrentUserSerializer, tags=["Autenticación"])
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def session_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    login(request, serializer.validated_data["user"])
    return Response(CurrentUserSerializer(request.user).data)


@api_view(["POST"])
def session_logout(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response(CurrentUserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def create_access_request(request):
    serializer = PublicAccessRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    access_request = serializer.save()
    return Response({"id": str(access_request.public_id)}, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserAdminSerializer
    permission_classes = (IsAdmin,)
    lookup_field = "public_id"


class AdvisorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role=User.Role.ADVISOR).order_by("first_name", "last_name", "username")
    serializer_class = CurrentUserSerializer

    def get_permissions(self):
        from core.permissions import IsManager

        return [IsManager()]


class AccessRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccessRequest.objects.select_related("reviewed_by").all()
    serializer_class = AccessRequestSerializer
    permission_classes = (IsAdmin,)
    lookup_field = "public_id"

    @action(detail=True, methods=["post"])
    def approve(self, request, public_id=None):
        access_request = self.get_object()
        access_request.status = AccessRequest.Status.APPROVED
        access_request.reviewed_at = timezone.now()
        access_request.reviewed_by = request.user
        access_request.save(update_fields=("status", "reviewed_at", "reviewed_by", "updated_at"))
        return Response(self.get_serializer(access_request).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, public_id=None):
        access_request = self.get_object()
        access_request.status = AccessRequest.Status.REJECTED
        access_request.reviewed_at = timezone.now()
        access_request.reviewed_by = request.user
        access_request.save(update_fields=("status", "reviewed_at", "reviewed_by", "updated_at"))
        return Response(self.get_serializer(access_request).data)
