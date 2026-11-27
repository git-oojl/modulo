from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsManager, is_manager, scoped_closing_queryset

from .models import Closing
from .serializers import ClosingSerializer, CommissionEstimateSerializer
from .services import correct_closing, register_closing, void_closing


class ClosingViewSet(viewsets.ModelViewSet):
    serializer_class = ClosingSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = scoped_closing_queryset(Closing.objects.select_related("property", "contact", "advisor", "commission"), self.request.user)
        for key in ("status", "operation"):
            if value := self.request.query_params.get(key):
                queryset = queryset.filter(**{key: value})
        if value := self.request.query_params.get("advisor"):
            queryset = queryset.filter(advisor__public_id=value)
        if value := self.request.query_params.get("commission_status"):
            queryset = queryset.filter(commission__status=value)
        if date_from := self.request.query_params.get("from"):
            queryset = queryset.filter(closed_on__gte=date_from)
        if date_to := self.request.query_params.get("to"):
            queryset = queryset.filter(closed_on__lte=date_to)
        return queryset

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "void", "commission"}:
            return [IsManager()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            closing = register_closing(data={**serializer.validated_data, "advisor": serializer.validated_data.get("advisor", request.user)}, actor=request.user)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(closing).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        closing = self.get_object()
        serializer = self.get_serializer(closing, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            corrected = correct_closing(closing=closing, data=dict(serializer.validated_data))
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(corrected).data)

    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "Los cierres se anulan; no se eliminan."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=["post"])
    def void(self, request, id=None):
        return Response(self.get_serializer(void_closing(closing=self.get_object(), actor=request.user)).data)

    @action(detail=True, methods=["patch"])
    def commission(self, request, id=None):
        commission = self.get_object().commission
        serializer = CommissionEstimateSerializer(commission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
