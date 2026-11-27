from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserReferenceSerializer
from contacts.serializers import ContactSerializer
from properties.serializers import PropertySerializer

from .models import Closing, CommissionEstimate


class CommissionEstimateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionEstimate
        fields = ("id", "percentage", "amount", "status", "created_at", "updated_at")
        read_only_fields = ("id", "amount", "created_at", "updated_at")


class ClosingSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source="property", read_only=True)
    contact_detail = ContactSerializer(source="contact", read_only=True)
    advisor = UserReferenceSerializer(read_only=True)
    advisor_id = serializers.SlugRelatedField(source="advisor", slug_field="public_id", queryset=User.objects.all(), write_only=True, required=False)
    commission = CommissionEstimateSerializer(required=False)

    class Meta:
        model = Closing
        fields = ("id", "property", "property_detail", "contact", "contact_detail", "advisor", "advisor_id", "operation", "closed_on", "amount", "currency", "status", "notes", "voided_at", "commission", "created_at", "updated_at")
        read_only_fields = ("id", "property_detail", "contact_detail", "advisor", "status", "voided_at", "created_at", "updated_at")

    def validate(self, attrs):
        property = attrs.get("property", getattr(self.instance, "property", None))
        operation = attrs.get("operation", getattr(self.instance, "operation", None))
        if property and operation and property.operation != operation:
            raise serializers.ValidationError({"operation": "Debe coincidir con la operación de la propiedad."})
        return attrs
