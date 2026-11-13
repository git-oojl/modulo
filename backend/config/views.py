"""Endpoints de infraestructura que no pertenecen a un dominio de negocio."""

from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@extend_schema(
    summary="Verificar disponibilidad de API y PostgreSQL",
    description="Comprobación pública y mínima para desarrollo y monitoreo.",
    responses=inline_serializer(
        name="HealthCheckResponse",
        fields={
            "status": serializers.CharField(),
            "database": serializers.CharField(),
        },
    ),
    tags=["Sistema"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Confirma que Django puede abrir una conexión utilizable con PostgreSQL."""
    try:
        connection.ensure_connection()
        database_is_usable = connection.is_usable()
    except DatabaseError:
        database_is_usable = False

    if not database_is_usable:
        return Response(
            {"status": "degraded", "database": "unavailable"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({"status": "ok", "database": "ok"})
