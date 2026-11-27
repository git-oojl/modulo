from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserReferenceSerializer

from .models import Property, PropertyMedia


class PropertyMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyMedia
        fields = ("id", "file", "alt_text", "sort_order", "is_cover", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_file(self, value):
        allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede superar 10 MB.")
        if getattr(value, "content_type", "") not in allowed_types:
            raise serializers.ValidationError("Solo se permiten imágenes JPEG, PNG, WEBP o archivos PDF.")
        return value


class PropertySerializer(serializers.ModelSerializer):
    advisor = UserReferenceSerializer(read_only=True)
    advisor_id = serializers.SlugRelatedField(source="advisor", slug_field="public_id", queryset=User.objects.all(), required=False, allow_null=True, write_only=True)
    media = PropertyMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = (
            "id", "title", "description", "type", "operation", "status", "price", "currency", "country", "state", "city", "neighborhood", "address", "public_location",
            "bedrooms", "bathrooms", "parking_spaces", "area_m2", "land_area_m2", "features", "advisor", "advisor_id", "is_public", "media", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "advisor", "media")

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        is_public = attrs.get("is_public", getattr(self.instance, "is_public", False))
        if is_public and status != Property.Status.ACTIVE:
            raise serializers.ValidationError({"is_public": "Solo una propiedad activa puede publicarse."})
        if status == Property.Status.CLOSED and (self.instance is None or self.instance.status != Property.Status.CLOSED):
            raise serializers.ValidationError({"status": "Una propiedad se cierra únicamente al registrar un cierre."})
        if self.instance and self.instance.status == Property.Status.CLOSED and status != Property.Status.CLOSED:
            raise serializers.ValidationError({"status": "Anular un cierre no reactiva automáticamente una propiedad."})
        return attrs


class PublicPropertySerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ("id", "title", "operation", "type", "price", "currency", "public_location", "bedrooms", "bathrooms", "area_m2", "cover_image_url")

    def get_cover_image_url(self, property):
        cover = next((item for item in property.media.all() if item.is_cover), None)
        media = cover or next(iter(property.media.all()), None)
        if not media:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(media.file.url) if request else media.file.url


class PublicPropertyDetailSerializer(PublicPropertySerializer):
    media = PropertyMediaSerializer(many=True, read_only=True)

    class Meta(PublicPropertySerializer.Meta):
        fields = PublicPropertySerializer.Meta.fields + ("description", "parking_spaces", "land_area_m2", "features", "media")
