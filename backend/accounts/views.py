from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdmin

from .models import User
from .serializers import CurrentUserSerializer, LoginSerializer, UserAdminSerializer


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
