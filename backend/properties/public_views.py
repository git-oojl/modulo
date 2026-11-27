from django.db import transaction
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from contacts.models import Contact, PropertyInterest
from organizations.models import LeadSource
from organizations.models import Organization

from .models import Property


class PublicInquirySerializer(serializers.Serializer):
    property = serializers.UUIDField()
    name = serializers.CharField(max_length=180)
    phone = serializers.CharField(max_length=32)
    email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True, max_length=4000)
    privacy_accepted = serializers.BooleanField()

    def validate_property(self, value):
        if not Organization.objects.filter(public_catalogue_enabled=True).exists() or not Property.objects.filter(id=value, status=Property.Status.ACTIVE, is_public=True).exists():
            raise serializers.ValidationError("La propiedad no está disponible.")
        return value

    def validate_privacy_accepted(self, value):
        if not value:
            raise serializers.ValidationError("Debes aceptar el aviso de privacidad.")
        return value


class PublicInquiryThrottle(AnonRateThrottle):
    scope = "public_inquiries"


class PublicCatalogueStatusView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({"enabled": Organization.objects.filter(public_catalogue_enabled=True).exists()})


class PublicInquiryView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (PublicInquiryThrottle,)

    @transaction.atomic
    def post(self, request):
        serializer = PublicInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        property = Property.objects.get(id=data["property"])
        source, _ = LeadSource.objects.get_or_create(name="sitio_web", defaults={"sort_order": 100})
        contact = Contact.objects.create(name=data["name"], phone=data["phone"], email=data.get("email", ""), source=source, notes=data.get("message", ""))
        PropertyInterest.objects.create(contact=contact, property=property, note=data.get("message", ""))
        return Response({"id": str(contact.id)}, status=201)
