from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserReferenceSerializer
from contacts.serializers import ContactSerializer
from properties.serializers import PropertySerializer

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    advisor = UserReferenceSerializer(read_only=True)
    advisor_id = serializers.SlugRelatedField(source="advisor", slug_field="public_id", queryset=User.objects.all(), write_only=True, required=False)
    contact_detail = ContactSerializer(source="contact", read_only=True)
    property_detail = PropertySerializer(source="property", read_only=True)

    class Meta:
        model = Appointment
        fields = ("id", "contact", "contact_detail", "property", "property_detail", "advisor", "advisor_id", "source", "purpose", "status", "starts_at", "ends_at", "result", "notes", "created_at", "updated_at")
        read_only_fields = ("id", "advisor", "contact_detail", "property_detail", "created_at", "updated_at")

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        status = attrs.get("status", getattr(self.instance, "status", None))
        result = attrs.get("result", getattr(self.instance, "result", ""))
        if ends_at and starts_at and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "Debe ser posterior al inicio."})
        if status == Appointment.Status.COMPLETED and not result.strip():
            raise serializers.ValidationError({"result": "Completar una cita exige registrar un resultado."})
        return attrs


class CompleteAppointmentSerializer(serializers.Serializer):
    result = serializers.CharField()
    next_follow_up_at = serializers.DateTimeField(required=False, allow_null=True)
    follow_up_note = serializers.CharField(required=False, allow_blank=True)
