from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import is_manager, scoped_property_queryset

from .models import Property, PropertyMedia
from .serializers import PropertyMediaSerializer, PropertySerializer, PublicPropertyDetailSerializer, PublicPropertySerializer


class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = Property.objects.select_related("advisor").prefetch_related("media")
        queryset = scoped_property_queryset(queryset, self.request.user)
        for key in ("status", "operation", "type"):
            if value := self.request.query_params.get(key):
                queryset = queryset.filter(**{key: value})
        if value := self.request.query_params.get("advisor"):
            queryset = queryset.filter(advisor__public_id=value)
        if value := self.request.query_params.get("is_public"):
            queryset = queryset.filter(is_public=value.lower() == "true")
        if value := self.request.query_params.get("q"):
            queryset = queryset.filter(Q(title__icontains=value) | Q(city__icontains=value) | Q(neighborhood__icontains=value))
        return queryset

    def perform_create(self, serializer):
        advisor = serializer.validated_data.get("advisor") if is_manager(self.request.user) else self.request.user
        if advisor is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"advisor_id": "Gerencia debe asignar un asesor responsable."})
        serializer.save(advisor=advisor)

    def perform_update(self, serializer):
        property = self.get_object()
        if not is_manager(self.request.user) and property.advisor_id != self.request.user.id:
            self.permission_denied(self.request)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        property = self.get_object()
        if not is_manager(request.user) and property.advisor_id != request.user.id:
            self.permission_denied(request)
        property.status = Property.Status.ARCHIVED
        property.is_public = False
        property.save(update_fields=("status", "is_public", "updated_at"))
        return Response(status=204)

    @action(detail=True, methods=["get", "post"], url_path="media")
    def media(self, request, id=None):
        property = self.get_object()
        if request.method == "GET":
            return Response(PropertyMediaSerializer(property.media.all(), many=True, context={"request": request}).data)
        if not is_manager(request.user) and property.advisor_id != request.user.id:
            self.permission_denied(request)
        serializer = PropertyMediaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(property=property)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["patch", "delete"], url_path="media/(?P<media_id>[^/.]+)")
    def media_item(self, request, id=None, media_id=None):
        property = self.get_object()
        if not is_manager(request.user) and property.advisor_id != request.user.id:
            self.permission_denied(request)
        try:
            media = property.media.get(id=media_id)
        except PropertyMedia.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound("No existe ese archivo.")
        if request.method == "DELETE":
            media.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = PropertyMediaSerializer(media, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublicPropertyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny,)
    lookup_field = "id"

    def get_queryset(self):
        from organizations.models import Organization

        if not Organization.objects.filter(public_catalogue_enabled=True).exists():
            return Property.objects.none()
        queryset = Property.objects.filter(status=Property.Status.ACTIVE, is_public=True).prefetch_related("media")
        for key in ("operation", "type", "city"):
            if value := self.request.query_params.get(key):
                queryset = queryset.filter(**{key: value})
        if value := self.request.query_params.get("q"):
            queryset = queryset.filter(Q(title__icontains=value) | Q(public_location__icontains=value))
        return queryset

    def get_serializer_class(self):
        return PublicPropertyDetailSerializer if self.action == "retrieve" else PublicPropertySerializer
