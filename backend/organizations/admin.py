from django.contrib import admin

from .models import LeadSource, Organization

admin.site.register(Organization)
admin.site.register(LeadSource)

# Register your models here.
