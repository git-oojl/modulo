from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserReferenceSerializer

from .models import Property, PropertyMedia


class PropertyMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyMedia
        fields = ("id", "file", "alt_text", "sort_order", "is_cover", "created_at")
        read_only_fields = ("id", "created_at")


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
