from django.contrib import admin

from .models import Contact, ContactActivity, FollowUp, PropertyInterest

admin.site.register(Contact)
admin.site.register(ContactActivity)
admin.site.register(FollowUp)
admin.site.register(PropertyInterest)

# Register your models here.
