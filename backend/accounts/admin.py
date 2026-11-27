from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AccessRequest, AdvisorProfile, User

admin.site.register(User, UserAdmin)
admin.site.register(AdvisorProfile)
admin.site.register(AccessRequest)

# Register your models here.
