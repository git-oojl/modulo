from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import is_manager, scoped_contact_queryset

from .models import Contact, ContactActivity, FollowUp, PropertyInterest
from .serializers import ContactActivitySerializer, ContactSerializer, FollowUpSerializer, PropertyInterestSerializer


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = scoped_contact_queryset(Contact.objects.select_related("advisor", "source").prefetch_related("activities__created_by", "interests__property__media", "follow_ups__assigned_to"), self.request.user)
        for key in ("status", "source"):
            if value := self.request.query_params.get(key):
                queryset = queryset.filter(**{key: value})
        if value := self.request.query_params.get("advisor"):
            queryset = queryset.filter(advisor__public_id=value)
        if value := self.request.query_params.get("q"):
            queryset = queryset.filter(Q(name__icontains=value) | Q(phone__icontains=value) | Q(email__icontains=value))
        return queryset

    def perform_create(self, serializer):
        serializer.save(advisor=serializer.validated_data.get("advisor") if is_manager(self.request.user) else self.request.user)

    def perform_update(self, serializer):
        contact = self.get_object()
        if not is_manager(self.request.user) and contact.advisor_id != self.request.user.id:
            self.permission_denied(self.request)
        previous_status = contact.status
        contact = serializer.save()
        if contact.status != previous_status:
            ContactActivity.objects.create(
                contact=contact,
                type=ContactActivity.Type.STATUS_CHANGE,
                content=f"Estado cambiado de {previous_status} a {contact.status}.",
                occurred_at=timezone.now(),
                created_by=self.request.user,
            )

    def destroy(self, request, *args, **kwargs):
        contact = self.get_object()
        if not is_manager(request.user) and contact.advisor_id != request.user.id:
            self.permission_denied(request)
        contact.status = Contact.Status.INACTIVE
        contact.save(update_fields=("status", "updated_at"))
        return Response(status=204)

    @action(detail=True, methods=["get", "post"], url_path="activities")
    def activities(self, request, id=None):
        contact = self.get_object()
        if request.method == "GET":
            return Response(ContactActivitySerializer(contact.activities.select_related("created_by"), many=True).data)
        serializer = ContactActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(contact=contact, created_by=request.user)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["get", "post"], url_path="interests")
    def interests(self, request, id=None):
        contact = self.get_object()
        if request.method == "GET":
            return Response(PropertyInterestSerializer(contact.interests.select_related("property"), many=True, context={"request": request}).data)
        serializer = PropertyInterestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(contact=contact)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["get", "post"], url_path="follow-ups")
    def follow_ups(self, request, id=None):
        contact = self.get_object()
        if request.method == "GET":
            return Response(FollowUpSerializer(contact.follow_ups.select_related("assigned_to", "completed_by"), many=True, context={"request": request}).data)
        serializer = FollowUpSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(contact=contact, assigned_to=serializer.validated_data.get("assigned_to", request.user))
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="follow-ups/(?P<follow_up_id>[^/.]+)/complete")
    def complete_follow_up(self, request, id=None, follow_up_id=None):
        follow_up = self.get_object().follow_ups.get(id=follow_up_id)
        if not is_manager(request.user) and follow_up.assigned_to_id != request.user.id:
            self.permission_denied(request)
        follow_up.status = FollowUp.Status.COMPLETED
        follow_up.completed_at = timezone.now()
        follow_up.completed_by = request.user
        follow_up.save(update_fields=("status", "completed_at", "completed_by", "updated_at"))
        return Response(FollowUpSerializer(follow_up, context={"request": request}).data)
