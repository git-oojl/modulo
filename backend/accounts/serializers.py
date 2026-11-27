from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import AdvisorProfile, User


class UserReferenceSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "display_name", "role")


class CurrentUserSerializer(UserReferenceSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)

    class Meta(UserReferenceSerializer.Meta):
        fields = UserReferenceSerializer.Meta.fields + ("username", "email")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs):
        identifier = attrs["username"].strip()
        username = identifier
        if "@" in identifier:
            username = User.objects.filter(email__iexact=identifier).values_list("username", flat=True).first() or identifier
        user = authenticate(username=username, password=attrs["password"])
        if not user or not user.is_active:
            raise serializers.ValidationError("Credenciales inválidas.")
        attrs["user"] = user
        return attrs


class UserAdminSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=12)
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role", "is_active", "password", "profile")

    def get_profile(self, user):
        try:
            return {"phone": user.advisor_profile.phone, "license_number": user.advisor_profile.license_number, "active": user.advisor_profile.active}
        except AdvisorProfile.DoesNotExist:
            return None

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        if user.role == User.Role.ADVISOR:
            AdvisorProfile.objects.get_or_create(user=user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
