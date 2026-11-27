from django.db.models import Q
from rest_framework.permissions import BasePermission

from accounts.models import User


def is_manager(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role in {User.Role.MANAGER, User.Role.ADMIN}))


def is_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role == User.Role.ADMIN))


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return is_manager(request.user)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


def scoped_contact_queryset(queryset, user):
    return queryset if is_manager(user) else queryset.filter(advisor=user)


def scoped_property_queryset(queryset, user):
    if is_manager(user):
        return queryset
    return queryset.filter(Q(advisor=user) | Q(status="activa")).distinct()


def scoped_appointment_queryset(queryset, user):
    return queryset if is_manager(user) else queryset.filter(advisor=user)


def scoped_closing_queryset(queryset, user):
    return queryset if is_manager(user) else queryset.filter(advisor=user)
