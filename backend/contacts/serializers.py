from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserReferenceSerializer
from properties.models import Property
from properties.serializers import PropertySerializer

from .models import Contact, ContactActivity, FollowUp, PropertyInterest


class ContactActivitySerializer(serializers.ModelSerializer):
    created_by = UserReferenceSerializer(read_only=True)

    class Meta:
        model = ContactActivity
        fields = ("id", "type", "content", "occurred_at", "created_by", "created_at")
        read_only_fields = ("id", "created_by", "created_at")


class FollowUpSerializer(serializers.ModelSerializer):
    assigned_to = UserReferenceSerializer(read_only=True)
    assigned_to_id = serializers.SlugRelatedField(source="assigned_to", slug_field="public_id", queryset=User.objects.all(), write_only=True, required=False)
    completed_by = UserReferenceSerializer(read_only=True)

    class Meta:
        model = FollowUp
        fields = ("id", "assigned_to", "assigned_to_id", "due_at", "status", "note", "completed_at", "completed_by", "created_at")
        read_only_fields = ("id", "completed_at", "completed_by", "created_at")

    def update(self, instance, validated_data):
        if validated_data.get("status") == FollowUp.Status.COMPLETED and instance.status != FollowUp.Status.COMPLETED:
            instance.completed_at = timezone.now()
            instance.completed_by = self.context["request"].user
        return super().update(instance, validated_data)


class PropertyInterestSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(source="property", queryset=Property.objects.all(), write_only=True)

    class Meta:
        model = PropertyInterest
        fields = ("id", "property", "property_id", "note", "created_at")
        read_only_fields = ("id", "property", "created_at")


class ContactSerializer(serializers.ModelSerializer):
    advisor = UserReferenceSerializer(read_only=True)
    advisor_id = serializers.SlugRelatedField(source="advisor", slug_field="public_id", queryset=User.objects.all(), write_only=True, required=False, allow_null=True)
    source_name = serializers.CharField(source="source.name", read_only=True)
    activities = ContactActivitySerializer(many=True, read_only=True)
    interests = PropertyInterestSerializer(many=True, read_only=True)
    follow_ups = FollowUpSerializer(many=True, read_only=True)

    class Meta:
        model = Contact
        fields = ("id", "name", "phone", "email", "advisor", "advisor_id", "source", "source_name", "status", "notes", "activities", "interests", "follow_ups", "created_at", "updated_at")
        read_only_fields = ("id", "advisor", "source_name", "activities", "interests", "follow_ups", "created_at", "updated_at")
