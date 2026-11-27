from rest_framework import serializers

from .models import LeadSource, Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "legal_name", "logo", "timezone", "default_language", "currency", "public_catalogue_enabled", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ("id", "name", "active", "sort_order", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
