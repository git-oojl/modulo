from rest_framework import mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsManager

from .models import LeadSource, Organization
from .serializers import LeadSourceSerializer, OrganizationSerializer


class OrganizationView(APIView):
    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get(self, request):
        organization = Organization.objects.first()
        if not organization:
            return Response(status=204)
        return Response(OrganizationSerializer(organization).data)

    def patch(self, request):
        if not IsAdmin().has_permission(request, self):
            self.permission_denied(request)
        organization = Organization.objects.first()
        if not organization:
            self.permission_denied(request, message="Cree primero la organización.")
        serializer = OrganizationSerializer(organization, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer
    permission_classes = (IsManager,)

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
